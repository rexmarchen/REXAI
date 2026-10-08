import pg from 'pg'
import { DATABASE_URL } from '../config/env.js'

const { Pool } = pg

const isLocalDatabase = (connectionString = '') => (
  connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
)

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL && !isLocalDatabase(DATABASE_URL)
    ? { rejectUnauthorized: false }
    : false
})

export default pool
