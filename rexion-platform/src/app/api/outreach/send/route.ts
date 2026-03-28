import { z } from 'zod'
import { ok, apiError, requireSessionUser } from '@/lib/api'
import { buildUnsubscribeFooter, sendEmail } from '@/lib/email'
import { countSentContactsSince, createCampaignRecord, ensureSessionUser, isEmailUnsubscribed } from '@/lib/server-data'
import { checkRateLimit } from '@/lib/rate-limit'
import { getEmailQueue, enqueueEmailJobs } from '@/lib/queue'
import { substituteEmailVariables } from '@/lib/outreach/email'
import { validateDailySendLimit } from '@/lib/outreach/limits'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const schema = z.object({
  company: z.object({
    name: z.string().min(2),
    domain: z.string().min(3),
    logo: z.string().optional(),
    industry: z.string().optional(),
    size: z.string().optional(),
    location: z.string().optional(),
    linkedinUrl: z.string().optional(),
    hiringStatus: z.enum(['Active Hiring', 'Unknown']).optional(),
  }),
  contacts: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().min(2),
        role: z.string().min(2),
        email: z.string().min(3),
        confidence: z.enum(['verified', 'likely', 'guessed']),
        linkedinUrl: z.string().optional(),
      })
    )
    .min(1),
  subject: z.string().min(3),
  body: z.string().min(10),
  tone: z.enum(['professional', 'bold', 'friendly']),
  openTracking: z.boolean().optional(),
  followUp: z.object({
    enabled: z.boolean(),
    days: z.number().int().min(1).max(14),
    message: z.string().min(3),
  }),
})

export async function POST(request: Request) {
  const sessionUser = await requireSessionUser()
  if (!sessionUser) {
    return apiError('Please log in to send outreach.', 401)
  }

  const rateLimit = checkRateLimit(`outreach-send:${sessionUser.id}`, 5, 60 * 1000)
  if (!rateLimit.allowed) {
    return apiError('Too many send attempts. Please wait a minute.', 429)
  }

  const payload = await request.json()
  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    return apiError('Please provide a valid company, contacts, and email draft.', 400)
  }

  const storedUser = await ensureSessionUser(sessionUser)
  if (!storedUser) {
    return apiError('Unable to resolve the current user.', 401)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const usedToday = await countSentContactsSince(storedUser.id, today)
  const limitState = validateDailySendLimit(storedUser.plan, usedToday, parsed.data.contacts.length)
  if (!limitState.allowed) {
    return Response.json(
      {
        error: 'Daily limit reached',
        limit: limitState.limit,
        used: limitState.usedToday,
        resets: 'tomorrow',
      },
      { status: 429 }
    )
  }

  const queueEnabled = Boolean(getEmailQueue())
  const preparedContacts: Array<
    z.infer<typeof schema>['contacts'][number] & {
      status: 'queued' | 'sent' | 'failed'
      sentAt?: string
      error?: string
      html?: string
    }
  > = []

  for (const contact of parsed.data.contacts) {
    if (!emailPattern.test(contact.email)) {
      preparedContacts.push({
        ...contact,
        status: 'failed',
        error: 'Invalid email address',
      })
      continue
    }

    if (await isEmailUnsubscribed(contact.email)) {
      preparedContacts.push({
        ...contact,
        status: 'failed',
        error: 'Recipient unsubscribed',
      })
      continue
    }

    const personalizedBody = substituteEmailVariables(parsed.data.body, parsed.data.company.name, contact)
    const html = `<div style="font-family:Inter,Arial,sans-serif;line-height:1.7;color:#f5f7f5;background:#0a100c;padding:24px;border-radius:16px;">${personalizedBody.replace(/\n/g, '<br />')}${buildUnsubscribeFooter(contact.email)}</div>`

    if (queueEnabled) {
      preparedContacts.push({
        ...contact,
        status: 'queued',
        html,
      })
      continue
    }

    try {
      await sendEmail({
        to: contact.email,
        subject: parsed.data.subject,
        html,
      })

      preparedContacts.push({
        ...contact,
        status: 'sent',
        sentAt: new Date().toISOString(),
        html,
      })
    } catch (error) {
      preparedContacts.push({
        ...contact,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Delivery failed',
        html,
      })
    }
  }

  const sentCount = preparedContacts.filter((contact) => contact.status === 'sent').length
  const failedCount = preparedContacts.filter((contact) => contact.status === 'failed').length
  const status =
    queueEnabled && sentCount + failedCount < preparedContacts.length
      ? failedCount > 0
        ? 'partial_failed'
        : 'sending'
      : sentCount === 0 && failedCount > 0
        ? 'failed'
        : failedCount > 0
          ? 'partial_failed'
          : 'sent'

  const campaign = await createCampaignRecord({
    userId: storedUser.id,
    company: parsed.data.company,
    subject: parsed.data.subject,
    body: parsed.data.body,
    tone: parsed.data.tone,
    contacts: preparedContacts.map((contact) => ({
      id: contact.id,
      name: contact.name,
      role: contact.role,
      email: contact.email,
      confidence: contact.confidence,
      linkedinUrl: contact.linkedinUrl,
      status: contact.status,
      sentAt: contact.sentAt,
      error: contact.error,
    })),
    followUp: parsed.data.followUp,
    status,
  })

  if (!campaign) {
    return apiError('Unable to create outreach campaign.', 500)
  }

  if (queueEnabled) {
    const jobs = campaign.contacts.flatMap((contact) => {
      const prepared = preparedContacts.find((item) => item.email === contact.email)
      if (!prepared || prepared.status === 'failed' || !prepared.html) {
        return []
      }

      return [
        {
          campaignId: campaign.id,
          contactId: contact.id,
          userId: storedUser.id,
          to: contact.email,
          subject: parsed.data.subject,
          html: prepared.html,
          tracking: Boolean(parsed.data.openTracking),
          followUp: parsed.data.followUp,
        },
      ]
    })

    if (jobs.length) {
      await enqueueEmailJobs(jobs)
    }
  }

  return ok({
    campaignId: campaign.id,
    queued: preparedContacts.filter((contact) => contact.status !== 'failed').length,
    status: {
      campaignId: campaign.id,
      status: campaign.status,
      totalContacts: campaign.totalContacts,
      sentCount: campaign.sentCount,
      failedCount: campaign.failedCount,
      openCount: campaign.openCount,
    },
  })
}
