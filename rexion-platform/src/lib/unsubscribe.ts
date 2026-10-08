import { createHmac, timingSafeEqual } from 'node:crypto'
import { isProduction } from '@/lib/runtime'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getUnsubscribeSecret() {
  const secret = process.env.REXION_UNSUBSCRIBE_SECRET || process.env.NEXTAUTH_SECRET

  if (secret) {
    return secret
  }

  if (!isProduction()) {
    return 'rexion-local-unsubscribe-secret'
  }

  throw new Error('REXION_UNSUBSCRIBE_SECRET or NEXTAUTH_SECRET must be set to sign unsubscribe links.')
}

function signPayload(payload: string) {
  return createHmac('sha256', getUnsubscribeSecret()).update(payload).digest('base64url')
}

export function createUnsubscribeToken(email: string) {
  const payload = Buffer.from(
    JSON.stringify({
      email: email.toLowerCase(),
      v: 1,
    })
  ).toString('base64url')

  return `${payload}.${signPayload(payload)}`
}

export function verifyUnsubscribeToken(token: string) {
  const [payload, signature] = token.split('.')
  if (!payload || !signature) {
    return null
  }

  const expectedSignature = signPayload(payload)
  const provided = Buffer.from(signature)
  const expected = Buffer.from(expectedSignature)

  if (provided.length !== expected.length) {
    return null
  }

  if (!timingSafeEqual(provided, expected)) {
    return null
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
      email?: string
    }

    if (!parsed.email || !emailPattern.test(parsed.email)) {
      return null
    }

    return parsed.email.toLowerCase()
  } catch {
    return null
  }
}
