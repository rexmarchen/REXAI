import SocialAutomationAccount from '../models/SocialAutomationAccount.js'
import SocialAutomationPost from '../models/SocialAutomationPost.js'
import Subscription from '../models/Subscription.js'
import AuditLog from '../models/AuditLog.js'
import User from '../models/User.js'
import { getSqliteDb } from './socialConnectionsSqliteService.js'

/**
 * Pauses a user's automated publishing, disables autopilots,
 * and marks queued/scheduled content as paused_subscription.
 */
export async function pauseUserAutomationAndQueuedPosts(userId, reason = 'Subscription expired or ineligible') {
  const timestamp = new Date()

  // 1. Pause Mongo Social Automation Account
  try {
    await SocialAutomationAccount.updateMany(
      { userId },
      {
        $set: {
          autopilotEnabled: false,
          status: 'paused',
          lastError: reason
        }
      }
    )
  } catch (err) {
    console.warn(`[ExpiryCleanup] Mongo account pause notice for ${userId}:`, err.message)
  }

  // 2. Pause SQLite Social Connections autopilot
  try {
    const db = getSqliteDb()
    db.prepare(`
      UPDATE social_connections 
      SET autopilot_enabled = 0, updated_at = datetime('now')
      WHERE (user_id = ? OR CAST(user_id AS TEXT) = CAST(? AS TEXT) OR (? IN (1, '1') AND user_id IS NULL))
    `).run(userId, String(userId), userId)
  } catch (sqlErr) {
    console.warn(`[ExpiryCleanup] SQLite autopilot pause notice for ${userId}:`, sqlErr.message)
  }

  // 3. Mark queued and approved posts as paused_subscription
  let pausedCount = 0
  try {
    const result = await SocialAutomationPost.updateMany(
      {
        userId,
        status: { $in: ['approved', 'new', 'queued', 'scheduled'] }
      },
      {
        $set: {
          status: 'paused_subscription',
          error: `Blocked from publishing: ${reason} at ${timestamp.toISOString()}`
        }
      }
    )
    pausedCount = result.modifiedCount || 0
  } catch (postErr) {
    console.warn(`[ExpiryCleanup] Post status freeze notice for ${userId}:`, postErr.message)
  }

  // 4. Create Audit Log Entry
  try {
    await AuditLog.create({
      action: 'SUBSCRIPTION_ENTITLEMENT_PAUSED',
      category: 'billing',
      severity: 'warning',
      title: 'LinkedIn Automation Suspended',
      description: `User ${userId} automation suspended. ${pausedCount} queued posts moved to paused_subscription. Reason: ${reason}`,
      status: 'Success',
      actor: { id: userId, name: 'System Expiry Engine', role: 'system' }
    })
  } catch (auditErr) {
    // Audit log failure shouldn't break cleanup
  }

  return {
    success: true,
    pausedPosts: pausedCount,
    timestamp
  }
}

/**
 * Reactivates user automation upon renewed entitlement
 * Guard: Stale queued content is preserved in paused_subscription until explicit user review
 */
export async function reactivateUserAutomation(userId, { restoreAutopilot = true } = {}) {
  try {
    if (restoreAutopilot) {
      await SocialAutomationAccount.updateMany(
        { userId, connected: true },
        {
          $set: {
            autopilotEnabled: true,
            status: 'active',
            lastError: null
          }
        }
      )

      try {
        const db = getSqliteDb()
        db.prepare(`
          UPDATE social_connections 
          SET autopilot_enabled = 1, updated_at = datetime('now')
          WHERE platform = 'linkedin' AND (user_id = ? OR CAST(user_id AS TEXT) = CAST(? AS TEXT) OR (? IN (1, '1') AND user_id IS NULL))
        `).run(userId, String(userId), userId)
      } catch (sqlErr) {
        console.warn(`[Reactivation] SQLite notice for ${userId}:`, sqlErr.message)
      }
    }

    await AuditLog.create({
      action: 'SUBSCRIPTION_ENTITLEMENT_RESTORED',
      category: 'billing',
      severity: 'info',
      title: 'LinkedIn Automation Restored',
      description: `User ${userId} paid entitlement verified. Autopilot restored. Note: Stale posts remain paused for safety until rescheduled.`,
      status: 'Success',
      actor: { id: userId, name: 'Billing System', role: 'system' }
    })

    return { success: true }
  } catch (err) {
    console.error(`[Reactivation] Error reactivating user ${userId}:`, err.message)
    throw err
  }
}

