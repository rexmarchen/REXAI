import assert from 'node:assert/strict'
import test from 'node:test'

import { validateInternshipSearch, validateLinkedInRedirect } from '../src/middleware/validate.js'
import { buildLinkedInSearchUrl, scoreLinkedInCandidate } from '../src/services/apifyService.js'
import {
  isInternshipAd,
  isRemoteAd,
  normalizeAdzunaJob,
  normalizeAdzunaUpstreamError
} from '../src/services/adzunaService.js'
import { buildInternshipCacheKey } from '../src/utils/cacheKeys.js'

test('validateInternshipSearch normalizes search params', () => {
  const params = new URLSearchParams({
    query: 'software engineer intern',
    location: 'India',
    remote: 'true',
    page: '2',
    num_pages: '3',
    limit: '25',
    posted_within_hours: '120',
    adzuna_only: 'true',
    refresh: 'true'
  })

  const result = validateInternshipSearch(params)

  assert.equal(result.query, 'software engineer intern')
  assert.equal(result.location, 'India')
  assert.equal(result.remote, true)
  assert.equal(result.page, 2)
  assert.equal(result.numPages, 3)
  assert.equal(result.limit, 25)
  assert.equal(result.postedWithinHours, 120)
  assert.equal(result.adzunaOnly, true)
  assert.equal(result.refresh, true)
})

test('validateInternshipSearch defaults to the latest 24 hours', () => {
  const params = new URLSearchParams({
    query: 'software engineer intern'
  })

  const result = validateInternshipSearch(params)

  assert.equal(result.postedWithinHours, 24)
  assert.equal(result.page, 1)
  assert.equal(result.numPages, 1)
})

test('validateLinkedInRedirect accepts safe LinkedIn fallback URLs', () => {
  const params = new URLSearchParams({
    title: 'Intern AMTS',
    company: 'Salesforce',
    location: 'Hyderabad, Telangana',
    fallback_url:
      'https://www.linkedin.com/jobs/search/?keywords=Intern%20AMTS%20Salesforce%20internship'
  })

  const result = validateLinkedInRedirect(params)

  assert.equal(result.title, 'Intern AMTS')
  assert.equal(result.company, 'Salesforce')
  assert.equal(result.location, 'Hyderabad, Telangana')
  assert.match(result.fallbackUrl, /^https:\/\/www\.linkedin\.com\/jobs\/search\/\?/)
})

test('buildInternshipCacheKey stays stable for equivalent params', () => {
  const firstKey = buildInternshipCacheKey({
    query: 'data intern',
    location: 'India',
    remote: false,
    page: 1,
    numPages: 2,
    limit: 30,
    postedWithinHours: 336,
    adzunaOnly: true,
    refresh: false
  })

  const secondKey = buildInternshipCacheKey({
    postedWithinHours: 336,
    limit: 30,
    numPages: 2,
    page: 1,
    remote: false,
    location: 'India',
    query: 'data intern',
    adzunaOnly: true,
    refresh: false
  })

  assert.equal(firstKey, secondKey)
})

test('isRemoteAd detects remote wording in Adzuna listings', () => {
  const result = isRemoteAd({
    title: 'Machine Learning Intern',
    description: 'Work from home internship opportunity',
    location: { display_name: 'Anywhere' }
  })

  assert.equal(result, true)
})

test('isInternshipAd detects internship titles', () => {
  const result = isInternshipAd({
    title: 'Software Engineering Intern',
    description: 'Join our platform team'
  })

  assert.equal(result, true)
})

test('normalizeAdzunaJob maps Adzuna fields into frontend job shape', () => {
  const job = normalizeAdzunaJob(
    {
      id: '123',
      title: 'Data Analyst Intern',
      description: 'Remote internship role',
      created: '2026-03-20T12:00:00Z',
      redirect_url: 'https://example.com/apply',
      salary_min: 10000,
      salary_max: 15000,
      contract_time: 'full_time',
      contract_type: 'contract',
      location: {
        display_name: 'Bengaluru, Karnataka'
      },
      company: {
        display_name: 'Example Labs'
      }
    },
    'in'
  )

  assert.equal(job.company, 'Example Labs')
  assert.equal(job.apply_link, 'https://example.com/apply')
  assert.equal(job.location, 'Bengaluru, Karnataka')
  assert.equal(job.source, 'Adzuna')
})

test('normalizeAdzunaUpstreamError maps network failures to a clear 502', () => {
  const error = normalizeAdzunaUpstreamError(new TypeError('fetch failed'))

  assert.equal(error.statusCode, 502)
  assert.match(error.message, /Unable to reach Adzuna right now/i)
})

test('normalizeAdzunaUpstreamError maps timeout failures to a clear 504', () => {
  const timeoutError = new Error('The operation was aborted due to timeout')
  timeoutError.name = 'TimeoutError'

  const error = normalizeAdzunaUpstreamError(timeoutError)

  assert.equal(error.statusCode, 504)
  assert.match(error.message, /timed out/i)
})

test('buildLinkedInSearchUrl preserves location for non-remote searches', () => {
  const url = buildLinkedInSearchUrl({
    title: 'Intern AMTS',
    company: 'Salesforce',
    location: 'Hyderabad, Telangana'
  })

  assert.equal(
    url,
    'https://www.linkedin.com/jobs/search/?keywords=Intern+AMTS+Salesforce+internship&location=Hyderabad%2C+Telangana'
  )
})

test('scoreLinkedInCandidate prefers exact title and company matches', () => {
  const exactScore = scoreLinkedInCandidate(
    {
      job_title: 'Intern AMTS',
      company_name: 'Salesforce',
      location: 'Hyderabad, Telangana',
      posted_via: 'LinkedIn',
      URL: 'https://www.linkedin.com/jobs/view/123456789'
    },
    {
      title: 'Intern AMTS',
      company: 'Salesforce',
      location: 'Hyderabad, Telangana'
    }
  )

  const looseScore = scoreLinkedInCandidate(
    {
      job_title: 'Remote Travel consultant',
      company_name: 'Example Co',
      location: 'Hyderabad, Telangana',
      posted_via: 'LinkedIn',
      URL: 'https://www.linkedin.com/jobs/view/987654321'
    },
    {
      title: 'Intern AMTS',
      company: 'Salesforce',
      location: 'Hyderabad, Telangana'
    }
  )

  assert.ok(exactScore > looseScore)
})
