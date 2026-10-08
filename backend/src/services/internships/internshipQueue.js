import { Queue, Worker } from 'bullmq'
import Redis from 'ioredis'
import { runInternshipIngestion } from './internshipIngestionService.js'
import logger from '../../utils/logger.js'

const REFRESH_INTERVAL_MINUTES = Number(process.env.INTERNSHIP_REFRESH_INTERVAL_MINUTES) || 5
const QUEUE_NAME = 'internship-ingestion'

let internshipQueue = null
let internshipWorker = null
let redisClient = null
let fallbackIntervalId = null

export function initInternshipQueue() {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379'
  
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn('[InternshipQueue] Redis unreachable, switching to Node interval scheduler fallback')
          startFallbackScheduler()
          return null // Stop reconnection spam
        }
        return Math.min(times * 500, 2000)
      }
    })

    redisClient.on('error', (err) => {
      // Graceful silence, fallback will handle
    })

    redisClient.on('connect', async () => {
      logger.info('[InternshipQueue] Redis connected for internship ingestion queue')
      if (fallbackIntervalId) {
        clearInterval(fallbackIntervalId)
        fallbackIntervalId = null
      }
      setupBullMQ()
    })
  } catch (err) {
    logger.warn('[InternshipQueue] Could not initialize Redis client, using fallback scheduler')
    startFallbackScheduler()
  }

  // Also run an initial seed ingestion on boot asynchronously
  setTimeout(() => {
    runInternshipIngestion().catch((e) => {
      logger.warn(`[InternshipQueue] Initial boot ingestion note: ${e.message}`)
    })
  }, 3000)
}

function setupBullMQ() {
  if (internshipQueue) return

  try {
    internshipQueue = new Queue(QUEUE_NAME, {
      connection: redisClient,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: 100,
        removeOnFail: 50
      }
    })

    internshipWorker = new Worker(
      QUEUE_NAME,
      async (job) => {
        logger.info(`[InternshipQueue] Executing ingestion job #${job.id}`)
        return await runInternshipIngestion()
      },
      { connection: redisClient }
    )

    internshipWorker.on('completed', (job) => {
      logger.info(`[InternshipQueue] Job #${job.id} completed successfully`)
    })

    internshipWorker.on('failed', (job, err) => {
      logger.error(`[InternshipQueue] Job #${job?.id} failed: ${err.message}`)
    })

    // Schedule repeatable job
    internshipQueue.add(
      'periodic-refresh',
      {},
      {
        repeat: {
          every: REFRESH_INTERVAL_MINUTES * 60 * 1000
        }
      }
    )
    logger.info(`[InternshipQueue] BullMQ repeatable ingestion scheduled every ${REFRESH_INTERVAL_MINUTES} minutes`)
  } catch (e) {
    logger.warn('[InternshipQueue] BullMQ setup failed, falling back to interval scheduler')
    startFallbackScheduler()
  }
}

function startFallbackScheduler() {
  if (fallbackIntervalId) return
  logger.info(`[InternshipQueue] In-memory timer scheduler active: every ${REFRESH_INTERVAL_MINUTES} minutes`)
  fallbackIntervalId = setInterval(() => {
    runInternshipIngestion().catch((err) => {
      logger.error(`[InternshipQueue] Scheduled ingestion failed: ${err.message}`)
    })
  }, REFRESH_INTERVAL_MINUTES * 60 * 1000)
}

export async function triggerManualIngestion() {
  logger.info('[InternshipQueue] Manual ingestion triggered by administrator')
  return await runInternshipIngestion()
}

export default {
  initInternshipQueue,
  triggerManualIngestion
}
