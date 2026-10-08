import axios from 'axios'
import { clearStoredAuth, redirectToLogin } from '../utils/authSession'

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      return '/api'
    }
  }
  return import.meta.env.VITE_API_BASE_URL || '/api'
}

const apiClient = axios.create({
  baseURL: getBaseURL()
})

const readAuthToken = () => {
  if (typeof window === 'undefined') {
    return null
  }

  return (
    window.localStorage.getItem('rexionAuthToken') ||
    window.sessionStorage.getItem('rexionAuthToken') ||
    null
  )
}

const buildApiErrorLog = (error) => {
  const statusCode = Number(error.response?.status || 0)
  const baseURL = String(error.config?.baseURL || '')
  const requestUrl = String(error.config?.url || '')
  const requestPath = requestUrl.startsWith('http') ? requestUrl : `${baseURL}${requestUrl}`

  return {
    method: String(error.config?.method || 'GET').toUpperCase(),
    url: requestPath || requestUrl || null,
    status: statusCode || null,
    message: error.response?.data?.message || error.message,
    data: error.response?.data || null
  }
}

apiClient.interceptors.request.use(
  (config) => {
    const token = readAuthToken()
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }

    // Let browser set multipart boundary automatically for FormData requests.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
      if (typeof config.headers.setContentType === 'function') {
        config.headers.setContentType(undefined)
      } else {
        delete config.headers['Content-Type']
        delete config.headers['content-type']
      }
    }

    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  response => response.data,
  error => {
    const statusCode = Number(error.response?.status || 0)
    const requestUrl = String(error.config?.url || '')
    const shouldPreserveAuth = Boolean(error.config?.__preserveAuthOnUnauthorized)
    const isAuthRequest = ['/auth/login', '/auth/register', '/auth/google'].some((path) =>
      requestUrl.includes(path)
    )

    if (statusCode === 401 && !isAuthRequest) {
      if (!shouldPreserveAuth) {
        clearStoredAuth()
      }

      if (!shouldPreserveAuth && !error.config?.__skipUnauthorizedRedirect) {
        redirectToLogin()
      }
    }

    console.error('API Error:', buildApiErrorLog(error))
    return Promise.reject(error)
  }
)

export default apiClient
