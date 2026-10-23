import apiClient from './apiClient'

const developerApi = {
  // Onboarding & Profile
  getProfile() {
    return apiClient.get('/developer/profile')
  },

  apply(data) {
    return apiClient.post('/developer/apply', data)
  },

  applyForDeveloper(data) {
    return apiClient.post('/developer/apply', data)
  },

  // Dashboard Overview
  getDashboard() {
    return apiClient.get('/developer/dashboard')
  },

  // Quizzes CRUD
  getQuizzes(params = {}) {
    return apiClient.get('/developer/quizzes', { params })
  },

  createQuiz(data) {
    return apiClient.post('/developer/quizzes', data)
  },

  getQuiz(id) {
    return apiClient.get(`/developer/quizzes/${id}`)
  },

  getQuizById(id) {
    return this.getQuiz(id)
  },

  updateQuiz(id, data) {
    return apiClient.patch(`/developer/quizzes/${id}`, data)
  },

  publishQuiz(id) {
    return apiClient.post(`/developer/quizzes/${id}/publish`)
  },

  archiveQuiz(id) {
    return apiClient.post(`/developer/quizzes/${id}/archive`)
  },

  restoreQuiz(id) {
    return apiClient.post(`/developer/quizzes/${id}/restore`)
  },

  duplicateQuiz(id) {
    return apiClient.post(`/developer/quizzes/${id}/duplicate`)
  },

  deleteQuiz(id) {
    return apiClient.delete(`/developer/quizzes/${id}`)
  },

  getAnalytics(id) {
    return apiClient.get(`/developer/quizzes/${id}/analytics`)
  },

  getQuizAnalytics(id) {
    return this.getAnalytics(id)
  },

  // Question Bank
  getQuestionsBank(params = {}) {
    return apiClient.get('/developer/questions', { params })
  },

  // Question Management inside a quiz
  addQuestion(quizId, questionData) {
    return apiClient.post(`/developer/quizzes/${quizId}/questions`, questionData)
  },

  updateQuestion(quizId, questionId, questionData) {
    return apiClient.patch(`/developer/quizzes/${quizId}/questions/${questionId}`, questionData)
  },

  deleteQuestion(quizId, questionId) {
    return apiClient.delete(`/developer/quizzes/${quizId}/questions/${questionId}`)
  },

  reorderQuestions(quizId, questionIds) {
    return apiClient.post(`/developer/quizzes/${quizId}/questions/reorder`, { questionIds })
  },

  duplicateQuestion(quizId, questionId) {
    return apiClient.post(`/developer/quizzes/${quizId}/questions/duplicate`, { questionId })
  },

  importQuestions(quizId, questions) {
    return apiClient.post(`/developer/quizzes/${quizId}/questions/import`, { questions })
  },

  // Admin moderation endpoints
  getAdminDevelopers(params = {}) {
    return apiClient.get('/admin/developers', { params })
  },

  updateDeveloperStatus(id, data) {
    return apiClient.patch(`/admin/developers/${id}/status`, data)
  },

  grantDeveloper(email, data = {}) {
    return apiClient.post('/admin/developers/grant', { email, ...data })
  },

  inviteDeveloper(emailOrData, data = {}) {
    const payload = typeof emailOrData === 'object' ? emailOrData : { email: emailOrData, ...data }
    return apiClient.post('/admin/developers/grant', payload)
  }
}

export default developerApi
