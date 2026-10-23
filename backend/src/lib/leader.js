import crypto from 'crypto'
import { getRedis } from './redis.js'

const KEY = 'rexion:scheduler-leader'
const TTL_MS = 30_000
const id = crypto.randomUUID()
let leader = false

const RENEW = `if redis.call('get',KEYS[1])==ARGV[1] then return redis.call('pexpire',KEYS[1],ARGV[2]) else return 0 end`

async function tick() {
  const r = getRedis()
  if (!r) {
    const inst = process.env.NODE_APP_INSTANCE
    leader = inst === undefined || inst === '0'
    return
  }
  try {
    if (leader) leader = (await r.eval(RENEW, 1, KEY, id, TTL_MS)) === 1
    if (!leader) leader = (await r.set(KEY, id, 'PX', TTL_MS, 'NX')) === 'OK'
  } catch {
    leader = false
  }
}

export function startLeaderElection() {
  tick()
  setInterval(tick, TTL_MS / 3).unref()
}

export const isLeader = () => leader
export const leaderOnly = (fn) => async (...args) => {
  if (leader) return fn(...args)
}

export default { startLeaderElection, isLeader, leaderOnly }
