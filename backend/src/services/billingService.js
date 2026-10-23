import Stripe from 'stripe'
import crypto from 'crypto'
import Subscription from '../models/Subscription.js'
import BillingEvent from '../models/BillingEvent.js'
import User from '../models/User.js'
import { getPlanConfig } from '../config/planConfig.js'
import {
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  STRIPE_PRO_PRICE_ID,
  STRIPE_ELITE_PRICE_ID,
  STRIPE_PRO_ANNUAL_PRICE_ID,
  STRIPE_ELITE_ANNUAL_PRICE_ID,
  FRONTEND_URL
} from '../config/env.js'
import { pauseUserAutomationAndQueuedPosts } from './expiryCleanupService.js'

let stripeInstance = null

export function getStripeClient() {
  if (stripeInstance) return stripeInstance
  if (STRIPE_SECRET_KEY) {
    stripeInstance = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20'
    })
    return stripeInstance
  }
  return null
}

export function setStripeClient(mockClient) {
  stripeInstance = mockClient
}

/**
 * Maps price ID to plan tier
 */
export function resolvePlanFromPriceId(priceId) {
  if (!priceId) return 'free'
  if (priceId === STRIPE_ELITE_PRICE_ID || priceId === STRIPE_ELITE_ANNUAL_PRICE_ID || /elite/i.test(priceId)) {
    return 'elite'
  }
  if (priceId === STRIPE_PRO_PRICE_ID || priceId === STRIPE_PRO_ANNUAL_PRICE_ID || /pro/i.test(priceId)) {
    return 'pro'
  }
  return 'free'
}

/**
 * Resolves price ID for checkout based on plan and billing cycle
 */
export function resolvePriceId(planId, billingCycle = 'monthly') {
  const isAnnual = billingCycle === 'annual'
  if (planId === 'elite') {
    return isAnnual ? STRIPE_ELITE_ANNUAL_PRICE_ID : STRIPE_ELITE_PRICE_ID
  }
  if (planId === 'pro') {
    return isAnnual ? STRIPE_PRO_ANNUAL_PRICE_ID : STRIPE_PRO_PRICE_ID
  }
  throw new Error(`Invalid plan for paid checkout: "${planId}"`)
}

/**
 * Computes entitlement status from subscription state and dates
 */
export function computeEntitlementStatus({ subscriptionStatus, currentPeriodEnd, cancelAtPeriodEnd }) {
  const now = new Date()

  if (['canceled', 'incomplete_expired'].includes(subscriptionStatus)) {
    return 'revoked'
  }

  if (['past_due', 'unpaid', 'paused'].includes(subscriptionStatus)) {
    return 'suspended'
  }

  if (['active', 'trialing'].includes(subscriptionStatus)) {
    if (currentPeriodEnd && new Date(currentPeriodEnd).getTime() <= now.getTime()) {
      return 'expired'
    }
    return 'active'
  }

  return 'inactive'
}

/**
 * Creates a Stripe Checkout Session for upgrading/subscribing
 */
export async function createCheckoutSession({
  userId,
  planId,
  billingCycle = 'monthly',
  successUrl,
  cancelUrl
}) {
  const normalizedPlan = String(planId || '').toLowerCase().trim()
  if (!['pro', 'elite'].includes(normalizedPlan)) {
    throw new Error('Please select an eligible paid plan (Pro or Elite).')
  }

  const user = await User.findById(userId)
  if (!user) {
    throw new Error('User not found.')
  }

  const stripe = getStripeClient()
  if (!stripe) {
    throw new Error('Stripe billing is not configured in this environment.')
  }

  // Check existing active subscription
  let existingSub = await Subscription.findOne({
    userId,
    subscriptionStatus: { $in: ['active', 'trialing'] }
  })

  let customerId = existingSub?.providerCustomerId || user.profile?.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: String(userId) }
    })
    customerId = customer.id

    if (!user.profile) user.profile = {}
    user.profile.stripeCustomerId = customerId
    await user.save()
  }

  const priceId = resolvePriceId(normalizedPlan, billingCycle)
  const appBaseUrl = FRONTEND_URL || 'http://localhost:5173'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    client_reference_id: String(userId),
    metadata: {
      userId: String(userId),
      planId: normalizedPlan,
      billingCycle
    },
    subscription_data: {
      metadata: {
        userId: String(userId),
        planId: normalizedPlan
      }
    },
    success_url: successUrl || `${appBaseUrl}/connections?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${appBaseUrl}/workspace?section=billing&checkout=cancelled`
  })

  return {
    sessionId: session.id,
    url: session.url
  }
}

/**
 * Creates a Customer Portal session for managing billing/cards/cancellations
 */
