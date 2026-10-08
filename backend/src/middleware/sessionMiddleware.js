import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import pgPool from '../lib/db.js'
import { DATABASE_URL, NODE_ENV, SESSION_SECRET } from '../config/env.js'

const PgSession = connectPgSimple(session)

export function linkedinSessionMiddleware() {
  const secret = SESSION_SECRET || 'rexion-dev-session-secret-key-12345678'

  if (DATABASE_URL && (DATABASE_URL.startsWith('postgres://') || DATABASE_URL.startsWith('postgresql://'))) {
    try {
      return session({
        store: new PgSession({
          pool: pgPool,
          createTableIfMissing: true
        }),
        secret,
        resave: false,
        saveUninitialized: false,
        cookie: {
          maxAge: 30 * 24 * 60 * 60 * 1000,
          httpOnly: true,
          sameSite: 'lax',
          secure: NODE_ENV === 'production'
        }
      })
    } catch (err) {
      console.warn('[Session Store Warning] Falling back to memory session store:', err.message)
    }
  }

  return session({
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'lax',
      secure: NODE_ENV === 'production'
    }
  })
}
