// Sliding-window limiter. In-memory = correct for ONE server instance only.
// On Vercel / multiple instances swap this for Upstash Ratelimit (same call shape).
const hits = new Map<string, number[]>();
export function allow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now(), recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) { hits.set(key, recent); return false; }
  recent.push(now); hits.set(key, recent); return true;
}
