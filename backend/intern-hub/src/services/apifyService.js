import { cache } from '../config/cache.js'
import { config } from '../config/index.js'
import { logger } from '../utils/logger.js'

const INDIA_REGEX =
  /\bindia\b|\bbengaluru\b|\bbangalore\b|\bhyderabad\b|\bpune\b|\bmumbai\b|\bchennai\b|\bgurgaon\b|\bgurugram\b|\bnoida\b|\bdelhi\b/i
const REMOTE_REGEX = /\b(remote|work from home|wfh|anywhere|distributed)\b/i
const INTERN_REGEX = /\b(intern|internship|trainee|apprentice|fellow|co-?op)\b/i
const TOKEN_SPLIT_REGEX = /[^a-z0-9+#.]+/i
const TOKEN_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'at',
  'for',
  'from',
  'in',
  'intern',
  'internship',
  'of',
  'on',
  'role',
  'the',
  'with'
])

const createHttpError = (statusCode, message) => {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

const cleanText = (value) => String(value || '').trim()

const normalizeActorId = (value) => cleanText(value).replace(/\//g, '~')

const toLower = (value) => cleanText(value).toLowerCase()

const isLinkedInUrl = (value) => {
  try {
    const parsed = new URL(String(value || '').trim())
    const hostname = parsed.hostname.toLowerCase()
    return parsed.protocol === 'https:' && (hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com'))
  } catch {
    return false
  }
}

export const buildLinkedInSearchUrl = ({ title, company, location }) => {
  const params = new URLSearchParams()
  params.set('keywords', [cleanText(title), cleanText(company), 'internship'].filter(Boolean).join(' '))

  const normalizedLocation = cleanText(location)
  if (normalizedLocation && !REMOTE_REGEX.test(normalizedLocation)) {
    params.set('location', normalizedLocation)
  }

  return `https://www.linkedin.com/jobs/search/?${params.toString()}`
}

const createRedirectCacheKey = ({ title, company, location }) =>
  `linkedin-redirect:${cleanText(title).toLowerCase()}|${cleanText(company).toLowerCase()}|${cleanText(location).toLowerCase()}`

const tokenize = (value) =>
  cleanText(value)
    .toLowerCase()
    .split(TOKEN_SPLIT_REGEX)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !TOKEN_STOP_WORDS.has(token))

const countOverlap = (left, right) => {
  const leftTokens = tokenize(left)
  const rightSet = new Set(tokenize(right))

  return leftTokens.reduce((total, token) => total + (rightSet.has(token) ? 1 : 0), 0)
}

const buildApifyInput = ({ title, query, company, location, remote = false, pagesToFetch = 1 }) => {
  const normalizedTitle = cleanText(query || title)
  const normalizedCompany = cleanText(company)
  const normalizedLocation = cleanText(location)
  const includeKeyword = INTERN_REGEX.test(normalizedTitle)
    ? normalizedTitle
    : `${normalizedTitle} internship${remote ? ' remote' : ''}`

  return {
    countryName: INDIA_REGEX.test(normalizedLocation) ? 'india' : 'all',
    includeKeyword,
    locationName:
      normalizedLocation && !REMOTE_REGEX.test(normalizedLocation) && normalizedLocation !== 'Location not listed'
        ? normalizedLocation
        : undefined,
    companyName: normalizedCompany || undefined,
    jobType: 'INTERN',
    datePosted: 'month',
    pagesToFetch: Math.max(1, Math.min(3, Number(pagesToFetch) || 1))
  }
}

const extractLinkedInCandidateUrl = (item) => {
  const candidates = [
    item?.URL,
    item?.url,
    item?.jobUrl,
    item?.job_url,
    item?.jobPostingUrl,
    item?.job_posting_url,
    item?.applyUrl,
    item?.apply_url,
    item?.link
  ]
    .map((value) => cleanText(value))
    .filter(Boolean)

  return candidates.find((value) => isLinkedInUrl(value)) || ''
}

export const scoreLinkedInCandidate = (item, params) => {
  const title = cleanText(item?.job_title || item?.title)
  const company = cleanText(item?.company_name || item?.company)
  const location = cleanText(item?.location)
  const url = extractLinkedInCandidateUrl(item)

  if (!url) {
    return Number.NEGATIVE_INFINITY
  }

  let score = 0

  score += countOverlap(params.title, title) * 4
  score += countOverlap(params.company, company) * 5
  score += countOverlap(params.location, location) * 2

  if (title && cleanText(params.title).toLowerCase() === title.toLowerCase()) {
    score += 10
  }
  if (company && cleanText(params.company).toLowerCase() === company.toLowerCase()) {
    score += 8
  }
  if (location && cleanText(params.location).toLowerCase() === location.toLowerCase()) {
    score += 4
  }
  if (INTERN_REGEX.test(title)) {
    score += 3
  }
  if (/linkedin\.com\/jobs\/view\//i.test(url)) {
    score += 6
  }
  if (/linkedin/i.test(cleanText(item?.posted_via))) {
    score += 2
  }

  return score
}

const fetchApifyLinkedInCandidates = async (params, options = {}) => {
  if (!config.apifyApiToken) {
    return []
  }

  const actorId = normalizeActorId(config.apifyLinkedinActorId)
  if (!actorId) {
    throw createHttpError(503, 'Apify LinkedIn actor id is missing.')
  }

  const endpoint = new URL(`acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items`, `${config.apifyBaseUrl}/`)
  endpoint.searchParams.set('timeout', String(Math.max(10, Math.ceil(config.apifyTimeoutMs / 1000))))
  endpoint.searchParams.set('format', 'json')
  endpoint.searchParams.set('clean', '1')
  endpoint.searchParams.set('limit', String(Math.max(1, Math.min(60, Number(options.limit) || 12))))

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${config.apifyApiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(buildApifyInput(params)),
    signal: AbortSignal.timeout(config.apifyTimeoutMs)
  })

  const payload = await response.json().catch(() => [])
  if (!response.ok) {
    const detail =
      cleanText(payload?.error?.message) ||
      cleanText(payload?.message) ||
      `Apify returned ${response.status}`
    throw createHttpError(response.status, detail)
  }

  return Array.isArray(payload) ? payload : []
}

const extractLinkedInTitle = (item) => cleanText(item?.job_title || item?.title || item?.position)

const extractLinkedInCompany = (item) =>
  cleanText(item?.company_name || item?.company || item?.companyName || item?.organization)

const extractLinkedInLocation = (item) =>
  cleanText(item?.location || item?.job_location || item?.formattedLocation)

const extractLinkedInDescription = (item) =>
  cleanText(
    item?.description ||
      item?.job_description ||
      item?.snippet ||
      item?.job_summary ||
      item?.summary
  )

const extractPostedValue = (item) =>
  item?.posted_date ||
  item?.postedAt ||
  item?.posted_at ||
  item?.job_posted_at ||
  item?.job_posted_at_datetime_utc ||
  item?.listedAt ||
  item?.createdAt ||
  item?.date

const normalizePostedDate = (value) => {
  if (value == null || value === '') {
    return ''
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const ts = value > 10_000_000_000 ? value : value * 1000
    const parsed = new Date(ts)
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString()
  }

  const raw = cleanText(value)
  if (!raw) {
    return ''
  }

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString()
}

const computePostedHoursAgo = (value) => {
  const postedDate = normalizePostedDate(value)
  if (!postedDate) {
    return null
  }

  const diffHours = Math.max(0, Math.floor((Date.now() - Date.parse(postedDate)) / (1000 * 60 * 60)))
  return Number.isFinite(diffHours) ? diffHours : null
}

const isRemoteLinkedInItem = (item) => {
  const corpus = [
    extractLinkedInTitle(item),
    extractLinkedInLocation(item),
    cleanText(item?.workplace_type),
    cleanText(item?.employment_type),
    extractLinkedInDescription(item)
  ]
    .join(' ')
    .toLowerCase()

  return REMOTE_REGEX.test(corpus) || Boolean(item?.is_remote)
}

const matchesLinkedInLocation = (item, location) => {
  const normalizedLocation = cleanText(location).toLowerCase()
  if (!normalizedLocation) {
    return true
  }

  const locationText = extractLinkedInLocation(item).toLowerCase()
  if (INDIA_REGEX.test(normalizedLocation)) {
    return !locationText || INDIA_REGEX.test(locationText)
  }

  return !locationText || locationText.includes(normalizedLocation)
}

const matchesPostedWithinHours = (item, postedWithinHours) => {
  if (!Number.isFinite(postedWithinHours) || Number(postedWithinHours) <= 0) {
    return true
  }

  const ageHours = computePostedHoursAgo(extractPostedValue(item))
  return ageHours == null || ageHours <= Number(postedWithinHours)
}

const normalizeLinkedInJob = (item) => {
  const title = extractLinkedInTitle(item)
  const company = extractLinkedInCompany(item)
  const location = extractLinkedInLocation(item) || 'Location not listed'
  const postedDate = normalizePostedDate(extractPostedValue(item))
  const employmentType = cleanText(item?.employment_type || item?.jobType || item?.job_type)
  const applyLink = extractLinkedInCandidateUrl(item)

  return {
    id: cleanText(item?.id || item?.job_id || applyLink || `${company}-${title}`),
    title,
    company: company || 'Unknown company',
    location,
    description: extractLinkedInDescription(item),
    salary: '',
    posted_date: postedDate,
    posted_hours_ago: computePostedHoursAgo(postedDate),
    apply_link: applyLink,
    employment_type: employmentType || 'Internship',
    is_remote: isRemoteLinkedInItem(item),
    source: 'LinkedIn',
    company_logo: cleanText(item?.company_logo || item?.companyLogo),
    required_skills: [],
    required_experience: null,
    required_education: null
  }
}

const dedupeLinkedInJobs = (jobs) => {
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

const scoreLinkedInSearchResult = (job, params) => {
  const query = cleanText(params?.query || params?.title)
  const location = cleanText(params?.location)
  let score = 0

  score += countOverlap(query, job.title) * 6
  score += countOverlap(query, `${job.title} ${job.description}`) * 2
  score += countOverlap(location, job.location) * 2

  if (INTERN_REGEX.test(job.title)) {
    score += 6
  }
  if (job.apply_link && /linkedin\.com\/jobs\/view\//i.test(job.apply_link)) {
    score += 8
  }
  if (job.is_remote && params?.remote) {
    score += 4
  }

  const ageHours = Number(job?.posted_hours_ago)
  if (Number.isFinite(ageHours)) {
    if (ageHours <= 24) {
      score += 5
    } else if (ageHours <= 72) {
      score += 2
    }
  }

  return score
}

const selectBestLinkedInUrl = (items, params) => {
  const ranked = items
    .map((item) => ({
      item,
      url: extractLinkedInCandidateUrl(item),
      score: scoreLinkedInCandidate(item, params)
    }))
    .filter((entry) => entry.url && Number.isFinite(entry.score))
    .sort((left, right) => right.score - left.score)

  const best = ranked[0]
  return best && best.score >= 6 ? best : null
}

export const resolveLinkedInDestination = async (params) => {
  const fallbackUrl = params.fallbackUrl || buildLinkedInSearchUrl(params)
  const cacheKey = createRedirectCacheKey(params)
  const cached = cache.get(cacheKey)

  if (cached?.url && isLinkedInUrl(cached.url)) {
    return cached
  }

  if (!config.apifyApiToken) {
    return {
      url: fallbackUrl,
      source: 'linkedin-search-fallback',
      usedFallback: true,
      meta: {
        reason: 'missing_apify_token'
      }
    }
  }

  try {
    const items = await fetchApifyLinkedInCandidates(params)
    const best = selectBestLinkedInUrl(items, params)

    const result = best
      ? {
          url: best.url,
          source: 'apify-linkedin-match',
          usedFallback: false,
          meta: {
            matched_title: cleanText(best.item?.job_title || best.item?.title),
            matched_company: cleanText(best.item?.company_name || best.item?.company),
            matched_location: cleanText(best.item?.location),
            score: best.score
          }
        }
      : {
          url: fallbackUrl,
          source: 'linkedin-search-fallback',
          usedFallback: true,
          meta: {
            reason: 'no_direct_match'
          }
        }

    cache.set(cacheKey, result)
    return result
  } catch (error) {
    logger.warn(`Apify LinkedIn redirect lookup failed: ${error?.message || 'Unknown error'}`)
    return {
      url: fallbackUrl,
      source: 'linkedin-search-fallback',
      usedFallback: true,
      meta: {
        reason: 'apify_lookup_failed'
      }
    }
  }
}

export const searchLinkedInInternships = async (params) => {
  if (!config.apifyApiToken) {
    return {
      jobs: [],
      meta: {
        provider: 'linkedin',
        skipped: true,
        reason: 'missing_apify_token'
      }
    }
  }

  try {
    const items = await fetchApifyLinkedInCandidates(
      {
        query: params.query,
        location: params.location,
        remote: params.remote,
        pagesToFetch: params.numPages
      },
      {
        limit: Math.min(60, Math.max(Number(params.limit || 12) * 2, 12))
      }
    )

    const jobs = dedupeLinkedInJobs(
      items
        .map((item) => normalizeLinkedInJob(item))
        .filter((job) => job.title && job.company && job.apply_link)
        .filter((job) => INTERN_REGEX.test(`${job.title} ${job.employment_type} ${job.description}`))
        .filter((job) => (params.remote ? job.is_remote : true))
        .filter((job) => matchesLinkedInLocation(job, params.location))
        .filter((job) => matchesPostedWithinHours(job, params.postedWithinHours))
        .sort((left, right) => scoreLinkedInSearchResult(right, params) - scoreLinkedInSearchResult(left, params))
    ).slice(0, Number(params.limit) || 20)

    return {
      jobs,
      meta: {
        provider: 'linkedin',
        actor: config.apifyLinkedinActorId,
        fetched_at: new Date().toISOString(),
        total_available: jobs.length
      }
    }
  } catch (error) {
    logger.warn(`Apify LinkedIn internship search failed: ${error?.message || 'Unknown error'}`)
    return {
      jobs: [],
      meta: {
        provider: 'linkedin',
        error: cleanText(error?.message || 'Apify internship search failed.')
      }
    }
  }
}
