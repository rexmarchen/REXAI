import { config } from './index.js'

const clonePayload = (value) => structuredClone(value)

class MemoryCache {
  constructor(defaultTtlSeconds) {
    this.defaultTtlMs = Math.max(1, Number(defaultTtlSeconds || 300)) * 1000
    this.store = new Map()
  }

  get(key, { allowStale = false } = {}) {
    const entry = this.store.get(key)
    if (!entry) {
      return null
    }

    const now = Date.now()
    const expired = entry.expiresAt <= now
    if (expired && !allowStale) {
      this.store.delete(key)
      return null
    }

    const payload = clonePayload(entry.value)
    payload.meta = {
      ...(payload.meta || {}),
      cache: expired ? 'stale' : 'hit'
    }
    return payload
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    this.store.set(key, {
      expiresAt: Date.now() + Math.max(1, Number(ttlMs || this.defaultTtlMs)),
      value: clonePayload(value)
    })
  }
}

export const cache = new MemoryCache(config.cacheTtlSeconds)
