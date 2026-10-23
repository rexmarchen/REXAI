import mongoose from 'mongoose'
import Subscription from '../models/Subscription.js'
import User from '../models/User.js'
import SocialAutomationAccount from '../models/SocialAutomationAccount.js'
import SocialAutomationPost from '../models/SocialAutomationPost.js'
import { getPlanConfig } from '../config/planConfig.js'
import { getSqliteDb } from './socialConnectionsSqliteService.js'

export const ENTITLEMENT_REASONS = {
  ALLOWED: 'ALLOWED',
  NO_USER: 'REASON_USER_NOT_FOUND',
  NO_SUBSCRIPTION: 'REASON_NO_ACTIVE_SUBSCRIPTION',
  EXPIRED: 'REASON_SUBSCRIPTION_EXPIRED',
  PAST_DUE: 'REASON_PAYMENT_PAST_DUE',
  REVOKED: 'REASON_SUBSCRIPTION_REVOKED',
  FEATURE_NOT_IN_PLAN: 'REASON_FEATURE_NOT_IN_PLAN',
  LIMIT_REACHED: 'REASON_DAILY_LIMIT_REACHED',
  ACCOUNT_NOT_OWNED: 'REASON_ACCOUNT_NOT_OWNED',
  NO_CONNECTION: 'REASON_NO_CONNECTED_ACCOUNT'
}

/**
 * Returns beginning of today in UTC
 */
function getStartOfTodayUtc() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
}

/**
 * Resolves current verified subscription and plan for a user
 */
export async function getEffectiveUserEntitlement(userId) {
  if (!userId) {
    return {
      allowed: false,
      reason: ENTITLEMENT_REASONS.NO_USER,
      planId: 'free',
      planConfig: getPlanConfig('free'),
      entitlementStatus: 'inactive'
    }
  }

  let user = null
  try {
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId).lean()
    } else {
      user = await User.findOne({ $or: [{ email: userId }, { providerId: userId }] }).lean()
    }
  } catch {
    user = null
  }

  // Look up subscription record
  const sub = await Subscription.findOne({ userId }).sort({ createdAt: -1 })
  const nowUtc = new Date()

  // If user cannot be found and has no subscription
  if (!user && !sub) {
    return {
      allowed: false,
      reason: ENTITLEMENT_REASONS.NO_USER,
      planId: 'free',
      planConfig: getPlanConfig('free'),
      entitlementStatus: 'inactive'
    }
  }

  // 1. If no subscription record exists:
  if (!sub) {
    // If user has 'free' plan or legacy user with no subscription
    return {
      allowed: false,
      reason: ENTITLEMENT_REASONS.NO_SUBSCRIPTION,
      user,
      subscription: null,
      planId: 'free',
      planConfig: getPlanConfig('free'),
      entitlementStatus: 'inactive',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null
    }
  }

  // 2. Evaluate subscription policy
  const { subscriptionStatus, currentPeriodEnd, cancelAtPeriodEnd, planId } = sub
  const planConfig = getPlanConfig(planId)

  // Policy check A: Immediately terminated or canceled
  if (['canceled', 'incomplete_expired'].includes(subscriptionStatus)) {
    // If canceled at period end and period has NOT ended yet, it remains eligible
    if (cancelAtPeriodEnd && currentPeriodEnd && new Date(currentPeriodEnd).getTime() > nowUtc.getTime()) {
      // Eligible until period end
      return {
        allowed: true,
        reason: ENTITLEMENT_REASONS.ALLOWED,
        user,
        subscription: sub,
        planId,
        planConfig,
        entitlementStatus: 'active',
        cancelAtPeriodEnd: true,
        currentPeriodEnd
      }
    }

    return {
      allowed: false,
      reason: ENTITLEMENT_REASONS.REVOKED,
      user,
      subscription: sub,
      planId: 'free',
      planConfig: getPlanConfig('free'),
      entitlementStatus: 'revoked',
      currentPeriodEnd
    }
  }

  // Policy check B: Past due or unpaid (strict suspension policy)
  if (['past_due', 'unpaid', 'paused'].includes(subscriptionStatus)) {
    return {
      allowed: false,
      reason: ENTITLEMENT_REASONS.PAST_DUE,
      user,
      subscription: sub,
      planId,
      planConfig,
      entitlementStatus: 'suspended',
      currentPeriodEnd
    }
  }

  // Policy check C: Active / trialing
  if (['active', 'trialing'].includes(subscriptionStatus)) {
    // Check paid-through timestamp
    if (currentPeriodEnd && new Date(currentPeriodEnd).getTime() <= nowUtc.getTime()) {
      return {
        allowed: false,
        reason: ENTITLEMENT_REASONS.EXPIRED,
        user,
        subscription: sub,
        planId: 'free',
        planConfig: getPlanConfig('free'),
        entitlementStatus: 'expired',
        currentPeriodEnd
      }
    }

    return {
      allowed: true,
      reason: ENTITLEMENT_REASONS.ALLOWED,
      user,
      subscription: sub,
      planId,
      planConfig,
      entitlementStatus: 'active',
      cancelAtPeriodEnd: Boolean(cancelAtPeriodEnd),
      currentPeriodEnd
    }
  }

  return {
    allowed: false,
    reason: ENTITLEMENT_REASONS.NO_SUBSCRIPTION,
    user,
    subscription: sub,
    planId: 'free',
    planConfig: getPlanConfig('free'),
    entitlementStatus: 'inactive',
    currentPeriodEnd
  }
}

