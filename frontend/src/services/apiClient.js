import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
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
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export default apiClient
