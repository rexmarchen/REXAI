const AUTH_TOKEN_KEY = 'rexionAuthToken'
const AUTH_USER_KEY = 'rexionUser'

export const clearStoredAuth = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY)
  window.localStorage.removeItem(AUTH_USER_KEY)
  window.sessionStorage.removeItem(AUTH_TOKEN_KEY)
  window.sessionStorage.removeItem(AUTH_USER_KEY)
}

export const persistAuthSession = (response, remember = true) => {
  if (typeof window === 'undefined') {
    return
  }

  const storage = remember ? window.localStorage : window.sessionStorage

  clearStoredAuth()
  storage.setItem(AUTH_TOKEN_KEY, response.token)
  storage.setItem(AUTH_USER_KEY, JSON.stringify(response.user))
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
