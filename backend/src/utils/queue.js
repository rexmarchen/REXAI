import { Queue, Worker } from 'bullmq'
import IORedis from 'ioredis'
import nodemailer from 'nodemailer'
import CampaignSend from '../models/CampaignSend.js'
import { sendViaMailbox } from '../services/outreachMailboxService.js'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

let queue = null
let worker = null
let redisConnection = null

try {
  redisConnection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    connectTimeout: 5000,
    lazyConnect: true
  })

  // Silent error catch to prevent crash if Redis is not available
  redisConnection.on('error', (err) => {
    console.warn('Redis Connection Error (BullMQ disabled):', err.message)
  })

  // Attempt connection
  redisConnection.connect().then(() => {
    console.info('Successfully connected to Redis. Starting BullMQ queue...')
    
    queue = new Queue('outreachQueue', { connection: redisConnection })

    worker = new Worker('outreachQueue', async (job) => {
      const { campaignSendId, userId, to, subject, body, mailConfig } = job.data

      try {
        await CampaignSend.findByIdAndUpdate(campaignSendId, { status: 'sending' })

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'
        const trackingPixel = `<img src="${appUrl}/api/outreach/track/open?sendId=${campaignSendId}" width="1" height="1" style="display:none;" />`
        const unsubscribeLink = `<br/><br/><p style="font-size:11px;color:#666;">If you no longer wish to receive these emails, you can <a href="${appUrl}/api/outreach/track/unsubscribe?email=${encodeURIComponent(to)}&userId=${userId}">unsubscribe</a>.</p>`
        const footerAddress = mailConfig.physicalAddress ? `<p style="font-size:11px;color:#666;">${mailConfig.physicalAddress}</p>` : ''

        const fullHtml = `${body}${unsubscribeLink}${footerAddress}${trackingPixel}`

        if (mailConfig.mailboxId) {
          await sendViaMailbox({ userId, mailboxId: mailConfig.mailboxId, to, subject, html: fullHtml, fromName: mailConfig.fromName })
        } else {
          const transporter = nodemailer.createTransport({
            host: mailConfig.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(mailConfig.smtpPort || process.env.SMTP_PORT || 465),
            secure: mailConfig.smtpSecure ?? (process.env.SMTP_SECURE === 'true'),
            auth: { user: mailConfig.smtpUser || process.env.SMTP_USER, pass: mailConfig.smtpPass || process.env.SMTP_PASS }
          })
          await transporter.sendMail({ from: `"${mailConfig.fromName || 'Outreach'}" <${mailConfig.fromEmail || process.env.SMTP_USER}>`, to, subject, html: fullHtml })
        }

        await CampaignSend.findByIdAndUpdate(campaignSendId, {
          status: 'sent',
          sentAt: new Date()
        })
      } catch (sendErr) {
        console.error(`BullMQ job ${job.id} failed to send email:`, sendErr.message)
        await CampaignSend.findByIdAndUpdate(campaignSendId, { status: 'failed' })
        throw sendErr
      }
    }, {
      connection: redisConnection,
      limiter: {
        max: 1,
        duration: 4000 // 1 email per 4 seconds
      }
    })

    worker.on('failed', (job, err) => {
      console.error(`BullMQ Outreach job ${job?.id} failed:`, err.message)
    })
  }).catch((err) => {
    console.warn('IORedis failed to connect (Outreach fallback enabled):', err.message)
  })
} catch (err) {
  console.warn('Queue helper failed to initialize:', err.message)
}

export const getQueue = () => queue
export const getWorker = () => worker
