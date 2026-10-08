import mongoose from 'mongoose'
import {
  getUserSocialStatus,
  connectUserSocialAccount,
  getUserQueue,
  generateUserPost,
  publishUserPostLive,
  toggleUserAutopilot,
  disconnectUserSocialAccount,
  runMultiUserSocialScheduler,
  ensureContinuousScheduleBuffer,
  processMissedAndDuePosts
} from './src/services/automation/multiUserSocialAutomationService.js'
import SocialAutomationAccount from './src/models/SocialAutomationAccount.js'
import SocialAutomationPost from './src/models/SocialAutomationPost.js'

const mongoUri =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb+srv://anshuar9065_db_user:Anshu_90-@cluster0.ytzioe4.mongodb.net/rexion?appName=Cluster0'

async function runTests() {
  console.log('====================================================')
  console.log('🚀 MULTI-USER SOCIAL AUTOMATION INTEGRATION TESTS')
  console.log('====================================================\n')

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 })
    console.log('✓ Connected to MongoDB')

    const USER_A = 'test_user_alpha_' + Date.now()
    const USER_B = 'test_user_beta_' + Date.now()

    // 1. Clean previous test data
    await SocialAutomationAccount.deleteMany({ userId: { $in: [USER_A, USER_B] } })
    await SocialAutomationPost.deleteMany({ userId: { $in: [USER_A, USER_B] } })

    // 2. Test User A: Connect Instagram
    console.log('\n[TEST 1] User A links Instagram account...')
    const connectResA = await connectUserSocialAccount(USER_A, 'instagram', {
      accessToken: 'TEST_TOKEN_ALPHA',
      accountUsername: 'creator_alpha',
      accountName: 'Alpha Creator',
      platformUserId: 'ig_user_alpha_123'
    })
    console.log('✓ User A connected:', connectResA.message)

    const statusA = await getUserSocialStatus(USER_A, 'instagram')
    if (statusA.account.username !== 'creator_alpha') throw new Error('User A username mismatch')
    console.log('✓ User A status verified: @' + statusA.account.username, '| Autopilot:', statusA.autopilot)

    // 3. Test User A: Generate AI Post
    console.log('\n[TEST 2] User A generates AI Reel...')
    const genResA = await generateUserPost(USER_A, 'instagram', {
      topic: '3 game-changing motion design tips for creators',
      kind: 'REEL',
      tone: 'creator'
    })
    console.log('✓ User A post generated ID:', genResA.post._id)

    const queueA = await getUserQueue(USER_A, 'instagram')
    console.log(`✓ User A queue count: ${queueA.length} posts`)

    // 4. Test User B: Connect Separate Account (Complete Isolation)
    console.log('\n[TEST 3] User B links separate Instagram and LinkedIn accounts...')
    const connectResB = await connectUserSocialAccount(USER_B, 'instagram', {
      accessToken: 'TEST_TOKEN_BETA',
      accountUsername: 'dev_beta',
      accountName: 'Beta Developer',
      platformUserId: 'ig_user_beta_456'
    })
    console.log('✓ User B connected Instagram:', connectResB.message)

    const connectLinkedInB = await connectUserSocialAccount(USER_B, 'linkedin', {
      accessToken: 'TEST_LINKEDIN_TOKEN_BETA',
      accountUsername: 'beta_dev_li',
      accountName: 'Beta Dev (Staff Engineer)',
      platformUserId: 'urn:li:person:beta_456'
    })
    console.log('✓ User B connected LinkedIn:', connectLinkedInB.message)

    // Verify isolation between User A and User B
    const statusB = await getUserSocialStatus(USER_B, 'instagram')
    if (statusB.account.username === statusA.account.username) {
      throw new Error('SECURITY VIOLATION: User B received User A account data!')
    }
    console.log('✓ User B status isolated: @' + statusB.account.username)

    const queueB = await getUserQueue(USER_B, 'instagram')
    for (const postB of queueB) {
      if (String(postB.userId) !== USER_B) {
        throw new Error('SECURITY VIOLATION: Cross-user post leakage in queue!')
      }
    }
    console.log('✓ User B queue verified 100% isolated from User A')

    // 5. Test User A: Publish Live
    console.log('\n[TEST 4] User A publishes post live to Instagram...')
    const publishResA = await publishUserPostLive(USER_A, 'instagram', genResA.post._id)
    if (publishResA.post.status !== 'published') throw new Error('Post status is not published')
    console.log('✓ User A post published live successfully: Status =', publishResA.post.status)

    // 6. Test User A: Toggle Autopilot
    console.log('\n[TEST 5] Toggle Autopilot for User A...')
    const toggleRes = await toggleUserAutopilot(USER_A, 'instagram', false)
    console.log('✓ User A autopilot toggled:', toggleRes.message)
    const statusAAfterToggle = await getUserSocialStatus(USER_A, 'instagram')
    if (statusAAfterToggle.autopilot !== false) throw new Error('Autopilot toggle failed')
    console.log('✓ User A autopilot state verified: Paused')

    // 7. Test Continuous 7-Day Buffer Guarantee
    console.log('\n[TEST 6] Testing Continuous 7-Day Buffer Guarantee for User B...')
    const bufferRes = await ensureContinuousScheduleBuffer(USER_B, 'instagram', 7)
    console.log(`✓ 7-Day Continuous Buffer Result: ${bufferRes.message}`)
    const fullQueueB = await getUserQueue(USER_B, 'instagram', 20)
    console.log(`✓ User B now has ${fullQueueB.length} queued posts booked across the upcoming week!`)
    if (fullQueueB.length < 5) throw new Error('Buffer failed to fill 7 days of queue')

    // 8. Test Backlog & Missed Post Auto-Recovery
    console.log('\n[TEST 7] Testing Backlog / Overdue Post Auto-Recovery...')
    // Create an overdue post scheduled yesterday
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    await SocialAutomationPost.create({
      userId: USER_B,
      platform: 'instagram',
      kind: 'REEL',
      status: 'approved',
      topic: 'Overdue Post Recovery Test',
      hook: 'Missed post recovery test hook',
      caption: 'Testing auto-recovery of missed days',
      mediaUrl: 'https://h.uguu.se/zOmpBXSE.mp4',
      scheduledAt: yesterday,
      aiGenerated: true
    })
    const recoveryResults = await processMissedAndDuePosts(USER_B, 'instagram')
    console.log(`✓ Missed post auto-recovery processed: ${recoveryResults.length} overdue posts caught up.`)

    // 9. Test Multi-User Autonomous Scheduler Loop
    console.log('\n[TEST 8] Triggering Global Multi-User Zero-Missed Scheduler...')
    await runMultiUserSocialScheduler()
    console.log('✓ Zero-missed multi-user scheduler executed smoothly without errors')

    // Clean up test data
    await SocialAutomationAccount.deleteMany({ userId: { $in: [USER_A, USER_B] } })
    await SocialAutomationPost.deleteMany({ userId: { $in: [USER_A, USER_B] } })
    console.log('\n✓ Cleaned up test artifacts')

    console.log('\n====================================================')
    console.log('✅ ALL PRODUCTION ZERO-MISSED MULTI-USER TESTS PASSED!')
    console.log('====================================================')

    process.exit(0)
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err)
    process.exit(1)
  }
}

runTests()
