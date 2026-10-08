import bcrypt from 'bcrypt'
import crypto from 'crypto'
import db from '../../lib/db.js'
import { ensureAutomationSchema } from './schema.js'

function randomPasswordHash() {
  return bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12)
}

export async function resolveAutomationUser(req) {
  if (req.session?.userId) {
    return Number(req.session.userId)
  }

  const email = String(req.user?.email || '').toLowerCase().trim()
  if (req.user?.id) {
    return typeof req.user.id === 'number' ? req.user.id : 1
  }

  try {
    await ensureAutomationSchema()
    if (email) {
      const existing = await db.query('SELECT id FROM users WHERE email = $1', [email])
      if (existing.rows[0]?.id) {
        return existing.rows[0].id
      }

      const passwordHash = await randomPasswordHash()
      const created = await db.query(
        'INSERT INTO users (email, password_hash, plan) VALUES ($1, $2, $3) RETURNING id',
        [email, passwordHash, req.user?.plan || 'free']
      )
      return created.rows[0].id
    }
  } catch (err) {
    console.warn('[UserBridge Warning] Database user resolution fallback:', err.message)
  }

  return 1
}

export function saveSession(req) {
  return new Promise((resolve) => {
    if (req.session && typeof req.session.save === 'function') {
      req.session.save(() => resolve())
    } else {
      resolve()
    }
  })
}
