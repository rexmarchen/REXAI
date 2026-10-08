import db from '../../lib/db.js'
import { ensureAutomationSchema } from './schema.js'

export async function getOrCreateSettings(userId) {
  await ensureAutomationSchema()
  const result = await db.query(
    `INSERT INTO automation_settings (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING *`,
    [userId]
  )
  return result.rows[0]
}

export async function updateSettings(userId, updates) {
  await ensureAutomationSchema()
  await getOrCreateSettings(userId)

  const allowed = {
    schedule_enabled: 'schedule_enabled',
    approval_mode: 'approval_mode',
    cron_time: 'cron_time',
    cron_timezone: 'cron_timezone',
    full_auto_enabled: 'full_auto_enabled',
    daily_post_limit: 'daily_post_limit',
    github_username: 'github_username'
  }

  const sets = []
  const values = []

  for (const [key, column] of Object.entries(allowed)) {
    if (Object.hasOwn(updates, key)) {
      values.push(updates[key])
      sets.push(`${column} = $${values.length}`)
    }
  }

  if (sets.length === 0) {
    return getOrCreateSettings(userId)
  }

  values.push(userId)
  const result = await db.query(
    `UPDATE automation_settings
     SET ${sets.join(', ')}, updated_at = now()
     WHERE user_id = $${values.length}
     RETURNING *`,
    values
  )

  return result.rows[0]
}

export async function getDueScheduledUsers() {
  await ensureAutomationSchema()
  const result = await db.query(`
    SELECT s.*, la.person_urn
    FROM automation_settings s
    JOIN linkedin_accounts la ON la.user_id = s.user_id
    WHERE s.schedule_enabled = true
      AND COALESCE(s.next_run_at, now() - interval '1 minute') <= now()
  `)
  return result.rows
}
