import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isInternship,
  isWithin48Hours,
  generateContentHash,
  inferDomain,
  formatRelativeTime
} from '../src/services/internships/internshipNormalizer.js'

test('isInternship correctly identifies confirmed internships', () => {
  const confirmedTitles = [
    'Software Engineer, Intern',
    'Frontend Engineering Intern',
    'Data Science Co-op',
    'Machine Learning Apprentice',
    'Graduate Intern - Cloud Systems',
    'Product Design Student Intern',
    'Research Fellow - AI'
  ]

  for (const title of confirmedTitles) {
    const result = isInternship({ title })
    assert.equal(result.isInternship, true, `Expected "${title}" to be identified as an internship`)
    assert.equal(result.classification, 'confirmed')
  }
})

test('isInternship rejects internal/staff non-internship roles', () => {
  const rejectedTitles = [
    'Internal Audit Manager',
    'Internal Sales Representative',
    'Lead Architect',
    'Staff Software Engineer',
    'Vice President of Engineering',
    'Senior Product Manager - Internal Tools'
  ]

  for (const title of rejectedTitles) {
    const result = isInternship({ title })
    assert.equal(result.isInternship, false, `Expected "${title}" to be rejected`)
    assert.equal(result.classification, 'rejected')
  }
})

test('isWithin48Hours enforces strict 48-hour window', () => {
  const now = Date.now()

  // 1 hour ago -> true
  assert.equal(isWithin48Hours(new Date(now - 1 * 60 * 60 * 1000)), true)

  // 47 hours 59 minutes ago -> true
  assert.equal(isWithin48Hours(new Date(now - (47 * 60 + 59) * 60 * 1000)), true)

  // Exactly 48 hours ago -> true
  assert.equal(isWithin48Hours(new Date(now - 48 * 60 * 60 * 1000)), true)

  // 48 hours 1 minute ago -> false
  assert.equal(isWithin48Hours(new Date(now - (48 * 60 + 1) * 60 * 1000)), false)

  // 72 hours ago -> false
  assert.equal(isWithin48Hours(new Date(now - 72 * 60 * 60 * 1000)), false)

  // Future timestamp (1 hour in future) -> false
  assert.equal(isWithin48Hours(new Date(now + 60 * 60 * 1000)), false)

  // Missing / null / invalid date -> false
  assert.equal(isWithin48Hours(null), false)
  assert.equal(isWithin48Hours(undefined), false)
  assert.equal(isWithin48Hours('invalid-date-string'), false)
})

test('generateContentHash produces deterministic SHA-256 fingerprint', () => {
  const job1 = {
    companyName: 'Figma',
    title: 'Software Engineer Intern',
    location: 'San Francisco, CA',
    employmentType: 'Internship'
  }

  const job2 = {
    companyName: 'figma',
    title: 'software engineer intern',
    location: 'San Francisco, CA',
    employmentType: 'internship'
  }

  const job3 = {
    companyName: 'Duolingo',
    title: 'Software Engineer Intern',
    location: 'Pittsburgh, PA',
    employmentType: 'Internship'
  }

  const hash1 = generateContentHash(job1)
  const hash2 = generateContentHash(job2)
  const hash3 = generateContentHash(job3)

  assert.equal(typeof hash1, 'string')
  assert.equal(hash1.length, 64) // SHA-256 hex length
  assert.equal(hash1, hash2, 'Normalized job data should yield identical contentHash')
  assert.notEqual(hash1, hash3, 'Different jobs must have different contentHash')
})

test('inferDomain correctly assigns career tracks', () => {
  assert.equal(inferDomain('React Frontend Developer Intern'), 'frontend')
  assert.equal(inferDomain('Golang Backend Microservices Intern'), 'backend')
  assert.equal(inferDomain('Full Stack Engineering Intern'), 'fullstack')
  assert.equal(inferDomain('Data Analytics Intern'), 'data')
  assert.equal(inferDomain('LLM & Machine Learning Intern'), 'ai')
  assert.equal(inferDomain('Product Designer Intern'), 'design')
})

test('formatRelativeTime returns accurate humanized relative time', () => {
  const now = Date.now()
  assert.equal(formatRelativeTime(new Date(now - 5 * 60 * 1000)), '5 minutes ago')
  assert.equal(formatRelativeTime(new Date(now - 2 * 60 * 60 * 1000)), '2 hours ago')
  assert.equal(formatRelativeTime(new Date(now - 25 * 60 * 60 * 1000)), 'Yesterday')
  assert.equal(formatRelativeTime(new Date(now - 3 * 24 * 60 * 60 * 1000)), '3 days ago')
})
