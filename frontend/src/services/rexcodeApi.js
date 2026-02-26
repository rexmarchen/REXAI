import apiClient from './apiClient'

export const generateSite = async (prompt, options = {}) => {
  return apiClient.post('/rexcode/generate', {
    prompt,
    ...(options || {})
  })
}

export const getGeneratedSite = async (id) => {
  return apiClient.get(`/rexcode/site/${id}`)
}
