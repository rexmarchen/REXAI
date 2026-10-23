import cron from 'node-cron'
import db from '../../lib/db.js'
import { AUTOMATION_SCHEDULER_ENABLED, AUTOMATION_TICK_CRON } from '../../config/env.js'
import { ensureAutomationSchema } from './schema.js'
import { getDueScheduledUsers } from './settingsService.js'
import { runAutomationForUser } from './postPipeline.js'
import { getSqliteDb } from '../socialConnectionsSqliteService.js'
import { canPublishToLinkedIn } from '../entitlementService.js'

let started = false

export async function tickMultiUserSqliteScheduler() {
  try {
    const db = getSqliteDb()
    const activeConnections = db.prepare(`
      SELECT * FROM social_connections 
      WHERE platform = 'linkedin' AND autopilot_enabled = 1 AND access_token IS NOT NULL AND access_token != ''
    `).all()

    for (const conn of activeConnections) {
      if (!conn.access_token || !conn.target_job_titles) continue

      // MANDATORY SUBSCRIPTION & ENTITLEMENT GATE
      const gate = await canPublishToLinkedIn(conn.user_id, conn.id)
      if (!gate.allowed) {
        console.warn(`[tickMultiUserSqliteScheduler] Skipping user ${conn.user_id}: ${gate.message}`)
        try {
          db.prepare('UPDATE social_connections SET autopilot_enabled = 0 WHERE id = ?').run(conn.id)
        } catch {}
        continue
      }
      try {
        const isOwner = Boolean(conn.user_id == 1 || conn.user_id === '1')
        const authorName = conn.account_handle || (isOwner ? 'Anshu Pal' : 'Software Engineer')
        const topic = conn.reel_prompt || 'System Design & Distributed Systems: Architecture and Resiliency'
        const personUrn = conn.target_job_titles
        await fetch('http://127.0.0.1:3000/trigger-daily', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: conn.user_id,
            accessToken: conn.access_token,
            personUrn: personUrn,
            authorUrn: personUrn,
            authorName,
            isOwner,
            topic
          }),
          signal: AbortSignal.timeout(60000)
        })
      } catch (agentErr) {
        // Standalone agent cycle notice
      }
      // Add safe stagger delay between consecutive users (1.5 seconds) to prevent burst rate limits
      await new Promise(r => setTimeout(r, 1500))
    }
  } catch (err) {
    console.warn('[tickMultiUserSqliteScheduler] Notice:', err.message)
  }
}

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
  try {
    await tickMultiUserSqliteScheduler()
  } catch (err) {
    // Non-blocking SQLite cycle
  }

  try {
    await ensureAutomationSchema()
    const users = await getDueScheduledUsers()

    for (const user of users) {
      // MANDATORY SUBSCRIPTION & ENTITLEMENT GATE
      const gate = await canPublishToLinkedIn(user.user_id)
      if (!gate.allowed) {
        console.warn(`[tickAutomationScheduler] Skipping expired/ineligible user ${user.user_id}: ${gate.message}`)
        await recordRun(user.user_id, 'scheduled', 'blocked', gate.message)
        continue
      }

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
  } catch (pgErr) {
    // Graceful fallback when Postgres is inactive
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
