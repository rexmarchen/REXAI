import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { config as loadEnv } from 'dotenv'
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
import { extractResumeProfile } from './src/services/resumeProfileExtractor.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const workspaceRoot = path.dirname(__dirname)

// Support both backend/.env and rexion-backend/.env so deployments can use either location.
loadEnv({ path: path.join(workspaceRoot, 'rexion-backend', '.env') })
loadEnv({ path: path.join(__dirname, '.env') })

const PORT = Number(process.env.PORT || 5000)
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'
const NODE_ENV = String(process.env.NODE_ENV || 'development').trim().toLowerCase()
const OPENROUTER_API_KEY = String(
  process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY || ''
).trim()
const OPENROUTER_BASE_URL = String(process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1')
  .trim()
  .replace(/\/+$/, '')
const OPENROUTER_REFERER = String(process.env.OPENROUTER_REFERER || 'http://localhost:5173').trim()
const OPENROUTER_APP_TITLE = String(process.env.OPENROUTER_APP_TITLE || 'Rexion AI').trim()
const REXCODE_MODEL = String(process.env.REXCODE_MODEL || 'deepseek/deepseek-r1:free').trim()
const REXCODE_REQUEST_TIMEOUT_MS = Math.max(
  10000,
  Number(process.env.REXCODE_REQUEST_TIMEOUT_MS || 60000)
)
const ML_SERVICE_URL = String(process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000')
  .trim()
  .replace(/\/+$/, '')
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
const generatedSites = new Map()
let nextGeneratedSiteId = 1

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
    const mlResponse = await fetch(`${ML_SERVICE_URL}${targetPath}`, {
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
    const mlResponse = await fetch(`${ML_SERVICE_URL}${targetPath}`, {
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
    const mlResponse = await fetch(`${ML_SERVICE_URL}${targetPathWithQuery}`, {
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
    confidence: normalizeConfidenceToUnit(analysis?.confidence)
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

async function requestOpenRouterGeneration(prompt, model) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, REXCODE_REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
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

async function requestOpenRouterAnswer(prompt, model) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, REXCODE_REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
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
  if (!hasUsableApiKey(OPENROUTER_API_KEY)) {
    throw new Error(
      'API key not loaded. Set OPENROUTER_API_KEY in backend/.env (or rexion-backend/.env), then restart backend.'
    )
  }

  const modelCandidates = [REXCODE_MODEL]
  if (REXCODE_MODEL !== 'openrouter/free') {
    modelCandidates.push('openrouter/free')
  }

  const failures = []
  for (const model of modelCandidates) {
    try {
      return await requestOpenRouterGeneration(prompt, model)
    } catch (error) {
      failures.push(String(error?.message || error))
    }
  }

  throw new Error(failures.join(' | '))
}

async function generateRexcodeAnswer(prompt) {
  if (!hasUsableApiKey(OPENROUTER_API_KEY)) {
    throw new Error(
      'API key not loaded. Set OPENROUTER_API_KEY in backend/.env (or rexion-backend/.env), then restart backend.'
    )
  }

  const modelCandidates = [REXCODE_MODEL]
  if (REXCODE_MODEL !== 'openrouter/free') {
    modelCandidates.push('openrouter/free')
  }

  const failures = []
  for (const model of modelCandidates) {
    try {
      return await requestOpenRouterAnswer(prompt, model)
    } catch (error) {
      failures.push(String(error?.message || error))
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

async function handleResumePredict(request, response, origin, options = {}) {
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

async function handleRexcodeGenerate(request, response, origin) {
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
    sendJson(
      response,
      502,
      {
        message: `AI generation failed. ${String(error?.message || error)}`
      },
      origin
    )
    return
  }

  const id = String(nextGeneratedSiteId++)
  const result = {
    id,
    prompt,
    mode: resolvedMode,
    provider: generatedResult.provider,
    model: generatedResult.model,
    createdAt: new Date().toISOString()
  }

  if (resolvedMode === 'site') {
    result.code = generatedResult.code
    result.siteUrl = generatedResult.siteUrl
  } else {
    result.answer = generatedResult.answer
  }

  generatedSites.set(id, result)
  sendJson(response, 201, result, origin)
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

function handleGetGeneratedSite(response, origin, siteId) {
  const result = generatedSites.get(String(siteId))
  if (!result) {
    sendJson(response, 404, { message: 'Generated site not found.' }, origin)
    return
  }

  sendJson(response, 200, result, origin)
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

  if (method === 'GET' && url.pathname === '/api/ml/health') {
    await handleMlProxyGet(response, origin, '/health')
    return
  }

  if (method === 'POST' && url.pathname === '/api/ml/predict') {
    await handleMlProxyMultipart(request, response, origin, '/predict')
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
    await handleMlProxyGet(response, origin, `/jobs/search${url.search}`)
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

  if (method === 'POST' && url.pathname === '/api/predict') {
    await handleMlProxyMultipart(request, response, origin, '/predict')
    return
  }

  if (method === 'POST' && url.pathname === '/api/rexcode/generate') {
    await handleRexcodeGenerate(request, response, origin)
    return
  }

  const resumeResultMatch = /^\/api\/resume\/result\/(\d+)$/.exec(url.pathname)
  if (method === 'GET' && resumeResultMatch) {
    handleGetResumeResult(response, origin, resumeResultMatch[1])
    return
  }

  const generatedSiteMatch = /^\/api\/rexcode\/site\/([\w-]+)$/.exec(url.pathname)
  if (method === 'GET' && generatedSiteMatch) {
    handleGetGeneratedSite(response, origin, generatedSiteMatch[1])
    return
  }

  sendJson(response, 404, { message: 'Route not found.' }, origin)
})

server.listen(PORT, () => {
  console.log(`Rexion backend listening on http://localhost:${PORT}`)
  console.log(`SQLite database: ${dbPath}`)
  console.log(`LLM provider: ${llmRuntimeInfo.provider}`)
  console.log(`LLM store path: ${llmRuntimeInfo.storePath}`)
  console.log(`Rexcode model target: ${REXCODE_MODEL}`)
  console.log(`Rexcode API key loaded: ${hasUsableApiKey(OPENROUTER_API_KEY) ? 'yes' : 'no'}`)
})