/**
 * Checks whether user has permission to use a specific feature
 */
export async function canUseFeature(userId, feature) {
  const entitlement = await getEffectiveUserEntitlement(userId)
  if (!entitlement.allowed) {
    return {
      allowed: false,
      reason: entitlement.reason,
      planId: entitlement.planId,
      entitlement
    }
  }

  const { planConfig } = entitlement
  if (feature === 'linkedin_automation') {
    if (!planConfig.linkedinAutomationAllowed) {
      return {
        allowed: false,
        reason: ENTITLEMENT_REASONS.FEATURE_NOT_IN_PLAN,
        planId: entitlement.planId,
        message: 'LinkedIn automation requires a Pro or Elite subscription.'
      }
    }
    return { allowed: true, planId: entitlement.planId }
  }

  if (feature === 'full_auto_pilot') {
    if (!planConfig.fullAutoPilotAllowed) {
      return {
        allowed: false,
        reason: ENTITLEMENT_REASONS.FEATURE_NOT_IN_PLAN,
        planId: entitlement.planId,
        message: 'Continuous Autopilot buffer requires an Elite subscription.'
      }
    }
    return { allowed: true, planId: entitlement.planId }
  }

  const isFeatureAllowed = planConfig.allowedAutomationFeatures.includes(feature)
  if (!isFeatureAllowed) {
    return {
      allowed: false,
      reason: ENTITLEMENT_REASONS.FEATURE_NOT_IN_PLAN,
      planId: entitlement.planId,
      message: `Feature "${feature}" is not included in ${planConfig.name}.`
    }
  }

  return { allowed: true, planId: entitlement.planId }
}

/**
 * Verifies that the user owns the specified LinkedIn connection
 */
export async function verifyConnectionOwnership(userId, connectionId = null) {
  if (!connectionId) return { verified: true }

  let found = false
  try {
    const db = getSqliteDb()
    const conn = db.prepare(`
      SELECT user_id FROM social_connections 
      WHERE id = ? AND platform = 'linkedin'
    `).get(connectionId)

    if (conn) {
      found = true
      const match = String(conn.user_id) === String(userId) || (conn.user_id === null && String(userId) === '1')
      if (!match) {
        return { verified: false, reason: ENTITLEMENT_REASONS.ACCOUNT_NOT_OWNED }
      }
      return { verified: true }
    }
  } catch (sqlErr) {
    // Continue checking Mongo
  }

  try {
    let mongoAcc = null
    if (mongoose.Types.ObjectId.isValid(connectionId)) {
      mongoAcc = await SocialAutomationAccount.findById(connectionId).lean()
    } else {
      mongoAcc = await SocialAutomationAccount.findOne({ _id: connectionId }).lean()
    }

    if (mongoAcc) {
      found = true
      if (String(mongoAcc.userId) !== String(userId)) {
        return { verified: false, reason: ENTITLEMENT_REASONS.ACCOUNT_NOT_OWNED }
      }
      return { verified: true }
    }
  } catch {}

  return { verified: false, reason: ENTITLEMENT_REASONS.NO_CONNECTION }
}

