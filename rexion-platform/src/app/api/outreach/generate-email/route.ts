import { z } from 'zod'
import { ok, apiError, requireSessionUser } from '@/lib/api'
import { buildSuggestedSubject } from '@/lib/outreach/email'
import { checkRateLimit } from '@/lib/rate-limit'
import { generateColdEmail } from '@/lib/openai'
import { ensureSessionUser } from '@/lib/server-data'

const schema = z.object({
  companyName: z.string().min(2),
  contactRole: z.string().min(2),
  tone: z.enum(['professional', 'bold', 'friendly']),
  userResumeText: z.string().optional(),
  targetRole: z.string().optional(),
})

export async function POST(request: Request) {
  const sessionUser = await requireSessionUser()
  if (!sessionUser) {
    return apiError('Please log in to generate outreach emails.', 401)
  }

  const rateLimit = checkRateLimit(`generate-email:${sessionUser.id}`, 20, 60 * 60 * 1000)
  if (!rateLimit.allowed) {
    return apiError('Hourly email generation limit reached. Try again later.', 429)
  }

  const payload = await request.json()
  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    return apiError('Please provide a valid company, role, and tone.', 400)
  }

  const storedUser = await ensureSessionUser(sessionUser)
  const body = await generateColdEmail({
    companyName: parsed.data.companyName,
    contactRole: parsed.data.contactRole,
    tone: parsed.data.tone,
    resumeText: parsed.data.userResumeText || storedUser?.profile.resumeText,
    targetRole: parsed.data.targetRole || storedUser?.profile.targetRole,
  })

  return ok({
    subject: buildSuggestedSubject(parsed.data.companyName, parsed.data.contactRole),
    body,
  })
}
