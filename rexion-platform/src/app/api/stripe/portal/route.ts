import { ok, apiError, requireSessionUser } from '@/lib/api'
import { getStripe } from '@/lib/stripe'
import { ensureSessionUser } from '@/lib/server-data'

export async function POST(request: Request) {
  const sessionUser = await requireSessionUser()
  if (!sessionUser) {
    return apiError('Please log in to open the billing portal.', 401)
  }

  const storedUser = await ensureSessionUser(sessionUser)
  if (!storedUser) {
    return apiError('Unable to resolve the current user.', 401)
  }

  const stripe = getStripe()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin

  if (!stripe || !storedUser.stripeCustomerId) {
    return ok({
      url: `${appUrl}/dashboard/billing?mockPortal=true`,
    })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: storedUser.stripeCustomerId,
    return_url: `${appUrl}/dashboard/billing`,
  })

  return ok({ url: session.url })
}