/**
 * Gatekeeper for LinkedIn publishing.
 * Verifies identity, subscription eligibility, current paid-through date,
 * daily quota limits, and connection ownership.
 */
export async function canPublishToLinkedIn(userId, connectionId = null, options = {}) {
  // 1. Check user entitlement & subscription status
  const entitlement = await getEffectiveUserEntitlement(userId)
  if (!entitlement.allowed) {
    return {
      allowed: false,
      reason: entitlement.reason,
      planId: entitlement.planId,
      message: getEntitlementDenialMessage(entitlement.reason, entitlement.currentPeriodEnd)
    }
  }

  // 2. Check plan permission for LinkedIn automation
  const { planConfig } = entitlement
  if (!planConfig.linkedinAutomationAllowed) {
    return {
      allowed: false,
      reason: ENTITLEMENT_REASONS.FEATURE_NOT_IN_PLAN,
      planId: entitlement.planId,
      message: 'Your current plan does not include automated LinkedIn publishing.'
    }
  }

  // 3. Verify connection ownership
  if (connectionId) {
    const ownership = await verifyConnectionOwnership(userId, connectionId)
    if (!ownership.verified) {
      return {
        allowed: false,
        reason: ENTITLEMENT_REASONS.ACCOUNT_NOT_OWNED,
        message: 'Security Alert: You do not own the requested LinkedIn connected account.'
      }
    }
  }

  // 4. Check Daily Publishing Limits
  const startOfDay = getStartOfTodayUtc()
  const postsPublishedToday = await SocialAutomationPost.countDocuments({
    userId,
    platform: 'linkedin',
    status: 'published',
    publishedAt: { $gte: startOfDay }
  })

  const limitRemaining = Math.max(0, planConfig.dailyPostLimit - postsPublishedToday)
  if (limitRemaining <= 0 && !options.bypassLimit) {
    return {
      allowed: false,
      reason: ENTITLEMENT_REASONS.LIMIT_REACHED,
      planId: entitlement.planId,
      postsPublishedToday,
      dailyPostLimit: planConfig.dailyPostLimit,
      message: `Daily publishing limit reached (${postsPublishedToday}/${planConfig.dailyPostLimit} posts). Upgrade to Elite for higher capacity.`
    }
  }

  return {
    allowed: true,
    reason: ENTITLEMENT_REASONS.ALLOWED,
    planId: entitlement.planId,
    dailyPostLimit: planConfig.dailyPostLimit,
    postsPublishedToday,
    limitRemaining,
    cancelAtPeriodEnd: entitlement.cancelAtPeriodEnd,
    currentPeriodEnd: entitlement.currentPeriodEnd
  }
}

/**
 * Translates reason codes into clear user-facing messages
 */
function getEntitlementDenialMessage(reason, expiryDate) {
  switch (reason) {
    case ENTITLEMENT_REASONS.NO_SUBSCRIPTION:
      return 'No active subscription found. Please subscribe to Pro or Elite to activate LinkedIn automation.'
    case ENTITLEMENT_REASONS.EXPIRED:
      return `Your subscription expired on ${expiryDate ? new Date(expiryDate).toLocaleDateString() : 'recently'}. Please renew to resume automation.`
    case ENTITLEMENT_REASONS.PAST_DUE:
      return 'Your subscription payment is past due. Publishing is temporarily suspended until payment is resolved.'
    case ENTITLEMENT_REASONS.REVOKED:
      return 'Your subscription was canceled or revoked. Automated publishing has been disabled.'
    case ENTITLEMENT_REASONS.LIMIT_REACHED:
      return 'You have reached your daily publishing limit for your current plan.'
    case ENTITLEMENT_REASONS.ACCOUNT_NOT_OWNED:
      return 'Access denied: You do not own the selected LinkedIn account.'
    default:
      return 'Subscription entitlement verification failed.'
  }
}
