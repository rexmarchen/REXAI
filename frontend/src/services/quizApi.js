import apiClient from './apiClient'

const getClientUserId = () => {
  if (typeof window === 'undefined') return null
  try {
    const stored = window.localStorage.getItem('rexionUser')
    if (stored) {
      const u = JSON.parse(stored)
      if (u?._id || u?.id) return String(u._id || u.id)
    }
    let guestId = window.localStorage.getItem('rexionClientUserId')
    if (!guestId) {
      guestId = 'usr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
      window.localStorage.setItem('rexionClientUserId', guestId)
    }
    return guestId
  } catch (_) {
    return null
  }
}

const quizApi = {
  /** Hub: metrics, popular topics, leaderboard */
  getQuizzes(params = {}) {
    const clean = { userId: getClientUserId(), ...params }
    Object.entries(clean).forEach(([k, v]) => { if (v === undefined || v === '') delete clean[k] })
    return apiClient.get('/quizzes', { params: clean })
  },

  /**
   * Today's question set for a quiz (daily rotation from server).
   * Returns { success, quiz: { questions: [...], todayDate, ... } }
   */
  getQuizById(idOrSlug) {
    return apiClient.get(`/quizzes/${idOrSlug}`)
  },

  /**
   * Submit answers — server scores them + persists attempt.
   * @param {string} idOrSlug
   * @param {Array}  answers   - [{ questionId, selectedIndex }]
   * @param {number} timeTaken - seconds taken
   * @param {string} dailyDate - 'YYYY-MM-DD' from server (prevent clock mismatch)
   */
  submitQuiz(idOrSlug, answers, timeTaken = 0, dailyDate = '') {
    const clientUserId = getClientUserId()
    return apiClient.post(`/quizzes/${idOrSlug}/submit`, {
      answers,
      timeTaken,
      dailyDate,
      clientUserId,
      userId: clientUserId
    })
  },

  /** Authenticated user's attempt history + per-quiz best scores + total XP */
  getMyAttempts() {
    const uid = getClientUserId()
    return apiClient.get('/quizzes/me/attempts', { params: uid ? { userId: uid } : {} }).catch(() => null)
  },

  /** Real XP-ranked leaderboard from MongoDB */
  getLeaderboard() {
    return apiClient.get('/quizzes/leaderboard').catch(() => null)
  },

  /** Generate fresh AI questions on demand for a quiz/topic */
  generateFreshQuestions(idOrSlug, count = 5) {
    return apiClient.post(`/quizzes/${idOrSlug}/generate-fresh`, { count })
  },

  /** Auto-provision and generate quiz for any arbitrary topic */
  generateTopicQuiz(topic, category = 'Development', difficulty = 'Medium', count = 5) {
    return apiClient.post('/quizzes/generate-topic', { topic, category, difficulty, count })
  }
}

export default quizApi
