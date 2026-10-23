import apiClient from './apiClient'

/**
 * Fetch dynamic connection status for live telemetry from SQLite
 */
export async function fetchConnectionStatus() {
  try {
    const res = await apiClient.get('/connections/status')
    return res?.data ?? res
  } catch (err) {
    console.warn('[socialConnectionsApi] Failed to fetch /connections/status:', err.message)
    // Fallback attempt to /social-connections/status
    try {
      const fallback = await apiClient.get('/social-connections/status')
      return fallback?.data ?? fallback
    } catch {
      return null
    }
  }
}

/**
 * Save or upsert social connection in SQLite
 */
export async function saveSocialConnection(payload) {
  const res = await apiClient.post('/connections', payload)
  return res?.data ?? res
}

/**
 * Toggle autopilot status for a connection or platform
 */
export async function toggleSocialAutopilot(payload) {
  const res = await apiClient.post('/connections/toggle', payload)
  return res?.data ?? res
}

/**
 * Request Meta OAuth URL from backend
 */
export async function getMetaOAuthUrl() {
  const res = await apiClient.get('/auth/instagram', {
    headers: { Accept: 'application/json' }
  })
  return res?.data ?? res
}

/**
 * Delete / disconnect a connection by ID
 */
export async function deleteSocialConnection(id) {
  const res = await apiClient.delete(`/connections/${id}`)
  return res?.data ?? res
}
