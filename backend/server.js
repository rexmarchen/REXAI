import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { spawn, spawnSync } from 'node:child_process'
import { config as loadEnv } from 'dotenv'
import express from 'express'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { DatabaseSync } from 'node:sqlite'
import pg from 'pg'
import { fileURLToPath } from 'node:url'
import { OAuth2Client } from 'google-auth-library'
import {
  analyzeResumeContent,
  getConfidenceLevel,
  getLlmRuntimeInfo,
  parseStoredAnalysis,
  serializeAnalysis
} from './src/services/resumeAnalysisService.js'
import { extractResumeProfile } from './src/services/resumeProfileExtractor.js'
import { config as internHubConfig } from './intern-hub/src/config/index.js'
import {
  validateInternshipSearch,
  validateLinkedInRedirect
} from './intern-hub/src/middleware/validate.js'
import { searchInternships } from './intern-hub/src/services/adzunaService.js'
import { resolveLinkedInDestination } from './intern-hub/src/services/apifyService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const workspaceRoot = path.dirname(__dirname)
const { Pool } = pg

const runtimeEnvPaths = [
  path.join(__dirname, 'legacy', 'rexion-backend', '.env'),
  path.join(__dirname, '.env'),
  path.join(__dirname, '.env.local')
]

function loadRuntimeEnv() {
  for (const envPath of runtimeEnvPaths) {
    loadEnv({ path: envPath, override: true })
  }
}

function getOpenRouterApiKey() {
  return String(process.env.OPENROUTER_API_KEY || '').trim()
}

function getDeepSeekApiKey() {
  return String(process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || '').trim()
}

function getRexcodeModel() {
  return String(process.env.REXCODE_MODEL || 'deepseek/deepseek-r1:free').trim()
}

function getRexcodeProvider() {
  const configured = String(process.env.REXCODE_PROVIDER || 'auto').trim().toLowerCase()
  if (configured === 'deepseek' || configured === 'openrouter') {
    return configured
  }

  const deepSeekApiKey = getDeepSeekApiKey()
  const openRouterApiKey = getOpenRouterApiKey()

  if (hasUsableApiKey(deepSeekApiKey) && !deepSeekApiKey.startsWith('sk-or-')) {
    return 'deepseek'
  }

  if (hasUsableApiKey(openRouterApiKey)) {
    return 'openrouter'
  }

  return 'deepseek'
}

// Support both backend/.env and backend/legacy/rexion-backend/.env during migration.
loadRuntimeEnv()

const PORT = Number(process.env.PORT || 5000)
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'
const DATABASE_URL = String(
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL || ''
).trim()
const DEFAULT_GOOGLE_CLIENT_ID =
  '384758871820-mlp81rh6vb22fhhcad4opoit20e7nc1p.apps.googleusercontent.com'
