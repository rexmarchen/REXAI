import { z } from 'zod'
import { ok, apiError, requireSessionUser } from '@/lib/api'
import { getPlanPriceId, getStripe } from '@/lib/stripe'
import { ensureSessionUser, updateUserSubscriptionRecord } from '@/lib/server-data'

const schema = z.object({
  plan: z.enum(['pro', 'elite']),
})

export async function POST(request: Request) {
  const sessionUser = await requireSessionUser()
  if (!sessionUser) {
    return apiError('Please log in to start checkout.', 401)
  }

  const payload = await request.json()
  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    return apiError('Please select a valid plan.', 400)
  }

  const storedUser = await ensureSessionUser(sessionUser)
  if (!storedUser) {
    return apiError('Unable to resolve the current user.', 401)
  }

  const stripe = getStripe()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin

  if (!stripe) {
    await updateUserSubscriptionRecord({
      userId: storedUser.id,
      plan: parsed.data.plan,
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
    })

    return ok({
      url: `${appUrl}/dashboard?upgraded=true&mockCheckout=${parsed.data.plan}`,
    })
  }

  const priceId = getPlanPriceId(parsed.data.plan)
  if (!priceId) {
    return apiError('Stripe price IDs are not configured.', 500)
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: storedUser.stripeCustomerId,
    customer_email: storedUser.stripeCustomerId ? undefined : storedUser.email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/dashboard?upgraded=true`,
    cancel_url: `${appUrl}/pricing`,
    metadata: {
      userId: storedUser.id,
      plan: parsed.data.plan,
    },
  })

  return ok({ url: checkoutSession.url })
}
