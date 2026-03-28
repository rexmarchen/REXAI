import { z } from 'zod'
import { ok, apiError, requireSessionUser } from '@/lib/api'
import { hasRequiredPlan } from '@/lib/plan'
import { createGigApplicationRecord, getGigById } from '@/lib/server-data'

const schema = z.object({
  resumeUrl: z.string().optional(),
  pitch: z.string().min(20).max(280),
  startDate: z.string().min(10),
})

export async function POST(
  request: Request,
  context: {
    params: { id: string }
  }
) {
  const sessionUser = await requireSessionUser()
  if (!sessionUser) {
    return apiError('Please log in to apply.', 401)
  }

  if (!hasRequiredPlan(sessionUser.plan, 'pro')) {
    return apiError('Upgrade to Pro to apply to micro-gigs.', 403)
  }

  const gig = await getGigById(context.params.id)
  if (!gig) {
    return apiError('Gig not found.', 404)
  }

  const payload = await request.json()
  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    return apiError('Please provide a valid pitch and start date.', 400)
  }

  return ok(
    await createGigApplicationRecord({
      gigId: context.params.id,
      userId: sessionUser.id,
      resumeUrl: parsed.data.resumeUrl,
      pitch: parsed.data.pitch,
      startDate: parsed.data.startDate,
    })
  )
}
