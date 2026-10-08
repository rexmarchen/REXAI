import crypto from 'crypto'
import { MAX_JOB_AGE_HOURS } from '../../config/constants.js'
import logger from '../../utils/logger.js'

/**
 * Normalizes string for canonical hashing
 */
function normalizeString(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

/**
 * Compute canonical deduplication hash for a job
 */
export function computeJobCanonicalHash({ title, company, location = '', url = '' }) {
  const normTitle = normalizeString(title)
  const normCompany = normalizeString(company)
  const normLocation = normalizeString(location)

  // Primary hash on company + title + location
  const content = `${normCompany}|${normTitle}|${normLocation}`
  return crypto.createHash('sha256').update(content).digest('hex')
}

/**
 * Evaluate job freshness strictly based on postedAt / updatedAt timestamp
 *
 * Rules:
 * 1. Must have valid ISO or parseable timestamp.
 * 2. Clock skew: if timestamp is >5 minutes in future, flag as invalid/suspicious.
 * 3. Freshness cutoff: ageHours <= MAX_JOB_AGE_HOURS (48.0 hours).
 * 4. Freshness score: 1.0 (0h old) down to 0.0 (48h old). Older jobs score 0.
 *
 * @param {Date|string|number} postedAt - Job timestamp
 * @param {Date} [referenceTime=new Date()] - Reference comparison time
 * @returns {{ isFresh: boolean, ageHours: number, freshnessScore: number, validTimestamp: boolean, reason?: string }}
 */
export function evaluateJobFreshness(postedAt, referenceTime = new Date()) {
  if (!postedAt) {
    return {
      isFresh: false,
      ageHours: Infinity,
      freshnessScore: 0,
      validTimestamp: false,
      reason: 'MISSING_TIMESTAMP'
    }
  }

  const jobDate = new Date(postedAt)
  const refDate = new Date(referenceTime)

  if (isNaN(jobDate.getTime()) || isNaN(refDate.getTime())) {
    return {
      isFresh: false,
      ageHours: Infinity,
      freshnessScore: 0,
      validTimestamp: false,
      reason: 'INVALID_DATE_FORMAT'
    }
  }

  const ageMs = refDate.getTime() - jobDate.getTime()
  // 5 minutes skew tolerance for distributed clock drift
  const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000

  if (ageMs < -MAX_CLOCK_SKEW_MS) {
    return {
      isFresh: false,
      ageHours: 0,
      freshnessScore: 0,
      validTimestamp: false,
      reason: 'FUTURE_TIMESTAMP_CLOCK_SKEW'
    }
  }

  // Treat slight future timestamps (within 5m) as 0 age
  const effectiveAgeMs = Math.max(0, ageMs)
  const ageHours = Number((effectiveAgeMs / (1000 * 60 * 60)).toFixed(2))

  if (ageHours > MAX_JOB_AGE_HOURS) {
    return {
      isFresh: false,
      ageHours,
      freshnessScore: 0,
      validTimestamp: true,
      reason: `EXCEEDED_MAX_AGE_${MAX_JOB_AGE_HOURS}H`
    }
  }

  // Linear decay score from 1.0 down to 0.0 at 48 hours
  const freshnessScore = Number(Math.max(0, 1 - (ageHours / MAX_JOB_AGE_HOURS)).toFixed(4))

  return {
    isFresh: true,
    ageHours,
    freshnessScore,
    validTimestamp: true
  }
}

/**
 * Pre-apply freshness validator (Mandatory check right before launching automation worker)
 *
 * @param {Date|string} postedAt
 * @param {Date} [referenceTime=new Date()]
 * @returns {{ isFresh: boolean, ageHours: number, reason?: string }}
 */
export function validatePreApplyFreshness(postedAt, referenceTime = new Date()) {
  const result = evaluateJobFreshness(postedAt, referenceTime)
  if (!result.isFresh) {
    logger.warn(`Pre-apply freshness check failed: age=${result.ageHours}h, reason=${result.reason}`)
  }
  return result
}
