import IORedis from 'ioredis'
import { Queue, Worker } from 'bullmq'
import { prisma } from '@/lib/db'
import nodemailer from 'nodemailer'
import { humanGapMinutes } from './jitter'
import { sendViaConnectedMailbox } from './outreach/connected-mailbox'

export interface OutreachJobData {
  campaignSendId: string
  campaignId: string
  contactId: string
  userId: string
  to: string
  subject: string
  body: string
  mailConfig: {
    smtpHost?: string
    smtpPort?: string
    smtpUser?: string
    smtpPass?: string
    smtpSecure?: boolean
    resendApiKey?: string
    mailboxId?: string
    fromEmail: string
    fromName?: string
    physicalAddress?: string
  }
}

let queue: Queue<OutreachJobData> | null = null
let redisConnection: IORedis | null = null

function getRedisConnection() {
  if (!process.env.REDIS_URL) {
    // Default fallback to local redis
    return new IORedis('redis://localhost:6379', {
      maxRetriesPerRequest: null
    })
  }

  if (!redisConnection) {
    redisConnection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    })
  }

  return redisConnection
}

export function getOutreachQueue() {
  const connection = getRedisConnection()
  if (!queue) {
    queue = new Queue<OutreachJobData>('outreachQueue', {
      connection,
    })
  }
  return queue
}

export async function enqueueOutreachJobs(jobs: OutreachJobData[]) {
  const outreachQueue = getOutreachQueue()
  
  // Calculate human-plausible staggered delays between emails using triangular distribution
  let cumulativeDelayMs = 0

  const queuedPayloads = jobs.map((job, index) => {
    if (index > 0) {
      // 45 seconds to 120 seconds gap (0.75 to 2.0 minutes), triangular weighted
      const gapMin = humanGapMinutes(0.75, 2.0)
      cumulativeDelayMs += Math.round(gapMin * 60 * 1000)
    }

    return {
      name: 'sendOutreach',
      data: job,
      opts: {
        delay: cumulativeDelayMs,
        removeOnComplete: true,
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
      },
    }
  })

  await outreachQueue.addBulk(queuedPayloads)
  return jobs.length
}

export async function sendCampaignEmail(
  to: string,
  subject: string,
  html: string,
  mailConfig: OutreachJobData['mailConfig'],
  userId: string
) {
  if (mailConfig.mailboxId) {
    await sendViaConnectedMailbox({
      userId,
      mailboxId: mailConfig.mailboxId,
      to,
      subject,
      html,
      fromName: mailConfig.fromName,
    })
    return
  }

  // 1. Send via user's SMTP credentials
  if (mailConfig.smtpHost && mailConfig.smtpUser && mailConfig.smtpPass) {
    const transporter = nodemailer.createTransport({
      host: mailConfig.smtpHost,
      port: Number(mailConfig.smtpPort) || 587,
      secure: mailConfig.smtpSecure ?? false,
      auth: {
        user: mailConfig.smtpUser,
        pass: mailConfig.smtpPass,
      },
    })

    await transporter.sendMail({
      from: `"${mailConfig.fromName || 'Outreach'}" <${mailConfig.fromEmail || mailConfig.smtpUser}>`,
      to,
      subject,
      html,
    })
  } else {
    // 2. Send via Resend API (user-supplied key or global fallback)
    const apiKey = mailConfig.resendApiKey || process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('No custom SMTP credentials or Resend API key configured.')
    }

    const from = mailConfig.fromEmail 
      ? `"${mailConfig.fromName || 'Outreach'}" <${mailConfig.fromEmail}>`
      : '"Outreach" <onboarding@resend.dev>'

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Resend email dispatch failed: ${errText}`)
    }
  }
}

export function registerOutreachWorker() {
  const connection = getRedisConnection()

  return new Worker<OutreachJobData>(
    'outreachQueue',
    async (job) => {
      const { campaignSendId, campaignId, contactId, userId, to, subject, body, mailConfig } = job.data

      try {
        // 1. Re-check suppression immediately before sending (recipient could have unsubscribed)
        const isSuppressed = await prisma.suppressionEntry.findFirst({
          where: { email: to.toLowerCase() }
        })

        if (isSuppressed) {
          console.log(`Skipping suppressed email: ${to}`)
          await prisma.campaignSend.update({
            where: { id: campaignSendId },
            data: { status: 'skipped' }
          })
          return
        }

        // 2. Append Unsubscribe links & tracking pixel (CAN-SPAM compliant)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const trackingPixel = `<img src="${appUrl}/api/outreach/track/open?sendId=${campaignSendId}" width="1" height="1" style="display:none;" />`
        const unsubscribeLink = `<p style="margin-top: 30px; font-size: 11px; color: #888;">
          You received this email because you are in our outreach directory. 
          To stop receiving emails, you can <a href="${appUrl}/api/outreach/track/unsubscribe?email=${encodeURIComponent(to.toLowerCase())}&userId=${userId}">unsubscribe here</a>.
          <br/>
          Sender Address: ${mailConfig.physicalAddress || '123 RexionAI Tech Boulevard, San Francisco, CA 94107'}
        </p>`

        const formattedHtml = `
          <div style="font-family: sans-serif; font-size: 14px; line-height: 1.6; color: #333;">
            ${body.replace(/\n/g, '<br/>')}
            ${unsubscribeLink}
            ${trackingPixel}
          </div>
        `

        // Update send record to sending status
        await prisma.campaignSend.update({
          where: { id: campaignSendId },
          data: { status: 'sending' }
        })

        // 3. Send email using user's mail options
        await sendCampaignEmail(to, subject, formattedHtml, mailConfig, userId)

        // 4. Update status to sent
        await prisma.campaignSend.update({
          where: { id: campaignSendId },
          data: {
            status: 'sent',
            sentAt: new Date()
          }
        })
      } catch (error: any) {
        console.error(`Failed to send email to ${to}:`, error)
        await prisma.campaignSend.update({
          where: { id: campaignSendId },
          data: {
            status: 'failed',
          }
        })
        throw error
      }
    },
    {
      connection,
      // Throttled to 1 send per 4 seconds
      limiter: {
        max: 1,
        duration: 4000,
      },
    }
  )
}
