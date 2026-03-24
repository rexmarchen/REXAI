import { config } from './index.js'

const WINDOW_MS = 60 * 1000
const buckets = new Map()

export const consumeRateLimit = (clientId) => {
  const normalizedClientId = String(clientId || 'anonymous').trim() || 'anonymous'
  const now = Date.now()
  const existing = buckets.get(normalizedClientId)

  if (!existing || existing.resetAt <= now) {
    const freshBucket = {
      remaining: config.rateLimitPerMinute - 1,
      resetAt: now + WINDOW_MS
    }
    buckets.set(normalizedClientId, freshBucket)
    return {
      allowed: true,
      limit: config.rateLimitPerMinute,
      remaining: freshBucket.remaining,
      resetAt: freshBucket.resetAt
    }
  }

  if (existing.remaining <= 0) {
    return {
      allowed: false,
      limit: config.rateLimitPerMinute,
      remaining: 0,
      resetAt: existing.resetAt
    }
  }

  existing.remaining -= 1
  return {
    allowed: true,
    limit: config.rateLimitPerMinute,
    remaining: existing.remaining,
    resetAt: existing.resetAt
  }
}