/**
 * Reschedules paused_subscription posts forward to a safe upcoming date
 */
export async function reschedulePausedPostsForUser(userId, platform = 'linkedin') {
  const pausedPosts = await SocialAutomationPost.find({
    userId,
    platform,
    status: 'paused_subscription'
  }).sort({ scheduledAt: 1 })

  if (pausedPosts.length === 0) {
    return { count: 0, message: 'No paused posts to reschedule.' }
  }

  const now = new Date()
  let schedulePointer = new Date(now)
  schedulePointer.setDate(schedulePointer.getDate() + 1)
  schedulePointer.setHours(9, 0, 0, 0)

  let updatedCount = 0
  for (const post of pausedPosts) {
    post.status = 'approved'
    post.error = null
    post.scheduledAt = new Date(schedulePointer)
    await post.save()
    updatedCount++

    // Increment 1 day forward per post
    schedulePointer.setDate(schedulePointer.getDate() + 1)
  }

  return {
    count: updatedCount,
    message: `Rescheduled ${updatedCount} paused posts starting tomorrow at 09:00.`
  }
}

/**
 * Periodic reconciliation engine comparing local subscription states with current UTC time and provider
 */
export async function reconcileAllSubscriptions(stripeClient = null) {
  const now = new Date()
  const results = {
    checked: 0,
    expired: 0,
    providerReconciled: 0,
    errors: []
  }

  try {
    // 1. Check local subscriptions where currentPeriodEnd has lapsed
    const expiredSubs = await Subscription.find({
      entitlementStatus: 'active',
      currentPeriodEnd: { $lte: now }
    })

    for (const sub of expiredSubs) {
      results.checked++
      sub.entitlementStatus = 'expired'
      sub.subscriptionStatus = 'inactive'
      await sub.save()

      await User.findByIdAndUpdate(sub.userId, { plan: 'free' })
      await pauseUserAutomationAndQueuedPosts(sub.userId, 'Subscription period expired at ' + sub.currentPeriodEnd?.toISOString())
      results.expired++
    }

    // 2. Cross-reference active subscriptions against Stripe API if client available
    if (stripeClient) {
      const activeSubs = await Subscription.find({
        billingProvider: 'stripe',
        providerSubscriptionId: { $ne: null }
      })

      for (const sub of activeSubs) {
        results.checked++
        try {
          const remoteSub = await stripeClient.subscriptions.retrieve(sub.providerSubscriptionId)
          if (remoteSub.status !== sub.subscriptionStatus) {
            sub.subscriptionStatus = remoteSub.status
            if (['canceled', 'unpaid', 'past_due'].includes(remoteSub.status)) {
              sub.entitlementStatus = remoteSub.status === 'canceled' ? 'revoked' : 'suspended'
              await pauseUserAutomationAndQueuedPosts(sub.userId, `Remote subscription is ${remoteSub.status}`)
            } else if (remoteSub.status === 'active') {
              sub.entitlementStatus = 'active'
              sub.currentPeriodEnd = new Date(remoteSub.current_period_end * 1000)
            }
            await sub.save()
            results.providerReconciled++
          }
        } catch (provErr) {
          results.errors.push(`Sub ${sub.providerSubscriptionId}: ${provErr.message}`)
        }
      }
    }
  } catch (err) {
    console.error('[SubscriptionReconciliation] Error:', err.message)
    results.errors.push(err.message)
  }

  return results
}
