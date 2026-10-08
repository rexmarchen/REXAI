import apiClient from './apiClient'

export async function fetchProblems(params = {}) {
  const res = await apiClient.get('/code-arena/problems', { params })
  return res?.data !== undefined ? res.data : res
}

export async function fetchProblem(slug) {
  const res = await apiClient.get(`/code-arena/problems/${slug}`)
  return res?.data !== undefined ? res.data : res
}

export async function runProblemCode(slug, { language, code }) {
  const res = await apiClient.post(`/code-arena/problems/${slug}/run`, {
    language,
    code
  })
  return res?.data !== undefined ? res.data : res
}

export async function submitProblemCode(slug, { language, code, userId }) {
  const res = await apiClient.post(`/code-arena/problems/${slug}/submit`, {
    language,
    code,
    userId
  })
  return res?.data !== undefined ? res.data : res
}

export async function fetchChallengesOverview(userId) {
  const res = await apiClient.get('/code-arena/overview', { params: { userId } })
  return res?.data !== undefined ? res.data : res
}

export async function syncChallenges() {
  const res = await apiClient.post('/code-arena/sync-challenges')
  return res?.data !== undefined ? res.data : res
}

