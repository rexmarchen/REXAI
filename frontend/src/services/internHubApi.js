const DEFAULT_API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
).replace(/\/+$/, '')

const LEGACY_INTERN_HUB_BASE_URLS = new Set([
  'http://127.0.0.1:5051/api',
  'http://localhost:5051/api'
])

const configuredInternHubBaseUrl = String(import.meta.env.VITE_INTERN_HUB_API_BASE_URL || '')
  .trim()
  .replace(/\/+$/, '')

const INTERN_HUB_API_BASE_URL = (
  configuredInternHubBaseUrl && !LEGACY_INTERN_HUB_BASE_URLS.has(configuredInternHubBaseUrl)
    ? configuredInternHubBaseUrl
    : `${DEFAULT_API_BASE_URL}/intern-hub`
).replace(/\/+$/, '')

const LINKEDIN_LIVE_WINDOW_SECONDS = 7 * 24 * 60 * 60
const INTERNSHIP_QUERY_REGEX = /\b(intern|internship|trainee|apprentice|fellow|co-?op)\b/i
const REMOTE_REGEX = /\bremote\b/i
const inflightSearches = new Map()

export const buildLinkedInSearchUrl = ({ title, company, location, mode }) => {
  const params = new URLSearchParams()
  const normalizedTitle = String(title || '').trim()
  const normalizedLocation = String(location || '').trim()
  const normalizedMode = String(mode || '').trim()

  params.set(
    'keywords',
    INTERNSHIP_QUERY_REGEX.test(normalizedTitle) ? normalizedTitle : `${normalizedTitle} internship`
  )
  params.set('f_JT', 'I')
  params.set('f_TPR', `r${LINKEDIN_LIVE_WINDOW_SECONDS}`)

  if (
    normalizedLocation &&
    normalizedLocation.toLowerCase() !== 'location not listed' &&
    !REMOTE_REGEX.test(normalizedLocation)
  ) {
    params.set('location', normalizedLocation)
  }

  if (REMOTE_REGEX.test(normalizedMode) || REMOTE_REGEX.test(normalizedLocation)) {
    params.set('f_WT', '2')
  }

  return `https://www.linkedin.com/jobs/search/?${params.toString()}`
}

export const buildLinkedInRedirectUrl = ({ title, company, location, mode }) => {
  const params = new URLSearchParams()
  params.set('title', String(title || '').trim())

  if (company) {
    params.set('company', String(company).trim())
  }
  if (location) {
    params.set('location', String(location).trim())
  }

  params.set(
    'fallback_url',
    buildLinkedInSearchUrl({
      title,
      company,
      location,
      mode
    })
  )

  return `${INTERN_HUB_API_BASE_URL}/linkedin/redirect?${params.toString()}`
}

const buildParams = (query, options = {}) => {
  const params = new URLSearchParams()
  params.append('query', query)

  if (options.location) {
    params.append('location', options.location)
  }
  if (typeof options.remote === 'boolean') {
    params.append('remote', String(options.remote))
  }
  if (Number.isFinite(options.page) && Number(options.page) > 0) {
    params.append('page', String(Math.round(Number(options.page))))
  }
  if (Number.isFinite(options.numPages) && Number(options.numPages) > 0) {
    params.append('num_pages', String(Math.round(Number(options.numPages))))
  }
  if (Number.isFinite(options.limit) && Number(options.limit) > 0) {
    params.append('limit', String(Math.round(Number(options.limit))))
  }
  if (Number.isFinite(options.postedWithinHours) && Number(options.postedWithinHours) > 0) {
    params.append('posted_within_hours', String(Math.round(Number(options.postedWithinHours))))
  }
  if (typeof options.adzunaOnly === 'boolean') {
    params.append('adzuna_only', String(options.adzunaOnly))
  }
  if (typeof options.refresh === 'boolean') {
    params.append('refresh', String(options.refresh))
  }

  return params
}

export const searchInternships = async (query, options = {}) => {
  const params = buildParams(query, options)
  const endpoint = `${INTERN_HUB_API_BASE_URL}/internships/search?${params.toString()}`

  if (inflightSearches.has(endpoint)) {
    return inflightSearches.get(endpoint)
  }

  const requestPromise = (async () => {
    let response
    try {
      response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      })
    } catch (error) {
      throw new Error('Live internship feed is temporarily unavailable. Unable to reach the internship API.')
    }

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      const detail = String(payload?.error || payload?.message || '').trim()
      const requestError = new Error(detail || `Intern Hub API returned ${response.status}`)
      requestError.statusCode = response.status
      requestError.response = {
        status: response.status,
        data: payload
      }
      throw requestError
    }

    return await response.json()
  })()

  inflightSearches.set(endpoint, requestPromise)

  try {
    return await requestPromise
  } finally {
    inflightSearches.delete(endpoint)
  }
}

export default {
  searchInternships,
  buildLinkedInRedirectUrl,
  buildLinkedInSearchUrl
}
