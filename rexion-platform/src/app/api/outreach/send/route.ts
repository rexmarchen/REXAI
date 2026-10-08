import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { enqueueOutreachJobs, OutreachJobData } from '@/lib/queue'
import { getConnectedMailbox } from '@/lib/outreach/connected-mailbox'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, subject, bodyTemplate, drafts, mailConfig } = await req.json()

    if (!name || !subject || !bodyTemplate || !Array.isArray(drafts) || drafts.length === 0) {
      return NextResponse.json({ error: 'Invalid campaign request payload' }, { status: 400 })
    }

    if (drafts.length > 20) {
      return NextResponse.json({ error: 'A campaign may contain at most 20 recipients.' }, { status: 400 })
    }

    let connectedMailbox: Awaited<ReturnType<typeof getConnectedMailbox>> | null = null
    if (mailConfig?.mailboxId) {
      connectedMailbox = await getConnectedMailbox(session.user.id, mailConfig.mailboxId)
    }

    const senderEmail = connectedMailbox?.email || mailConfig?.fromEmail
    if (!senderEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
      return NextResponse.json({ error: 'Sender email (fromEmail) is required' }, { status: 400 })
    }

    const hasSmtp = Boolean(mailConfig.smtpHost && mailConfig.smtpUser && mailConfig.smtpPass)
    const hasResend = Boolean(mailConfig.resendApiKey || process.env.RESEND_API_KEY)
    if (!connectedMailbox && !hasSmtp && !hasResend) {
      return NextResponse.json({
        error: 'Connect a Google or Microsoft mailbox, or provide SMTP credentials or a Resend API key before sending.',
      }, { status: 400 })
    }

    // 1. Create the Campaign
    const campaign = await prisma.campaign.create({
      data: {
        userId: session.user.id,
        name,
        subject,
        bodyTemplate,
        status: 'sending',
      },
    })

    // 2. Fetch all unique email addresses in the drafts to check suppression list
    const contactIds = drafts.map((d) => d.contactId)
    const contacts = await prisma.contact.findMany({
      where: {
        id: { in: contactIds },
        userId: session.user.id,
      },
    })

    const contactMap = new Map(contacts.map((c) => [c.id, c]))

    // Find all suppressed emails for the user
    const suppressedEmails = await prisma.suppressionEntry.findMany({
      where: {
        userId: session.user.id,
      },
      select: { email: true },
    })
    const suppressedSet = new Set(suppressedEmails.map((se) => se.email.toLowerCase()))

    let skippedCount = 0
    let queuedCount = 0
    const jobsToEnqueue: OutreachJobData[] = []

    // 3. Process each draft contact
    for (const draft of drafts) {
      const contact = contactMap.get(draft.contactId)
      if (!contact) continue

      const email = contact.email.toLowerCase().trim()
      const isSuppressed = suppressedSet.has(email)

      // Create CampaignSend record
      const sendRecord = await prisma.campaignSend.create({
        data: {
          campaignId: campaign.id,
          contactId: contact.id,
          subject: draft.subject || subject,
          body: draft.body || bodyTemplate,
          status: isSuppressed ? 'skipped' : 'queued',
        },
      })

      if (isSuppressed) {
        skippedCount++
      } else {
        queuedCount++
        jobsToEnqueue.push({
          campaignSendId: sendRecord.id,
          campaignId: campaign.id,
          contactId: contact.id,
          userId: session.user.id,
          to: contact.email,
          subject: sendRecord.subject,
          body: sendRecord.body,
          mailConfig: {
            smtpHost: mailConfig.smtpHost,
            smtpPort: mailConfig.smtpPort,
            smtpUser: mailConfig.smtpUser,
            smtpPass: mailConfig.smtpPass,
            smtpSecure: mailConfig.smtpSecure,
            resendApiKey: mailConfig.resendApiKey,
            mailboxId: connectedMailbox?.id,
            fromEmail: senderEmail,
            fromName: mailConfig.fromName,
            physicalAddress: mailConfig.physicalAddress,
          },
        })
      }
    }

    // 4. Enqueue non-suppressed jobs to BullMQ
    if (jobsToEnqueue.length > 0) {
      await enqueueOutreachJobs(jobsToEnqueue)
    } else {
      // If all are skipped, mark campaign complete
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'complete' },
      })
    }

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      queued: queuedCount,
      skipped: skippedCount,
      message: `Enqueued ${queuedCount} emails, skipped ${skippedCount} suppressed contacts.`,
    })
  } catch (error: any) {
    console.error('Outreach send route error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