export async function createCustomerPortalSession({ userId, returnUrl }) {
  const user = await User.findById(userId)
  if (!user) throw new Error('User not found.')

  const sub = await Subscription.findOne({ userId })
  const customerId = sub?.providerCustomerId || user.profile?.stripeCustomerId

  if (!customerId) {
    throw new Error('No active billing customer found. Please subscribe to a paid plan first.')
  }

  const stripe = getStripeClient()
  if (!stripe) {
    throw new Error('Stripe billing is not configured.')
  }

  const appBaseUrl = FRONTEND_URL || 'http://localhost:5173'
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl || `${appBaseUrl}/workspace?section=billing`
  })

  return { url: session.url }
}

/**
 * Verifies webhook signature using Stripe library
 */
export function verifyWebhookSignature(rawBody, signature, secret = STRIPE_WEBHOOK_SECRET) {
  const stripe = getStripeClient()
  if (stripe?.webhooks?.constructEvent) {
    try {
      return Boolean(stripe.webhooks.constructEvent(rawBody, signature, secret))
    } catch {
      return false
    }
  }

  // Standard HMAC-SHA256 signature verification fallback
  if (!signature || !secret || !rawBody) return false
  try {
    const parts = Object.fromEntries(signature.split(',').map(kv => kv.split('=')))
    const t = parts.t
    const v1 = parts.v1
    if (!t || !v1) return false
    const expected = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex')
    if (v1.length !== expected.length) return false
    return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected))
  } catch {
    return false
  }
}

/**
 * Applies authoritative subscription state to MongoDB and User plan
 */
export async function applySubscriptionState({
  userId,
  provider = 'stripe',
  providerCustomerId,
  providerSubscriptionId,
  providerPriceId,
  planId,
  subscriptionStatus,
  currentPeriodStart,
  currentPeriodEnd,
  cancelAtPeriodEnd = false,
  canceledAt = null,
  lastSuccessfulPaymentAt = null,
  rawPayload = {}
}) {
  const planConfig = getPlanConfig(planId)
  const entitlementStatus = computeEntitlementStatus({
    subscriptionStatus,
    currentPeriodEnd,
    cancelAtPeriodEnd
  })

  let sub = null
  if (providerSubscriptionId) {
    sub = await Subscription.findOne({ providerSubscriptionId })
  }
  if (!sub && userId) {
    sub = await Subscription.findOne({ userId })
  }

  const updateFields = {
    userId,
    billingProvider: provider,
    providerCustomerId: providerCustomerId || sub?.providerCustomerId || null,
    providerSubscriptionId: providerSubscriptionId || sub?.providerSubscriptionId || null,
    providerPriceId: providerPriceId || sub?.providerPriceId || null,
    planId,
    subscriptionStatus,
    currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart) : sub?.currentPeriodStart,
    currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : sub?.currentPeriodEnd,
    cancelAtPeriodEnd: Boolean(cancelAtPeriodEnd),
    canceledAt: canceledAt ? new Date(canceledAt) : (cancelAtPeriodEnd ? new Date() : null),
    entitlementStatus,
    dailyPostLimit: planConfig.dailyPostLimit,
    metadata: {
      ...sub?.metadata,
      lastReconciledAt: new Date().toISOString()
    }
  }

  if (lastSuccessfulPaymentAt) {
    updateFields.lastSuccessfulPaymentAt = new Date(lastSuccessfulPaymentAt)
  }

  if (sub) {
    Object.assign(sub, updateFields)
    await sub.save()
  } else {
    sub = await Subscription.create(updateFields)
  }

  // Update user model plan to reflect current eligible state
  const effectivePlan = entitlementStatus === 'active' ? planId : 'free'
  await User.findByIdAndUpdate(userId, { plan: effectivePlan })

  // If entitlement became ineligible, trigger immediate pause on scheduled/queued content
  if (entitlementStatus !== 'active') {
    await pauseUserAutomationAndQueuedPosts(userId, `Subscription state transitioned to ${entitlementStatus} (${subscriptionStatus}).`)
  }

  return sub
}

/**
 * Core Webhook Event Processing with Idempotency & Safe Out-of-Order Reconciliation
 */
