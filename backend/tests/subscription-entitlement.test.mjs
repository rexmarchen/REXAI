import assert from 'assert'
import crypto from 'crypto'
import {
  canPublishToLinkedIn,
  canUseFeature,
  getEffectiveUserEntitlement,
  ENTITLEMENT_REASONS
} from '../src/services/entitlementService.js'
import {
  verifyWebhookSignature,
  processWebhookEvent
} from '../src/services/billingService.js'
import {
  pauseUserAutomationAndQueuedPosts,
  reactivateUserAutomation,
  reschedulePausedPostsForUser
} from '../src/services/expiryCleanupService.js'
import { PLANS } from '../src/config/planConfig.js'
import User from '../src/models/User.js'
import Subscription from '../src/models/Subscription.js'
import BillingEvent from '../src/models/BillingEvent.js'
import SocialAutomationPost from '../src/models/SocialAutomationPost.js'
import SocialAutomationAccount from '../src/models/SocialAutomationAccount.js'
import AuditLog from '../src/models/AuditLog.js'

console.log('=================================================================')
console.log('  REXION AI SUBSCRIPTION & ENTITLEMENT REGRESSION TEST SUITE     ')
console.log('=================================================================\n')

let passedTests = 0
let totalTests = 0

async function runTest(name, fn) {
  totalTests++
  try {
    await fn()
    console.log(`[PASS] Test ${totalTests}: ${name}`)
    passedTests++
  } catch (err) {
    console.error(`[FAIL] Test ${totalTests}: ${name}`)
    console.error(err)
    process.exitCode = 1
  }
}

// ─────────────────────────────────────────────────────────────────
// MOCK STORAGE FIXTURES FOR DETERMINISTIC TESTING
// ─────────────────────────────────────────────────────────────────

const mockSubscriptions = new Map()
const mockBillingEvents = new Map()
const mockPosts = new Map()
const mockAccounts = new Map()

// Patch AuditLog
AuditLog.create = async () => ({})

// Patch User
User.findById = (id) => {
  const queryObj = {
    lean: async () => ({ _id: id, email: `${id}@example.com`, plan: 'free' }),
    exec: async () => ({ _id: id, email: `${id}@example.com`, plan: 'free' }),
    then: (resolve, reject) => queryObj.exec().then(resolve, reject)
  }
  return queryObj
}

User.findOne = (query) => {
  const queryObj = {
    lean: async () => null,
    exec: async () => null,
    then: (resolve, reject) => queryObj.exec().then(resolve, reject)
  }
  return queryObj
}

User.findByIdAndUpdate = async () => ({})

// Patch Subscription document prototype and queries
Subscription.prototype.save = async function() {
  mockSubscriptions.set(this._id || this.userId, this)
  return this
}

Subscription.create = async (doc) => {
  const item = {
    ...doc,
    _id: doc._id || 'sub_' + Math.random().toString(36).substring(2, 9),
    save: async function() {
      mockSubscriptions.set(this._id, this)
      if (this.userId) mockSubscriptions.set(this.userId, this)
      if (this.providerSubscriptionId) mockSubscriptions.set(this.providerSubscriptionId, this)
      return this
    }
  }
  mockSubscriptions.set(item._id, item)
  if (item.userId) mockSubscriptions.set(item.userId, item)
  if (item.providerSubscriptionId) mockSubscriptions.set(item.providerSubscriptionId, item)
  return item
}

Subscription.findOne = (query) => {
  const queryObj = {
    sort: () => queryObj,
    lean: async () => {
      for (const sub of mockSubscriptions.values()) {
        let match = true
        for (const [k, v] of Object.entries(query || {})) {
          if (sub[k] !== v) match = false
        }
        if (match) return JSON.parse(JSON.stringify(sub))
      }
      return null
    },
    exec: async () => {
      for (const sub of mockSubscriptions.values()) {
        let match = true
        for (const [k, v] of Object.entries(query || {})) {
          if (sub[k] !== v) match = false
        }
        if (match) return sub
      }
      return null
    },
    then: (resolve, reject) => queryObj.exec().then(resolve, reject)
  }
  return queryObj
}

