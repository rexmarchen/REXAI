import apiClient from './apiClient'

const getClientContext = () => {
  if (typeof window === 'undefined') return {}
  let userId = null
  let quizScores = null
  let solvedSlugs = null

  try {
    const stored = window.localStorage.getItem('rexionUser')
    if (stored) {
      const u = JSON.parse(stored)
      if (u?._id || u?.id) userId = String(u._id || u.id)
    }
    if (!userId) {
      userId = window.localStorage.getItem('rexionClientUserId') || null
    }

    const rawScores = window.localStorage.getItem('rexionQuizScores')
    if (rawScores) quizScores = rawScores

    const rawSolves = window.localStorage.getItem('rexionSolvedChallenges') || window.localStorage.getItem('rexion_solved_challenges')
    if (rawSolves) solvedSlugs = rawSolves
  } catch (_) {}

  return { userId, quizScores, solvedSlugs }
}

const skillGraphApi = {
  /**
   * Fetch the dynamic skill graph data for a target role
   * @param {string} roleId - e.g. 'ai-engineer', 'fullstack-developer'
   */
  async getSkillGraph(roleId = 'ai-engineer', options = {}) {
    const ctx = getClientContext()
    const params = new URLSearchParams({ roleId })
    if (ctx.userId) params.append('userId', ctx.userId)
    if (ctx.quizScores) params.append('quizScores', ctx.quizScores)
    if (ctx.solvedSlugs) params.append('solvedSlugs', ctx.solvedSlugs)

    const res = await apiClient.get(`/skill-gap/graph?${params.toString()}`, {
      __skipUnauthorizedRedirect: true,
      headers: ctx.userId ? { 'x-user-id': ctx.userId } : {},
      ...options
    })
    return res?.data?.data || res?.data || res
  },

  /**
   * Fetch real calculated user skills summary from MongoDB
   * @param {string} roleId
   */
  async getUserSkillsSummary(roleId = 'ai-engineer', options = {}) {
    const ctx = getClientContext()
    const params = new URLSearchParams({ roleId })
    if (ctx.userId) params.append('userId', ctx.userId)
    if (ctx.quizScores) params.append('quizScores', ctx.quizScores)
    if (ctx.solvedSlugs) params.append('solvedSlugs', ctx.solvedSlugs)

    const res = await apiClient.get(`/skill-gap/user-skills-summary?${params.toString()}`, {
      __skipUnauthorizedRedirect: true,
      headers: ctx.userId ? { 'x-user-id': ctx.userId } : {},
      ...options
    })
    return res?.data?.data || res?.data || res
  },

  /**
   * Fetch available target roles
   */
  async getRoles(options = {}) {
    return apiClient.get('/skill-gap/roles', {
      __skipUnauthorizedRedirect: true,
      ...options
    }).then(r => r?.roles || r?.data?.roles || [])
  },

  /**
   * Dynamically generate or fetch a custom skill graph via AI
   * @param {string} roleTitle - e.g. "Data Scientist", "Cybersecurity", "Blockchain Developer"
   */
  async generateCustomPath(roleTitle, options = {}) {
    const ctx = getClientContext()
    const payload = {
      roleTitle,
      userId: ctx.userId || undefined
    }
    const res = await apiClient.post('/skill-gap/generate-custom-path', payload, {
      __skipUnauthorizedRedirect: true,
      headers: ctx.userId ? { 'x-user-id': ctx.userId } : {},
      ...options
    })
    // Support both direct unwrapped response and nested response.data
    const root = res?.roleId ? res : (res?.data?.roleId ? res.data : res)
    return {
      success: root?.success ?? true,
      roleId: root?.roleId || (root?.data && root.data.roleId) || roleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      roleName: root?.roleName || (root?.data && root.data.roleName) || roleTitle,
      data: root?.data?.clusters ? root.data : (root?.clusters ? root : (root?.data || root))
    }
  }
}

export default skillGraphApi
