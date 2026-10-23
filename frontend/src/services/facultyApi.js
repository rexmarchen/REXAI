import apiClient from './apiClient'

const facultyApi = {
  // Faculty Profile & Verification
  getProfile() {
    return apiClient.get('/faculty/profile')
  },
  updateProfile(data) {
    return apiClient.put('/faculty/profile', data)
  },
  submitVerification(data) {
    return apiClient.post('/faculty/verify', data)
  },
  getPublicProfile(id) {
    return apiClient.get(`/faculty/public/${id}`)
  },

  // Faculty Dashboard
  getDashboard() {
    return apiClient.get('/faculty/dashboard')
  },

  // Quiz Management
  getQuizzes(params = {}) {
    return apiClient.get('/faculty/quizzes', { params })
  },
  createQuiz(data) {
    return apiClient.post('/faculty/quizzes', data)
  },
  getQuizById(id) {
    return apiClient.get(`/faculty/quizzes/${id}`)
  },
  updateQuiz(id, data) {
    return apiClient.put(`/faculty/quizzes/${id}`, data)
  },
  deleteQuiz(id) {
    return apiClient.delete(`/faculty/quizzes/${id}`)
  },
  publishQuiz(id) {
    return apiClient.post(`/faculty/quizzes/${id}/publish`)
  },
  unpublishQuiz(id) {
    return apiClient.post(`/faculty/quizzes/${id}/unpublish`)
  },
  archiveQuiz(id) {
    return apiClient.post(`/faculty/quizzes/${id}/archive`)
  },
  restoreQuiz(id) {
    return apiClient.post(`/faculty/quizzes/${id}/restore`)
  },
  duplicateQuiz(id) {
    return apiClient.post(`/faculty/quizzes/${id}/duplicate`)
  },
  getQuizAnalytics(id) {
    return apiClient.get(`/faculty/quizzes/${id}/analytics`)
  },

  // Questions inside a Quiz
  addQuestion(quizId, data) {
    return apiClient.post(`/faculty/quizzes/${quizId}/questions`, data)
  },
  updateQuestion(quizId, questionId, data) {
    return apiClient.put(`/faculty/quizzes/${quizId}/questions/${questionId}`, data)
  },
  deleteQuestion(quizId, questionId) {
    return apiClient.delete(`/faculty/quizzes/${quizId}/questions/${questionId}`)
  },
  reorderQuestions(quizId, orderedIds) {
    return apiClient.post(`/faculty/quizzes/${quizId}/questions/reorder`, { orderedIds })
  },
  importQuestionsFromBank(quizId, questionBankIds) {
    return apiClient.post(`/faculty/quizzes/${quizId}/questions/from-bank`, { questionBankIds })
  },

  // Question Bank
  getQuestionBank(params = {}) {
    return apiClient.get('/faculty/questions', { params })
  },
  createQuestionBankItem(data) {
    return apiClient.post('/faculty/questions', data)
  },
  updateQuestionBankItem(id, data) {
    return apiClient.put(`/faculty/questions/${id}`, data)
  },
  deleteQuestionBankItem(id) {
    return apiClient.delete(`/faculty/questions/${id}`)
  },

  // Admin Verification Moderation
  getAdminFacultyList(params = {}) {
    return apiClient.get('/admin/faculty', { params })
  },
  getAdminFacultyDetail(id) {
    return apiClient.get(`/admin/faculty/${id}`)
  },
  updateAdminFacultyStatus(id, data) {
    return apiClient.patch(`/admin/faculty/${id}/status`, data)
  }
}

export default facultyApi
