import apiClient from './apiClient'

const authApi = {
  register(payload) {
    return apiClient.post('/auth/register', payload)
  },
  login(payload) {
    return apiClient.post('/auth/login', payload)
  },
  googleLogin(payload) {
    return apiClient.post('/auth/google', payload)
  },
  me() {
    return apiClient.get('/auth/me', {
      __skipUnauthorizedRedirect: true
    })
  }
}

export default authApi
