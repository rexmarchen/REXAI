import axios from 'axios'

const atsClient = axios.create({
  baseURL:
    import.meta.env.VITE_ATS_API_BASE_URL ||
    import.meta.env.VITE_ML_SERVICE_BASE_URL ||
    'http://127.0.0.1:8000'
})

atsClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
)

export const uploadResumesToAts = async (files) => {
  const formData = new FormData()
  for (const file of files) {
    formData.append('resumes', file)
  }

  return atsClient.post('/upload-resumes', formData)
}

export const matchResumesWithJob = async ({ jobDescription, resumeIds }) => {
  return atsClient.post('/match', {
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

  return atsClient.get(`/rank?${params.toString()}`)
}
