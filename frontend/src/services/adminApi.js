import apiClient from './apiClient'

const adminApi = {
  // System Overview & Metrics
  getOverview(params = {}) {
    return apiClient.get('/admin/overview', { params })
  },

  getSystemHealth() {
    return apiClient.get('/admin/system-health')
  },

  getUserGrowth(params = {}) {
    return apiClient.get('/admin/analytics/user-growth', { params })
  },

  // User Management
  getUsers(params = {}) {
    return apiClient.get('/admin/users', { params })
  },

  updateUserRole(id, role) {
    return apiClient.patch(`/admin/users/${id}/role`, { role })
  },

  updateUserStatus(id, data) {
    return apiClient.patch(`/admin/users/${id}/status`, data)
  },

  deleteUser(id) {
    return apiClient.delete(`/admin/users/${id}`)
  },

  // Feature Controls
  getFeatureFlags() {
    return apiClient.get('/admin/features')
  },

  updateFeatureFlag(key, value) {
    return apiClient.patch(`/admin/features/${key}`, { value })
  },

  // Security & Audit Logs
  getAuditLogs(params = {}) {
    return apiClient.get('/admin/audit-logs', { params })
  },

  // Subscriptions & Billing
  getBillingOverview() {
    return apiClient.get('/admin/billing')
  },

  getSubscriptions(params = {}) {
    return apiClient.get('/admin/subscriptions', { params })
  },

  overrideSubscription(userId, data = {}) {
    return apiClient.post(`/admin/subscriptions/${userId}/override`, data)
  },

  getBillingFailures() {
    return apiClient.get('/admin/billing-failures')
  },

  // Developer Moderation
  getDevelopers(params = {}) {
    return apiClient.get('/admin/developers', { params })
  },

  updateDeveloperStatus(id, statusData) {
    return apiClient.patch(`/admin/developers/${id}/status`, statusData)
  },

  grantDeveloper(data) {
    return apiClient.post('/admin/developers/grant', data)
  },

  // Faculty Verification & Moderation
  getFaculty(params = {}) {
    return apiClient.get('/admin/faculty', { params })
  },

  getFacultyDetail(id) {
    return apiClient.get(`/admin/faculty/${id}`)
  },

  updateFacultyVerification(id, verificationData) {
    return apiClient.patch(`/admin/faculty/${id}/verification`, verificationData)
  },

  // System & Internship Tools
  refreshInternships() {
    return apiClient.post('/admin/internships/refresh')
  },

  getInternshipsHealth() {
    return apiClient.get('/admin/internships/health')
  }
}

export default adminApi
