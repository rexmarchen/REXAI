interface RateLimitEntry {
  count: number
  resetAt: number
}

declare global {
  // eslint-disable-next-line no-var
  var rexionRateLimitStore: Map<string, RateLimitEntry> | undefined
}

function getStore() {
  if (!global.rexionRateLimitStore) {
    global.rexionRateLimitStore = new Map<string, RateLimitEntry>()
  }

  return global.rexionRateLimitStore
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const store = getStore()
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    const nextEntry = {
      count: 1,
      resetAt: now + windowMs,
    }
    store.set(key, nextEntry)
    return {
      allowed: true,
      remaining: Math.max(0, limit - nextEntry.count),
      resetAt: nextEntry.resetAt,
    }
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  entry.count += 1
  store.set(key, entry)

  return {
    allowed: true,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  }
}
