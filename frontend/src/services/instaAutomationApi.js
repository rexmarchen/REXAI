import apiClient from './apiClient'

export const fetchInstaStatus = async () => {
  return apiClient.get('/insta-automation/status')
}

export const fetchInstaQueue = async (limit = 20) => {
  return apiClient.get('/insta-automation/queue', { params: { limit } })
}

export const fetchInstaHistory = async (limit = 20) => {
  return apiClient.get('/insta-automation/history', { params: { limit } })
}

export const generateInstaContent = async ({ topic, kind = 'REEL', tone = 'creator' }) => {
  return apiClient.post('/insta-automation/generate', { topic, kind, tone })
}

export const publishInstaNow = async (postId = null) => {
  return apiClient.post('/insta-automation/publish-now', { postId })
}

export const toggleInstaAutopilot = async (enable) => {
  return apiClient.post('/insta-automation/autopilot/toggle', { enable })
}

export const updateInstaSettings = async (settings) => {
  return apiClient.patch('/insta-automation/settings', settings)
}

export const connectInstaAccount = async (credentials) => {
  return apiClient.post('/insta-automation/connect', credentials)
}

export const disconnectInstaAccount = async () => {
  return apiClient.post('/insta-automation/disconnect')
}

export const replenishContinuousBuffer = async (days = 7) => {
  return apiClient.post('/insta-automation/replenish-buffer', { days })
}

export const exchangeInstaToken = async (shortLivedToken) => {
  return apiClient.post('/insta-automation/exchange-token', { shortLivedToken })
}

export const testInstaConnection = async (credentials) => {
  return apiClient.post('/insta-automation/test-connection', credentials)
}

