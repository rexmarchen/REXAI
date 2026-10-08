import { ok, apiError, requireSessionUser } from '@/lib/api'
import { getAppUrl, isDemoModeEnabled } from '@/lib/runtime'
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
  const appUrl = getAppUrl(request.url)

  if (!stripe || !storedUser.stripeCustomerId) {
    if (!isDemoModeEnabled()) {
      return apiError('The billing portal is unavailable until Stripe is configured.', 503)
    }

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
