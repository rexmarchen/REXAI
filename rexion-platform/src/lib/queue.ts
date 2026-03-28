import IORedis from 'ioredis'
import { Queue, Worker } from 'bullmq'
import { sendEmail } from '@/lib/email'
import { updateCampaignContactDeliveryStatus } from '@/lib/server-data'

export interface SendEmailJobData {
  campaignId: string
  contactId: string
  userId: string
  to: string
  subject: string
  html: string
  tracking: boolean
  followUp?: {
    enabled: boolean
    days: number
    message: string
  }
}

let queue: Queue<SendEmailJobData> | null = null
let redisConnection: IORedis | null = null

function getRedisConnection() {
  if (!process.env.REDIS_URL) {
    return null
  }

  if (!redisConnection) {
    redisConnection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    })
  }

  return redisConnection
}

export function getEmailQueue() {
  const connection = getRedisConnection()
  if (!connection) {
    return null
  }

  if (!queue) {
    queue = new Queue<SendEmailJobData>('emailQueue', {
      connection,
    })
  }

  return queue
}

export async function enqueueEmailJobs(jobs: SendEmailJobData[]) {
  const emailQueue = getEmailQueue()
  if (!emailQueue) {
    for (const job of jobs) {
      await sendEmail({
        to: job.to,
        subject: job.subject,
        html: job.html,
      })
    }

    return { queued: jobs.length, mode: 'inline' as const }
  }

  await emailQueue.addBulk(
    jobs.map((job) => ({
      name: 'sendEmail',
      data: job,
      opts: {
        removeOnComplete: true,
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 3000,
        },
      },
    }))
  )

  return { queued: jobs.length, mode: 'queue' as const }
}

export function registerEmailWorker() {
  const connection = getRedisConnection()
  if (!connection) {
    return null
  }

  return new Worker<SendEmailJobData>(
    'emailQueue',
    async (job) => {
      try {
        await sendEmail({
          to: job.data.to,
          subject: job.data.subject,
          html: job.data.html,
        })

        await updateCampaignContactDeliveryStatus({
          campaignId: job.data.campaignId,
          contactId: job.data.contactId,
          userId: job.data.userId,
          status: 'sent',
        })
      } catch (error) {
        await updateCampaignContactDeliveryStatus({
          campaignId: job.data.campaignId,
          contactId: job.data.contactId,
          userId: job.data.userId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Queue delivery failed',
        })

        throw error
      }
    },
    {
      connection,
      limiter: {
        max: 1,
        duration: 3000,
      },
    }
  )
}
