import dotenv from 'dotenv'
dotenv.config()

export const NODE_ENV = process.env.NODE_ENV || 'development'
export const PORT = process.env.PORT || 5000
export const MONGO_URI = process.env.MONGO_URI
export const JWT_SECRET = process.env.JWT_SECRET
export const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d'
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY
export const UPLOAD_PATH = process.env.UPLOAD_PATH || 'uploads/'
export const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'
export const USE_FALLBACK_ANALYSIS = process.env.USE_FALLBACK_ANALYSIS === 'true'