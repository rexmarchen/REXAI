import assert from 'assert'
import {
  evaluateJobFreshness,
  validatePreApplyFreshness,
  computeJobCanonicalHash
} from '../src/services/jobs/jobFreshnessEngine.js'
import { MAX_JOB_AGE_HOURS } from '../src/config/constants.js'

console.log('--- RUNNING STRICT 48-HOUR FRESHNESS ENGINE TEST SUITE ---')

const NOW = new Date('2026-09-19T12:00:00.000Z')

// Test 1: Immediate posting (0h old)
{
  const result = evaluateJobFreshness(NOW.toISOString(), NOW)
  assert.strictEqual(result.isFresh, true, '0h job must be fresh')
  assert.strictEqual(result.ageHours, 0)
  assert.strictEqual(result.freshnessScore, 1)
  console.log('✓ Test 1 Passed: 0h job is fresh with 1.0 score')
}

// Test 2: 1 hour ago
{
  const oneHourAgo = new Date(NOW.getTime() - 1 * 60 * 60 * 1000)
  const result = evaluateJobFreshness(oneHourAgo.toISOString(), NOW)
  assert.strictEqual(result.isFresh, true, '1h job must be fresh')
  assert.strictEqual(result.ageHours, 1)
  assert(result.freshnessScore > 0.95, '1h job should have high freshness score')
  console.log('✓ Test 2 Passed: 1h job is fresh')
}

// Test 3: 24 hours ago
{
  const dayAgo = new Date(NOW.getTime() - 24 * 60 * 60 * 1000)
  const result = evaluateJobFreshness(dayAgo.toISOString(), NOW)
  assert.strictEqual(result.isFresh, true, '24h job must be fresh')
  assert.strictEqual(result.ageHours, 24)
  assert.strictEqual(result.freshnessScore, 0.5, '24h job score must be exactly 0.5')
  console.log('✓ Test 3 Passed: 24h job is fresh with 0.5 score')
}

// Test 4: 47 hours 59 minutes ago (boundary within 48h)
{
  const almost48h = new Date(NOW.getTime() - (47 * 60 + 59) * 60 * 1000)
  const result = evaluateJobFreshness(almost48h.toISOString(), NOW)
  assert.strictEqual(result.isFresh, true, '47h59m job must be fresh')
  assert(result.ageHours < 48)
  assert(result.freshnessScore > 0)
  console.log('✓ Test 4 Passed: 47h59m boundary job is fresh')
}

// Test 5: Exact 48.0 hours boundary
{
  const exact48h = new Date(NOW.getTime() - 48 * 60 * 60 * 1000)
  const result = evaluateJobFreshness(exact48h.toISOString(), NOW)
  assert.strictEqual(result.isFresh, true, 'Exact 48h job is fresh at boundary')
  assert.strictEqual(result.ageHours, 48)
  assert.strictEqual(result.freshnessScore, 0)
  console.log('✓ Test 5 Passed: Exact 48h boundary is accepted with 0.0 decay score')
}

// Test 6: 48 hours 1 minute ago (boundary expired)
{
  const over48h = new Date(NOW.getTime() - (48 * 60 + 1) * 60 * 1000)
  const result = evaluateJobFreshness(over48h.toISOString(), NOW)
  assert.strictEqual(result.isFresh, false, '48h01m job must be expired')
  assert(result.ageHours > 48)
  assert.strictEqual(result.freshnessScore, 0)
  assert.strictEqual(result.reason, `EXCEEDED_MAX_AGE_${MAX_JOB_AGE_HOURS}H`)
  console.log('✓ Test 6 Passed: 48h01m boundary job is strictly rejected')
}

// Test 7: 72 hours ago
{
  const threeDaysAgo = new Date(NOW.getTime() - 72 * 60 * 60 * 1000)
  const result = evaluateJobFreshness(threeDaysAgo.toISOString(), NOW)
  assert.strictEqual(result.isFresh, false, '72h job must be expired')
  assert.strictEqual(result.ageHours, 72)
  console.log('✓ Test 7 Passed: 72h job is rejected')
}

// Test 8: Missing or empty timestamp
{
  const result = evaluateJobFreshness(null, NOW)
  assert.strictEqual(result.isFresh, false, 'Missing timestamp must be rejected')
  assert.strictEqual(result.reason, 'MISSING_TIMESTAMP')
  console.log('✓ Test 8 Passed: Missing timestamp safely rejected')
}

// Test 9: Invalid date string
{
  const result = evaluateJobFreshness('not-a-valid-date-str', NOW)
  assert.strictEqual(result.isFresh, false, 'Invalid date must be rejected')
  assert.strictEqual(result.reason, 'INVALID_DATE_FORMAT')
  console.log('✓ Test 9 Passed: Invalid date string rejected')
}

// Test 10: Future timestamp beyond 5 min clock skew
{
  const futureDate = new Date(NOW.getTime() + 10 * 60 * 1000) // 10 minutes in future
  const result = evaluateJobFreshness(futureDate.toISOString(), NOW)
  assert.strictEqual(result.isFresh, false, 'Distant future timestamp must be rejected')
  assert.strictEqual(result.reason, 'FUTURE_TIMESTAMP_CLOCK_SKEW')
  console.log('✓ Test 10 Passed: Clock skew anomaly rejected')
}

// Test 11: Pre-apply freshness validation
{
  const freshPreApply = validatePreApplyFreshness(new Date(NOW.getTime() - 10 * 60 * 60 * 1000), NOW)
  assert.strictEqual(freshPreApply.isFresh, true, 'Pre-apply validation should succeed for fresh job')

  const stalePreApply = validatePreApplyFreshness(new Date(NOW.getTime() - 50 * 60 * 60 * 1000), NOW)
  assert.strictEqual(stalePreApply.isFresh, false, 'Pre-apply validation must fail for 50h job')
  console.log('✓ Test 11 Passed: Pre-apply freshness validator behaves correctly')
}

// Test 12: Canonical Deduplication Hash
{
  const hash1 = computeJobCanonicalHash({ title: 'Senior AI Engineer', company: 'Google', location: 'San Francisco, CA' })
  const hash2 = computeJobCanonicalHash({ title: 'senior ai engineer', company: 'google', location: 'san francisco, ca' })
  const hash3 = computeJobCanonicalHash({ title: 'Senior AI Engineer', company: 'Meta', location: 'San Francisco, CA' })

  assert.strictEqual(hash1, hash2, 'Canonical hash must be case & punctuation insensitive')
  assert.notStrictEqual(hash1, hash3, 'Different companies must produce distinct hashes')
  console.log('✓ Test 12 Passed: Canonical deduplication hashing is robust')
}

console.log('ALL 12 FRESHNESS ENGINE TESTS PASSED PERFECTLY!')
