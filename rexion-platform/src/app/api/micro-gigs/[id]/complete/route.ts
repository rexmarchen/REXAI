import { z } from 'zod'
import { ok, apiError, requireSessionUser } from '@/lib/api'

const schema = z.object({
  rating: z.number().min(1).max(5),
  convertedToFullTime: z.boolean(),
  daysToConversion: z.number().int().min(0),
  earnings: z.number().int().min(0),
})

export async function PATCH(request: Request) {
  const sessionUser = await requireSessionUser()
  if (!sessionUser) {
    return apiError('Please log in to complete a gig.', 401)
  }

  if (sessionUser.role !== 'company' && sessionUser.role !== 'admin') {
    return apiError('Only company accounts can mark gigs complete.', 403)
  }

  const payload = await request.json()
  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    return apiError('Please provide valid completion details.', 400)
  }

  return ok({
    completed: true,
    payout: Math.round(parsed.data.earnings * 0.9),
    status: parsed.data.convertedToFullTime ? 'converted' : 'completed',
  })
}
