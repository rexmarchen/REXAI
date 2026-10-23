import apiClient from './apiClient'

/**
 * Fetch paginated activities with filters
 */
export const fetchActivities = async ({
  category,
  status,
  startDate,
  endDate,
  search,
  page = 1,
  limit = 20
} = {}) => {
  const params = { page, limit }
  if (category && category !== 'all') params.category = category
  if (status && status !== 'all') params.status = status
  if (startDate) params.startDate = startDate
  if (endDate) params.endDate = endDate
  if (search && search.trim()) params.search = search.trim()

  // Note: apiClient returns response.data directly
  const data = await apiClient.get('/activities', { params })
  return data
}

/**
 * Fetch activity summary and metrics for dashboard
 */
export const fetchActivitySummary = async ({ startDate, endDate } = {}) => {
  const params = {}
  if (startDate) params.startDate = startDate
  if (endDate) params.endDate = endDate

  // Note: apiClient returns response.data directly
  const data = await apiClient.get('/activities/summary', { params })
  return data?.data || data
}

/**
 * Download CSV export of user activities
 */
export const downloadActivitiesCsv = async ({
  category,
  startDate,
  endDate,
  search
} = {}) => {
  const params = {}
  if (category && category !== 'all') params.category = category
  if (startDate) params.startDate = startDate
  if (endDate) params.endDate = endDate
  if (search && search.trim()) params.search = search.trim()

  const data = await apiClient.get('/activities/export', {
    params,
    responseType: 'blob'
  })

  // Trigger browser download
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `rexion-activity-tracker-${Date.now()}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Delete a specific activity record
 */
export const deleteActivity = async (id) => {
  const data = await apiClient.delete(`/activities/${id}`)
  return data
}