export async function processWebhookEvent(event) {
  const eventId = event?.id
  const eventType = event?.type
  if (!eventId || !eventType) {
    throw new Error('Malformed webhook event: missing id or type')
  }

  // 1. Idempotency Check: deduplicate event processing
  const existingEvent = await BillingEvent.findOne({ providerEventId: eventId })
  if (existingEvent) {
    return { duplicate: true, status: existingEvent.status, eventId }
  }

  const billingLog = new BillingEvent({
    providerEventId: eventId,
    provider: 'stripe',
    eventType,
    payload: event
  })

  try {
    const dataObj = event.data?.object || {}
    const stripe = getStripeClient()

    switch (eventType) {
      case 'checkout.session.completed': {
        const userId = dataObj.client_reference_id || dataObj.metadata?.userId
        const subscriptionId = dataObj.subscription
        const customerId = dataObj.customer

        if (subscriptionId && stripe) {
          // Fetch authoritative subscription state from Stripe
          const stripeSub = await stripe.subscriptions.retrieve(subscriptionId)
          const priceId = stripeSub.items?.data?.[0]?.price?.id
          const planId = resolvePlanFromPriceId(priceId) || dataObj.metadata?.planId || 'pro'

          await applySubscriptionState({
            userId,
            provider: 'stripe',
            providerCustomerId: customerId,
            providerSubscriptionId: subscriptionId,
            providerPriceId: priceId,
            planId,
            subscriptionStatus: stripeSub.status,
            currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
            lastSuccessfulPaymentAt: new Date(),
            rawPayload: stripeSub
          })
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const subscriptionId = dataObj.subscription
        const customerId = dataObj.customer
        const sub = await Subscription.findOne({ providerSubscriptionId: subscriptionId })

        let userId = sub?.userId
        if (!userId && customerId && stripe) {
          const customer = await stripe.customers.retrieve(customerId)
          userId = customer.metadata?.userId
        }

        if (userId && stripe && subscriptionId) {
          const stripeSub = await stripe.subscriptions.retrieve(subscriptionId)
          const priceId = stripeSub.items?.data?.[0]?.price?.id
          const planId = resolvePlanFromPriceId(priceId) || sub?.planId || 'pro'

          await applySubscriptionState({
            userId,
            provider: 'stripe',
            providerCustomerId: customerId,
            providerSubscriptionId: subscriptionId,
            providerPriceId: priceId,
            planId,
            subscriptionStatus: stripeSub.status,
            currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
            lastSuccessfulPaymentAt: new Date(),
            rawPayload: stripeSub
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const subscriptionId = dataObj.subscription
        const sub = await Subscription.findOne({ providerSubscriptionId: subscriptionId })

        if (sub) {
          await applySubscriptionState({
            userId: sub.userId,
            provider: 'stripe',
            providerCustomerId: sub.providerCustomerId,
            providerSubscriptionId: subscriptionId,
            providerPriceId: sub.providerPriceId,
            planId: sub.planId,
            subscriptionStatus: 'past_due',
            currentPeriodStart: sub.currentPeriodStart,
            currentPeriodEnd: sub.currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            rawPayload: dataObj
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscriptionId = dataObj.id
        const customerId = dataObj.customer
        const sub = await Subscription.findOne({ providerSubscriptionId: subscriptionId })

        let userId = sub?.userId
        if (!userId && customerId && stripe) {
          const customer = await stripe.customers.retrieve(customerId)
          userId = customer.metadata?.userId
        }

        // Safe out-of-order reconciliation: ignore older updates that arrive after a cancellation
        const eventTimestamp = event.created ? new Date(event.created * 1000) : null
        if (sub && eventTimestamp && sub.updatedAt && eventTimestamp < new Date(sub.updatedAt)) {
          if (sub.subscriptionStatus === 'canceled' && dataObj.status === 'active') {
            console.warn(`[Billing Webhook] Ignoring out-of-order event ${eventId} for sub ${subscriptionId}`)
            break
          }
        }

        if (userId) {
          const priceId = dataObj.items?.data?.[0]?.price?.id
          const planId = resolvePlanFromPriceId(priceId) || sub?.planId || 'pro'

          await applySubscriptionState({
            userId,
            provider: 'stripe',
            providerCustomerId: customerId,
            providerSubscriptionId: subscriptionId,
            providerPriceId: priceId,
            planId,
            subscriptionStatus: dataObj.status,
            currentPeriodStart: new Date(dataObj.current_period_start * 1000),
            currentPeriodEnd: new Date(dataObj.current_period_end * 1000),
            cancelAtPeriodEnd: dataObj.cancel_at_period_end,
            canceledAt: dataObj.canceled_at ? new Date(dataObj.canceled_at * 1000) : null,
            rawPayload: dataObj
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscriptionId = dataObj.id
        const sub = await Subscription.findOne({ providerSubscriptionId: subscriptionId })

        if (sub) {
          await applySubscriptionState({
            userId: sub.userId,
            provider: 'stripe',
            providerCustomerId: sub.providerCustomerId,
            providerSubscriptionId: subscriptionId,
            providerPriceId: sub.providerPriceId,
            planId: sub.planId,
            subscriptionStatus: 'canceled',
            currentPeriodStart: sub.currentPeriodStart,
            currentPeriodEnd: sub.currentPeriodEnd,
            cancelAtPeriodEnd: false,
            canceledAt: new Date(),
            rawPayload: dataObj
          })
        }
        break
      }

      default:
        billingLog.status = 'ignored'
        break
    }

    billingLog.status = billingLog.status || 'processed'
    await billingLog.save()
    return { success: true, eventId, status: billingLog.status }
  } catch (err) {
    billingLog.status = 'failed'
    billingLog.error = err.message
    await billingLog.save()
    throw err
  }
}
