import dotenv from 'dotenv'
dotenv.config()
dotenv.config({ path: '.env.local', override: true })

export const NODE_ENV = process.env.NODE_ENV || 'development'
export const PORT = process.env.PORT || 5000
export const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || ''
const rawPgUrl = String(process.env.POSTGRES_URL || process.env.PG_URI || (process.env.DATABASE_URL?.startsWith('postgres') ? process.env.DATABASE_URL : '') || '').trim()
export const DATABASE_URL = rawPgUrl
export const SESSION_SECRET = String(process.env.SESSION_SECRET || '').trim()

if (SESSION_SECRET.length < 32 || /^(fallback|change-me|secret123|dev|your_super_strong|rexion-dev)/i.test(SESSION_SECRET)) {
  console.warn('[WARNING] SESSION_SECRET is weak or default. Set a 32+ character random secret.')
}
export const ENCRYPTION_KEY = String(process.env.ENCRYPTION_KEY || '').trim()
export const LINKEDIN_CLIENT_ID = String(process.env.LINKEDIN_CLIENT_ID || '').trim()
export const LINKEDIN_CLIENT_SECRET = String(process.env.LINKEDIN_CLIENT_SECRET || '').trim()
export const LINKEDIN_REDIRECT_URI = String(process.env.LINKEDIN_REDIRECT_URI || '').trim()
export const LINKEDIN_VERSION = String(process.env.LINKEDIN_VERSION || '202405').trim()
export const AUTOMATION_SCHEDULER_ENABLED = String(process.env.AUTOMATION_SCHEDULER_ENABLED || 'false').trim().toLowerCase() === 'true'
export const AUTOMATION_TICK_CRON = String(process.env.AUTOMATION_TICK_CRON || '*/1 * * * *').trim()
export const AUTOMATION_VECTOR_ROOT = String(process.env.AUTOMATION_VECTOR_ROOT || 'data/vector-index').trim()
export const GEMINI_API_KEY = String(process.env.GEMINI_API_KEY || '').trim()
export const GEMINI_TEXT_MODEL = String(process.env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash').trim()
export const GEMINI_EMBEDDING_MODEL = String(process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001').trim()
export const GITHUB_TOKEN = String(process.env.GITHUB_TOKEN || '').trim()
const resolveJwtSecret = () => {
  const secret = process.env.JWT_SECRET
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret === 'change-me-in-production' || secret === 'your_super_strong_jwt_secret') {
      throw new Error('[FATAL SECURITY ERROR] JWT_SECRET must be set to a cryptographically strong secret in production!')
    }
    return secret
  }
  return secret || 'dev-fallback-secret-rexion-development-only'
}
export const JWT_SECRET = resolveJwtSecret()
export const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d'
export const FRONTEND_URL = String(process.env.FRONTEND_URL || process.env.APP_URL || '').trim()
export const GOOGLE_CLIENT_ID = String(process.env.GOOGLE_CLIENT_ID || '').trim()
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY
export const UPLOAD_PATH = process.env.UPLOAD_PATH || 'uploads/'
export const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'
export const USE_FALLBACK_ANALYSIS = process.env.USE_FALLBACK_ANALYSIS === 'true'

export const GREENHOUSE_API_KEY = String(process.env.GREENHOUSE_API_KEY || '').trim()
export const GREENHOUSE_BOARD_TOKEN = String(process.env.GREENHOUSE_BOARD_TOKEN || '').trim()
export const GREENHOUSE_DRY_RUN = String(process.env.GREENHOUSE_DRY_RUN || 'true').trim().toLowerCase() === 'true'

export const STRIPE_SECRET_KEY = String(process.env.STRIPE_SECRET_KEY || '').trim()
export const STRIPE_WEBHOOK_SECRET = String(process.env.STRIPE_WEBHOOK_SECRET || '').trim()
export const STRIPE_PRO_PRICE_ID = String(process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly').trim()
export const STRIPE_ELITE_PRICE_ID = String(process.env.STRIPE_ELITE_PRICE_ID || 'price_elite_monthly').trim()
export const STRIPE_PRO_ANNUAL_PRICE_ID = String(process.env.STRIPE_PRO_ANNUAL_PRICE_ID || 'price_pro_annual').trim()
export const STRIPE_ELITE_ANNUAL_PRICE_ID = String(process.env.STRIPE_ELITE_ANNUAL_PRICE_ID || 'price_elite_annual').trim()

/**
 * Validates production environment strictness to prevent startup with default or weak secrets.
 */
export const validateProductionEnvironment = () => {
  if (NODE_ENV !== 'production') return { valid: true, mode: 'development' }

  const errors = []
  const secret = process.env.JWT_SECRET || ''
  if (!secret || secret.length < 32 || /fallback|change-me|secret123|dev|your_super_strong/i.test(secret)) {
    errors.push('JWT_SECRET must be at least 32 characters and cryptographically random in production.')
  }

  const mongo = MONGO_URI
  if (!mongo || mongo.includes('127.0.0.1:27017/test') || mongo === 'mongodb://localhost:27017') {
    errors.push('MONGO_URI must point to an authenticated production cluster (e.g. Atlas), not default localhost test DB.')
  }

  const tokenEncKey = process.env.TOKEN_ENC_KEY
  if (tokenEncKey) {
    try {
      const buf = Buffer.from(tokenEncKey, 'base64')
      if (buf.length !== 32) {
        errors.push('TOKEN_ENC_KEY must decode to exactly 32 bytes for AES-256-GCM.')
      }
    } catch {
      errors.push('TOKEN_ENC_KEY must be a valid base64 encoded string.')
    }
  }

  if (errors.length > 0) {
    const errorMsg = `[CRITICAL PRODUCTION CONFIG ERROR]\n- ${errors.join('\n- ')}`
    console.error(errorMsg)
    throw new Error(errorMsg)
  }

  return { valid: true, mode: 'production' }
}
