import IORedis from 'ioredis';

let client = null;

// Lazy: created on first use, so dotenv has already loaded REDIS_URL by then.
export function getRedis() {
  if (!client) {
    if (!process.env.REDIS_URL) throw new Error('REDIS_URL is not set');
    client = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: 2 });
    client.on('error', (e) => console.warn('[li-agent redis]', e.message));
  }
  return client;
}

// BullMQ requires maxRetriesPerRequest: null, so it gets its own connection.
export const bullConnection = () => new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