const GOOGLE_CLIENT_ID = String(process.env.GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID).trim()
const NODE_ENV = String(process.env.NODE_ENV || 'development').trim().toLowerCase()
const USE_POSTGRES = DATABASE_URL.length > 0
const IS_SERVERLESS = Boolean(process.env.VERCEL)
const OPENROUTER_BASE_URL = String(process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1')
  .trim()
  .replace(/\/+$/, '')
const OPENROUTER_REFERER = String(process.env.OPENROUTER_REFERER || 'http://localhost:5173').trim()
const OPENROUTER_APP_TITLE = String(process.env.OPENROUTER_APP_TITLE || 'Rexion AI').trim()
const DEEPSEEK_BASE_URL = String(process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com')
  .trim()
  .replace(/\/+$/, '')
const REXCODE_REQUEST_TIMEOUT_MS = Math.max(
  10000,
  Number(process.env.REXCODE_REQUEST_TIMEOUT_MS || 60000)
)
const ML_SERVICE_URL = String(process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000')
  .trim()
  .replace(/\/+$/, '')
const ML_SERVICE_AUTOSTART = String(process.env.ML_SERVICE_AUTOSTART || 'true').trim().toLowerCase() !== 'false'
const JSEARCH_API_KEY = String(
  process.env.JSEARCH_API_KEY ||
    process.env.RAPIDAPI_KEY ||
    process.env.RAPID_API_KEY ||
    process.env.X_RAPIDAPI_KEY ||
    ''
).trim()
const JSEARCH_API_HOST = String(
  process.env.JSEARCH_API_HOST || process.env.RAPIDAPI_HOST || process.env.RAPID_API_HOST || 'jsearch.p.rapidapi.com'
).trim()
const JSEARCH_DEFAULT_REMOTE = String(process.env.JSEARCH_DEFAULT_REMOTE || 'true').trim().toLowerCase() !== 'false'
const JSEARCH_DEFAULT_LOCATION = String(process.env.JSEARCH_DEFAULT_LOCATION || '').trim()
const JSEARCH_ENABLE_FALLBACK =
  String(process.env.JSEARCH_ENABLE_FALLBACK || 'false').trim().toLowerCase() === 'true'
const JSEARCH_TIMEOUT_MS = Math.max(
  5000,
  Math.round(Number(process.env.JSEARCH_TIMEOUT_SECONDS || 35) * 1000)
)
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const allowedOrigins = new Set(CORS_ORIGINS)
const localOriginRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const dataDirectory = path.join(__dirname, 'data')
mkdirSync(dataDirectory, { recursive: true })
const llmRuntimeInfo = getLlmRuntimeInfo()
const dbPath = path.join(dataDirectory, 'rexion.sqlite')
let sqliteDb = null
let postgresPool = null
let createUserStatement = null
let findUserByEmailStatement = null
let findUserByIdStatement = null
let findUserByGoogleSubStatement = null
let createGoogleUserStatement = null
let updateGoogleIdentityStatement = null
let createResumePredictionStatement = null
let findResumePredictionByIdStatement = null
let createGeneratedSiteStatement = null
let findGeneratedSiteByIdStatement = null

function ensureSqliteColumnExists(tableName, columnDefinition) {
  try {
    sqliteDb.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`)
  } catch (error) {
    const message = String(error?.message || '').toLowerCase()
    if (!message.includes('duplicate column name')) {
      throw error
    }
  }
}

async function initializeDatabase() {
  if (USE_POSTGRES) {
    postgresPool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })

    await postgresPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL DEFAULT '',
        google_sub TEXT,
        google_picture TEXT,
        auth_provider TEXT NOT NULL DEFAULT 'password',
        role TEXT NOT NULL DEFAULT 'candidate',
        plan TEXT NOT NULL DEFAULT 'free',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_unique
      ON users (google_sub)
      WHERE google_sub IS NOT NULL AND google_sub <> '';

      CREATE TABLE IF NOT EXISTS resume_predictions (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        mime_type TEXT,
        size_bytes INTEGER NOT NULL,
        prediction TEXT NOT NULL,
        confidence INTEGER NOT NULL,
        confidence_level TEXT,
        llm_model TEXT,
        analysis_json TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS generated_sites (
        id BIGSERIAL PRIMARY KEY,
        owner_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        prompt TEXT NOT NULL,
        mode TEXT NOT NULL,
        provider TEXT,
        model TEXT,
        code TEXT,
        site_url TEXT,
        answer TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)

    return
  }

  sqliteDb = new DatabaseSync(dbPath)

  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS resume_predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      mime_type TEXT,
      size_bytes INTEGER NOT NULL,
      prediction TEXT NOT NULL,
      confidence INTEGER NOT NULL,
      confidence_level TEXT,
      llm_model TEXT,
      analysis_json TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS generated_sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_user_id INTEGER NOT NULL,
      prompt TEXT NOT NULL,
      mode TEXT NOT NULL,
      provider TEXT,
      model TEXT,
      code TEXT,
      site_url TEXT,
      answer TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  ensureSqliteColumnExists('resume_predictions', 'confidence_level TEXT')
  ensureSqliteColumnExists('resume_predictions', 'llm_model TEXT')
  ensureSqliteColumnExists('resume_predictions', 'analysis_json TEXT')
  ensureSqliteColumnExists('resume_predictions', 'user_id INTEGER')
  ensureSqliteColumnExists('users', 'google_sub TEXT')
  ensureSqliteColumnExists('users', 'google_picture TEXT')
  ensureSqliteColumnExists('users', "auth_provider TEXT NOT NULL DEFAULT 'password'")
  ensureSqliteColumnExists('users', "role TEXT NOT NULL DEFAULT 'candidate'")
  ensureSqliteColumnExists('users', "plan TEXT NOT NULL DEFAULT 'free'")

  sqliteDb.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_unique
    ON users (google_sub)
    WHERE google_sub IS NOT NULL AND google_sub <> ''
  `)

  createUserStatement = sqliteDb.prepare(
    `
    INSERT INTO users (full_name, email, password_hash, auth_provider, role, plan)
    VALUES (?, ?, ?, ?, ?, ?)
  `
  )
  findUserByEmailStatement = sqliteDb.prepare(
    `
    SELECT
      id,
      full_name AS fullName,
      email,
      password_hash AS passwordHash,
      google_sub AS googleSub,
      google_picture AS googlePicture,
      auth_provider AS authProvider,
      role,
      plan,
      created_at AS createdAt
    FROM users
    WHERE email = ?
    LIMIT 1
  `
  )
  findUserByIdStatement = sqliteDb.prepare(
    `
    SELECT
      id,
      full_name AS fullName,
      email,
      password_hash AS passwordHash,
      google_sub AS googleSub,
      google_picture AS googlePicture,
      auth_provider AS authProvider,
      role,
      plan,
      created_at AS createdAt
    FROM users
    WHERE id = ?
    LIMIT 1
  `
  )
  findUserByGoogleSubStatement = sqliteDb.prepare(
    `
    SELECT
      id,
      full_name AS fullName,
      email,
      password_hash AS passwordHash,
      google_sub AS googleSub,
      google_picture AS googlePicture,
      auth_provider AS authProvider,
      role,
      plan,
      created_at AS createdAt
    FROM users
    WHERE google_sub = ?
    LIMIT 1
  `
  )
  createGoogleUserStatement = sqliteDb.prepare(
    `
    INSERT INTO users (
      full_name,
      email,
      password_hash,
      google_sub,
      google_picture,
      auth_provider,
      role,
      plan
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `
  )
  updateGoogleIdentityStatement = sqliteDb.prepare(
    `
    UPDATE users
    SET
      full_name = ?,
      google_sub = ?,
      google_picture = ?,
      auth_provider = ?
    WHERE id = ?
  `
  )
  createResumePredictionStatement = sqliteDb.prepare(
    `
    INSERT INTO resume_predictions (
      user_id,
      file_name,
      file_path,
      mime_type,
      size_bytes,
      prediction,
      confidence,
      confidence_level,
      llm_model,
      analysis_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  )
  findResumePredictionByIdStatement = sqliteDb.prepare(
    `
    SELECT
      id,
      user_id AS userId,
      file_name AS fileName,
      file_path AS filePath,
      mime_type AS mimeType,
      size_bytes AS sizeBytes,
      prediction,
      confidence,
      confidence_level AS confidenceLevel,
      llm_model AS llmModel,
      analysis_json AS analysisJson,
      created_at AS createdAt
    FROM resume_predictions
    WHERE id = ?
    LIMIT 1
  `
  )
  createGeneratedSiteStatement = sqliteDb.prepare(
    `
    INSERT INTO generated_sites (
      owner_user_id,
      prompt,
      mode,
      provider,
      model,
      code,
      site_url,
      answer
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `
  )
  findGeneratedSiteByIdStatement = sqliteDb.prepare(
    `
    SELECT
      id,
      owner_user_id AS ownerUserId,
      prompt,
      mode,
      provider,
      model,
      code,
      site_url AS siteUrl,
      answer,
      created_at AS createdAt
    FROM generated_sites
    WHERE id = ?
    LIMIT 1
  `
  )
}

const databaseReady = initializeDatabase()

async function findUserByEmail(email) {
  await databaseReady

  if (!USE_POSTGRES) {
    return findUserByEmailStatement.get(email) || null
  }

  const result = await postgresPool.query(
    `
      SELECT
        id,
        full_name AS "fullName",
        email,
        password_hash AS "passwordHash",
        google_sub AS "googleSub",
        google_picture AS "googlePicture",
        auth_provider AS "authProvider",
        role,
        plan,
        created_at AS "createdAt"
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email]
  )

  return result.rows[0] || null
}

async function findUserById(userId) {
  await databaseReady

  if (!USE_POSTGRES) {
    return findUserByIdStatement.get(userId) || null
  }

  const result = await postgresPool.query(
    `
      SELECT
        id,
        full_name AS "fullName",
        email,
        password_hash AS "passwordHash",
        google_sub AS "googleSub",
        google_picture AS "googlePicture",
        auth_provider AS "authProvider",
        role,
        plan,
        created_at AS "createdAt"
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  )

  return result.rows[0] || null
}

async function findUserByGoogleSub(googleSub) {
  await databaseReady

  if (!USE_POSTGRES) {
    return findUserByGoogleSubStatement.get(googleSub) || null
  }

  const result = await postgresPool.query(
    `
      SELECT
        id,
        full_name AS "fullName",
        email,
        password_hash AS "passwordHash",
        google_sub AS "googleSub",
        google_picture AS "googlePicture",
        auth_provider AS "authProvider",
        role,
        plan,
        created_at AS "createdAt"
      FROM users
      WHERE google_sub = $1
      LIMIT 1
    `,
    [googleSub]
  )

  return result.rows[0] || null
}

async function createUserRecord({ fullName, email, passwordHash, authProvider, role, plan }) {
  await databaseReady

  if (!USE_POSTGRES) {
    const result = createUserStatement.run(fullName, email, passwordHash, authProvider, role, plan)
    return { id: Number(result.lastInsertRowid) }
  }

  const result = await postgresPool.query(
    `
      INSERT INTO users (full_name, email, password_hash, auth_provider, role, plan)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `,
    [fullName, email, passwordHash, authProvider, role, plan]
  )

  return { id: Number(result.rows[0]?.id) }
}

async function updateGoogleIdentity({ id, fullName, googleSub, googlePicture, authProvider }) {
  await databaseReady

  if (!USE_POSTGRES) {
    updateGoogleIdentityStatement.run(fullName, googleSub, googlePicture, authProvider, id)
    return
  }

  await postgresPool.query(
    `
      UPDATE users
      SET
        full_name = $1,
        google_sub = $2,
        google_picture = $3,
        auth_provider = $4
      WHERE id = $5
    `,
    [fullName, googleSub, googlePicture, authProvider, id]
  )
}

async function createGoogleUserRecord({
  fullName,
  email,
  passwordHash,
  googleSub,
  googlePicture,
  authProvider,
  role,
  plan
}) {
  await databaseReady

  if (!USE_POSTGRES) {
    const result = createGoogleUserStatement.run(
      fullName,
      email,
      passwordHash,
      googleSub,
      googlePicture,
      authProvider,
      role,
      plan
    )
    return { id: Number(result.lastInsertRowid) }
  }

  const result = await postgresPool.query(
    `
      INSERT INTO users (
        full_name,
        email,
        password_hash,
        google_sub,
        google_picture,
        auth_provider,
        role,
        plan
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `,
    [fullName, email, passwordHash, googleSub, googlePicture, authProvider, role, plan]
  )

  return { id: Number(result.rows[0]?.id) }
}

async function createResumePrediction(record) {
  await databaseReady

  if (!USE_POSTGRES) {
    const result = createResumePredictionStatement.run(
      record.userId,
      record.fileName,
      record.filePath,
      record.mimeType,
      record.sizeBytes,
      record.prediction,
      record.confidence,
      record.confidenceLevel,
      record.llmModel,
      record.analysisJson
    )
    return { id: Number(result.lastInsertRowid) }
  }

  const result = await postgresPool.query(
    `
      INSERT INTO resume_predictions (
        user_id,
        file_name,
        file_path,
        mime_type,
        size_bytes,
        prediction,
        confidence,
        confidence_level,
        llm_model,
        analysis_json
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `,
    [
      record.userId,
      record.fileName,
      record.filePath,
      record.mimeType,
      record.sizeBytes,
      record.prediction,
      record.confidence,
      record.confidenceLevel,
      record.llmModel,
      record.analysisJson
    ]
  )

  return { id: Number(result.rows[0]?.id) }
}

async function findResumePredictionById(predictionId) {
  await databaseReady

  if (!USE_POSTGRES) {
    return findResumePredictionByIdStatement.get(predictionId) || null
  }

  const result = await postgresPool.query(
    `
      SELECT
        id,
        user_id AS "userId",
        file_name AS "fileName",
        file_path AS "filePath",
        mime_type AS "mimeType",
        size_bytes AS "sizeBytes",
        prediction,
        confidence,
        confidence_level AS "confidenceLevel",
        llm_model AS "llmModel",
        analysis_json AS "analysisJson",
        created_at AS "createdAt"
      FROM resume_predictions
      WHERE id = $1
      LIMIT 1
    `,
    [predictionId]
  )

  return result.rows[0] || null
}

async function createGeneratedSite(record) {
  await databaseReady

  if (!USE_POSTGRES) {
    const result = createGeneratedSiteStatement.run(
      record.ownerUserId,
      record.prompt,
      record.mode,
      record.provider,
      record.model,
      record.code || null,
      record.siteUrl || null,
      record.answer || null
    )

    return { id: Number(result.lastInsertRowid) }
  }

  const result = await postgresPool.query(
    `
      INSERT INTO generated_sites (
        owner_user_id,
        prompt,
        mode,
        provider,
        model,
        code,
        site_url,
        answer
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `,
    [
      record.ownerUserId,
      record.prompt,
      record.mode,
      record.provider,
      record.model,
      record.code || null,
      record.siteUrl || null,
      record.answer || null
    ]
  )

  return { id: Number(result.rows[0]?.id) }
}

async function findGeneratedSiteById(siteId) {
  await databaseReady

  if (!USE_POSTGRES) {
    return findGeneratedSiteByIdStatement.get(siteId) || null
  }

  const result = await postgresPool.query(
    `
      SELECT
        id,
        owner_user_id AS "ownerUserId",
        prompt,
        mode,
        provider,
        model,
        code,
        site_url AS "siteUrl",
        answer,
        created_at AS "createdAt"
      FROM generated_sites
      WHERE id = $1
      LIMIT 1
    `,
    [siteId]
  )

  return result.rows[0] || null
}

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null

function buildUserPayload(user) {
  if (!user) {
    return null
  }

  return {
    id: Number(user.id),
    fullName: user.fullName,
    email: user.email,
    role: String(user.role || 'candidate'),
    plan: String(user.plan || 'free'),
    authProvider: String(user.authProvider || 'password'),
    avatarUrl: user.googlePicture || null
  }
}

function resolveCorsOrigin(origin) {
  if (!origin) {
    return CORS_ORIGINS[0] || '*'
  }

  if (allowedOrigins.has(origin)) {
    return origin
  }

  // In local development, allow localhost/127.0.0.1 on any port to avoid
  // browser CORS failures when Vite selects a fallback port.
  if (NODE_ENV !== 'production' && localOriginRegex.test(origin)) {
    return origin
  }

  return CORS_ORIGINS[0] || '*'
}

function getJsonHeaders(origin) {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': resolveCorsOrigin(origin),
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin'
  }
}

function sendJson(response, statusCode, payload, origin) {
  response.writeHead(statusCode, getJsonHeaders(origin))
  response.end(JSON.stringify(payload))
}

function sendNoContent(response, origin) {
  response.writeHead(204, getJsonHeaders(origin))
  response.end()
}

function sendRedirect(response, statusCode, location, origin, extraHeaders = {}) {
  response.writeHead(statusCode, {
    ...getJsonHeaders(origin),
    ...extraHeaders,
    Location: location
  })
  response.end()
}

function readRawBody(request, maxBytes = 10 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let totalBytes = 0

    request.on('data', (chunk) => {
      totalBytes += chunk.length

      if (totalBytes > maxBytes) {
        reject(new Error('PAYLOAD_TOO_LARGE'))
        request.destroy()
        return
      }

      chunks.push(chunk)
    })

    request.on('end', () => {
      resolve(Buffer.concat(chunks))
    })

    request.on('error', reject)
  })
}

function parseJsonPayload(rawText) {
  if (!rawText) {
    return null
  }

  try {
    return JSON.parse(String(rawText))
  } catch {
    return null
  }
}

async function readFetchJsonOrText(fetchResponse) {
  const text = await fetchResponse.text()
  const parsed = parseJsonPayload(text)
  return parsed || { message: text }
}

function buildFallbackName(email) {
  const localPart = String(email || '').split('@')[0]
  const humanized = localPart.replace(/[._-]+/g, ' ').trim()

  if (!humanized) {
    return 'Google User'
  }

  return humanized.replace(/\b\w/g, (character) => character.toUpperCase())
}

function isVerifiedGoogleEmail(value) {
  return value === true || value === 'true'
}

async function verifyGoogleCredential(credential) {
  if (!googleClient || !GOOGLE_CLIENT_ID) {
    throw new Error('Google sign-in is not configured on the server.')
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    })

    return ticket.getPayload()
  } catch {
    throw new Error('Invalid or expired Google credential.')
  }
}

function encodeBase64UrlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

function decodeBase64UrlJson(value) {
  try {
    return JSON.parse(Buffer.from(String(value || ''), 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

function verifyToken(token) {
  const [headerPart, payloadPart, signaturePart] = String(token || '').split('.')

  if (!headerPart || !payloadPart || !signaturePart) {
    throw new Error('Missing token sections.')
  }

  const expectedSignature = createHmac('sha256', JWT_SECRET)
    .update(`${headerPart}.${payloadPart}`)
    .digest('base64url')

  const providedBuffer = Buffer.from(signaturePart)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new Error('Token signature is invalid.')
  }

  const header = decodeBase64UrlJson(headerPart)
  const payload = decodeBase64UrlJson(payloadPart)

  if (!header || !payload || header.alg !== 'HS256' || header.typ !== 'JWT') {
    throw new Error('Token payload is invalid.')
  }

  const now = Math.floor(Date.now() / 1000)
  if (!Number.isFinite(payload.exp) || payload.exp <= now) {
    throw new Error('Token has expired.')
  }

  return payload
}

function getTokenFromRequest(request) {
  const authorizationHeader = String(request.headers.authorization || '').trim()

  if (!authorizationHeader.startsWith('Bearer ')) {
    return ''
  }

  return authorizationHeader.slice('Bearer '.length).trim()
}

async function authenticateRequest(request) {
  const token = getTokenFromRequest(request)

  if (!token) {
    return { ok: false, statusCode: 401, message: 'Authentication required.' }
  }

  let payload
  try {
    payload = verifyToken(token)
  } catch (error) {
    return {
      ok: false,
      statusCode: 401,
      message: String(error?.message || 'Invalid authentication token.')
    }
  }

  const userId = Number(payload.sub)
  if (!Number.isInteger(userId) || userId <= 0) {
    return { ok: false, statusCode: 401, message: 'Authentication token is malformed.' }
  }

  const userRecord = await findUserById(userId)
  if (!userRecord) {
    return { ok: false, statusCode: 401, message: 'The user for this session no longer exists.' }
  }

  return {
    ok: true,
    userRecord,
    user: buildUserPayload(userRecord)
  }
}

async function requireAuthenticatedUser(request, response, origin) {
  const authResult = await authenticateRequest(request)

  if (!authResult.ok) {
    sendJson(response, authResult.statusCode, { message: authResult.message }, origin)
    return null
  }

  return authResult
}

let mlServiceChild = null
let mlServiceStartPromise = null

const mlServiceAddress = (() => {
  try {
    const parsed = new URL(ML_SERVICE_URL)
    const host = parsed.hostname || '127.0.0.1'
    const port = parsed.port || (parsed.protocol === 'https:' ? '443' : '80')
    return { host, port }
  } catch {
    return { host: '127.0.0.1', port: '8000' }
  }
})()

function resolveMlPythonBin() {
  const windowsCandidates = [
    path.join(workspaceRoot, '.venv', 'Scripts', 'python.exe'),
    path.join(workspaceRoot, '.venv-1', 'Scripts', 'python.exe'),
    path.join(workspaceRoot, '.venv-2', 'Scripts', 'python.exe'),
    'python'
  ]
  const unixCandidates = [
    path.join(workspaceRoot, '.venv', 'bin', 'python'),
    path.join(workspaceRoot, '.venv-1', 'bin', 'python'),
    path.join(workspaceRoot, '.venv-2', 'bin', 'python'),
    'python3',
    'python'
  ]
  const candidates = process.platform === 'win32' ? windowsCandidates : unixCandidates

  for (const candidate of candidates) {
    if (candidate.includes(path.sep) && !existsSync(candidate)) {
      continue
    }

    const probe = spawnSync(candidate, ['-c', 'import ml_service.app.main'], {
      cwd: workspaceRoot,
      env: process.env,
      stdio: 'ignore',
      timeout: 15000,
      windowsHide: true
    })

    if (probe.status === 0) {
      return candidate
    }
  }

  return process.platform === 'win32' ? 'python' : 'python3'
}

function logChildOutput(prefix, chunk) {
  const output = String(chunk || '')
  const lines = output.split(/\r?\n/)
  for (const line of lines) {
    if (line.trim()) {
      console.log(`[${prefix}] ${line}`)
    }
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

async function isMlHealthy(timeoutMs = 1500) {
  try {
    const response = await fetchWithTimeout(`${ML_SERVICE_URL}/health`, { method: 'GET' }, timeoutMs)
    return response.ok
  } catch {
    return false
  }
}

function startMlServiceProcess() {
  if (mlServiceChild && mlServiceChild.exitCode === null) {
    return mlServiceChild
  }

  const mlPythonBin = resolveMlPythonBin()
  const args = [
    '-m',
    'uvicorn',
    'ml_service.app.main:app',
    '--host',
    mlServiceAddress.host,
    '--port',
    mlServiceAddress.port
  ]

  const child = spawn(mlPythonBin, args, {
    cwd: workspaceRoot,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe']
  })

  child.stdout?.on('data', (chunk) => logChildOutput('ml_service', chunk))
  child.stderr?.on('data', (chunk) => logChildOutput('ml_service', chunk))

  child.on('exit', (code, signal) => {
    if (mlServiceChild === child) {
      mlServiceChild = null
    }
    const reason = signal ? `signal ${signal}` : `code ${code}`
    console.error(`[ml_service] exited (${reason})`)
  })

  mlServiceChild = child
  return child
}

async function waitForMlHealthy(maxWaitMs = 30000) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < maxWaitMs) {
    if (await isMlHealthy(1200)) {
      return true
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  return false
}

async function ensureMlServiceAvailable() {
  if (await isMlHealthy(1200)) {
    return
  }

  if (NODE_ENV === 'production' || !ML_SERVICE_AUTOSTART) {
    return
  }

  if (!mlServiceStartPromise) {
    mlServiceStartPromise = (async () => {
      startMlServiceProcess()
      const ready = await waitForMlHealthy(30000)
      if (!ready) {
        throw new Error(`ML service failed to become healthy at ${ML_SERVICE_URL}.`)
      }
    })().finally(() => {
      mlServiceStartPromise = null
    })
  }

  await mlServiceStartPromise
}

async function requestMlService(targetPath, options) {
  try {
    return await fetchWithTimeout(`${ML_SERVICE_URL}${targetPath}`, options, 25000)
  } catch (firstError) {
    await ensureMlServiceAvailable()
    return await fetchWithTimeout(`${ML_SERVICE_URL}${targetPath}`, options, 25000)
  }
}

async function handleMlProxyMultipart(request, response, origin, targetPath) {
  const contentType = String(request.headers['content-type'] || '')
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType)
  const boundary = boundaryMatch?.[1] || boundaryMatch?.[2]

  if (!contentType.toLowerCase().includes('multipart/form-data') || !boundary) {
    sendJson(
      response,
      400,
      { message: 'Expected multipart/form-data request.' },
      origin
    )
    return
  }

  let rawBody
  try {
    rawBody = await readRawBody(request)
  } catch (error) {
    if (error.message === 'PAYLOAD_TOO_LARGE') {
      sendJson(response, 413, { message: 'Uploaded file is too large. Max size is 10MB.' }, origin)
      return
    }
    sendJson(response, 400, { message: 'Unable to read uploaded file.' }, origin)
    return
  }

  try {
    const mlResponse = await requestMlService(targetPath, {
      method: 'POST',
      headers: {
        'Content-Type': contentType
      },
      body: rawBody
    })

    const payload = await readFetchJsonOrText(mlResponse)
    sendJson(response, mlResponse.status, payload, origin)
  } catch (error) {
    sendJson(
      response,
      503,
      {
        message: `ML service unavailable at ${ML_SERVICE_URL}.`,
        detail: String(error?.message || error)
      },
      origin
    )
  }
}

async function handleMlProxyJson(request, response, origin, targetPath) {
  let payload
  try {
    payload = await readJsonBody(request)
  } catch (error) {
    if (error.message === 'PAYLOAD_TOO_LARGE') {
      sendJson(response, 413, { message: 'Request body is too large.' }, origin)
      return
    }
    sendJson(response, 400, { message: 'Invalid JSON body.' }, origin)
    return
  }

  try {
    const mlResponse = await requestMlService(targetPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const mlPayload = await readFetchJsonOrText(mlResponse)
    sendJson(response, mlResponse.status, mlPayload, origin)
  } catch (error) {
    sendJson(
      response,
      503,
      {
        message: `ML service unavailable at ${ML_SERVICE_URL}.`,
        detail: String(error?.message || error)
      },
      origin
    )
  }
}

async function handleMlProxyGet(response, origin, targetPathWithQuery) {
  try {
    const mlResponse = await requestMlService(targetPathWithQuery, {
      method: 'GET'
    })
    const payload = await readFetchJsonOrText(mlResponse)
    sendJson(response, mlResponse.status, payload, origin)
  } catch (error) {
    sendJson(
      response,
      503,
      {
        message: `ML service unavailable at ${ML_SERVICE_URL}.`,
        detail: String(error?.message || error)
      },
      origin
    )
  }
}

const remoteJobRegex = /\bremote\b|\bwork from home\b|\bwfh\b|\banywhere\b/i
const indiaLocationRegex =
  /\bindia\b|\bbengaluru\b|\bbangalore\b|\bhyderabad\b|\bpune\b|\bmumbai\b|\bchennai\b|\bgurgaon\b|\bgurugram\b|\bnoida\b|\bdelhi\b/i

function parseJobPostedAt(value) {
  const raw = String(value || '').trim()
  if (!raw) {
    return null
  }

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function getPostedHoursAgo(value) {
  const postedAt = parseJobPostedAt(value)
  if (!postedAt) {
    return null
  }

  const ageMs = Date.now() - postedAt.getTime()
  if (ageMs <= 0) {
    return 0
  }

  return Math.floor(ageMs / (1000 * 60 * 60))
}

function buildJSearchCorpus(job) {
  return [
    job?.job_title,
    job?.job_description,
    job?.job_employment_type,
    job?.job_location,
    job?.job_city,
    job?.job_state,
    job?.job_country
  ]
    .map((part) => String(part || '').trim())
    .join(' ')
}

function isRemoteJSearchJob(job) {
  if (job?.job_is_remote === true) {
    return true
  }

  return remoteJobRegex.test(buildJSearchCorpus(job))
}

function matchesJSearchLocation(job, location) {
  const normalizedLocation = String(location || '').trim().toLowerCase()
  if (!normalizedLocation) {
    return true
  }

  const corpus = buildJSearchCorpus(job).toLowerCase()
  if (corpus.includes(normalizedLocation)) {
    return true
  }

  if (normalizedLocation === 'india') {
    return indiaLocationRegex.test(corpus)
  }

  return false
}

function formatJSearchJob(job) {
  const postedDate = String(
    job?.job_posted_at_datetime_utc || job?.job_posted_at || job?.posted_date || ''
  ).trim()

  return {
    title: String(job?.job_title || 'Untitled role').trim(),
    company: String(job?.employer_name || 'Unknown company').trim(),
    location: String(job?.job_location || job?.job_country || 'Location not specified').trim(),
    description: String(job?.job_description || '').trim(),
    salary: String(job?.job_salary || '').trim(),
    posted_date: postedDate,
    posted_hours_ago: getPostedHoursAgo(postedDate),
    apply_link: String(job?.job_apply_link || '').trim(),
    employment_type: String(job?.job_employment_type || '').trim(),
    is_remote: isRemoteJSearchJob(job),
    source: String(job?.job_publisher || 'JSearch').trim(),
    company_logo: String(job?.employer_logo || '').trim(),
    required_skills: Array.isArray(job?.job_required_skills) ? job.job_required_skills : [],
    required_experience: job?.job_required_experience || '',
    required_education: job?.job_required_education || ''
  }
}

async function searchJobsViaArbeitnow(params) {
  const maxPages = Math.max(1, Math.min(Number(params.numPages || 1), 3))
  const effectiveRemote = params.remote == null ? JSEARCH_DEFAULT_REMOTE : Boolean(params.remote)
  const locationText = String(params.location || '').trim().toLowerCase()
  const queryTerms = String(params.query || '')
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 1)
  const jobs = []

  for (let page = 1; page <= maxPages; page += 1) {
    const response = await fetchWithTimeout(
      `https://www.arbeitnow.com/api/job-board-api?page=${page}`,
      { method: 'GET' },
      JSEARCH_TIMEOUT_MS
    )

    if (!response.ok) {
      break
    }

    const payload = await response.json().catch(() => ({}))
    const rows = Array.isArray(payload?.data) ? payload.data : []

    for (const row of rows) {
      const text = [row?.title, row?.description, row?.location, row?.company_name]
        .map((part) => String(part || '').toLowerCase())
        .join(' ')

      const queryMatched = queryTerms.every((term) => text.includes(term))
      if (!queryMatched) {
        continue
      }

      if (effectiveRemote && !remoteJobRegex.test(text)) {
        continue
      }

      if (locationText && locationText !== 'remote' && !text.includes(locationText)) {
        continue
      }

      jobs.push({
        title: String(row?.title || 'Untitled role').trim(),
        company: String(row?.company_name || 'Unknown company').trim(),
        location: String(row?.location || 'Location not specified').trim(),
        description: String(row?.description || '').trim(),
        salary: '',
        posted_date: String(row?.created_at || '').trim(),
        posted_hours_ago: getPostedHoursAgo(row?.created_at),
        apply_link: String(row?.url || '').trim(),
        employment_type: Array.isArray(row?.job_types)
          ? row.job_types.join(' ')
          : String(row?.job_types || '').trim(),
        is_remote: true,
        source: 'Arbeitnow',
        company_logo: '',
        required_skills: [],
        required_experience: '',
        required_education: ''
      })
    }
  }

  const filteredByRecency =
    Number.isFinite(params.postedWithinHours) && params.postedWithinHours > 0
      ? jobs.filter((job) => {
          const hours = Number(job.posted_hours_ago)
          return Number.isFinite(hours) && hours <= Number(params.postedWithinHours)
        })
      : jobs

  return {
    jobs: filteredByRecency.slice(0, Math.max(1, Math.min(Number(params.limit || 30), 50))),
    meta: {
      provider: 'arbeitnow',
      fallback_enabled: true,
      error: null
    }
  }
}

async function searchJobsViaJSearch(params) {
  const effectiveRemote = params.remote == null ? JSEARCH_DEFAULT_REMOTE : Boolean(params.remote)
  const effectiveLocation = String(params.location || JSEARCH_DEFAULT_LOCATION || '').trim()

  if (!JSEARCH_API_KEY) {
    if (JSEARCH_ENABLE_FALLBACK) {
      return await searchJobsViaArbeitnow(params)
    }

    return {
      jobs: [],
      meta: {
        provider: 'none',
        jsearch_configured: false,
        fallback_enabled: JSEARCH_ENABLE_FALLBACK,
        error: 'JSearch API key is not configured.'
      }
    }
  }

  const endpoint = new URL(`https://${JSEARCH_API_HOST}/search`)
  endpoint.searchParams.set('query', params.query)
  endpoint.searchParams.set('page', String(Math.max(1, Number(params.page || 1))))
  endpoint.searchParams.set('num_pages', String(Math.max(1, Number(params.numPages || 1))))

  if (effectiveLocation) {
    endpoint.searchParams.set('location', effectiveLocation)
  }

  if (effectiveRemote) {
    endpoint.searchParams.set('remote_jobs_only', 'true')
  }

  const response = await fetchWithTimeout(
    endpoint.toString(),
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-RapidAPI-Key': JSEARCH_API_KEY,
        'X-RapidAPI-Host': JSEARCH_API_HOST
      }
    },
    JSEARCH_TIMEOUT_MS
  )

  const payload = await response.json().catch(() => ({}))

  if (!response.ok || payload?.status !== 'OK') {
    const detail =
      String(payload?.message || payload?.error || '').trim() ||
      `JSearch returned ${response.status}.`

    if (JSEARCH_ENABLE_FALLBACK) {
      const fallback = await searchJobsViaArbeitnow(params)
      return {
        ...fallback,
        meta: {
          ...fallback.meta,
          error: detail
        }
      }
    }

    return {
      jobs: [],
      meta: {
        provider: 'jsearch',
        jsearch_configured: true,
        fallback_enabled: JSEARCH_ENABLE_FALLBACK,
        error: detail
      }
    }
  }

  let jobs = Array.isArray(payload?.data) ? payload.data : []

  if (effectiveLocation) {
    jobs = jobs.filter((job) => matchesJSearchLocation(job, effectiveLocation))
  }

  if (effectiveRemote) {
    jobs = jobs.filter((job) => isRemoteJSearchJob(job))
  }

  let formattedJobs = jobs.map((job) => formatJSearchJob(job))
  formattedJobs.sort((left, right) => {
    const leftTime = parseJobPostedAt(left.posted_date)?.getTime() || 0
    const rightTime = parseJobPostedAt(right.posted_date)?.getTime() || 0
    return rightTime - leftTime
  })

  if (Number.isFinite(params.postedWithinHours) && params.postedWithinHours > 0) {
    formattedJobs = formattedJobs.filter((job) => {
      const hours = Number(job.posted_hours_ago)
      return Number.isFinite(hours) && hours <= Number(params.postedWithinHours)
    })
  }

  if (Number.isFinite(params.limit) && params.limit > 0) {
    formattedJobs = formattedJobs.slice(0, Math.min(Number(params.limit), 50))
  }

  return {
    jobs: formattedJobs,
    meta: {
      provider: 'jsearch',
      jsearch_configured: true,
      fallback_enabled: JSEARCH_ENABLE_FALLBACK,
      error: null
    }
  }
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const key = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${key}`
}

function verifyPassword(password, storedHash) {
  const [salt, keyHex] = String(storedHash || '').split(':')
  if (!salt || !keyHex) {
    return false
  }

  const storedKey = Buffer.from(keyHex, 'hex')
  const derivedKey = scryptSync(password, salt, storedKey.length)

  if (storedKey.length !== derivedKey.length) {
    return false
  }

  return timingSafeEqual(storedKey, derivedKey)
}

function createToken(user) {
  const now = Math.floor(Date.now() / 1000)
  const header = encodeBase64UrlJson({ alg: 'HS256', typ: 'JWT' })
  const payload = encodeBase64UrlJson({
    sub: user.id,
    email: user.email,
    name: user.fullName,
    iat: now,
    exp: now + 60 * 60 * 24 * 7
  })

  const signature = createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url')

  return `${header}.${payload}.${signature}`
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let rawData = ''

    request.on('data', (chunk) => {
      rawData += chunk

      if (rawData.length > 1024 * 1024) {
        reject(new Error('PAYLOAD_TOO_LARGE'))
        request.destroy()
      }
    })

    request.on('end', () => {
      if (!rawData) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(rawData))
      } catch {
        reject(new Error('INVALID_JSON'))
      }
    })

    request.on('error', reject)
  })
}

function parseMultipartFormData(bodyBuffer, boundary) {
  const delimiter = `--${boundary}`
  const rawBody = bodyBuffer.toString('latin1')
  const rawParts = rawBody
    .split(delimiter)
    .slice(1, -1)

  const fields = {}

  for (const rawPart of rawParts) {
    let part = rawPart

    if (part.startsWith('\r\n')) {
      part = part.slice(2)
    }

    if (part.endsWith('\r\n')) {
      part = part.slice(0, -2)
    }

    const headerEndIndex = part.indexOf('\r\n\r\n')
    if (headerEndIndex === -1) {
      continue
    }

    const headerBlock = part.slice(0, headerEndIndex)
    const contentText = part.slice(headerEndIndex + 4)
    const headers = headerBlock.split('\r\n')
    const contentDispositionHeader = headers.find((headerLine) =>
      headerLine.toLowerCase().startsWith('content-disposition:')
    )

    if (!contentDispositionHeader) {
      continue
    }

    const fieldNameMatch = /name="([^"]+)"/i.exec(contentDispositionHeader)
    if (!fieldNameMatch) {
      continue
    }

    const fileNameMatch = /filename="([^"]*)"/i.exec(contentDispositionHeader)
    const contentTypeHeader = headers.find((headerLine) =>
      headerLine.toLowerCase().startsWith('content-type:')
    )

    const fieldName = fieldNameMatch[1]
    const contentType = contentTypeHeader
      ? contentTypeHeader.split(':').slice(1).join(':').trim()
      : 'application/octet-stream'

    fields[fieldName] = {
      filename: fileNameMatch ? fileNameMatch[1] : '',
      contentType,
      data: Buffer.from(contentText, 'latin1'),
      value: contentText
    }
  }

  return fields
}

function buildResumeApiPayload(result) {
  const storedAnalysis = parseStoredAnalysis(result.analysisJson)
  const confidence = Number(result.confidence)
  const confidenceLevel =
    String(result.confidenceLevel || storedAnalysis.confidenceLevel || '').trim() ||
    getConfidenceLevel(confidence)

  const payload = {
    id: result.id,
    fileName: result.fileName,
    sizeBytes: result.sizeBytes,
    prediction: String(result.prediction || storedAnalysis.prediction || ''),
    confidence,
    confidenceLevel,
    weaknesses: Array.isArray(storedAnalysis.weaknesses) ? storedAnalysis.weaknesses : [],
    precautions: Array.isArray(storedAnalysis.precautions) ? storedAnalysis.precautions : [],
    technologyRecommendations: Array.isArray(storedAnalysis.technologyRecommendations)
      ? storedAnalysis.technologyRecommendations
      : [],
    improvementPlan: Array.isArray(storedAnalysis.improvementPlan) ? storedAnalysis.improvementPlan : [],
    llmModel: String(result.llmModel || storedAnalysis.llmModel || 'local-llm-v1'),
    analysisMethod: String(storedAnalysis.analysisMethod || 'heuristic-local-llm'),
    voiceSummary: String(storedAnalysis.voiceSummary || ''),
    createdAt: result.createdAt
  }

  if (!payload.voiceSummary && payload.weaknesses.length > 0) {
    payload.voiceSummary = `AI coach update. Confidence ${payload.confidence} percent with ${payload.confidenceLevel} level. Key weakness: ${payload.weaknesses[0]}. Priority improvement: ${payload.improvementPlan[0] || 'Strengthen measurable impact statements.'}`
  }

  return payload
}

function normalizeConfidenceToUnit(confidenceValue) {
  const numeric = Number(confidenceValue)
  if (!Number.isFinite(numeric)) {
    return 0
  }

  return Math.max(0, Math.min(1, Number((numeric / 100).toFixed(2))))
}

function buildPipelinePredictPayload(resumeBuffer, analysis) {
  const extracted = extractResumeProfile(resumeBuffer)
  const safeSkills = Array.isArray(extracted.skills) ? extracted.skills.filter(Boolean) : []
  const safeCertifications = Array.isArray(extracted.certifications)
    ? extracted.certifications.filter(Boolean)
    : []
  const safeProjects = Array.isArray(extracted.projects) ? extracted.projects.filter(Boolean) : []
  const experienceYears = Number(extracted.experience_years)

  return {
    name: String(extracted.name || '').trim(),
    skills: safeSkills,
    education: String(extracted.education || '').trim(),
    certifications: safeCertifications,
    projects: safeProjects,
    experience_years: Number.isFinite(experienceYears) ? Math.max(0, experienceYears) : 0,
    predicted_role: String(extracted.predicted_role || '').trim() || 'Software Engineer',
    confidence: normalizeConfidenceToUnit(analysis?.confidence),
    ats_score: Number(analysis?.confidence || 0),
    predicted_category: String(analysis?.confidenceLevel || '').trim(),
    missing_skills: Array.isArray(analysis?.technologyRecommendations)
      ? analysis.technologyRecommendations
      : [],
    weaknesses: Array.isArray(analysis?.weaknesses) ? analysis.weaknesses : [],
    job_description_used: '',
    jobs: []
  }
}

function hasUsableApiKey(value) {
  const key = String(value || '').trim()
  if (!key) {
    return false
  }

  return !/(your_|change-me|placeholder|dummy|example)/i.test(key)
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildGeneratedSite(prompt) {
  const safePrompt = escapeHtml(prompt.trim())
  const code = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rexion Generated Site</title>
  <style>
    :root { color-scheme: light; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      font-family: "Segoe UI", Arial, sans-serif;
      background: linear-gradient(135deg, #0f172a, #111827 45%, #1e3a8a);
      color: #f8fafc;
      padding: 24px;
      box-sizing: border-box;
    }
    .card {
      width: min(760px, 100%);
      border: 1px solid rgba(56, 189, 248, 0.45);
      border-radius: 16px;
      padding: 24px;
      background: rgba(2, 6, 23, 0.72);
      backdrop-filter: blur(8px);
      box-shadow: 0 20px 50px rgba(2, 6, 23, 0.45);
    }
    h1 {
      margin: 0 0 8px;
      font-size: clamp(1.4rem, 3vw, 2rem);
      letter-spacing: 0.04em;
    }
    p {
      margin: 0;
      line-height: 1.6;
      color: #e2e8f0;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <article class="card">
    <h1>REXION Generated Output</h1>
    <p>${safePrompt}</p>
  </article>
</body>
</html>`

  return {
    code,
    siteUrl: `data:text/html;charset=utf-8,${encodeURIComponent(code)}`
  }
}

function buildSiteResponseFromCode(code, extra = {}) {
  return {
    code,
    siteUrl: `data:text/html;charset=utf-8,${encodeURIComponent(code)}`,
    ...extra
  }
}

function parseJsonObject(rawText) {
  if (!rawText) {
    return null
  }

  try {
    return JSON.parse(String(rawText))
  } catch {
    const text = String(rawText)
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) {
      return null
    }

    try {
      return JSON.parse(text.slice(start, end + 1))
    } catch {
      return null
    }
  }
}

function extractHtmlFromModelResponse(content, prompt) {
  const raw = String(content || '').trim()
  if (!raw) {
    return buildGeneratedSite(prompt).code
  }

  const parsed = parseJsonObject(raw)
  if (parsed && typeof parsed === 'object') {
    const maybeHtml =
      String(parsed.html || parsed.code || parsed.content || '').trim()
    if (maybeHtml) {
      return maybeHtml
    }
  }

  const fencedHtmlMatch = /```(?:html)?\s*([\s\S]*?)```/i.exec(raw)
  const candidate = (fencedHtmlMatch?.[1] || raw).trim()

  if (/<html[\s>]/i.test(candidate)) {
    return candidate
  }

  if (/<body[\s>]/i.test(candidate) || /<(main|section|div|article|header|footer)[\s>]/i.test(candidate)) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rexion Generated Site</title>
</head>
<body>
${candidate}
</body>
</html>`
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rexion Generated Site</title>
  <style>
    body { font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 24px; }
    pre { white-space: pre-wrap; background: rgba(15, 23, 42, 0.7); border: 1px solid #334155; padding: 16px; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>Model Output</h1>
  <pre>${escapeHtml(candidate)}</pre>
</body>
</html>`
}

function extractAnswerTextFromModelResponse(content, prompt) {
  const raw = String(content || '').trim()
  if (!raw) {
    return `I could not generate a response for "${prompt}". Please try again with more detail.`
  }

  const parsed = parseJsonObject(raw)
  if (parsed && typeof parsed === 'object') {
    const maybeAnswer = String(parsed.answer || parsed.text || parsed.content || '').trim()
    if (maybeAnswer) {
      return maybeAnswer
    }
  }

  const fencedTextMatch = /```(?:markdown|md|text)?\s*([\s\S]*?)```/i.exec(raw)
  const candidate = String(fencedTextMatch?.[1] || raw).trim()

  if (!candidate) {
    return `I could not generate a response for "${prompt}". Please try again with more detail.`
  }

  return candidate
}

function buildAnswerResponse(answer, extra = {}) {
  return {
    answer: String(answer || '').trim(),
    ...extra
  }
}

function isOpenRouterAuthFailure(message) {
  const text = String(message || '').toLowerCase()
  return (
    text.includes('user not found') ||
    text.includes('invalid api key') ||
    text.includes('unauthorized') ||
    /\b401\b/.test(text)
  )
}

function isDeepSeekAuthFailure(message) {
  const text = String(message || '').toLowerCase()
  return (
    text.includes('authentication') ||
    text.includes('invalid api key') ||
    text.includes('missing authentication header') ||
    (text.includes('unauthorized') && text.includes('deepseek')) ||
    /\b401\b/.test(text)
  )
}

function isDeepSeekBillingFailure(message) {
  const text = String(message || '').toLowerCase()
  return (
    text.includes('insufficient balance') ||
    text.includes('insufficient_quota') ||
    /\b402\b/.test(text)
  )
}

function toRexcodeFailure(error) {
  const rawMessage = String(error?.message || error || 'Unknown AI generation error')
  if (isDeepSeekAuthFailure(rawMessage)) {
    return {
      statusCode: 401,
      message:
        'DeepSeek authentication failed (401). Set a valid DEEPSEEK_API_KEY in backend/.env.'
    }
  }

  if (isDeepSeekBillingFailure(rawMessage)) {
    return {
      statusCode: 402,
      message: 'DeepSeek quota/billing issue (402). Add balance or upgrade the DeepSeek account and retry.'
    }
  }

  if (isOpenRouterAuthFailure(rawMessage)) {
    return {
      statusCode: 401,
      message:
        'OpenRouter authentication failed (401: User not found). The configured API key is rejected. Set a valid OPENROUTER_API_KEY in backend/.env.'
    }
  }

  return {
    statusCode: 502,
    message: `AI generation failed. ${rawMessage}`
  }
}

function inferRexcodeMode(requestedMode, prompt) {
  const normalizedMode = String(requestedMode || 'auto').trim().toLowerCase()
  if (normalizedMode === 'site' || normalizedMode === 'answer') {
    return normalizedMode
  }

  const text = String(prompt || '').trim().toLowerCase()
  const websiteHints = [
    'website',
    'web site',
    'landing page',
    'portfolio',
    'webpage',
    'home page',
    'ui',
    'dashboard',
    'html',
    'css',
    'javascript',
    'react',
    'build a site',
    'create a site',
    'generate code',
    'frontend'
  ]

  return websiteHints.some((hint) => text.includes(hint)) ? 'site' : 'answer'
}

function normalizeDeepSeekModel(model) {
  const raw = String(model || '').trim().toLowerCase()
  if (!raw) {
    return 'deepseek-chat'
  }

  if (raw === 'deepseek-chat' || raw.endsWith('/deepseek-chat') || raw.endsWith('/deepseek-v3')) {
    return 'deepseek-chat'
  }

  if (
    raw === 'deepseek-reasoner' ||
    raw.includes('deepseek-r1') ||
    raw.endsWith('/deepseek-reasoner')
  ) {
    return 'deepseek-reasoner'
  }

  if (raw.startsWith('deepseek/')) {
    return raw.split('/').pop() || 'deepseek-chat'
  }

  return 'deepseek-chat'
}

function buildDeepSeekModelCandidates(configuredModel, mode) {
  const candidates = [normalizeDeepSeekModel(configuredModel)]
  const fallbacks =
    mode === 'site' ? ['deepseek-chat', 'deepseek-reasoner'] : ['deepseek-chat', 'deepseek-reasoner']

  for (const fallback of fallbacks) {
    if (!candidates.includes(fallback)) {
      candidates.push(fallback)
    }
  }

  return candidates
}

async function requestDeepSeekGeneration(prompt, model, apiKey) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, REXCODE_REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 3200,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert frontend engineer. Return only a complete, valid HTML document with embedded CSS and JavaScript. Do not include markdown.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
      signal: controller.signal
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DeepSeek model ${model} failed (${response.status}): ${errorText.slice(0, 300)}`)
    }

    const payload = await response.json()
    const content = payload?.choices?.[0]?.message?.content
    const code = extractHtmlFromModelResponse(content, prompt)

    return buildSiteResponseFromCode(code, {
      provider: 'deepseek',
      model: String(payload?.model || model)
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`DeepSeek model ${model} timed out after ${REXCODE_REQUEST_TIMEOUT_MS}ms.`)
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

async function requestDeepSeekAnswer(prompt, model, apiKey) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, REXCODE_REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 900,
        messages: [
          {
            role: 'system',
            content:
              'You are REXION AI. Respond with plain text only. Use short paragraphs and optional bullet points. You may use markdown **bold** for emphasis. Do not return HTML, CSS, JavaScript, or code fences.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
      signal: controller.signal
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DeepSeek model ${model} failed (${response.status}): ${errorText.slice(0, 300)}`)
    }

    const payload = await response.json()
    const content = payload?.choices?.[0]?.message?.content
    const answer = extractAnswerTextFromModelResponse(content, prompt)

    return buildAnswerResponse(answer, {
      provider: 'deepseek',
      model: String(payload?.model || model)
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`DeepSeek model ${model} timed out after ${REXCODE_REQUEST_TIMEOUT_MS}ms.`)
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

async function requestOpenRouterGeneration(prompt, model, apiKey) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, REXCODE_REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': OPENROUTER_REFERER,
        'X-Title': OPENROUTER_APP_TITLE
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 3200,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert frontend engineer. Return only a complete, valid HTML document with embedded CSS and JavaScript. Do not include markdown.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
      signal: controller.signal
    })

    if (!response.ok) {
      const errorText = await response.text()
      let providerMessage = errorText.slice(0, 300)
      const parsedError = parseJsonObject(errorText)
      if (parsedError?.error?.message) {
        providerMessage = String(parsedError.error.message).slice(0, 300)
      }

      throw new Error(`Model ${model} failed (${response.status}): ${providerMessage}`)
    }

    const payload = await response.json()
    const content = payload?.choices?.[0]?.message?.content
    const code = extractHtmlFromModelResponse(content, prompt)

    return buildSiteResponseFromCode(code, {
      provider: 'openrouter',
      model: String(payload?.model || model)
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Model ${model} timed out after ${REXCODE_REQUEST_TIMEOUT_MS}ms.`)
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

async function requestOpenRouterAnswer(prompt, model, apiKey) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, REXCODE_REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': OPENROUTER_REFERER,
        'X-Title': OPENROUTER_APP_TITLE
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 900,
        messages: [
          {
            role: 'system',
            content:
              'You are REXION AI. Respond with plain text only. Use short paragraphs and optional bullet points. You may use markdown **bold** for emphasis. Do not return HTML, CSS, JavaScript, or code fences.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
      signal: controller.signal
    })

    if (!response.ok) {
      const errorText = await response.text()
      let providerMessage = errorText.slice(0, 300)
      const parsedError = parseJsonObject(errorText)
      if (parsedError?.error?.message) {
        providerMessage = String(parsedError.error.message).slice(0, 300)
      }

      throw new Error(`Model ${model} failed (${response.status}): ${providerMessage}`)
    }

    const payload = await response.json()
    const content = payload?.choices?.[0]?.message?.content
    const answer = extractAnswerTextFromModelResponse(content, prompt)

    return buildAnswerResponse(answer, {
      provider: 'openrouter',
      model: String(payload?.model || model)
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Model ${model} timed out after ${REXCODE_REQUEST_TIMEOUT_MS}ms.`)
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

async function generateRexcodeSite(prompt) {
  loadRuntimeEnv()
  const openRouterApiKey = getOpenRouterApiKey()
  const deepSeekApiKey = getDeepSeekApiKey()
  const configuredModel = getRexcodeModel()
  const configuredProvider = String(process.env.REXCODE_PROVIDER || 'auto').trim().toLowerCase()
  const preferredProvider = getRexcodeProvider()
  const providerOrder =
    configuredProvider === 'deepseek'
      ? ['deepseek']
      : configuredProvider === 'openrouter'
        ? ['openrouter']
        : preferredProvider === 'deepseek'
          ? ['deepseek', 'openrouter']
          : ['openrouter', 'deepseek']

  const failures = []

  for (const provider of providerOrder) {
    if (provider === 'deepseek') {
      if (!hasUsableApiKey(deepSeekApiKey)) {
        failures.push(
          'DeepSeek API key is missing or placeholder. Set DEEPSEEK_API_KEY in backend/.env.'
        )
        continue
      }

      const deepSeekModelCandidates = buildDeepSeekModelCandidates(configuredModel, 'site')
      for (const model of deepSeekModelCandidates) {
        try {
          return await requestDeepSeekGeneration(prompt, model, deepSeekApiKey)
        } catch (error) {
          failures.push(String(error?.message || error))
        }
      }
      continue
    }

    if (!hasUsableApiKey(openRouterApiKey)) {
      failures.push(
        'OpenRouter API key is missing or placeholder. Set OPENROUTER_API_KEY in backend/.env.'
      )
      continue
    }

    const modelCandidates = [configuredModel]
    for (const fallbackModel of ['openrouter/auto', 'openrouter/free']) {
      if (fallbackModel !== configuredModel) {
        modelCandidates.push(fallbackModel)
      }
    }

    for (const model of modelCandidates) {
      try {
        return await requestOpenRouterGeneration(prompt, model, openRouterApiKey)
      } catch (error) {
        failures.push(String(error?.message || error))
      }
    }
  }

  throw new Error(failures.join(' | '))
}

async function generateRexcodeAnswer(prompt) {
  loadRuntimeEnv()
  const openRouterApiKey = getOpenRouterApiKey()
  const deepSeekApiKey = getDeepSeekApiKey()
  const configuredModel = getRexcodeModel()
  const configuredProvider = String(process.env.REXCODE_PROVIDER || 'auto').trim().toLowerCase()
  const preferredProvider = getRexcodeProvider()
  const providerOrder =
    configuredProvider === 'deepseek'
      ? ['deepseek']
      : configuredProvider === 'openrouter'
        ? ['openrouter']
        : preferredProvider === 'deepseek'
          ? ['deepseek', 'openrouter']
          : ['openrouter', 'deepseek']

  const failures = []

  for (const provider of providerOrder) {
    if (provider === 'deepseek') {
      if (!hasUsableApiKey(deepSeekApiKey)) {
        failures.push(
          'DeepSeek API key is missing or placeholder. Set DEEPSEEK_API_KEY in backend/.env.'
        )
        continue
      }

      const deepSeekModelCandidates = buildDeepSeekModelCandidates(configuredModel, 'answer')
      for (const model of deepSeekModelCandidates) {
        try {
          return await requestDeepSeekAnswer(prompt, model, deepSeekApiKey)
        } catch (error) {
          failures.push(String(error?.message || error))
        }
      }
      continue
    }

    if (!hasUsableApiKey(openRouterApiKey)) {
      failures.push(
        'OpenRouter API key is missing or placeholder. Set OPENROUTER_API_KEY in backend/.env.'
      )
      continue
    }

    const modelCandidates = [configuredModel]
    for (const fallbackModel of ['openrouter/auto', 'openrouter/free']) {
      if (fallbackModel !== configuredModel) {
        modelCandidates.push(fallbackModel)
      }
    }

    for (const model of modelCandidates) {
      try {
        return await requestOpenRouterAnswer(prompt, model, openRouterApiKey)
      } catch (error) {
        failures.push(String(error?.message || error))
      }
    }
  }

  throw new Error(failures.join(' | '))
}

async function handleRegister(request, response, origin) {
  let payload

  try {
    payload = await readJsonBody(request)
  } catch (error) {
    if (error.message === 'PAYLOAD_TOO_LARGE') {
      sendJson(response, 413, { message: 'Request body is too large.' }, origin)
      return
    }

    sendJson(response, 400, { message: 'Invalid JSON body.' }, origin)
    return
  }

  const fullName = String(payload.fullName || '').trim()
  const email = String(payload.email || '').trim().toLowerCase()
  const password = String(payload.password || '')

  if (!fullName || !email || !password) {
    sendJson(response, 400, { message: 'fullName, email and password are required.' }, origin)
    return
  }

  if (!emailRegex.test(email)) {
    sendJson(response, 400, { message: 'Please provide a valid email address.' }, origin)
    return
  }

  if (password.length < 8) {
    sendJson(response, 400, { message: 'Password must be at least 8 characters.' }, origin)
    return
  }

  const existingUser = await findUserByEmail(email)
  if (existingUser) {
    sendJson(response, 409, { message: 'An account with this email already exists.' }, origin)
    return
  }

  const passwordHash = hashPassword(password)
  const result = await createUserRecord({
    fullName,
    email,
    passwordHash,
    authProvider: 'password',
    role: 'candidate',
    plan: 'free'
  })

  const user = buildUserPayload({
      id: Number(result.id),
    fullName,
    email,
    role: 'candidate',
    plan: 'free',
    authProvider: 'password',
    googlePicture: ''
  })

  sendJson(
    response,
    201,
    {
      message: 'Account created successfully.',
      user,
      token: createToken(user)
    },
    origin
  )
}

async function handleLogin(request, response, origin) {
  let payload

  try {
    payload = await readJsonBody(request)
  } catch (error) {
    if (error.message === 'PAYLOAD_TOO_LARGE') {
      sendJson(response, 413, { message: 'Request body is too large.' }, origin)
      return
    }

    sendJson(response, 400, { message: 'Invalid JSON body.' }, origin)
    return
  }

  const email = String(payload.email || '').trim().toLowerCase()
  const password = String(payload.password || '')

  if (!email || !password) {
    sendJson(response, 400, { message: 'email and password are required.' }, origin)
    return
  }

  const userRecord = await findUserByEmail(email)

  if (!userRecord) {
    sendJson(response, 401, { message: 'Invalid email or password.' }, origin)
    return
  }

  if (!userRecord.passwordHash && userRecord.googleSub) {
    sendJson(response, 401, { message: 'This account uses Google sign-in. Continue with Google.' }, origin)
    return
  }

  if (!verifyPassword(password, userRecord.passwordHash)) {
    sendJson(response, 401, { message: 'Invalid email or password.' }, origin)
    return
  }

  const user = buildUserPayload(userRecord)

  sendJson(
    response,
    200,
    {
      message: 'Login successful.',
      user,
      token: createToken(user)
    },
    origin
  )
}

async function handleGoogleAuth(request, response, origin) {
  let payload

  try {
    payload = await readJsonBody(request)
  } catch (error) {
    if (error.message === 'PAYLOAD_TOO_LARGE') {
      sendJson(response, 413, { message: 'Request body is too large.' }, origin)
      return
    }

    sendJson(response, 400, { message: 'Invalid JSON body.' }, origin)
    return
  }

  const credential = String(payload.credential || '').trim()
  if (!credential) {
    sendJson(response, 400, { message: 'Google credential is required.' }, origin)
    return
  }

  let googlePayload
  try {
    googlePayload = await verifyGoogleCredential(credential)
  } catch (error) {
    sendJson(response, 401, { message: String(error?.message || 'Google sign-in failed.') }, origin)
    return
  }

  const email = String(googlePayload?.email || '').trim().toLowerCase()
  const googleSub = String(googlePayload?.sub || '').trim()

  if (!email || !googleSub) {
    sendJson(response, 401, { message: 'Google sign-in did not return a valid account.' }, origin)
    return
  }

  if (!isVerifiedGoogleEmail(googlePayload?.email_verified)) {
    sendJson(response, 401, { message: 'Google account email must be verified to continue.' }, origin)
    return
  }

  const googleName =
    String(googlePayload?.name || '').trim() || buildFallbackName(email)
  const googlePicture = String(googlePayload?.picture || '').trim()

  let userRecord = await findUserByGoogleSub(googleSub)
  let message = 'Google sign-in successful.'
  let statusCode = 200

  if (!userRecord) {
    userRecord = await findUserByEmail(email)

    if (userRecord) {
      const resolvedFullName = String(userRecord.fullName || '').trim() || googleName
      const authProvider = userRecord.passwordHash ? 'hybrid' : 'google'

      await updateGoogleIdentity({
        id: userRecord.id,
        fullName: resolvedFullName,
        googleSub,
        googlePicture,
        authProvider
      })

      userRecord = await findUserById(userRecord.id)
      message = 'Google account linked. Login successful.'
    } else {
      const createResult = await createGoogleUserRecord({
        fullName: googleName,
        email,
        passwordHash: '',
        googleSub,
        googlePicture,
        authProvider: 'google',
        role: 'candidate',
        plan: 'free'
      })

      userRecord = await findUserById(Number(createResult.id))
      message = 'Account created successfully with Google.'
      statusCode = 201
    }
  }

  const user = buildUserPayload(userRecord)

  sendJson(
    response,
    statusCode,
    {
      message,
      user,
      token: createToken(user)
    },
    origin
  )
}

function handleGetCurrentUser(response, origin, userRecord) {
  sendJson(
    response,
    200,
    {
      message: 'Session active.',
      user: buildUserPayload(userRecord)
    },
    origin
  )
}

async function handleResumePredict(request, response, origin, authUser, options = {}) {
  const contentType = String(request.headers['content-type'] || '')
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType)
  const boundary = boundaryMatch?.[1] || boundaryMatch?.[2]

  if (!contentType.toLowerCase().includes('multipart/form-data') || !boundary) {
    sendJson(
      response,
      400,
      { message: 'Expected multipart/form-data with a resume file.' },
      origin
    )
    return
  }

  let rawBody

  try {
    rawBody = await readRawBody(request)
  } catch (error) {
    if (error.message === 'PAYLOAD_TOO_LARGE') {
      sendJson(response, 413, { message: 'Resume file is too large. Max size is 10MB.' }, origin)
      return
    }

    sendJson(response, 400, { message: 'Unable to read uploaded file.' }, origin)
    return
  }

  const fields = parseMultipartFormData(rawBody, boundary)
  const resume = fields.resume

  if (!resume || !resume.data || resume.data.length === 0) {
    sendJson(response, 400, { message: 'No resume file found in request.' }, origin)
    return
  }

  const originalName = path.basename(String(resume.filename || 'resume.bin'))
  const extension = path.extname(originalName).toLowerCase()
  const allowedExtensions = new Set(['.pdf', '.doc', '.docx'])

  if (!allowedExtensions.has(extension)) {
    sendJson(response, 400, { message: 'Only PDF, DOC and DOCX files are supported.' }, origin)
    return
  }

  const uploadsDirectory = IS_SERVERLESS ? path.join('/tmp', 'rexion-uploads') : path.join(__dirname, 'uploads')
  mkdirSync(uploadsDirectory, { recursive: true })

  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`
  const savedPath = path.join(uploadsDirectory, uniqueName)
  writeFileSync(savedPath, resume.data)

  const analysis = await analyzeResumeContent(resume.data, originalName)
  const insertResult = await createResumePrediction({
    userId: Number(authUser.id),
    fileName: originalName,
    filePath: savedPath,
    mimeType: resume.contentType,
    sizeBytes: resume.data.length,
    prediction: analysis.prediction,
    confidence: analysis.confidence,
    confidenceLevel: analysis.confidenceLevel,
    llmModel: analysis.llmModel,
    analysisJson: serializeAnalysis(analysis)
  })
  const predictionId = Number(insertResult.id)

  if (options.pipelineShape === true) {
    sendJson(response, 201, buildPipelinePredictPayload(resume.data, analysis), origin)
    return
  }

  sendJson(
    response,
    201,
    {
      id: predictionId,
      fileName: originalName,
      sizeBytes: resume.data.length,
      prediction: analysis.prediction,
      confidence: analysis.confidence,
      confidenceLevel: analysis.confidenceLevel,
      weaknesses: analysis.weaknesses,
      precautions: analysis.precautions,
      technologyRecommendations: analysis.technologyRecommendations,
      improvementPlan: analysis.improvementPlan,
      llmModel: analysis.llmModel,
      analysisMethod: analysis.analysisMethod,
      voiceSummary: analysis.voiceSummary
    },
    origin
  )
}

async function handleRexcodeGenerate(request, response, origin, authUser) {
  let payload

  try {
    payload = await readJsonBody(request)
  } catch (error) {
    if (error.message === 'PAYLOAD_TOO_LARGE') {
      sendJson(response, 413, { message: 'Request body is too large.' }, origin)
      return
    }

    sendJson(response, 400, { message: 'Invalid JSON body.' }, origin)
    return
  }

  const prompt = String(payload.prompt || '').trim()
  if (!prompt) {
    sendJson(response, 400, { message: 'Prompt is required.' }, origin)
    return
  }

  if (prompt.length > 2000) {
    sendJson(response, 400, { message: 'Prompt must be 2000 characters or less.' }, origin)
    return
  }

  const requestedMode = String(payload.mode || 'auto').trim().toLowerCase()
  if (requestedMode && !['auto', 'site', 'answer'].includes(requestedMode)) {
    sendJson(response, 400, { message: 'mode must be one of: auto, site, answer.' }, origin)
    return
  }

  const resolvedMode = inferRexcodeMode(requestedMode, prompt)
  let generatedResult
  try {
    generatedResult =
      resolvedMode === 'site' ? await generateRexcodeSite(prompt) : await generateRexcodeAnswer(prompt)
  } catch (error) {
    const failure = toRexcodeFailure(error)
    sendJson(
      response,
      failure.statusCode,
      {
        message: failure.message
      },
      origin
    )
    return
  }

  const result = {
    prompt,
    mode: resolvedMode,
    provider: generatedResult.provider,
    model: generatedResult.model,
    ownerUserId: Number(authUser.id),
    createdAt: new Date().toISOString()
  }

  if (resolvedMode === 'site') {
    result.code = generatedResult.code
    result.siteUrl = generatedResult.siteUrl
  } else {
    result.answer = generatedResult.answer
  }

  const createdSite = await createGeneratedSite(result)
  result.id = String(createdSite.id)
  sendJson(response, 201, result, origin)
}

async function handleGetResumeResultForUser(response, origin, authUser, resultId) {
  const numericId = Number(resultId)

  if (!Number.isInteger(numericId) || numericId <= 0) {
    sendJson(response, 400, { message: 'Invalid result id.' }, origin)
    return
  }

  const result = await findResumePredictionById(numericId)
  if (!result) {
    sendJson(response, 404, { message: 'Prediction result not found.' }, origin)
    return
  }

  if (Number.isInteger(Number(result.userId)) && Number(result.userId) !== Number(authUser.id)) {
    sendJson(response, 404, { message: 'Prediction result not found.' }, origin)
    return
  }

  sendJson(response, 200, buildResumeApiPayload(result), origin)
}

async function handleGetGeneratedSite(response, origin, authUser, siteId) {
  const numericId = Number(siteId)
  if (!Number.isInteger(numericId) || numericId <= 0) {
    sendJson(response, 400, { message: 'Generated site id is invalid.' }, origin)
    return
  }

  const result = await findGeneratedSiteById(numericId)
  if (!result) {
    sendJson(response, 404, { message: 'Generated site not found.' }, origin)
    return
  }

  if (Number(result.ownerUserId || 0) !== Number(authUser.id)) {
    sendJson(response, 404, { message: 'Generated site not found.' }, origin)
    return
  }

  sendJson(response, 200, result, origin)
}

function sendInternHubError(response, origin, error) {
  const statusCode = Number(error?.statusCode || error?.status || 500)
  const message = String(error?.message || 'Internal server error.')

  sendJson(
    response,
    statusCode,
    {
      success: false,
      error: message
    },
    origin
  )
}

async function handleInternHubHealth(response, origin) {
  sendJson(
    response,
    200,
    {
      success: true,
      status: 'ok',
      service: 'intern-hub',
      provider: 'adzuna',
      adzuna_base_url: internHubConfig.adzunaBaseUrl,
      adzuna_app_id_loaded: Boolean(internHubConfig.adzunaAppId),
      timestamp: new Date().toISOString()
    },
    origin
  )
}

async function handleInternHubSearch(response, origin, searchParams) {
  try {
    const params = validateInternshipSearch(searchParams)
    let payload = null

    if (internHubConfig.adzunaAppId && internHubConfig.adzunaAppKey) {
      try {
        payload = await searchInternships(params)
      } catch (error) {
        if (params.adzunaOnly) {
          throw error
        }
      }
    }

    if (!payload) {
      payload = await searchJobsViaJSearch(params)
    }

    sendJson(
      response,
      200,
      {
        success: true,
        query: params.query,
        location: params.location || null,
        remote: params.remote ?? null,
        page: params.page,
        num_pages: params.numPages,
        limit: params.limit,
        posted_within_hours: params.postedWithinHours,
        refresh: params.refresh,
        jobs: payload.jobs,
        meta: payload.meta
      },
      origin
    )
  } catch (error) {
    sendInternHubError(response, origin, error)
  }
}

async function handleInternHubLinkedInRedirect(response, origin, searchParams) {
  try {
    const params = validateLinkedInRedirect(searchParams)
    const resolved = await resolveLinkedInDestination(params)

    sendRedirect(response, 302, resolved.url, origin, {
      'Cache-Control': 'no-store',
      'X-Intern-Hub-Redirect-Source': resolved.source
    })
  } catch (error) {
    sendInternHubError(response, origin, error)
  }
}

const protectedFeaturePathMatchers = [
  (pathname) => pathname === '/api/auth/me',
  (pathname) => pathname === '/api/resume/predict',
  (pathname) => pathname === '/api/predict',
  (pathname) => /^\/api\/resume\/result\/\d+$/.test(pathname),
  (pathname) => pathname === '/api/rexcode/generate',
  (pathname) => /^\/api\/rexcode\/site\/[\w-]+$/.test(pathname),
  (pathname) => pathname.startsWith('/api/ml/'),
  (pathname) => pathname.startsWith('/api/intern-hub/')
]

function isProtectedFeaturePath(pathname) {
  return protectedFeaturePathMatchers.some((matcher) => matcher(pathname))
}

const app = express()

app.use(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`)
  const method = request.method || 'GET'
  const origin = request.headers.origin

  if (method === 'OPTIONS') {
    sendNoContent(response, origin)
    return
  }

  const protectedFeaturePath = isProtectedFeaturePath(url.pathname)
  const authResult = protectedFeaturePath
    ? await requireAuthenticatedUser(request, response, origin)
    : null

  if (protectedFeaturePath && !authResult) {
    return
  }

  const authenticatedUser = authResult?.user || null
  const authenticatedUserRecord = authResult?.userRecord || null

  if (method === 'GET' && url.pathname === '/api/health') {
    sendJson(
      response,
      200,
      {
        message: 'Rexion backend is running.',
        timestamp: new Date().toISOString()
      },
      origin
    )
    return
  }

  if (method === 'GET' && url.pathname === '/api/intern-hub/health') {
    await handleInternHubHealth(response, origin)
    return
  }

  if (
    method === 'GET' &&
    (url.pathname === '/api/intern-hub/internships/search' ||
      url.pathname === '/api/intern-hub/ml/jobs/search')
  ) {
    await handleInternHubSearch(response, origin, url.searchParams)
    return
  }

  if (method === 'GET' && url.pathname === '/api/intern-hub/linkedin/redirect') {
    await handleInternHubLinkedInRedirect(response, origin, url.searchParams)
    return
  }

  if (method === 'GET' && url.pathname === '/api/ml/health') {
    if (await isMlHealthy(1200)) {
      await handleMlProxyGet(response, origin, '/health')
      return
    }

    sendJson(
      response,
      200,
      {
        status: 'degraded',
        service: 'ml-proxy',
        fallback: 'local-node-backend',
        timestamp: new Date().toISOString()
      },
      origin
    )
    return
  }

  if (method === 'POST' && url.pathname === '/api/ml/predict') {
    await handleResumePredict(request, response, origin, authenticatedUser, { pipelineShape: true })
    return
  }

  if (method === 'POST' && url.pathname === '/api/ml/upload-resumes') {
    await handleMlProxyMultipart(request, response, origin, '/upload-resumes')
    return
  }

  if (method === 'POST' && url.pathname === '/api/ml/match') {
    await handleMlProxyJson(request, response, origin, '/match')
    return
  }

  if (method === 'GET' && url.pathname === '/api/ml/rank') {
    await handleMlProxyGet(response, origin, `/rank${url.search}`)
    return
  }

  if (method === 'GET' && url.pathname === '/api/ml/jobs/search') {
    await handleInternHubSearch(response, origin, url.searchParams)
    return
  }

  if (method === 'POST' && url.pathname === '/api/auth/register') {
    await handleRegister(request, response, origin)
    return
  }

  if (method === 'POST' && url.pathname === '/api/auth/login') {
    await handleLogin(request, response, origin)
    return
  }

  if (method === 'POST' && url.pathname === '/api/auth/google') {
    await handleGoogleAuth(request, response, origin)
    return
  }

  if (method === 'GET' && url.pathname === '/api/auth/me') {
    handleGetCurrentUser(response, origin, authenticatedUserRecord)
    return
  }

  if (method === 'POST' && url.pathname === '/api/resume/predict') {
    await handleResumePredict(request, response, origin, authenticatedUser)
    return
  }

  if (method === 'POST' && url.pathname === '/api/predict') {
    await handleResumePredict(request, response, origin, authenticatedUser, { pipelineShape: true })
    return
  }

  if (method === 'POST' && url.pathname === '/api/rexcode/generate') {
    await handleRexcodeGenerate(request, response, origin, authenticatedUser)
    return
  }

  const resumeResultMatch = /^\/api\/resume\/result\/(\d+)$/.exec(url.pathname)
  if (method === 'GET' && resumeResultMatch) {
    await handleGetResumeResultForUser(response, origin, authenticatedUser, resumeResultMatch[1])
    return
  }

  const generatedSiteMatch = /^\/api\/rexcode\/site\/([\w-]+)$/.exec(url.pathname)
  if (method === 'GET' && generatedSiteMatch) {
    await handleGetGeneratedSite(response, origin, authenticatedUser, generatedSiteMatch[1])
    return
  }

  sendJson(response, 404, { message: 'Route not found.' }, origin)
})

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === __filename

if (isDirectRun) {
  app.listen(PORT, () => {
    const openRouterApiKey = getOpenRouterApiKey()
    const deepSeekApiKey = getDeepSeekApiKey()
    const configuredRexcodeModel = getRexcodeModel()
    const configuredRexcodeProvider = getRexcodeProvider()
    console.log(`Rexion backend listening on http://localhost:${PORT}`)
    console.log(`Database mode: ${USE_POSTGRES ? 'postgresql' : 'sqlite'}`)
    if (!USE_POSTGRES) {
      console.log(`SQLite database: ${dbPath}`)
    }
    console.log(`LLM provider: ${llmRuntimeInfo.provider}`)
    console.log(`LLM store path: ${llmRuntimeInfo.storePath}`)
    console.log(`Rexcode provider target: ${configuredRexcodeProvider}`)
    console.log(`Rexcode model target: ${configuredRexcodeModel}`)
    console.log(`Rexcode API key loaded: ${hasUsableApiKey(openRouterApiKey) ? 'yes' : 'no'}`)
    console.log(`DeepSeek API key loaded: ${hasUsableApiKey(deepSeekApiKey) ? 'yes' : 'no'}`)
  })
}

export default app
