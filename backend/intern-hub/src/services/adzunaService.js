import { cache } from '../config/cache.js'
import { config } from '../config/index.js'
import { searchLinkedInInternships } from './apifyService.js'
import { buildInternshipCacheKey } from '../utils/cacheKeys.js'
import { logger } from '../utils/logger.js'

const REMOTE_REGEX = /\b(remote|work from home|wfh|anywhere|distributed|home-based)\b/i
const INTERNSHIP_REGEX = /\b(intern|internship|trainee|apprentice|fellow|co-?op)\b/i
const INDIA_REGEX =
  /\bindia\b|\bbengaluru\b|\bbangalore\b|\bhyderabad\b|\bpune\b|\bmumbai\b|\bchennai\b|\bgurgaon\b|\bgurugram\b|\bnoida\b|\bdelhi\b/i
const DEFAULT_LOCATION_TEXT = 'Location not listed'
const inflightRequests = new Map()
const LINKEDIN_SUPPLEMENT_THRESHOLD = 12
const GLOBAL_EXPANSION_THRESHOLD = 10

const createHttpError = (statusCode, message) => {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

export const normalizeAdzunaUpstreamError = (error) => {
  if (error?.statusCode) {
    if (Number(error.statusCode) === 429) {
      return createHttpError(
        429,
        'Adzuna rate limit reached. Please wait a minute and try again.'
      )
    }
    return error
  }

  const name = String(error?.name || '').trim()
  const message = String(error?.message || '').trim().toLowerCase()

  if (name === 'TimeoutError' || name === 'AbortError') {
    return createHttpError(504, 'Adzuna timed out before returning internship results. Please try again.')
  }

  if (message === 'fetch failed') {
    return createHttpError(
      502,
      'Unable to reach Adzuna right now. Check your network connection or try again shortly.'
    )
  }

  return error
}

const toLower = (value) => String(value || '').trim().toLowerCase()

const toPositiveNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

const dedupeJobs = (jobs) => {
  const seen = new Set()
  return jobs.filter((job) => {
    const key = `${toLower(job?.title)}|${toLower(job?.company)}|${toLower(job?.location)}`
    if (!key || seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

const computePostedHoursAgo = (value) => {
  const timestamp = Date.parse(String(value || '').trim())
  if (!Number.isFinite(timestamp)) {
    return null
  }
  const diffHours = Math.max(0, Math.floor((Date.now() - timestamp) / (1000 * 60 * 60)))
  return diffHours
}

const formatSalary = (salaryMin, salaryMax) => {
  const min = toPositiveNumber(salaryMin)
  const max = toPositiveNumber(salaryMax)

  if (min && max) {
    return min === max
      ? `${Math.round(min).toLocaleString()}`
      : `${Math.round(min).toLocaleString()} - ${Math.round(max).toLocaleString()}`
  }
  if (min) {
    return `From ${Math.round(min).toLocaleString()}`
  }
  if (max) {
    return `Up to ${Math.round(max).toLocaleString()}`
  }

  return ''
}

const buildEmploymentType = (job) => {
  return [job?.contract_time, job?.contract_type]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ')
}

const buildLocationText = (job) => {
  const directLocation = String(job?.location || '').trim()
  if (directLocation && typeof job?.location === 'string') {
    return directLocation
  }

  const displayName = String(job?.location?.display_name || '').trim()
  if (displayName) {
    return displayName
  }

  const area = Array.isArray(job?.location?.area)
    ? job.location.area.map((item) => String(item || '').trim()).filter(Boolean)
    : []

  return area.length > 0 ? area.join(', ') : DEFAULT_LOCATION_TEXT
}

export const isRemoteAd = (job) => {
  const corpus = [
    job?.title,
    job?.description,
    job?.location?.display_name,
    Array.isArray(job?.location?.area) ? job.location.area.join(' ') : ''
  ]
    .map((value) => String(value || '').trim())
    .join(' ')

  return REMOTE_REGEX.test(corpus)
}

export const isInternshipAd = (job) => {
  const corpus = [job?.title, job?.description, job?.contract_type, job?.contract_time]
    .map((value) => String(value || '').trim())
    .join(' ')

  return INTERNSHIP_REGEX.test(corpus)
}

const isIndianSearch = (params) => INDIA_REGEX.test(String(params?.location || '').trim())

const hashString = (value) => {
  let hash = 0
  const text = String(value || '')
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0
  }
  return hash
}

const selectCountryCodes = (params) => {
  if (isIndianSearch(params)) {
    return config.adzunaIndiaCountries.slice(0, 1)
  }

  const pool = config.adzunaSearchCountries.filter(Boolean)
  const totalCountries = Math.min(Math.max(1, config.adzunaCountriesPerRequest), pool.length || 1)
  const safePool = pool.length > 0 ? pool : ['in']
  const startIndex = hashString(`${params.query}|${params.page}|${params.location || ''}|${params.remote}`) % safePool.length

  return Array.from({ length: totalCountries }, (_, offset) => safePool[(startIndex + offset) % safePool.length])
}

const selectGlobalSupplementCountryCodes = (params, excludedCountries = []) => {
  const pool = config.adzunaSearchCountries
    .filter(Boolean)
    .filter((countryCode) => !excludedCountries.includes(countryCode))

  if (pool.length === 0) {
    return []
  }

  const totalCountries = Math.min(Math.max(1, config.adzunaCountriesPerRequest), pool.length)
  const startIndex =
    hashString(`global:${params.query}|${params.page}|${params.location || ''}|${params.remote}`) % pool.length

  return Array.from({ length: totalCountries }, (_, offset) => pool[(startIndex + offset) % pool.length])
}

const buildSearchUrl = ({ countryCode, page, query, location, limit }) => {
  const url = new URL(`jobs/${countryCode}/search/${page}`, `${config.adzunaBaseUrl}/`)
  url.searchParams.set('app_id', config.adzunaAppId)
  url.searchParams.set('app_key', config.adzunaAppKey)
  url.searchParams.set('what', query)
  url.searchParams.set('results_per_page', String(limit))
  url.searchParams.set('sort_by', 'date')
  url.searchParams.set('content-type', 'application/json')

  if (location && !INDIA_REGEX.test(location)) {
    url.searchParams.set('where', location)
  }

  return url
}

const filterByRecency = (jobs, postedWithinHours) => {
  if (!Number.isFinite(postedWithinHours) || postedWithinHours <= 0) {
    return jobs
  }

  return jobs.filter((job) => {
    const ageHours = computePostedHoursAgo(job?.created)
    return ageHours != null && ageHours <= postedWithinHours
  })
}

const filterByLocation = (jobs, location) => {
  const normalizedLocation = String(location || '').trim()
  if (!normalizedLocation || INDIA_REGEX.test(normalizedLocation)) {
    return jobs
  }

  const needle = normalizedLocation.toLowerCase()
  return jobs.filter((job) => {
    const locationText = buildLocationText(job).toLowerCase()
    return locationText.includes(needle)
  })
}

export const normalizeAdzunaJob = (job, countryCode) => {
  const location = buildLocationText(job)
  const postedDate = String(job?.created || '').trim()
  const salary = formatSalary(job?.salary_min, job?.salary_max)

  return {
    id: String(job?.id || `${countryCode}-${toLower(job?.title)}-${toLower(job?.company?.display_name)}`),
    title: String(job?.title || '').trim(),
    company: String(job?.company?.display_name || 'Unknown company').trim(),
    location,
    description: String(job?.description || '').trim(),
    salary,
    posted_date: postedDate,
    posted_hours_ago: computePostedHoursAgo(postedDate),
    apply_link: String(job?.redirect_url || '').trim(),
    employment_type: buildEmploymentType(job) || 'Internship',
    is_remote: isRemoteAd(job),
    source: 'Adzuna',
    company_logo: null,
    required_skills: [],
    required_experience: null,
    required_education: null,
    country_code: countryCode
  }
}

const fetchAdzunaPage = async ({ countryCode, page, query, location, limit }) => {
  const url = buildSearchUrl({
    countryCode,
    page,
    query,
    location,
    limit: Math.min(limit, Math.max(1, config.adzunaResultsPerPage))
  })

  let response
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      signal: AbortSignal.timeout(config.upstreamTimeoutMs)
    })
  } catch (error) {
    throw normalizeAdzunaUpstreamError(error)
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw createHttpError(
      response.status,
      payload?.description || payload?.error || `Adzuna returned ${response.status}`
    )
  }

  const rows = Array.isArray(payload?.results) ? payload.results : []
  return rows.map((job) => normalizeAdzunaJob(job, countryCode))
}

const fetchAdzunaJobs = async (params, countryCodes = selectCountryCodes(params)) => {
  if (!config.adzunaAppId || !config.adzunaAppKey) {
    throw createHttpError(
      503,
      'Adzuna credentials are missing. Add ADZUNA_APP_ID and ADZUNA_APP_KEY to backend/intern-hub/.env.'
    )
  }

  const selectedCountries = countryCodes.filter(Boolean)
  const pageCount = Math.max(1, params.numPages)
  const results = []

  for (const countryCode of selectedCountries) {
    for (let pageOffset = 0; pageOffset < pageCount; pageOffset += 1) {
      const page = Math.max(1, params.page + pageOffset)
      logger.info(`Fetching Adzuna internships for "${params.query}" in ${countryCode} page ${page}`)
      const pageJobs = await fetchAdzunaPage({
        countryCode,
        page,
        query: params.query,
        location: params.location,
        limit: params.limit
      })
      results.push(...pageJobs)
    }
  }

  return results
}

const filterNormalizedJobs = (jobs, params) => {
  let filtered = jobs.filter((job) => isInternshipAd(job))

  if (typeof params.remote === 'boolean' && params.remote) {
    filtered = filtered.filter((job) => job.is_remote)
  }

  filtered = filterByLocation(
    filtered.map((job) => ({
      ...job,
      location: job.location || DEFAULT_LOCATION_TEXT
    })),
    params.location
  )

  filtered = filterByRecency(
    filtered.map((job) => ({
      ...job,
      created: job.posted_date
    })),
    params.postedWithinHours
  ).map(({ created, ...job }) => job)

  filtered.sort((left, right) => {
    const leftTime = Date.parse(String(left?.posted_date || '')) || 0
    const rightTime = Date.parse(String(right?.posted_date || '')) || 0
    return rightTime - leftTime
  })

  return dedupeJobs(filtered).slice(0, params.limit)
}

const sortNormalizedJobsByRecency = (jobs) =>
  [...jobs].sort((left, right) => {
    const leftTime = Date.parse(String(left?.posted_date || '')) || 0
    const rightTime = Date.parse(String(right?.posted_date || '')) || 0
    return rightTime - leftTime
  })

export const searchInternships = async (params) => {
  const effectiveParams = {
    ...params,
    refresh: Boolean(params.refresh)
  }
  const cacheKey = buildInternshipCacheKey(effectiveParams)

  if (!effectiveParams.refresh) {
    const cached = cache.get(cacheKey)
    if (cached) {
      return cached
    }
  }

  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey)
  }

  const requestPromise = (async () => {
    try {
      const selectedCountries = selectCountryCodes(effectiveParams)
      let fetchedCountries = [...selectedCountries]
      let adzunaJobs = []
      let adzunaErrorMessage = ''

      try {
        adzunaJobs = await fetchAdzunaJobs(effectiveParams, selectedCountries)
      } catch (error) {
        const normalizedError = normalizeAdzunaUpstreamError(error)
        adzunaErrorMessage = String(normalizedError?.message || 'Adzuna request failed.')
        logger.warn(`Adzuna internship fetch degraded: ${adzunaErrorMessage}`)
      }

      let normalizedAdzunaJobs = filterNormalizedJobs(adzunaJobs, effectiveParams)

      if (isIndianSearch(effectiveParams) && normalizedAdzunaJobs.length < GLOBAL_EXPANSION_THRESHOLD) {
        const supplementalCountries = selectGlobalSupplementCountryCodes(effectiveParams, selectedCountries)

        if (supplementalCountries.length > 0) {
          try {
            const supplementalJobs = await fetchAdzunaJobs(effectiveParams, supplementalCountries)
            normalizedAdzunaJobs = filterNormalizedJobs([...adzunaJobs, ...supplementalJobs], effectiveParams)
            fetchedCountries = [...selectedCountries, ...supplementalCountries]
          } catch (error) {
            const normalizedError = normalizeAdzunaUpstreamError(error)
            logger.warn(
              `Adzuna global internship expansion degraded: ${
                normalizedError?.message || 'Global expansion request failed.'
              }`
            )
          }
        }
      }

      const shouldSupplementWithLinkedIn =
        !effectiveParams.adzunaOnly &&
        normalizedAdzunaJobs.length < Math.min(Number(effectiveParams.limit) || 20, LINKEDIN_SUPPLEMENT_THRESHOLD)

      const linkedInPayload = shouldSupplementWithLinkedIn
        ? await searchLinkedInInternships(effectiveParams)
        : {
            jobs: [],
            meta: {
              provider: 'linkedin',
              skipped: true,
              reason: 'adzuna_results_sufficient'
            }
          }

      const normalizedJobs = sortNormalizedJobsByRecency(
        filterNormalizedJobs([...normalizedAdzunaJobs, ...(linkedInPayload.jobs || [])], effectiveParams)
      ).slice(0, effectiveParams.limit)

      if (normalizedJobs.length === 0 && adzunaErrorMessage && linkedInPayload.jobs.length === 0) {
        throw createHttpError(502, adzunaErrorMessage)
      }

      const providers = [
        normalizedAdzunaJobs.length > 0 ? 'adzuna' : null,
        linkedInPayload.jobs.length > 0 ? 'linkedin' : null
      ].filter(Boolean)

      const result = {
        jobs: normalizedJobs,
        meta: {
          provider: providers.length > 1 ? 'adzuna+linkedin' : providers[0] || 'adzuna',
          providers,
          adzuna_only: Boolean(effectiveParams.adzunaOnly),
          countries: fetchedCountries,
          adzuna_base_url: config.adzunaBaseUrl,
          linkedin_actor: config.apifyLinkedinActorId,
          cache: 'miss',
          fetched_at: new Date().toISOString(),
          total_available: normalizedJobs.length,
          adzuna_total: normalizedAdzunaJobs.length,
          linkedin_total: Number(linkedInPayload.jobs?.length || 0),
          ...(adzunaErrorMessage ? { error: adzunaErrorMessage } : {}),
          ...(linkedInPayload.meta?.error ? { linkedin_error: linkedInPayload.meta.error } : {})
        }
      }

      cache.set(cacheKey, result)
      return result
    } catch (error) {
      const normalizedError = normalizeAdzunaUpstreamError(error)
      const stale = cache.get(cacheKey, { allowStale: true })
      if (stale) {
        stale.meta = {
          ...(stale.meta || {}),
          error: String(normalizedError?.message || 'Upstream request failed.')
        }
        return stale
      }

      logger.error(`Adzuna internship fetch failed: ${normalizedError?.message || 'Unknown error'}`)
      if (!normalizedError?.statusCode) {
        normalizedError.statusCode = 502
      }
      throw normalizedError
    } finally {
      inflightRequests.delete(cacheKey)
    }
  })()

  inflightRequests.set(cacheKey, requestPromise)
  return requestPromise
}
