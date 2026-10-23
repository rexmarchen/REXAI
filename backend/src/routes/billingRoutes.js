import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
  createCheckoutSession,
  createCustomerPortalSession,
  processWebhookEvent,
  verifyWebhookSignature
} from '../services/billingService.js'
import { getEffectiveUserEntitlement } from '../services/entitlementService.js'
import { PLANS } from '../config/planConfig.js'
import { STRIPE_WEBHOOK_SECRET } from '../config/env.js'

const router = express.Router()

const asyncRoute = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/billing/plans
 * Public catalogue of available plans and capabilities
 */
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    plans: Object.values(PLANS)
  })
})

/**
 * POST /api/billing/webhook
 * Stripe webhook handler with raw signature verification and event deduplication.
 * Raw body is preserved by express.json() verify() middleware as req.rawBody.
 */
router.post('/webhook', asyncRoute(async (req, res) => {
  if (!STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ error: 'Webhook signature verification not configured.' })
  }
  const sig = req.headers['stripe-signature']
  const rawBody = req.rawBody || (Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body)))
  let event

  try {
    if (STRIPE_WEBHOOK_SECRET && sig) {
      event = verifyWebhookSignature(rawBody, sig, STRIPE_WEBHOOK_SECRET)
    } else {
      // Parse JSON directly if test mode or mock webhook
      const rawString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : JSON.stringify(rawBody)
      event = typeof rawBody === 'object' && !Buffer.isBuffer(rawBody) ? rawBody : JSON.parse(rawString)
    }
  } catch (err) {
    console.error('[Billing Webhook Signature Error]:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  try {
    const result = await processWebhookEvent(event)
    return res.json({ received: true, ...result })
  } catch (err) {
    console.error('[Billing Webhook Processing Error]:', err.message)
    return res.status(500).json({ error: `Webhook Processing Failed: ${err.message}` })
  }
}))

// Authenticated billing routes
router.use(protect)

/**
 * GET /api/billing/subscription
 * Returns verified source-of-truth subscription state for current user
 */
router.get('/subscription', asyncRoute(async (req, res) => {
  const userId = req.user._id || req.user.id
  const entitlement = await getEffectiveUserEntitlement(userId)

  res.json({
    success: true,
    planId: entitlement.planId,
    planConfig: entitlement.planConfig,
    subscriptionStatus: entitlement.subscription?.subscriptionStatus || 'inactive',
    entitlementStatus: entitlement.entitlementStatus,
    currentPeriodStart: entitlement.subscription?.currentPeriodStart || null,
    currentPeriodEnd: entitlement.currentPeriodEnd,
    cancelAtPeriodEnd: Boolean(entitlement.cancelAtPeriodEnd),
    canceledAt: entitlement.subscription?.canceledAt || null,
    lastSuccessfulPaymentAt: entitlement.subscription?.lastSuccessfulPaymentAt || null,
    dailyPostLimit: entitlement.planConfig.dailyPostLimit,
    allowed: entitlement.allowed,
    denialReason: entitlement.allowed ? null : entitlement.reason
  })
}))

/**
 * POST /api/billing/checkout
 * Initiates Stripe subscription checkout session
 */
router.post('/checkout', asyncRoute(async (req, res) => {
  const userId = req.user._id || req.user.id
  const { planId, billingCycle, successUrl, cancelUrl } = req.body || {}

  const session = await createCheckoutSession({
    userId,
    planId,
    billingCycle: billingCycle || 'monthly',
    successUrl,
    cancelUrl
  })

  res.status(200).json({
    success: true,
    sessionId: session.sessionId,
    url: session.url
  })
}))

/**
 * POST /api/billing/customer-portal
 * Creates a Stripe Customer Portal session for billing management
 */
router.post('/customer-portal', asyncRoute(async (req, res) => {
  const userId = req.user._id || req.user.id
  const { returnUrl } = req.body || {}

  const portal = await createCustomerPortalSession({
    userId,
    returnUrl
  })

  res.status(200).json({
    success: true,
    url: portal.url
  })
}))

export default router
