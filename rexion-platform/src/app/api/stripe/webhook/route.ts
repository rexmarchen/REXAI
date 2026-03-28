import type Stripe from 'stripe'
import { apiError, ok } from '@/lib/api'
import { getStripe } from '@/lib/stripe'
import { findUserByStripeCustomerId, updateUserSubscriptionRecord } from '@/lib/server-data'

export async function POST(request: Request) {
  const stripe = getStripe()
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return apiError('Stripe webhook is not configured.', 500)
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return apiError('Missing Stripe signature.', 400)
  }

  const body = await request.text()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    return apiError(error instanceof Error ? error.message : 'Invalid webhook signature.', 400)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    const plan = session.metadata?.plan as 'pro' | 'elite' | undefined

    if (userId && plan) {
      let currentPeriodEnd: Date | undefined

      if (typeof session.subscription === 'string') {
        const subscription = await stripe.subscriptions.retrieve(session.subscription)
        currentPeriodEnd = new Date(subscription.current_period_end * 1000)
      }

      await updateUserSubscriptionRecord({
        userId,
        plan,
        status: 'active',
        stripeCustomerId: typeof session.customer === 'string' ? session.customer : undefined,
        stripeSubscriptionId:
          typeof session.subscription === 'string' ? session.subscription : undefined,
        currentPeriodEnd,
      })
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    if (typeof invoice.customer === 'string') {
      const user = await findUserByStripeCustomerId(invoice.customer)
      if (user) {
        await updateUserSubscriptionRecord({
          userId: user.id,
          plan: user.plan,
          status: 'past_due',
          stripeCustomerId: user.stripeCustomerId,
          stripeSubscriptionId: user.stripeSubscriptionId,
        })
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    if (typeof subscription.customer === 'string') {
      const user = await findUserByStripeCustomerId(subscription.customer)
      if (user) {
        await updateUserSubscriptionRecord({
          userId: user.id,
          plan: 'free',
          status: 'inactive',
          stripeCustomerId: user.stripeCustomerId,
          stripeSubscriptionId: undefined,
        })
      }
    }
  }

  return ok({ received: true })
}
