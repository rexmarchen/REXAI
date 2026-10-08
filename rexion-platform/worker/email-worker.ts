import dotenv from 'dotenv'
import path from 'path'

// Load environment variables (useful when running as a standalone worker process)
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { registerOutreachWorker } from '../src/lib/queue'

const worker = registerOutreachWorker()

console.info('REXION outreach queue worker started.')

worker.on('completed', (job) => {
  console.info(`Outreach email job completed: ${job.id}`)
})

worker.on('failed', (job, error) => {
  console.error(`Outreach email job failed: ${job?.id}`, error)
})
