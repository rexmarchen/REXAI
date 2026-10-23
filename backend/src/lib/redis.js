import Redis from 'ioredis'

let client = null

export function getRedis() {
  if (!process.env.REDIS_URL) return null

  if (!client) {
    client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => {
        if (times > 3) return null
        return Math.min(times * 200, 2000)
      },
      lazyConnect: false
    })
    client.on('connect', () => console.log('[Redis] Connected successfully'))
    client.on('error', (e) => console.warn('[Redis] Connection warning:', e.message))
  }
  return client
}

export default getRedis
