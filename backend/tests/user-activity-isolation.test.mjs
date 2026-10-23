import assert from 'assert'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import ActivityLog from '../src/models/ActivityLog.js'
import {
  recordActivity,
  getUserActivities,
  getUserActivitySummary,
  exportUserActivitiesCsv
} from '../src/services/activityService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/rexion'

async function runTests() {
  console.log('[Test] Connecting to MongoDB:', MONGO_URI)
  await mongoose.connect(MONGO_URI)

  const testUserA = new mongoose.Types.ObjectId()
  const testUserB = new mongoose.Types.ObjectId()

  try {
    console.log('[Test 1] Recording real activities for User A...')
    const act1 = await recordActivity({
      userId: testUserA,
      type: 'ai_request',
      title: 'AI Consultation on Distributed Systems',
      description: 'Asked AI Assistant about Kafka vs RabbitMQ',
      status: 'completed',
      metadata: { topic: 'Kafka' }
    })
    assert(act1, 'act1 should be created')
    assert.strictEqual(act1.category, 'ai', 'Auto-inferred category should be ai')

    const act2 = await recordActivity({
      userId: testUserA,
      type: 'resume_analyzed',
      title: 'AI Resume Analysis Completed',
      description: 'Analyzed for Senior Backend Engineer',
      status: 'completed',
      metadata: { score: 92 }
    })
    assert(act2, 'act2 should be created')
    assert.strictEqual(act2.category, 'resume', 'Auto-inferred category should be resume')

    const act3 = await recordActivity({
      userId: testUserA,
      type: 'quiz_completed',
      title: 'Quiz Completed',
      description: 'Python Advanced Quiz with 90% score',
      status: 'completed',
      metadata: { score: 90 }
    })
    assert(act3, 'act3 should be created')
    assert.strictEqual(act3.category, 'learning', 'Auto-inferred category should be learning')

    console.log('[Test 2] Recording activities for User B (to test strict isolation)...')
    const actB = await recordActivity({
      userId: testUserB,
      type: 'application_submitted',
      title: 'Applied for DevOps Engineer',
      description: 'Application submitted to CloudCorp',
      status: 'completed',
      metadata: { company: 'CloudCorp' }
    })
    assert(actB, 'actB should be created')

    console.log('[Test 3] Verifying strict data isolation (User A cannot see User B data)...')
    const listA = await getUserActivities({ userId: testUserA })
    assert.strictEqual(listA.total, 3, 'User A should have exactly 3 activities')
    const idsA = listA.activities.map((a) => a.userId.toString())
    idsA.forEach((id) => {
      assert.strictEqual(id, testUserA.toString(), 'All activities must belong to User A')
      assert.notStrictEqual(id, testUserB.toString(), 'User B activities must never leak into User A')
    })

    const listB = await getUserActivities({ userId: testUserB })
    assert.strictEqual(listB.total, 1, 'User B should have exactly 1 activity')
    assert.strictEqual(listB.activities[0].userId.toString(), testUserB.toString())

    console.log('[Test 4] Verifying category filtering...')
    const aiOnly = await getUserActivities({ userId: testUserA, category: 'ai' })
    assert.strictEqual(aiOnly.total, 1, 'User A should have 1 AI activity')
    assert.strictEqual(aiOnly.activities[0].type, 'ai_request')

    console.log('[Test 5] Verifying search filtering...')
    const searchResult = await getUserActivities({ userId: testUserA, search: 'Kafka' })
    assert.strictEqual(searchResult.total, 1, 'Should find 1 activity with Kafka')

    console.log('[Test 6] Verifying summary and breakdown calculations...')
    const summaryA = await getUserActivitySummary({ userId: testUserA })
    assert.strictEqual(summaryA.totalActivities, 3, 'Total activities should be 3')
    assert.strictEqual(summaryA.kpis.aiRequests.value, 1, 'AI Requests should be 1')
    assert.strictEqual(summaryA.kpis.resumesAnalyzed.value, 1, 'Resumes analyzed should be 1')
    assert.strictEqual(summaryA.kpis.quizAttempts.value, 1, 'Quiz attempts should be 1')
    assert.strictEqual(summaryA.kpis.applications.value, 0, 'Applications should be 0 for User A')

    // Donut breakdown verification
    const breakdownTotal = summaryA.breakdown.reduce((sum, b) => sum + b.count, 0)
    assert.strictEqual(breakdownTotal, 3, 'Breakdown counts must reconcile to total activities')

    console.log('[Test 7] Verifying Idempotency and deduplication...')
    const idempotentKey = 'test_key_12345'
    const firstCall = await recordActivity({
      userId: testUserA,
      type: 'job_match',
      title: 'New Job Match Found',
      idempotencyKey: idempotentKey
    })
    const secondCall = await recordActivity({
      userId: testUserA,
      type: 'job_match',
      title: 'New Job Match Found',
      idempotencyKey: idempotentKey
    })
    assert.strictEqual(
      firstCall._id.toString(),
      secondCall._id.toString(),
      'Duplicate calls with same idempotencyKey must return existing record'
    )

    console.log('[Test 8] Verifying CSV Export generation...')
    const csv = await exportUserActivitiesCsv({ userId: testUserA })
    assert(csv.includes('Activity ID,Timestamp (UTC),Category,Type,Title,Description,Status,Metadata'), 'CSV must contain headers')
    assert(csv.includes('AI Consultation on Distributed Systems'), 'CSV must contain User A activity')
    assert(!csv.includes('Applied for DevOps Engineer'), 'CSV must NOT contain User B activity')

    console.log('✅ ALL PRODUCTION ACTIVITY TRACKER TESTS PASSED CLEANLY!')
  } finally {
    // Cleanup test records
    await ActivityLog.deleteMany({ userId: { $in: [testUserA, testUserB] } })
    await mongoose.disconnect()
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
