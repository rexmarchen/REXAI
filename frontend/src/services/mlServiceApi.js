import apiClient from './apiClient'

const ML_SERVICE_BASE_URL = (import.meta.env.VITE_ML_SERVICE_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')

const isNetworkFailure = (error) =>
  !error?.response &&
  /network error|failed to fetch|load failed|ecconnrefused|err_network/i.test(
    String(error?.message || '')
  )

const shouldUseDirectMlFallback = (error) => {
  const status = Number(error?.response?.status || 0)
  return isNetworkFailure(error) || status === 404 || status === 502 || status === 503
}

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

  try {
    return await apiClient.post('/ml/predict', formData)
  } catch (error) {
    if (!shouldUseDirectMlFallback(error)) {
      throw error
    }

    // Fallback to direct ML service if backend proxy is unreachable.
    const directResponse = await fetch(`${ML_SERVICE_BASE_URL}/predict`, {
      method: 'POST',
      body: formData
    })

    if (!directResponse.ok) {
      const errorPayload = await directResponse.json().catch(() => ({}))
      const detail = String(errorPayload?.detail || errorPayload?.message || '').trim()
      throw new Error(detail || `ML service returned ${directResponse.status}`)
    }

    return directResponse.json()
  }
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

  try {
    return await apiClient.get(`/ml/jobs/search?${params.toString()}`)
  } catch (error) {
    if (!shouldUseDirectMlFallback(error)) {
      throw error
    }

    const directResponse = await fetch(`${ML_SERVICE_BASE_URL}/jobs/search?${params.toString()}`, {
      method: 'GET'
    })

    if (!directResponse.ok) {
      throw new Error(`ML jobs endpoint returned ${directResponse.status}`)
    }

    return directResponse.json()
  }
}

export default apiClient
