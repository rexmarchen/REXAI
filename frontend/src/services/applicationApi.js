import apiClient from './apiClient'

/**
 * Ingest resume file or raw text to create/update candidate profile & generate semantic chunks
 */
export async function uploadCandidateResume(fileOrFormData) {
  let body = fileOrFormData
  if (fileOrFormData instanceof File) {
    const formData = new FormData()
    formData.append('resume', fileOrFormData)
    body = formData
  }
  return await apiClient.post('/applications/resume/upload', body)
}

/**
 * Get the current candidate profile
 */
export async function getCandidateProfile() {
  return await apiClient.get('/applications/profile')
}

/**
 * Update candidate preferences or contact info
 */
export async function updateCandidateProfile(updates) {
  return await apiClient.put('/applications/profile', updates)
}

/**
 * Discover fresh jobs (<= 48 hours old) with multi-factor explainable matching
 */
export async function discoverFreshJobs(params = {}) {
  return await apiClient.post('/applications/discover', params)
}

/**
 * Execute 1-Click Agentic application workflow
 */
export async function applyOneClick(job, options = {}) {
  return await apiClient.post('/applications/apply-one-click', { job, options })
}

/**
 * Get detailed live status and audit trail of an application
 */
export async function getApplicationStatus(applicationId) {
  return await apiClient.get(`/applications/status/${applicationId}`)
}

/**
 * Get aggregate candidate application metrics and analytics
 */
export async function getApplicationMetrics() {
  return await apiClient.get('/applications/metrics')
}

/**
 * Get live tracked applications from MongoDB
 */
export async function getTrackedApplications(params = {}) {
  return await apiClient.get('/applications/tracker', { params })
}

