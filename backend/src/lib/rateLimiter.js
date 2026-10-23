import rateLimit from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import { getRedis } from './redis.js'

const isDevLoopback = (req) =>
  process.env.NODE_ENV === 'development' &&
  (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1')

export function createLimiter({ windowMs = 60_000, limit = 100, name = 'api' } = {}) {
  const r = getRedis()
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    passOnStoreError: true, // Redis hiccups won't block users
    skip: isDevLoopback,
    store: r
      ? new RedisStore({
          sendCommand: (...args) => r.call(...args),
          prefix: `rexion:rl:${name}:`
        })
      : undefined
  })
}

export const apiLimiter = createLimiter({ name: 'api', windowMs: 15 * 60 * 1000, limit: 600 })
export const authLimiter = createLimiter({ name: 'auth', windowMs: 15 * 60 * 1000, limit: 30 })

// Per-user rate limiter for authenticated requests (prevents one user from
// exhausting the shared IP-based limit behind a NAT/proxy).
export const userApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => {
    const u = req.user
    return u ? `uid:${u.id || u._id}` : `ip:${req.ip}`
  },
  skip: isDevLoopback
})
