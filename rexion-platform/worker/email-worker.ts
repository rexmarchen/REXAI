import { registerEmailWorker } from '@/lib/queue'

const worker = registerEmailWorker()

if (!worker) {
  console.info('Email worker not started because REDIS_URL is not configured.')
  process.exit(0)
}

console.info('REXION email worker started.')

worker.on('completed', (job) => {
  console.info(`Email job completed: ${job.id}`)
})

worker.on('failed', (job, error) => {
  console.error(`Email job failed: ${job?.id}`, error)
})
