import apiClient from './apiClient'

const authApi = {
  register(payload) {
    return apiClient.post('/auth/register', payload)
  },
  login(payload) {
    return apiClient.post('/auth/login', payload)
  }
}

export default authApi
