import assert from 'node:assert/strict'
import { mockLeaderboard, mockMicroGigs } from '@/lib/mock-data'
import { calculateMatchScore, rankMicroGigs, buildLeaderboardRows } from '@/lib/micro-gigs/matching'
import { mergeContacts, maskEmail, selectTopContacts } from '@/lib/outreach/contacts'
import { buildSuggestedSubject, countWords, substituteEmailVariables } from '@/lib/outreach/email'
import { validateDailySendLimit } from '@/lib/outreach/limits'
import { normalizePlan, normalizeRole, hasRequiredPlan } from '@/lib/plan'
import { checkRateLimit } from '@/lib/rate-limit'

function run(name, fn) {
  try {
    fn()
    console.log(`PASS ${name}`)
  } catch (error) {
    console.error(`FAIL ${name}`)
    throw error
  }
}

run('mergeContacts keeps the strongest confidence record', () => {
  const contacts = mergeContacts([
    [
      {
        id: '1',
        name: 'Aarav',
        role: 'Recruiter',
        email: 'aarav@example.com',
        confidence: 'likely',
      },
    ],
    [
      {
        id: '2',
        name: 'Aarav Singh',
        role: 'Talent Acquisition Lead',
        email: 'aarav@example.com',
        confidence: 'verified',
      },
    ],
  ])

  assert.equal(contacts.length, 1)
  assert.equal(contacts[0].confidence, 'verified')
  assert.equal(contacts[0].role, 'Talent Acquisition Lead')
})

run('selectTopContacts prioritizes outreach roles', () => {
  const contacts = selectTopContacts([
    { id: '1', name: 'Founder', role: 'Founder', email: 'founder@company.com', confidence: 'verified' },
    { id: '2', name: 'HR', role: 'Talent Acquisition Lead', email: 'hr@company.com', confidence: 'verified' },
    { id: '3', name: 'Recruiter', role: 'Recruiter', email: 'recruiter@company.com', confidence: 'likely' },
    { id: '4', name: 'Manager', role: 'Hiring Manager', email: 'manager@company.com', confidence: 'verified' },
  ])

  assert.deepEqual(
    contacts.map((contact) => contact.email),
    ['hr@company.com', 'recruiter@company.com', 'manager@company.com']
  )
})

run('email helpers substitute variables and count words', () => {
  const output = substituteEmailVariables('Hi {Name} at {Company} for {Role}', 'REXION', {
    id: '1',
    name: 'Nikita',
    role: 'Recruiter',
    email: 'nikita@rexion.ai',
    confidence: 'verified',
  })

  assert.match(output, /Nikita/)
  assert.match(output, /REXION/)
  assert.equal(maskEmail('nikita@rexion.ai'), 'n***@rexion.ai')
  assert.equal(countWords('one two three'), 3)
  assert.equal(buildSuggestedSubject('REXION', 'Recruiter'), 'Quick question about recruiter at REXION')
})

run('daily send limits match subscription plans', () => {
  assert.equal(validateDailySendLimit('free', 0, 1).allowed, false)
  assert.equal(validateDailySendLimit('pro', 10, 5).allowed, true)
  assert.equal(validateDailySendLimit('elite', 199, 2).allowed, false)
})

run('micro-gig scoring rewards the right profile fit', () => {
  const score = calculateMatchScore({
    skills: ['React', 'Next.js', 'Framer Motion'],
    preferredDomain: 'Frontend',
    location: 'Remote',
    gig: mockMicroGigs[0],
  })

  assert.ok(score > 70)
})

run('micro-gig ranking sorts best-fit gigs first', () => {
  const ranked = rankMicroGigs(mockMicroGigs, {
    skills: ['Python', 'Analytics', 'Experimentation'],
    preferredDomain: 'Data',
    location: 'Remote',
  })

  assert.equal(ranked[0].gig.domain, 'Data')
  assert.ok(ranked[0].score >= ranked[1].score)
})

run('leaderboard rows remain ordered by rank', () => {
  const rows = buildLeaderboardRows([...mockLeaderboard].reverse())
  assert.deepEqual(
    rows.map((row) => row.rank),
    [1, 2, 3]
  )
})

run('plan helpers normalize safely and compare plan gates', () => {
  assert.equal(normalizePlan('anything'), 'free')
  assert.equal(normalizeRole('anything'), 'candidate')
  assert.equal(hasRequiredPlan('elite', 'pro'), true)
  assert.equal(hasRequiredPlan('free', 'pro'), false)
})

run('rate limiter blocks requests after the configured threshold', () => {
  const key = `test:${Date.now()}`
  assert.equal(checkRateLimit(key, 2, 60_000).allowed, true)
  assert.equal(checkRateLimit(key, 2, 60_000).allowed, true)
  assert.equal(checkRateLimit(key, 2, 60_000).allowed, false)
})

console.log('All tests passed.')
