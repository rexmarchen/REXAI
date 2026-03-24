import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const CONFIG_DIR = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(CONFIG_DIR, '../..')
const ENV_PATH = path.join(PROJECT_ROOT, '.env')

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  const parsed = {}
  const content = fs.readFileSync(filePath, 'utf8')

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex <= 0) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    parsed[key] = value
  }

  return parsed
}

const fileEnv = parseEnvFile(ENV_PATH)

const readEnv = (key) => {
  const runtimeValue = process.env[key]
  if (runtimeValue != null && String(runtimeValue).trim() !== '') {
    return String(runtimeValue).trim()
  }
  return fileEnv[key]
}

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const toList = (value, fallback) => {
  if (!value) {
    return fallback
  }

  const items = String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return items.length > 0 ? items : fallback
}

const normalizeBaseUrl = (value, fallback) => {
  const resolved = String(value || fallback || '').trim() || fallback
  return resolved.replace(/\/+$/, '')
}

export const config = {
  envPath: ENV_PATH,
  projectRoot: PROJECT_ROOT,
  port: toPositiveInt(readEnv('PORT') || readEnv('INTERN_HUB_PORT'), 5051),
  adzunaBaseUrl: normalizeBaseUrl(readEnv('ADZUNA_BASE_URL'), 'https://api.adzuna.com/v1/api'),
  adzunaAppId: String(readEnv('ADZUNA_APP_ID') || '').trim(),
  adzunaAppKey: String(readEnv('ADZUNA_APP_KEY') || '').trim(),
  apifyBaseUrl: normalizeBaseUrl(readEnv('APIFY_BASE_URL'), 'https://api.apify.com/v2'),
  apifyApiToken: String(readEnv('APIFY_API_TOKEN') || '').trim(),
  apifyLinkedinActorId: String(
    readEnv('APIFY_LINKEDIN_ACTOR_ID') || 'orgupdate/linkedin-jobs-scraper'
  ).trim(),
  apifyTimeoutMs: toPositiveInt(readEnv('APIFY_TIMEOUT_MS'), 45000),
  adzunaSearchCountries: toList(readEnv('ADZUNA_SEARCH_COUNTRIES'), ['in', 'gb', 'us', 'au', 'ca', 'sg']),
  adzunaIndiaCountries: toList(readEnv('ADZUNA_INDIA_COUNTRIES'), ['in']),
  adzunaCountriesPerRequest: toPositiveInt(readEnv('ADZUNA_COUNTRIES_PER_REQUEST'), 1),
  adzunaResultsPerPage: toPositiveInt(readEnv('ADZUNA_RESULTS_PER_PAGE'), 20),
  cacheTtlSeconds: toPositiveInt(readEnv('CACHE_TTL_SECONDS'), 300),
  rateLimitPerMinute: toPositiveInt(readEnv('RATE_LIMIT_PER_MINUTE'), 90),
  upstreamTimeoutMs: toPositiveInt(readEnv('UPSTREAM_TIMEOUT_MS'), 15000),
  allowedOrigins: toList(readEnv('ALLOWED_ORIGINS'), [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ])
}

export const isAllowedOrigin = (origin) => {
  if (!origin) {
    return false
  }

  if (config.allowedOrigins.includes('*')) {
    return true
  }

  return config.allowedOrigins.includes(origin)
}
