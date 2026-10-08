import apiClient from './apiClient'

export async function fetchChallengesList(userId) {
  const res = await apiClient.get('/challenges', { params: { userId } })
  return res?.data !== undefined ? res.data : res
}

export async function fetchChallenge(id) {
  const res = await apiClient.get(`/challenges/${id}`)
  return res?.data !== undefined ? res.data : res
}

export async function runChallengeCode(id, { language, code }) {
  const res = await apiClient.post(`/challenges/${id}/run`, {
    language,
    code
  })
  return res?.data !== undefined ? res.data : res
}

export async function submitChallengeCode(id, { language, code, userId }) {
  const res = await apiClient.post(`/challenges/${id}/submit`, {
    language,
    code,
    userId
  })
  return res?.data !== undefined ? res.data : res
}
