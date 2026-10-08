import crypto from 'node:crypto'

const INTERNSHIP_CONFIRMED_REGEX = /\b(intern|internship|co-?op|apprentice|apprenticeship|fellow|fellowship|trainee|student intern|graduate intern)\b/i
const REJECTED_ROLE_REGEX = /\b(internal audit|internal sales|internal product lead|internal tools lead|internal controls|director|vice president|vp\b|principal|staff software engineer|lead architect)\b/i
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000

/**
 * Deterministically classifies whether a job is a genuine student internship.
 * @param {Object} job 
 * @returns {{ isInternship: boolean, classification: 'confirmed' | 'probable' | 'rejected' }}
 */
export function isInternship(job) {
  if (!job) return { isInternship: false, classification: 'rejected' }

  const title = String(job.title || '').trim()
  const employmentType = String(job.employmentType || job.contract_type || '').trim()

  // 1. Explicit exclusions
  if (REJECTED_ROLE_REGEX.test(title)) {
    return { isInternship: false, classification: 'rejected' }
  }

  // 2. Confirmed by title
  if (INTERNSHIP_CONFIRMED_REGEX.test(title)) {
    return { isInternship: true, classification: 'confirmed' }
  }

  // 3. Confirmed by structured employment type
  if (INTERNSHIP_CONFIRMED_REGEX.test(employmentType)) {
    return { isInternship: true, classification: 'probable' }
  }

  return { isInternship: false, classification: 'rejected' }
}

/**
 * Server-side strict 48-hour freshness verification.
 * Canonical condition: postedAt >= now - 48 hours
 * @param {Date | string | number} postedAt
 * @returns {boolean}
 */
export function isWithin48Hours(postedAt) {
  if (!postedAt) return false

  const date = new Date(postedAt)
  const timestamp = date.getTime()
  if (isNaN(timestamp)) return false

  const now = Date.now()
  // Reject future timestamps past a 5-minute clock drift tolerance
  if (timestamp > now + 5 * 60 * 1000) return false

  return timestamp >= now - FORTY_EIGHT_HOURS_MS
}

/**
 * Generates deterministic SHA-256 content fingerprint for deduplication across sources.
 * @param {Object} job
 * @returns {string}
 */
export function generateContentHash(job) {
  const normCompany = String(job.companyName || job.company || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const normTitle = String(job.title || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const normLocation = String(job.location || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const normType = String(job.employmentType || '').toLowerCase().replace(/[^a-z0-9]/g, '')

  const raw = `${normCompany}|${normTitle}|${normLocation}|${normType}`
  return crypto.createHash('sha256').update(raw).digest('hex')
}

/**
 * Infers career domain track.
 */
export function inferDomain(title, description = '') {
  const corpus = `${title} ${description}`.toLowerCase()
  if (/frontend|react|next\.?js|vue|angular|ui developer|web developer\b/i.test(corpus)) return 'frontend'
  if (/backend|node\.?js|express|golang|go\b|django|fastapi|spring|java\b|distributed|microservice/i.test(corpus)) return 'backend'
  if (/fullstack|full-stack|full stack|mern|mean/i.test(corpus)) return 'fullstack'
  if (/\b(data|analytics|analyst|data science|bi analyst|tableau|pandas|sql)\b/i.test(corpus)) return 'data'
  if (/machine learning|ml\b|ai\b|artificial intelligence|nlp|deep learning|computer vision|llm/i.test(corpus)) return 'ai'
  if (/product design|ui\/ux|ux design|ui design|figma|user research|designer/i.test(corpus)) return 'design'
  if (/devops|cloud|aws|kubernetes|docker|terraform|sre|infrastructure|security/i.test(corpus)) return 'engineering'
  return 'engineering'
}

/**
 * Human-readable relative time formatter without AI clichés.
 */
export function formatRelativeTime(postedAt) {
  if (!postedAt) return 'Recently posted'
  const date = new Date(postedAt)
  const timestamp = date.getTime()
  if (isNaN(timestamp)) return 'Recently posted'

  const diffMs = Math.max(0, Date.now() - timestamp)
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 60) {
    return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`
  }
  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
  }
  if (diffDays === 1) {
    return 'Yesterday'
  }
  return `${diffDays} days ago`
}

const VERIFIED_COMPANY_LINKEDIN = {
  amazon: 'https://www.linkedin.com/company/amazon/jobs/',
  google: 'https://www.linkedin.com/company/google/jobs/',
  microsoft: 'https://www.linkedin.com/company/microsoft/jobs/',
  zepto: 'https://www.linkedin.com/company/zeptonow/jobs/',
  palantir: 'https://www.linkedin.com/company/palantir-technologies/jobs/',
  'palantir technologies': 'https://www.linkedin.com/company/palantir-technologies/jobs/',
  datadog: 'https://www.linkedin.com/company/datadog/jobs/',
  postman: 'https://www.linkedin.com/company/postman-platform/jobs/',
  razorpay: 'https://www.linkedin.com/company/razorpay/jobs/',
  figma: 'https://www.linkedin.com/company/figma/jobs/',
  cred: 'https://www.linkedin.com/company/cred-club/jobs/',
  groww: 'https://www.linkedin.com/company/groww.in/jobs/',
  swiggy: 'https://www.linkedin.com/company/swiggy-in/jobs/',
  zomato: 'https://www.linkedin.com/company/zomato/jobs/',
  phonepe: 'https://www.linkedin.com/company/phonepe-internet/jobs/',
  duolingo: 'https://www.linkedin.com/company/duolingo/jobs/',
  discord: 'https://www.linkedin.com/company/discord/jobs/',
  scaleai: 'https://www.linkedin.com/company/scaleai/jobs/',
  'scale ai': 'https://www.linkedin.com/company/scaleai/jobs/',
  canonical: 'https://www.linkedin.com/company/canonical/jobs/',
  uber: 'https://www.linkedin.com/company/uber-com/jobs/',
  meta: 'https://www.linkedin.com/company/meta/jobs/',
  stripe: 'https://www.linkedin.com/company/stripe/jobs/'
}

/**
 * Constructs a robust LinkedIn Job URL that opens either the company's verified LinkedIn Jobs page
 * or a clean scoped search.
 * @param {string} company
 * @param {string} title
 * @returns {string}
 */
export function buildCleanLinkedInSearchUrl(company, title) {
  const normComp = String(company || '').trim().toLowerCase()
  if (VERIFIED_COMPANY_LINKEDIN[normComp]) {
    return VERIFIED_COMPANY_LINKEDIN[normComp]
  }

  const cleanComp = String(company || '').replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
  let cleanTitle = String(title || '')
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/[-–—|/\\].*$/, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const words = cleanTitle.split(' ').filter(Boolean).slice(0, 3).join(' ')
  const query = `${cleanComp} ${words || 'Intern'}`.trim()
  return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}`
}

export default {
  isInternship,
  isWithin48Hours,
  generateContentHash,
  inferDomain,
  formatRelativeTime,
  buildCleanLinkedInSearchUrl
}

