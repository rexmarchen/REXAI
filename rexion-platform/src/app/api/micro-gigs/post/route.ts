import { z } from 'zod'
import { ok, apiError, requireSessionUser } from '@/lib/api'
import { createGigRecord } from '@/lib/server-data'

const schema = z.object({
  companyName: z.string().min(2),
  title: z.string().min(3),
  description: z.string().min(20),
  skills: z.array(z.string().min(1)).min(1),
  domain: z.string().min(2),
  pay: z.number().int().min(8000).max(25000),
  duration: z.number().int().min(7).max(14),
  location: z.enum(['remote', 'hybrid', 'onsite']),
  spotsTotal: z.number().int().min(1).max(10),
  isPreHiring: z.boolean(),
})

export async function POST(request: Request) {
  const sessionUser = await requireSessionUser()
  if (!sessionUser) {
    return apiError('Please log in to post a gig.', 401)
  }

  if (sessionUser.role !== 'company' && sessionUser.role !== 'admin') {
    return apiError('Only company accounts can post gigs.', 403)
  }

  const payload = await request.json()
  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    return apiError('Please provide a complete gig brief.', 400)
  }

  return ok(
    await createGigRecord({
      userId: sessionUser.id,
      ...parsed.data,
    })
  )
}
