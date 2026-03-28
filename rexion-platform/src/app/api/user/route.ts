import { apiError, ok, requireSessionUser } from '@/lib/api'
import { deleteUserData, ensureSessionUser } from '@/lib/server-data'
import { getStripe } from '@/lib/stripe'

export async function GET() {
  const sessionUser = await requireSessionUser()
  if (!sessionUser) {
    return apiError('Please log in to view your account.', 401)
  }

  const user = await ensureSessionUser(sessionUser)
  return ok(user)
}

export async function DELETE() {
  const sessionUser = await requireSessionUser()
  if (!sessionUser) {
    return apiError('Please log in to delete your account.', 401)
  }

  const user = await ensureSessionUser(sessionUser)
  const stripe = getStripe()

  if (stripe && user?.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(user.stripeSubscriptionId)
    } catch (error) {
      console.error('Stripe cancellation failed during account deletion', error)
    }
  }

  await deleteUserData(sessionUser.id)
  return ok({ deleted: true })
}