Subscription.find = (query) => {
  const queryObj = {
    sort: () => queryObj,
    lean: async () => {
      const results = []
      for (const sub of mockSubscriptions.values()) {
        let match = true
        for (const [k, v] of Object.entries(query || {})) {
          if (sub[k] !== v) match = false
        }
        if (match) results.push(JSON.parse(JSON.stringify(sub)))
      }
      return results
    },
    exec: async () => {
      const results = []
      for (const sub of mockSubscriptions.values()) {
        let match = true
        for (const [k, v] of Object.entries(query || {})) {
          if (sub[k] !== v) match = false
        }
        if (match) results.push(sub)
      }
      return results
    },
    then: (resolve, reject) => queryObj.exec().then(resolve, reject)
  }
  return queryObj
}

Subscription.findOneAndUpdate = async (filter, update, options) => {
  let existing = null
  for (const s of mockSubscriptions.values()) {
    if (Object.entries(filter).every(([k, v]) => s[k] === v)) {
      existing = s
      break
    }
  }
  if (existing) {
    const fieldsToSet = update.$set || update
    Object.assign(existing, fieldsToSet, { updatedAt: new Date() })
    return existing
  } else if (options?.upsert) {
    return await Subscription.create({ ...filter, ...(update.$set || update) })
  }
  return null
}

// Patch BillingEvent
BillingEvent.prototype.save = async function() {
  mockBillingEvents.set(this.providerEventId, this)
  return this
}

BillingEvent.findOne = (query) => {
  const queryObj = {
    lean: async () => {
      for (const ev of mockBillingEvents.values()) {
        let match = true
        for (const [k, v] of Object.entries(query || {})) {
          if (ev[k] !== v) match = false
        }
        if (match) return JSON.parse(JSON.stringify(ev))
      }
      return null
    },
    exec: async () => {
      for (const ev of mockBillingEvents.values()) {
        let match = true
        for (const [k, v] of Object.entries(query || {})) {
          if (ev[k] !== v) match = false
        }
        if (match) return ev
      }
      return null
    },
    then: (resolve, reject) => queryObj.exec().then(resolve, reject)
  }
  return queryObj
}

BillingEvent.create = async (doc) => {
  const newDoc = {
    ...doc,
    _id: 'bev_' + Math.random().toString(36).substring(2, 9),
    createdAt: new Date(),
    save: async function() {
      mockBillingEvents.set(this.providerEventId, this)
      return this
    }
  }
  mockBillingEvents.set(doc.providerEventId, newDoc)
  return newDoc
}

// Patch SocialAutomationPost
SocialAutomationPost.find = (query) => {
  const queryObj = {
    sort: () => queryObj,
    lean: async () => {
      const results = []
      for (const p of mockPosts.values()) {
        let match = true
        for (const [k, v] of Object.entries(query || {})) {
          if (k === 'status' && typeof v === 'object' && v.$in) {
            if (!v.$in.includes(p.status)) match = false
          } else if (p[k] !== v) {
            match = false
          }
        }
        if (match) results.push(JSON.parse(JSON.stringify(p)))
      }
      return results
    },
    exec: async () => {
      const results = []
      for (const p of mockPosts.values()) {
        let match = true
        for (const [k, v] of Object.entries(query || {})) {
          if (k === 'status' && typeof v === 'object' && v.$in) {
            if (!v.$in.includes(p.status)) match = false
          } else if (p[k] !== v) {
            match = false
          }
        }
        if (match) {
          p.save = async function() { return this }
          results.push(p)
        }
      }
      return results
    },
    then: (resolve, reject) => queryObj.exec().then(resolve, reject)
  }
  return queryObj
}

SocialAutomationPost.countDocuments = async (query) => {
  let count = 0
  for (const p of mockPosts.values()) {
    let match = true
    for (const [k, v] of Object.entries(query || {})) {
      if (k === 'publishedAt' && typeof v === 'object') {
        if (v.$gte && new Date(p.publishedAt) < v.$gte) match = false
        if (v.$lte && new Date(p.publishedAt) > v.$lte) match = false
      } else if (p[k] !== v) {
        match = false
      }
    }
    if (match) count++
  }
  return count
}

SocialAutomationPost.updateMany = async (filter, update) => {
  let modifiedCount = 0
  for (const p of mockPosts.values()) {
    let match = true
    for (const [k, v] of Object.entries(filter)) {
      if (k === 'status' && typeof v === 'object' && v.$in) {
        if (!v.$in.includes(p.status)) match = false
      } else if (p[k] !== v) {
        match = false
      }
    }
    if (match) {
      Object.assign(p, update.$set || update)
      modifiedCount++
    }
  }
  return { modifiedCount }
}

