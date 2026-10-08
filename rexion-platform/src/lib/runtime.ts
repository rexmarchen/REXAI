const LOCAL_APP_URL = 'http://localhost:3000'

function normalizeUrl(value?: string | null) {
  if (!value) {
    return null
  }

  try {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return new URL(value).origin
    }

    return new URL(`https://${value}`).origin
  } catch {
    return null
  }
}

export function isProduction() {
  return process.env.NODE_ENV === 'production'
}

export function isDemoModeEnabled() {
  const rawValue = process.env.REXION_ENABLE_DEMO_MODE?.trim().toLowerCase()

  if (rawValue === 'true') {
    return true
  }

  if (rawValue === 'false') {
    return false
  }

  return !isProduction()
}

export function getAppUrl(requestUrl?: string) {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    requestUrl,
  ]

  for (const candidate of candidates) {
    const normalized = normalizeUrl(candidate)
    if (normalized) {
      return normalized
    }
  }

  return LOCAL_APP_URL
}

export function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'local'
  }

  return request.headers.get('x-real-ip') || 'local'
}
