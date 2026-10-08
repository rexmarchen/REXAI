import dotenv from 'dotenv'
dotenv.config()
dotenv.config({ path: '.env.local', override: true })

export const NODE_ENV = process.env.NODE_ENV || 'development'
export const PORT = process.env.PORT || 5000
export const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || ''
const rawPgUrl = String(process.env.POSTGRES_URL || process.env.PG_URI || (process.env.DATABASE_URL?.startsWith('postgres') ? process.env.DATABASE_URL : '') || '').trim()
export const DATABASE_URL = rawPgUrl
export const SESSION_SECRET = String(process.env.SESSION_SECRET || '').trim()
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
export const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'
export const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d'
export const GOOGLE_CLIENT_ID = String(process.env.GOOGLE_CLIENT_ID || '').trim()
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY
export const UPLOAD_PATH = process.env.UPLOAD_PATH || 'uploads/'
export const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'
export const USE_FALLBACK_ANALYSIS = process.env.USE_FALLBACK_ANALYSIS === 'true'

export const GREENHOUSE_API_KEY = String(process.env.GREENHOUSE_API_KEY || '').trim()
export const GREENHOUSE_BOARD_TOKEN = String(process.env.GREENHOUSE_BOARD_TOKEN || '').trim()
export const GREENHOUSE_DRY_RUN = String(process.env.GREENHOUSE_DRY_RUN || 'true').trim().toLowerCase() === 'true'
