import apiClient from './apiClient'

// NOTE: apiClient response interceptor returns response.data directly (no wrapping).
// So we call apiClient.post/get and get the parsed JSON back immediately.

// Send message to AI Tutor — JSON mode (production stable)
export async function sendTutorMessage({ message, mode = 'ask', level = 'beginner', path = 'AI Engineer', sessionId }) {
  const data = await apiClient.post('/tutor/chat', {
    message,
    mode,
    level,
    path,
    sessionId
  })
  return data
}

// Stream AI Tutor response via SSE — used for real-time typing effect
// Returns: async generator that yields { type, ...payload }
export async function* streamTutorMessage({ message, mode = 'ask', level = 'beginner', path = 'AI Engineer', sessionId }) {
  const res = await fetch('/api/tutor/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
    },
    body: JSON.stringify({ message, mode, level, path, sessionId, stream: true })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `Request failed with status ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n\n')
      buffer = parts.pop() || ''
      for (const part of parts) {
        const line = part.trim()
        if (!line.startsWith('data:')) continue
        try {
          const payload = JSON.parse(line.slice(5).trim())
          yield payload
        } catch (_) {
          // skip malformed chunks
        }
      }
    }
  } finally {
    reader.cancel().catch(() => {})
  }
}

// Fetch recent sessions
export async function fetchTutorSessions() {
  const data = await apiClient.get('/tutor/sessions')
  return data?.sessions || []
}

// Fetch single session with full message history
export async function fetchTutorSession(sessionId) {
  const data = await apiClient.get(`/tutor/sessions/${sessionId}`)
  return data?.session || null
}

// Generate practice quiz (correct answers stripped server-side)
export async function createTutorQuiz({ topic, difficulty = 'medium', count = 3 }) {
  const data = await apiClient.post('/tutor/quiz', { topic, difficulty, count })
  return data
}

// Submit quiz answers — returns score, mastery, per-question feedback
export async function submitTutorQuiz(quizId, answers) {
  const data = await apiClient.post(`/tutor/quiz/${quizId}/submit`, { answers })
  return data
}

// Rate a message thumbs-up or thumbs-down
export async function rateTutorMessage(messageId, rating, sessionId) {
  const data = await apiClient.post(`/tutor/messages/${messageId}/rate`, { rating, sessionId })
  return data
}
