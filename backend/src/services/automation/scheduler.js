import cron from 'node-cron'
import db from '../../lib/db.js'
import { AUTOMATION_SCHEDULER_ENABLED, AUTOMATION_TICK_CRON } from '../../config/env.js'
import { ensureAutomationSchema } from './schema.js'
import { getDueScheduledUsers } from './settingsService.js'
import { runAutomationForUser } from './postPipeline.js'

let started = false

function nextDailyRun(cronTime) {
  const now = new Date()
  const [hourRaw, minuteRaw] = String(cronTime || '09:00').split(':')
  const next = new Date(now)
  next.setHours(Number(hourRaw || 9), Number(minuteRaw || 0), 0, 0)
  if (next <= now) {
    next.setDate(next.getDate() + 1)
  }
  return next
}

async function recordRun(userId, runType, status, error = null, metadata = {}) {
  await db.query(
    `INSERT INTO automation_runs (user_id, run_type, status, error, finished_at, metadata)
     VALUES ($1, $2, $3, $4, now(), $5)`,
    [userId, runType, status, error, metadata]
  )
}

export async function tickAutomationScheduler() {
  await ensureAutomationSchema()
  const users = await getDueScheduledUsers()

  for (const user of users) {
    try {
      await runAutomationForUser(user.user_id, { reason: 'scheduled' })
      await db.query(
        `UPDATE automation_settings
         SET last_run_at = now(), next_run_at = $1, updated_at = now()
         WHERE user_id = $2`,
        [nextDailyRun(user.cron_time), user.user_id]
      )
      await recordRun(user.user_id, 'scheduled', 'success')
    } catch (err) {
      console.error(`Automation scheduler failed for user ${user.user_id}:`, err.message)
      await db.query(
        `UPDATE automation_settings
         SET last_run_at = now(), next_run_at = $1, updated_at = now()
         WHERE user_id = $2`,
        [nextDailyRun(user.cron_time), user.user_id]
      )
      await recordRun(user.user_id, 'scheduled', 'failed', err.message)
    }
  }
}

export function startAutomationScheduler() {
  if (started || !AUTOMATION_SCHEDULER_ENABLED) {
    return
  }

  started = true
  cron.schedule(AUTOMATION_TICK_CRON || '*/1 * * * *', () => {
    tickAutomationScheduler().catch((err) => {
      console.error('Automation scheduler tick failed:', err.message)
    })
  })

  console.log(`LinkedIn automation scheduler started (${AUTOMATION_TICK_CRON || '*/1 * * * *'}).`)
}
