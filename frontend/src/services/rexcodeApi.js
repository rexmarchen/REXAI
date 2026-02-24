import apiClient from './apiClient'

export const generateSite = async (prompt) => {
  return apiClient.post('/rexcode/generate', { prompt })
}

export const getGeneratedSite = async (id) => {
  return apiClient.get(`/rexcode/site/${id}`)
}