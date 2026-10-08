import { z } from 'zod'
import { ok, apiError, requireSessionUser } from '@/lib/api'
import { applyToMicroGigsBatch, summarizeApplicationBatch } from '@/lib/micro-gigs/apply-all'
import { hasRequiredPlan } from '@/lib/plan'
import { listUserApplicationBatches } from '@/lib/server-data'

const schema = z.object({
  gigIds: z.array(z.string().min(1)).min(1).max(12),
})

export async function GET() {
  const sessionUser = await requireSessionUser()
  if (!sessionUser) {
    return apiError('Please log in to view application batches.', 401)
  }

  return ok(await listUserApplicationBatches(sessionUser.id))
}

export async function POST(request: Request) {
  const sessionUser = await requireSessionUser()
  if (!sessionUser) {
    return apiError('Please log in to apply to gigs.', 401)
  }

  if (!hasRequiredPlan(sessionUser.plan, 'pro')) {
    return apiError('Upgrade to Pro to use Apply All.', 403)
  }

  const payload = await request.json()
  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    return apiError('Please provide a valid list of matched gigs.', 400)
  }

  const batch = await applyToMicroGigsBatch({
    userId: sessionUser.id,
    gigIds: parsed.data.gigIds,
  })

  return ok({
    batch,
    summary: summarizeApplicationBatch(batch),
  })
}
