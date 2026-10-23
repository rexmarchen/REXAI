import { getRedis } from './redis.js'

const PREFIX = 'rexion:cache:'
const L1_TTL_MS = 5000
const L1_MAX = 1000
const local = new Map()
const inflight = new Map()

function l1Get(key) {
  const e = local.get(key)
  if (!e) return undefined
  if (e.exp < Date.now()) {
    local.delete(key)
    return undefined
  }
  return e.v
}

function l1Set(key, v, ttlMs) {
  if (local.size >= L1_MAX) {
    local.delete(local.keys().next().value)
  }
  local.set(key, { v, exp: Date.now() + ttlMs })
}

export async function get(key) {
  const hit = l1Get(key)
  if (hit !== undefined) return hit

  const r = getRedis()
  if (!r) return undefined

  try {
    const raw = await r.get(PREFIX + key)
    if (raw === null) return undefined
    const v = JSON.parse(raw)
    l1Set(key, v, L1_TTL_MS)
    return v
  } catch {
    return undefined
  }
}

export async function set(key, value, ttlSeconds = 60) {
  const r = getRedis()
  l1Set(key, value, r ? Math.min(ttlSeconds * 1000, L1_TTL_MS) : ttlSeconds * 1000)
  if (!r) return
  try {
    await r.set(PREFIX + key, JSON.stringify(value), 'EX', ttlSeconds)
  } catch {}
}

export async function del(key) {
  local.delete(key)
  const r = getRedis()
  if (r) {
    try {
      await r.del(PREFIX + key)
    } catch {}
  }
}

export async function delPrefix(prefix) {
  for (const k of local.keys()) {
    if (k.startsWith(prefix)) local.delete(k)
  }
  const r = getRedis()
  if (!r) return
  try {
    const stream = r.scanStream({ match: `${PREFIX}${prefix}*`, count: 200 })
    for await (const keys of stream) {
      if (keys.length) await r.del(keys)
    }
  } catch {}
}

export async function getOrCompute(key, fn, ttlSeconds = 60) {
  const cached = await get(key)
  if (cached !== undefined) return cached

  if (inflight.has(key)) return inflight.get(key)

  const p = (async () => {
    try {
      const value = await fn()
      if (value !== undefined) await set(key, value, ttlSeconds)
      return value
    } finally {
      inflight.delete(key)
    }
  })()

  inflight.set(key, p)
  return p
}

export default { get, set, del, delPrefix, getOrCompute }
