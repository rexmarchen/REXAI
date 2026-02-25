import apiClient from './apiClient'

export const uploadResume = async (file) => {
  const formData = new FormData()
  formData.append('resume', file)
  return apiClient.post('/resume/predict', formData)
}

export const predictResumePipeline = async (file) => {
  const formData = new FormData()
  formData.append('resume', file)
  return apiClient.post('/predict', formData)
}

export const getPredictionResult = async (id) => {
  return apiClient.get(`/resume/result/${id}`)
}
