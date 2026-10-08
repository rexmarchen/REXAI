import apiClient from './apiClient'

const dominationRequestConfig = {
  __skipUnauthorizedRedirect: true,
  __preserveAuthOnUnauthorized: true
}

const dominationApi = {
  launch(formData) {
    return apiClient.post('/domination/apply', formData, dominationRequestConfig)
  },
  findJobs(payload) {
    return apiClient.post('/domination/find-jobs', payload, dominationRequestConfig)
  },
  applyAll(payload) {
    return apiClient.post('/domination/apply-all', payload, dominationRequestConfig)
  },
  getBatchStatus(batchId) {
    return apiClient.get(`/domination/batch/${batchId}`, dominationRequestConfig)
  },
  getEvidenceBlob(filename) {
    return apiClient.get(`/domination/evidence/${filename}`, {
      ...dominationRequestConfig,
      responseType: 'blob'
    })
  },
  getEmailBlob(filename) {
    return apiClient.get(`/domination/email/${filename}`, {
      ...dominationRequestConfig,
      responseType: 'blob'
    })
  },
  getGreenhouseJob(url) {
    return apiClient.get(`/jobs/greenhouse?url=${encodeURIComponent(url)}`, dominationRequestConfig)
  },
  validateGreenhouse(url) {
    return apiClient.post('/jobs/greenhouse/validate', { url }, dominationRequestConfig)
  },
  applyGreenhouse(url, answers, dryRun) {
    return apiClient.post('/jobs/greenhouse/apply', { url, answers, dryRun }, dominationRequestConfig)
  }
}

export default dominationApi
