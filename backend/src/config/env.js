import dotenv from 'dotenv'
dotenv.config()

export const NODE_ENV = process.env.NODE_ENV || 'development'
export const PORT = process.env.PORT || 5000
export const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rexion'
export const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production'
export const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d'
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
export const UPLOAD_PATH = process.env.UPLOAD_PATH || 'uploads/'
export const LLM_PROVIDER = process.env.LLM_PROVIDER || 'local'