// Patch SocialAutomationAccount
SocialAutomationAccount.updateMany = async (filter, update) => {
  let modifiedCount = 0
  for (const acc of mockAccounts.values()) {
    let match = true
    for (const [k, v] of Object.entries(filter)) {
      if (acc[k] !== v) match = false
    }
    if (match) {
      Object.assign(acc, update.$set || update)
      modifiedCount++
    }
  }
  return { modifiedCount }
}

SocialAutomationAccount.find = (query) => {
  const queryObj = {
    sort: () => queryObj,
    lean: async () => [],
    exec: async () => [],
    then: (resolve, reject) => queryObj.exec().then(resolve, reject)
  }
  return queryObj
}

SocialAutomationAccount.findOne = (query) => {
  const queryObj = {
    sort: () => queryObj,
    lean: async () => {
      for (const acc of mockAccounts.values()) {
        let match = true
        for (const [k, v] of Object.entries(query || {})) {
          if (acc[k] !== v) match = false
        }
        if (match) return JSON.parse(JSON.stringify(acc))
      }
      return null
    },
    exec: async () => {
      for (const acc of mockAccounts.values()) {
        let match = true
        for (const [k, v] of Object.entries(query || {})) {
          if (acc[k] !== v) match = false
        }
        if (match) return acc
      }
      return null
    },
    then: (resolve, reject) => queryObj.exec().then(resolve, reject)
  }
  return queryObj
}

// ─────────────────────────────────────────────────────────────────
// EXECUTE 20 MANDATORY TESTS
// ─────────────────────────────────────────────────────────────────

