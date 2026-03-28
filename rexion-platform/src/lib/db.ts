import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || ''

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache:
    | {
        conn: typeof mongoose | null
        promise: Promise<typeof mongoose> | null
      }
    | undefined
}

const cached = global.mongooseCache ?? {
  conn: null,
  promise: null,
}

global.mongooseCache = cached

export function hasDatabaseConnectionString() {
  return Boolean(MONGODB_URI)
}

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured.')
  }

  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: 'rexion_ai',
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}

export async function safeConnectToDatabase() {
  if (!hasDatabaseConnectionString()) {
    return null
  }

  try {
    return await connectToDatabase()
  } catch (error) {
    console.error('Database connection skipped:', error)
    return null
  }
}
