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
  storage.setItem(AUTH_USER_KEY, JSON.stringify(normalizeUserPlan(response.user)))
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

  storage.setItem(AUTH_USER_KEY, JSON.stringify(normalizeUserPlan(user)))
  emitAuthChange()
}

export const hasStoredAuth = () => Boolean(getStoredToken())

export const getStoredUser = () => {
  const rawUser = getStorageValue(AUTH_USER_KEY)

  if (!rawUser) {
    return null
  }

  try {
    return normalizeUserPlan(JSON.parse(rawUser))
  } catch {
    return null
  }
}

const normalizeUserPlan = (user) => {
  if (!user || typeof user !== 'object') {
    return user
  }

  return user.role === 'admin' ? { ...user, plan: 'elite' } : user
}

export const getAuthErrorMessage = (error, fallbackMessage) => {
  if (!error) return fallbackMessage || 'An unexpected error occurred.'

  // If backend returned a JSON body with message or error field
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.response?.data?.error) {
    return typeof error.response.data.error === 'string'
      ? error.response.data.error
      : error.response.data.message || fallbackMessage
  }

  // If response data is a string (e.g. Vite proxy error or raw text)
  if (typeof error.response?.data === 'string') {
    const dataStr = error.response.data.toLowerCase()
    if (dataStr.includes('econnrefused') || dataStr.includes('proxy error') || dataStr.includes('connect')) {
      return 'Cannot connect to backend server. Please verify the dev backend is running on port 5000.'
    }
  }

  // Network / connection failures
  if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
    return 'Cannot reach the backend server. Please make sure the server is started with npm run dev.'
  }

  // HTTP status codes
  if (error.response?.status === 503 || error.response?.status === 502 || error.response?.status === 504) {
    return 'Authentication service is temporarily unavailable. Please try again shortly.'
  }

  if (error.response?.status === 500) {
    return 'Server error (500). Please check backend logs or try again shortly.'
  }

  return error.message || fallbackMessage || 'Unable to sign in. Please try again.'
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
