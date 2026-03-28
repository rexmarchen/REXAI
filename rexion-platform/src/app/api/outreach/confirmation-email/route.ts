import { z } from 'zod'
import { ok, apiError, requireSessionUser } from '@/lib/api'
import { sendEmail } from '@/lib/email'

const schema = z.object({
  companyName: z.string().min(2),
  recipients: z.number().int().min(1),
  subject: z.string().min(3),
})

export async function POST(request: Request) {
  const sessionUser = await requireSessionUser()
  if (!sessionUser?.email) {
    return apiError('Please log in to send a confirmation email.', 401)
  }

  const payload = await request.json()
  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    return apiError('Please provide a valid outreach summary.', 400)
  }

  await sendEmail({
    to: sessionUser.email,
    subject: `Outreach launched for ${parsed.data.companyName}`,
    html: `<div style="font-family:Inter,Arial,sans-serif;line-height:1.7;color:#f5f7f5;background:#0a100c;padding:24px;border-radius:16px;">You launched outreach to ${parsed.data.recipients} contacts at <strong>${parsed.data.companyName}</strong>.<br /><br />Subject: ${parsed.data.subject}</div>`,
  })

  return ok({ sent: true })
}
