/**
 * atsJobSourceService.js
 * ─────────────────────
 * Fetches jobs directly from Greenhouse & Lever public Job Board APIs
 * for a configurable list of target companies.
 *
 * All responses are normalised into the same schema used by Adzuna results
 * so they can be merged and scored against the resume profile.
 */
import logger from '../utils/logger.js'

// ── Target company tokens ──────────────────────────────────────────────────
// Greenhouse token = the slug used in boards-api.greenhouse.io/v1/boards/{token}/jobs
// Lever token     = the slug used in api.lever.co/v0/postings/{token}
// Replace these placeholders with the companies you actually want to target.

const GREENHOUSE_COMPANIES = [
  'airbnb',
  'fingerprint',
  'figma',
  'anthropic',
  'scaleai',
  'cloudflare',
  'datadog',
  'canonical',
  'elastic',
  'instacart',
  'reddit',
  'roblox',
  'discord',
  'twitch',
  'coursera',
  'duolingo',
  'pagerduty',
  'seatgeek',
  'affirm',
  'flexport',
  'brex',
  'carta',
  'checkr',
  'coinbase'
]

const LEVER_COMPANIES = [
  'palantir'
]

// ── Fetch helpers ──────────────────────────────────────────────────────────

/**
 * Fetch all open jobs for one Greenhouse company token.
 * Returns normalised job objects or [] on error.
 */
async function fetchGreenhouseJobs(companyToken) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${companyToken}/jobs?content=true`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) })
    if (!res.ok) {
      logger.warn(`[ATS] Greenhouse ${companyToken}: HTTP ${res.status}`)
      return []
    }
    const data = await res.json()
    const jobs = Array.isArray(data?.jobs) ? data.jobs : []
    logger.info(`[ATS] Greenhouse ${companyToken}: ${jobs.length} jobs fetched`)
    return jobs.map(j => normaliseGreenhouse(j, companyToken))
  } catch (err) {
    logger.warn(`[ATS] Greenhouse ${companyToken} fetch failed: ${err.message}`)
    return []
  }
}

/**
 * Fetch all open jobs for one Lever company token.
 * Returns normalised job objects or [] on error.
 */
async function fetchLeverJobs(companyToken) {
  const url = `https://api.lever.co/v0/postings/${companyToken}?mode=json`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) })
    if (!res.ok) {
      logger.warn(`[ATS] Lever ${companyToken}: HTTP ${res.status}`)
      return []
    }
    const data = await res.json()
    const postings = Array.isArray(data) ? data : []
    logger.info(`[ATS] Lever ${companyToken}: ${postings.length} jobs fetched`)
    return postings.map(j => normaliseLever(j, companyToken))
  } catch (err) {
    logger.warn(`[ATS] Lever ${companyToken} fetch failed: ${err.message}`)
    return []
  }
}

// ── Normalisers ────────────────────────────────────────────────────────────

function normaliseGreenhouse(job, companyToken) {
  const url = job.absolute_url || `https://boards.greenhouse.io/${companyToken}/jobs/${job.id}`
  return {
    id:          `greenhouse-${companyToken}-${job.id}`,
    title:       job.title || 'Untitled Role',
    job_title:   job.title || 'Untitled Role',
    company:     capitalise(companyToken),
    location:    job.location?.name || 'Remote',
    description: stripHtml(job.content || '').slice(0, 800),
    posting_url: url,
    url,
    score:       0,     // filled in by calculateMatch after merge
    matchScores: { totalScore: 0 },
    tier:        1,     // always Tier-1: known ATS direct link
    source:      'greenhouse',
  }
}

function normaliseLever(job, companyToken) {
  const url = job.hostedUrl || `https://jobs.lever.co/${companyToken}/${job.id}`
  const location = job.categories?.location || job.categories?.allLocations?.[0] || 'Remote'
  const desc = typeof job.description === 'string'
    ? stripHtml(job.description).slice(0, 800)
    : typeof job.descriptionPlain === 'string'
      ? job.descriptionPlain.slice(0, 800)
      : ''
  return {
    id:          `lever-${companyToken}-${job.id}`,
    title:       job.text || 'Untitled Role',
    job_title:   job.text || 'Untitled Role',
    company:     capitalise(companyToken),
    location,
    description: desc,
    posting_url: url,
    url,
    score:       0,
    matchScores: { totalScore: 0 },
    tier:        1,
    source:      'lever',
  }
}

// ── Utilities ──────────────────────────────────────────────────────────────

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function capitalise(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Fetch all ATS jobs in parallel from configured company lists.
 * Returns a flat array of normalised job objects.
 */
export async function fetchAtsJobs() {
  logger.info(`[ATS] Fetching direct ATS jobs for ${GREENHOUSE_COMPANIES.length} GH + ${LEVER_COMPANIES.length} Lever companies…`)

  const [ghResults, lvResults] = await Promise.all([
    Promise.all(GREENHOUSE_COMPANIES.map(fetchGreenhouseJobs)),
    Promise.all(LEVER_COMPANIES.map(fetchLeverJobs)),
  ])

  const all = [
    ...ghResults.flat(),
    ...lvResults.flat(),
  ]

  logger.info(`[ATS] Total ATS jobs fetched: ${all.length}`)
  return all
}
