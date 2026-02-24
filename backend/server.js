import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import process from 'node:process'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import {
  analyzeResumeContent,
  getConfidenceLevel,
  getLlmRuntimeInfo,
  parseStoredAnalysis,
  serializeAnalysis
} from './src/services/resumeAnalysisService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = Number(process.env.PORT || 5000)
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'
const NODE_ENV = String(process.env.NODE_ENV || 'development').trim().toLowerCase()
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
const db = new DatabaseSync(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`)

db.exec(`
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

function ensureColumnExists(tableName, columnDefinition) {
  try {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`)
  } catch (error) {
    const message = String(error?.message || '').toLowerCase()
    if (!message.includes('duplicate column name')) {
      throw error
    }
  }
}

ensureColumnExists('resume_predictions', 'confidence_level TEXT')
ensureColumnExists('resume_predictions', 'llm_model TEXT')
ensureColumnExists('resume_predictions', 'analysis_json TEXT')

const createUserStatement = db.prepare(
  'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)'
)
const findUserByEmailStatement = db.prepare(
  'SELECT id, full_name AS fullName, email, password_hash AS passwordHash, created_at AS createdAt FROM users WHERE email = ? LIMIT 1'
)
const createResumePredictionStatement = db.prepare(
  `
  INSERT INTO resume_predictions (
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
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`
)
const findResumePredictionByIdStatement = db.prepare(
  `
  SELECT
    id,
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

function base64Url(value) {
  return Buffer.from(value).toString('base64url')
}

function createToken(user) {
  const now = Math.floor(Date.now() / 1000)
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64Url(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      name: user.fullName,
      iat: now,
      exp: now + 60 * 60 * 24 * 7
    })
  )

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

  const existingUser = findUserByEmailStatement.get(email)
  if (existingUser) {
    sendJson(response, 409, { message: 'An account with this email already exists.' }, origin)
    return
  }

  const passwordHash = hashPassword(password)
  const result = createUserStatement.run(fullName, email, passwordHash)

  const user = {
    id: Number(result.lastInsertRowid),
    fullName,
    email
  }

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

  const userRecord = findUserByEmailStatement.get(email)

  if (!userRecord || !verifyPassword(password, userRecord.passwordHash)) {
    sendJson(response, 401, { message: 'Invalid email or password.' }, origin)
    return
  }

  const user = {
    id: userRecord.id,
    fullName: userRecord.fullName,
    email: userRecord.email
  }

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

async function handleResumePredict(request, response, origin) {
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

  const uploadsDirectory = path.join(__dirname, 'uploads')
  mkdirSync(uploadsDirectory, { recursive: true })

  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`
  const savedPath = path.join(uploadsDirectory, uniqueName)
  writeFileSync(savedPath, resume.data)

  const analysis = await analyzeResumeContent(resume.data, originalName)
  const insertResult = createResumePredictionStatement.run(
    originalName,
    savedPath,
    resume.contentType,
    resume.data.length,
    analysis.prediction,
    analysis.confidence,
    analysis.confidenceLevel,
    analysis.llmModel,
    serializeAnalysis(analysis)
  )
  const predictionId = Number(insertResult.lastInsertRowid)

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

function handleGetResumeResult(response, origin, resultId) {
  const numericId = Number(resultId)

  if (!Number.isInteger(numericId) || numericId <= 0) {
    sendJson(response, 400, { message: 'Invalid result id.' }, origin)
    return
  }

  const result = findResumePredictionByIdStatement.get(numericId)
  if (!result) {
    sendJson(response, 404, { message: 'Prediction result not found.' }, origin)
    return
  }

  sendJson(response, 200, buildResumeApiPayload(result), origin)
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`)
  const method = request.method || 'GET'
  const origin = request.headers.origin

  if (method === 'OPTIONS') {
    sendNoContent(response, origin)
    return
  }

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

  if (method === 'POST' && url.pathname === '/api/auth/register') {
    await handleRegister(request, response, origin)
    return
  }

  if (method === 'POST' && url.pathname === '/api/auth/login') {
    await handleLogin(request, response, origin)
    return
  }

  if (method === 'POST' && url.pathname === '/api/resume/predict') {
    await handleResumePredict(request, response, origin)
    return
  }

  const resumeResultMatch = /^\/api\/resume\/result\/(\d+)$/.exec(url.pathname)
  if (method === 'GET' && resumeResultMatch) {
    handleGetResumeResult(response, origin, resumeResultMatch[1])
    return
  }

  sendJson(response, 404, { message: 'Route not found.' }, origin)
})

server.listen(PORT, () => {
  console.log(`Rexion backend listening on http://localhost:${PORT}`)
  console.log(`SQLite database: ${dbPath}`)
  console.log(`LLM provider: ${llmRuntimeInfo.provider}`)
  console.log(`LLM store path: ${llmRuntimeInfo.storePath}`)
})
