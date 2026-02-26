import apiClient from './apiClient'

export const uploadResumesToAts = async (files) => {
  const formData = new FormData()
  for (const file of files) {
    formData.append('resumes', file)
  }

  return apiClient.post('/ml/upload-resumes', formData)
}

export const matchResumesWithJob = async ({ jobDescription, resumeIds }) => {
  return apiClient.post('/ml/match', {
    job_description: jobDescription,
    resume_ids: resumeIds
  })
}

export const rankResumesWithJob = async ({ jobDescription, topK = 0 }) => {
  const params = new URLSearchParams()
  params.set('job_description', jobDescription)
  if (Number(topK) > 0) {
    params.set('top_k', String(topK))
  }

  return apiClient.get(`/ml/rank?${params.toString()}`)
}
