const AUTH_TOKEN_KEY = 'rexionAuthToken'
const AUTH_USER_KEY = 'rexionUser'
export const AUTH_CHANGE_EVENT = 'rexion-auth-changed'

const getStorageValue = (key) => {
  if (typeof window === 'undefined') {
    return null
  }

  return (
    window.localStorage.getItem(key) ||
    window.sessionStorage.getItem(key)
  )
}

const emitAuthChange = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))
}

const getActiveAuthStorage = () => {
  if (typeof window === 'undefined') {
    return null
  }

  if (window.localStorage.getItem(AUTH_TOKEN_KEY)) {
    return window.localStorage
  }

  if (window.sessionStorage.getItem(AUTH_TOKEN_KEY)) {
    return window.sessionStorage
  }

  return null
}

export const getStoredToken = () => getStorageValue(AUTH_TOKEN_KEY)

export const clearStoredAuth = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY)
  window.localStorage.removeItem(AUTH_USER_KEY)
  window.sessionStorage.removeItem(AUTH_TOKEN_KEY)
  window.sessionStorage.removeItem(AUTH_USER_KEY)
  emitAuthChange()
}

export const persistAuthSession = (response, remember = true) => {
  if (typeof window === 'undefined') {
    return
  }

  const storage = remember ? window.localStorage : window.sessionStorage

  clearStoredAuth()
  storage.setItem(AUTH_TOKEN_KEY, response.token)
  storage.setItem(AUTH_USER_KEY, JSON.stringify(response.user))
  emitAuthChange()
}

export const persistStoredUser = (user) => {
  if (typeof window === 'undefined') {
    return
  }

  const storage = getActiveAuthStorage()
  if (!storage) {
    return
  }

  storage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  emitAuthChange()
}

export const hasStoredAuth = () => Boolean(getStoredToken())

export const getStoredUser = () => {
  const rawUser = getStorageValue(AUTH_USER_KEY)

  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser)
  } catch {
    return null
  }
}

export const getAuthErrorMessage = (error, fallbackMessage) => {
  return (
    error.response?.data?.message ||
    (error.code === 'ERR_NETWORK'
      ? 'Cannot reach the backend. Start it with npm run dev. Use npm run dev:mongo only if you specifically need the Atlas-backed backend.'
      : error.message) ||
    fallbackMessage
    )
}

export const resolveAuthRedirectPath = (candidatePath, fallbackPath = '/dashboard') => {
  const normalized = String(candidatePath || '').trim()

  if (!normalized || !normalized.startsWith('/') || normalized.startsWith('//')) {
    return fallbackPath
  }

  return normalized
}

export const buildLoginPath = (nextPath = '/dashboard') => {
  const safeNextPath = resolveAuthRedirectPath(nextPath)
  return `/login?next=${encodeURIComponent(safeNextPath)}`
}

export const redirectToLogin = (nextPath) => {
  if (typeof window === 'undefined') {
    return
  }

  const targetPath =
    typeof nextPath === 'string' && nextPath.trim()
      ? nextPath
      : `${window.location.pathname}${window.location.search}${window.location.hash}`

  window.location.assign(buildLoginPath(targetPath))
}
