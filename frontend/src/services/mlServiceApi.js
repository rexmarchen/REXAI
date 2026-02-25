import axios from 'axios'

const mlServiceClient = axios.create({
  baseURL: import.meta.env.VITE_ML_SERVICE_BASE_URL || 'http://127.0.0.1:8000'
})

mlServiceClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('ML Service Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

/**
 * Upload resume and get career prediction with job matches
 * @param {File} file - Resume file
 * @param {Object} options - Optional prediction filters
 * @param {string} options.jobDescription - Manual job description for ATS scoring
 * @param {string} options.location - Preferred job location
 * @param {boolean} options.remote - Remote jobs only
 * @returns {Promise} Prediction response with career path, confidence, ATS score, and jobs
 */
export const predictCareerPath = async (file, options = {}) => {
  const formData = new FormData()
  formData.append('file', file)

  if (options.jobDescription) {
    formData.append('job_description', options.jobDescription)
  }
  if (options.location) {
    formData.append('location', options.location)
  }
  if (typeof options.remote === 'boolean') {
    formData.append('remote', String(options.remote))
  }
  
  return mlServiceClient.post('/predict', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * Search for jobs based on query
 * @param {string} query - Job title or keywords (e.g., "Software Engineer")
 * @param {Object} options - Optional search filters
 * @param {string} options.location - Location (city, state, or "remote")
 * @param {boolean} options.remote - Filter for remote positions only
 * @param {number} options.page - Page number (starts at 1)
 * @returns {Promise} List of job postings
 */
export const searchJobs = async (query, options = {}) => {
  const params = new URLSearchParams()
  params.append('query', query)
  
  if (options.location) {
    params.append('location', options.location)
  }
  if (typeof options.remote === 'boolean') {
    params.append('remote', String(options.remote))
  }
  if (options.page) {
    params.append('page', options.page)
  }
  
  return mlServiceClient.get(`/jobs/search?${params.toString()}`)
}

export default mlServiceClient