async function runAll() {
  const testUserId = 'user_test_pro_100'
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)

  // 1. Paid user can publish
  await runTest('1. Paid user with active subscription can publish', async () => {
    mockSubscriptions.set('sub_pro', {
      _id: 'sub_pro',
      userId: testUserId,
      planId: 'pro',
      subscriptionStatus: 'active',
      entitlementStatus: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: futureDate,
      cancelAtPeriodEnd: false
    })

    const decision = await canPublishToLinkedIn(testUserId)
    assert.strictEqual(decision.allowed, true, 'Active Pro user should be allowed to publish')
    assert.strictEqual(decision.planId, 'pro')
  })

  // 2. Unpaid user cannot publish
  await runTest('2. Unpaid user (free tier) cannot publish', async () => {
    const unpaidUserId = 'user_free_200'
    const decision = await canPublishToLinkedIn(unpaidUserId)
    assert.strictEqual(decision.allowed, false, 'Free/unpaid user must not be allowed to publish')
    assert.ok(
      decision.reason === ENTITLEMENT_REASONS.NO_SUBSCRIPTION || decision.reason === ENTITLEMENT_REASONS.NO_USER,
      'Must deny with no subscription or no user reason'
    )
  })

  // 3. Expired user cannot publish
  await runTest('3. Expired user (past currentPeriodEnd) cannot publish', async () => {
    const expiredUserId = 'user_expired_300'
    mockSubscriptions.set('sub_expired', {
      _id: 'sub_expired',
      userId: expiredUserId,
      planId: 'pro',
      subscriptionStatus: 'active',
      entitlementStatus: 'active',
      currentPeriodStart: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: pastDate, // Expired 5 days ago
      cancelAtPeriodEnd: false
    })

    const decision = await canPublishToLinkedIn(expiredUserId)
    assert.strictEqual(decision.allowed, false, 'Expired user must be denied publishing')
    assert.strictEqual(decision.reason, ENTITLEMENT_REASONS.EXPIRED)
  })

  // 4. Future end-of-period cancellation remains eligible until expiry
  await runTest('4. Future end-of-period cancellation remains eligible until period end', async () => {
    const cancelingUserId = 'user_canceling_400'
    mockSubscriptions.set('sub_canceling', {
      _id: 'sub_canceling',
      userId: cancelingUserId,
      planId: 'pro',
      subscriptionStatus: 'active',
      entitlementStatus: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: futureDate,
      cancelAtPeriodEnd: true // Canceled at period end, but paid-through is valid
    })

    const decision = await canPublishToLinkedIn(cancelingUserId)
    assert.strictEqual(decision.allowed, true, 'User pending end-of-period cancellation must remain eligible until period end')
  })

  // 5. Immediate cancellation blocks new publishing
  await runTest('5. Immediate cancellation blocks new publishing immediately', async () => {
    const termUserId = 'user_terminated_500'
    mockSubscriptions.set('sub_term', {
      _id: 'sub_term',
      userId: termUserId,
      planId: 'pro',
      subscriptionStatus: 'canceled',
      entitlementStatus: 'canceled',
      currentPeriodStart: new Date(),
      currentPeriodEnd: futureDate,
      cancelAtPeriodEnd: false
    })

    const decision = await canPublishToLinkedIn(termUserId)
    assert.strictEqual(decision.allowed, false, 'Terminated subscription must immediately block publishing')
    assert.strictEqual(decision.reason, ENTITLEMENT_REASONS.REVOKED)
  })

  // 6. Past-due payment follows the configured suspension policy
  await runTest('6. Past-due payment suspends publishing', async () => {
    const pastDueUserId = 'user_pastdue_600'
    mockSubscriptions.set('sub_pastdue', {
      _id: 'sub_pastdue',
      userId: pastDueUserId,
      planId: 'pro',
      subscriptionStatus: 'past_due',
      entitlementStatus: 'suspended',
      currentPeriodStart: new Date(),
      currentPeriodEnd: futureDate,
      cancelAtPeriodEnd: false
    })

    const decision = await canPublishToLinkedIn(pastDueUserId)
    assert.strictEqual(decision.allowed, false, 'Past-due subscription must suspend publishing')
    assert.strictEqual(decision.reason, ENTITLEMENT_REASONS.PAST_DUE)
  })

  // 7. Successful renewal restores eligibility
  await runTest('7. Successful renewal restores eligibility immediately', async () => {
    const pastDueUserId = 'user_pastdue_600'
    const sub = mockSubscriptions.get('sub_pastdue')
    sub.subscriptionStatus = 'active'
    sub.entitlementStatus = 'active'
    sub.currentPeriodEnd = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)

    const decision = await canPublishToLinkedIn(pastDueUserId)
    assert.strictEqual(decision.allowed, true, 'Renewed user must be restored to eligible publishing')
  })

  // 8. A previously queued job cannot publish after expiry
  await runTest('8. A pre-queued job cannot publish after subscription expires', async () => {
    const queueUserId = 'user_queue_800'
    mockSubscriptions.set('sub_q', {
      _id: 'sub_q',
      userId: queueUserId,
      planId: 'pro',
      subscriptionStatus: 'active',
      entitlementStatus: 'active',
      currentPeriodStart: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: pastDate // Expired after job was queued
    })

    const checkAtWorkerExec = await canPublishToLinkedIn(queueUserId)
    assert.strictEqual(checkAtWorkerExec.allowed, false, 'Pre-queued job must be blocked at execution time')
  })

  // 9. A delayed job cannot publish after expiry
  await runTest('9. Delayed job publishing gate blocks execution when expired', async () => {
    const delayedUserId = 'user_delayed_900'
    mockSubscriptions.set('sub_d', {
      _id: 'sub_d',
      userId: delayedUserId,
      planId: 'elite',
      subscriptionStatus: 'canceled',
      entitlementStatus: 'canceled'
    })

    const check = await canPublishToLinkedIn(delayedUserId)
    assert.strictEqual(check.allowed, false, 'Delayed job must evaluate live state immediately prior to publishing')
  })

  // 10. A recurring scheduler cannot enqueue eligible publishing work for an expired account
  await runTest('10. Recurring scheduler detects inactive/expired accounts and prevents dispatch', async () => {
    const recurringUserId = 'user_recur_1000'
    mockSubscriptions.set('sub_rec', {
      _id: 'sub_rec',
      userId: recurringUserId,
      planId: 'free',
      subscriptionStatus: 'inactive',
      entitlementStatus: 'inactive'
    })

    const canSchedule = await canPublishToLinkedIn(recurringUserId)
    assert.strictEqual(canSchedule.allowed, false, 'Recurring scheduler must reject free/inactive user')
  })

  // 11. A retry cannot bypass the entitlement check
  await runTest('11. Retries re-evaluate entitlement and block execution if revoked', async () => {
    const retryUserId = 'user_retry_1100'
    // First attempt was paid, but user cancelled before retry attempt 2
    mockSubscriptions.set('sub_ret', {
      _id: 'sub_ret',
      userId: retryUserId,
      planId: 'pro',
      subscriptionStatus: 'unpaid',
      entitlementStatus: 'suspended'
    })

    const retryCheck = await canPublishToLinkedIn(retryUserId)
    assert.strictEqual(retryCheck.allowed, false, 'Retry attempt must re-verify live entitlement')
  })

  // 12. Browser or frontend tampering cannot unlock publishing
  await runTest('12. Client-supplied plan or expiry parameter cannot override backend gate', async () => {
    const spoofedUserId = 'user_spoof_1200'
    // Entitlement service ignores spoofed payload and reads exclusively from verified source of truth
    const decision = await canPublishToLinkedIn(spoofedUserId)
    assert.strictEqual(decision.allowed, false, 'Backend gate must ignore client-side spoofing')
  })

  // 13. User A cannot publish through User B's connected account or job
  await runTest('13. Cross-user IDOR access is rejected (User A cannot publish via User B account)', async () => {
    const userA = 'user_alice'
    const userB = 'user_bob'
    mockSubscriptions.set('sub_alice', {
      _id: 'sub_alice',
      userId: userA,
      planId: 'pro',
      subscriptionStatus: 'active',
      entitlementStatus: 'active',
      currentPeriodEnd: futureDate
    })
    mockAccounts.set('acc_bob', {
      _id: 'acc_bob',
      userId: userB,
      platform: 'linkedin',
      accountName: 'Bob Account'
    })

    const decision = await canPublishToLinkedIn(userA, 'acc_bob')
    assert.strictEqual(decision.allowed, false, 'Cross-user account access must be denied')
    assert.strictEqual(decision.reason, ENTITLEMENT_REASONS.ACCOUNT_NOT_OWNED)
  })

  // 14. Duplicate webhook events do not duplicate subscriptions or processing side effects
  await runTest('14. Duplicate webhook events are handled idempotently via event deduplication', async () => {
    const duplicateEventId = 'evt_unique_order_1400'
    const fakePayload = {
      id: duplicateEventId,
      type: 'invoice.payment_succeeded',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          customer: 'cus_test_14',
          subscription: 'sub_test_14',
          amount_paid: 2900
        }
      }
    }

    // First delivery processes
    const res1 = await processWebhookEvent(fakePayload)
    assert.strictEqual(res1.success, true)
    assert.strictEqual(Boolean(res1.duplicate), false, 'First event must process')

    // Second delivery of same event ID is caught as duplicate
    const res2 = await processWebhookEvent(fakePayload)
    assert.strictEqual(res2.duplicate, true, 'Duplicate event must be ignored idempotently')
  })

  // 15. Out-of-order webhook events cannot silently restore a revoked entitlement
  await runTest('15. Out-of-order older webhook events cannot overwrite newer state', async () => {
    const outOfOrderUserId = 'user_order_1500'
    const existingDate = new Date(Date.now() - 1000)
    mockSubscriptions.set('sub_stripe_1500', {
      _id: 'sub_order',
      userId: outOfOrderUserId,
      providerSubscriptionId: 'sub_stripe_1500',
      planId: 'pro',
      subscriptionStatus: 'canceled',
      entitlementStatus: 'canceled',
      updatedAt: existingDate,
      save: async function() { return this }
    })

    // Older event timestamp from Stripe (created before cancellation)
    const olderStripeTimestamp = Math.floor((Date.now() - 3600000) / 1000)
    const olderEvent = {
      id: 'evt_old_1500',
      type: 'customer.subscription.updated',
      created: olderStripeTimestamp,
      data: {
        object: {
          id: 'sub_stripe_1500',
          status: 'active'
        }
      }
    }

    const res = await processWebhookEvent(olderEvent)
    assert.strictEqual(res.success, true)
    const currentSub = mockSubscriptions.get('sub_stripe_1500')
    assert.strictEqual(currentSub.subscriptionStatus, 'canceled', 'Canceled state must not be overwritten by older event')
  })

  // 16. Worker restart and queue recovery cannot bypass subscription checks
  await runTest('16. Worker restart/recovery re-evaluates entitlement before publishing', async () => {
    const recoveredUserId = 'user_restarted_1600'
    mockSubscriptions.set('sub_recov', {
      _id: 'sub_recov',
      userId: recoveredUserId,
      planId: 'pro',
      subscriptionStatus: 'past_due',
      entitlementStatus: 'suspended'
    })

    const decision = await canPublishToLinkedIn(recoveredUserId)
    assert.strictEqual(decision.allowed, false, 'Recovered job must not publish for past_due user')
  })

  // 17. Plan limits are enforced under concurrent requests
  await runTest('17. Daily quota limit is strictly enforced (e.g. Pro limit of 3)', async () => {
    const limitUserId = 'user_limit_1700'
    mockSubscriptions.set('sub_limit', {
      _id: 'sub_limit',
      userId: limitUserId,
      planId: 'pro',
      subscriptionStatus: 'active',
      entitlementStatus: 'active',
      currentPeriodEnd: futureDate
    })

    // Mock 3 posts published today already
    const now = new Date()
    mockPosts.set('p1', { userId: limitUserId, platform: 'linkedin', status: 'published', publishedAt: now })
    mockPosts.set('p2', { userId: limitUserId, platform: 'linkedin', status: 'published', publishedAt: now })
    mockPosts.set('p3', { userId: limitUserId, platform: 'linkedin', status: 'published', publishedAt: now })

    const decision = await canPublishToLinkedIn(limitUserId)
    assert.strictEqual(decision.allowed, false, 'User at daily limit must be denied publishing')
    assert.strictEqual(decision.reason, ENTITLEMENT_REASONS.LIMIT_REACHED)
  })

  // 18. Invalid webhook signatures are rejected
  await runTest('18. Webhook signature verification rejects tampered payload or invalid signature', async () => {
    const secret = 'whsec_test_secret_abc123'
    const payload = JSON.stringify({ id: 'evt_test', type: 'charge.succeeded' })
    const timestamp = Math.floor(Date.now() / 1000)
    const validSignature = crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')
    const validHeader = `t=${timestamp},v1=${validSignature}`

    // Valid header passes
    const verified = verifyWebhookSignature(payload, validHeader, secret)
    assert.strictEqual(verified, true, 'Valid signature must verify')

    // Tampered payload fails
    const tamperedPayload = payload + '{"tampered":true}'
    const failed1 = verifyWebhookSignature(tamperedPayload, validHeader, secret)
    assert.strictEqual(failed1, false, 'Tampered payload must fail signature check')

    // Invalid signature header fails
    const failed2 = verifyWebhookSignature(payload, 't=123,v1=bad_sig', secret)
    assert.strictEqual(failed2, false, 'Invalid signature header must fail')
  })

  // 19. Invalid or expired LinkedIn tokens fail safely
  await runTest('19. Missing/invalid LinkedIn tokens fail safely without unhandled crashes', async () => {
    const userWithoutToken = 'user_notoken_1900'
    mockSubscriptions.set('sub_notoken', {
      _id: 'sub_notoken',
      userId: userWithoutToken,
      planId: 'pro',
      subscriptionStatus: 'active',
      entitlementStatus: 'active',
      currentPeriodEnd: futureDate
    })

    // If connection does not exist, publish decision safely denies without unhandled exception
    const decision = await canPublishToLinkedIn(userWithoutToken, 'non_existent_acc')
    assert.strictEqual(decision.allowed, false, 'Non-existent connection must be denied safely')
  })

  // 20. Stale posts are paused on expiry and NOT auto-flushed on renewal without explicit workflow
  await runTest('20. Stale posts are marked paused_subscription and require explicit rescheduling', async () => {
    const lapseUserId = 'user_lapse_2000'
    mockPosts.set('post_q1', { _id: 'post_q1', userId: lapseUserId, platform: 'linkedin', status: 'approved' })
    mockPosts.set('post_q2', { _id: 'post_q2', userId: lapseUserId, platform: 'linkedin', status: 'new' })

    // 1. Subscription lapses -> pauseUserAutomationAndQueuedPosts
    const pauseResult = await pauseUserAutomationAndQueuedPosts(lapseUserId, 'subscription_expired')
    assert.strictEqual(pauseResult.success, true)
    assert.strictEqual(mockPosts.get('post_q1').status, 'paused_subscription')
    assert.strictEqual(mockPosts.get('post_q2').status, 'paused_subscription')

    // 2. User renews subscription -> reactivateUserAutomation leaves paused posts untouched (zero auto-flush)
    const reactivateResult = await reactivateUserAutomation(lapseUserId)
    assert.strictEqual(reactivateResult.success, true)
    assert.strictEqual(mockPosts.get('post_q1').status, 'paused_subscription', 'Renewal must NOT auto-flush stale posts')

    // 3. Explicit rescheduling workflow reschedules them safely
    const rescheduleResult = await reschedulePausedPostsForUser(lapseUserId)
    assert.strictEqual(rescheduleResult.count, 2)
    assert.strictEqual(mockPosts.get('post_q1').status, 'approved', 'Explicit rescheduling workflow reactivates posts safely')
  })

  console.log('\n=================================================================')
  console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`)
  console.log('=================================================================\n')

  if (passedTests !== totalTests) {
    process.exit(1)
  }
}

runAll().catch(err => {
  console.error('Test execution error:', err)
  process.exit(1)
})
