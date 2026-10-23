import { DatabaseSync } from 'node:sqlite'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Standard data path: backend/data/rexion.sqlite
const DB_PATH = path.resolve(__dirname, '../../data/rexion.sqlite')

let dbInstance = null

export function getSqliteDb() {
  if (dbInstance) return dbInstance

  const dataDir = path.dirname(DB_PATH)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  dbInstance = new DatabaseSync(DB_PATH)
  try {
    dbInstance.exec('PRAGMA journal_mode = WAL;')
    dbInstance.exec('PRAGMA busy_timeout = 5000;')
  } catch (err) {
    // In-memory or restricted pragma fallback
  }

  ensureSocialConnectionsSchema(dbInstance)
  return dbInstance
}

export function ensureSocialConnectionsSchema(db = getSqliteDb()) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS social_connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      platform TEXT NOT NULL CHECK(platform IN ('linkedin', 'instagram')),
      account_handle TEXT NOT NULL,
      access_token TEXT,
      telegram_chat_id TEXT,
      autopilot_enabled INTEGER NOT NULL DEFAULT 0,
      queue_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    DROP INDEX IF EXISTS idx_social_connections_platform_handle;

    CREATE INDEX IF NOT EXISTS idx_social_connections_user_platform 
      ON social_connections(user_id, platform);
  `)

  // Migrate optional configuration columns if not present
  const optionalColumns = [
    { name: 'target_job_titles', type: 'TEXT' },
    { name: 'message_template', type: 'TEXT' },
    { name: 'daily_limit', type: 'INTEGER DEFAULT 25' },
    { name: 'schedule_times', type: "TEXT DEFAULT '17:00, 19:00'" },
    { name: 'reel_prompt', type: 'TEXT' },
    { name: 'config', type: "TEXT DEFAULT '{}'" }
  ]
  for (const col of optionalColumns) {
    try {
      db.exec(`ALTER TABLE social_connections ADD COLUMN ${col.name} ${col.type};`)
    } catch {
      // Column already exists
    }
  }
}

/**
 * Get comprehensive connection status for live telemetry
 */
export function getConnectionStatus({ userId = null } = {}) {
  const connections = getAllConnections({ userId })
  const igConn = connections.find(c => c.platform === 'instagram')
  const liConn = connections.find(c => c.platform === 'linkedin')

  let igConfig = {}
  try {
    igConfig = typeof igConn?.config === 'string' ? JSON.parse(igConn.config || '{}') : (igConn?.config || {})
  } catch {}

  return {
    success: true,
    instagram: {
      connected: Boolean(igConn && (igConn.access_token || igConn.account_handle)),
      username: igConn?.account_handle || null,
      accountName: igConn?.account_handle ? `@${igConn.account_handle}` : null,
      accessToken: igConn?.access_token || null,
      autopilot: Boolean(igConn?.autopilot_enabled),
      queueCount: Number(igConn?.queue_count || 0),
      telegramChatId: igConn?.telegram_chat_id || null,
      reelPrompt: igConn?.reel_prompt || '',
      scheduleTimes: igConn?.schedule_times || '17:00 & 19:00 IST',
      updatedAt: igConn?.updated_at || null,
      id: igConn?.id || null,
      appId: igConfig.appId || '',
      hasAppSecret: Boolean(igConfig.appSecret),
      appSecret: igConfig.appSecret || '',
      igUserId: igConn?.target_job_titles || igConfig.igUserId || '',
      githubRepo: igConfig.githubRepo || '',
      contentType: igConfig.contentType || (igConfig.githubRepo ? 'github' : 'topic')
    },
    linkedin: {
      connected: Boolean(liConn && (liConn.access_token || liConn.account_handle)),
      accountName: liConn?.account_handle || null,
      handle: liConn?.account_handle || null,
      accessToken: liConn?.access_token || null,
      targetJobTitles: liConn?.target_job_titles || '',
      messageTemplate: liConn?.message_template || "Hi {firstName}, loved your recent work on system scalability. Would be great to connect!",
      dailyLimit: Number(liConn?.daily_limit || 25),
      autopilot: Boolean(liConn?.autopilot_enabled),
      queueCount: Number(liConn?.queue_count || 0),
      scheduleTimes: liConn?.schedule_times || '09:00 & 18:00 IST',
      reelPrompt: liConn?.reel_prompt || '',
      updatedAt: liConn?.updated_at || null,
      id: liConn?.id || null
    },
    connections
  }
}

/**
 * Fetch all connections with optional user and platform filters
 */
export function getAllConnections({ userId = null, platform = null } = {}) {
  const db = getSqliteDb()
  const conditions = []
  const params = []

  if (userId !== null && userId !== undefined) {
    conditions.push('(user_id = ? OR CAST(user_id AS TEXT) = CAST(? AS TEXT))')
    params.push(userId, String(userId))
  }

  if (platform) {
    conditions.push('platform = ?')
    params.push(platform)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const query = `
    SELECT 
      id,
      user_id,
      platform,
      account_handle,
      access_token,
      telegram_chat_id,
      autopilot_enabled,
      queue_count,
      target_job_titles,
      message_template,
      daily_limit,
      schedule_times,
      reel_prompt,
      config,
      created_at,
      updated_at
    FROM social_connections 
    ${whereClause}
    ORDER BY id DESC
  `

  const rows = db.prepare(query).all(...params)
  return rows.map(r => ({
    ...r,
    autopilot_enabled: Boolean(r.autopilot_enabled)
  }))
}

/**
 * Fetch a single connection by ID
 */
export function getConnectionById(id) {
  const db = getSqliteDb()
  const row = db.prepare(`
    SELECT 
      id,
      user_id,
      platform,
      account_handle,
      access_token,
      telegram_chat_id,
      autopilot_enabled,
      queue_count,
      created_at,
      updated_at
    FROM social_connections 
    WHERE id = ?
  `).get(id)

  if (!row) return null
  return {
    ...row,
    autopilot_enabled: Boolean(row.autopilot_enabled)
  }
}

/**
 * Save or update (upsert) a social connection
 */
export function saveConnection(params = {}) {
  const {
    id = null,
    userId = params.user_id ?? null,
    platform = params.platform,
    accountHandle = params.account_handle || params.accountHandle || '',
    accessToken = params.access_token || params.accessToken || '',
    telegramChatId = params.telegram_chat_id || params.telegramChatId || '',
    autopilotEnabled = params.autopilot_enabled !== undefined ? params.autopilot_enabled : (params.autopilotEnabled ?? true),
    queueCount = params.queue_count ?? params.queueCount ?? 0,
    targetJobTitles = params.target_job_titles || params.targetJobTitles || '',
    messageTemplate = params.message_template || params.messageTemplate || '',
    dailyLimit = params.daily_limit ?? params.dailyLimit ?? 25,
    scheduleTimes = params.schedule_times || params.scheduleTimes || '17:00, 19:00',
    reelPrompt = params.reel_prompt || params.reelPrompt || '',
    config = params.config || '{}'
  } = params

  if (!platform || !['linkedin', 'instagram'].includes(platform.toLowerCase())) {
    throw new Error("Invalid platform: must be either 'linkedin' or 'instagram'")
  }

  if (!accountHandle || typeof accountHandle !== 'string' || !accountHandle.trim()) {
    throw new Error('account_handle is required')
  }

  const normalizedPlatform = platform.toLowerCase()
  const normalizedHandle = accountHandle.trim()
  const autopilotVal = autopilotEnabled ? 1 : 0
  const qCount = Number.isFinite(Number(queueCount)) ? Math.max(0, Number(queueCount)) : 0
  const dLimit = Number.isFinite(Number(dailyLimit)) ? Math.max(1, Math.min(100, Number(dailyLimit))) : 25
  const sTimes = scheduleTimes || '17:00, 19:00'
  const db = getSqliteDb()

  if (id) {
    // Explicit update by ID
    const stmt = db.prepare(`
      UPDATE social_connections
      SET 
        user_id = COALESCE(?, user_id),
        platform = ?,
        account_handle = ?,
        access_token = ?,
        telegram_chat_id = ?,
        autopilot_enabled = ?,
        queue_count = ?,
        target_job_titles = COALESCE(?, target_job_titles),
        message_template = COALESCE(?, message_template),
        daily_limit = ?,
        schedule_times = ?,
        reel_prompt = COALESCE(?, reel_prompt),
        config = COALESCE(?, config),
        updated_at = datetime('now')
      WHERE id = ?
    `)
    stmt.run(
      userId,
      normalizedPlatform,
      normalizedHandle,
      accessToken,
      telegramChatId,
      autopilotVal,
      qCount,
      targetJobTitles,
      messageTemplate,
      dLimit,
      sTimes,
      reelPrompt,
      typeof config === 'object' ? JSON.stringify(config) : config,
      id
    )
    return getConnectionById(id)
  }

  // Check if connection already exists for user and platform, or fallback to account_handle
  let existing = null
  if (userId !== null && userId !== undefined) {
    existing = db.prepare(`
      SELECT id FROM social_connections 
      WHERE platform = ? AND (user_id = ? OR CAST(user_id AS TEXT) = CAST(? AS TEXT))
    `).get(normalizedPlatform, userId, String(userId))
  }
  if (!existing) {
    existing = db.prepare(`
      SELECT id FROM social_connections 
      WHERE platform = ? AND account_handle = ? AND (user_id IS NULL OR user_id = ? OR CAST(user_id AS TEXT) = CAST(? AS TEXT))
    `).get(normalizedPlatform, normalizedHandle, userId || null, String(userId || ''))
  }

  if (existing) {
    const stmt = db.prepare(`
      UPDATE social_connections
      SET 
        user_id = COALESCE(?, user_id),
        access_token = CASE WHEN ? != '' THEN ? ELSE access_token END,
        telegram_chat_id = CASE WHEN ? != '' THEN ? ELSE telegram_chat_id END,
        autopilot_enabled = ?,
        queue_count = ?,
        target_job_titles = CASE WHEN ? != '' THEN ? ELSE target_job_titles END,
        message_template = CASE WHEN ? != '' THEN ? ELSE message_template END,
        daily_limit = ?,
        schedule_times = ?,
        reel_prompt = CASE WHEN ? != '' THEN ? ELSE reel_prompt END,
        config = CASE WHEN ? != '{}' THEN ? ELSE config END,
        updated_at = datetime('now')
      WHERE id = ?
    `)
    const confStr = typeof config === 'object' ? JSON.stringify(config) : config
    stmt.run(
      userId,
      accessToken, accessToken,
      telegramChatId, telegramChatId,
      autopilotVal,
      qCount,
      targetJobTitles, targetJobTitles,
      messageTemplate, messageTemplate,
      dLimit,
      sTimes,
      reelPrompt, reelPrompt,
      confStr, confStr,
      existing.id
    )
    return getConnectionById(existing.id)
  }

  // Insert new connection
  const stmt = db.prepare(`
    INSERT INTO social_connections (
      user_id,
      platform,
      account_handle,
      access_token,
      telegram_chat_id,
      autopilot_enabled,
      queue_count,
      target_job_titles,
      message_template,
      daily_limit,
      schedule_times,
      reel_prompt,
      config,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `)

  const confStr = typeof config === 'object' ? JSON.stringify(config) : config
  const res = stmt.run(
    userId,
    normalizedPlatform,
    normalizedHandle,
    accessToken,
    telegramChatId,
    autopilotVal,
    qCount,
    targetJobTitles,
    messageTemplate,
    dLimit,
    sTimes,
    reelPrompt,
    confStr
  )

  return getConnectionById(res.lastInsertRowid)
}

/**
 * Toggle autopilot status for a specific connection
 */
export function toggleAutopilot(id, enabled = null) {
  const db = getSqliteDb()
  const existing = getConnectionById(id)
  if (!existing) {
    throw new Error(`Connection with id ${id} not found`)
  }

  const nextVal = enabled !== null ? (enabled ? 1 : 0) : (existing.autopilot_enabled ? 0 : 1)

  db.prepare(`
    UPDATE social_connections
    SET autopilot_enabled = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(nextVal, id)

  return getConnectionById(id)
}

/**
 * Partial update for a connection
 */
export function updateConnection(id, updates = {}) {
  const existing = getConnectionById(id)
  if (!existing) {
    throw new Error(`Connection with id ${id} not found`)
  }

  const fields = []
  const values = []

  if (updates.accountHandle || updates.account_handle) {
    fields.push('account_handle = ?')
    values.push((updates.accountHandle || updates.account_handle).trim())
  }
  if (updates.accessToken !== undefined || updates.access_token !== undefined || updates.li_at_cookie !== undefined) {
    fields.push('access_token = ?')
    values.push(updates.accessToken !== undefined ? updates.accessToken : (updates.access_token !== undefined ? updates.access_token : updates.li_at_cookie))
  }
  if (updates.telegramChatId !== undefined || updates.telegram_chat_id !== undefined) {
    fields.push('telegram_chat_id = ?')
    values.push(updates.telegramChatId !== undefined ? updates.telegramChatId : updates.telegram_chat_id)
  }
  if (updates.autopilotEnabled !== undefined || updates.autopilot_enabled !== undefined) {
    fields.push('autopilot_enabled = ?')
    const val = updates.autopilotEnabled !== undefined ? updates.autopilotEnabled : updates.autopilot_enabled
    values.push(val ? 1 : 0)
  }
  if (updates.queueCount !== undefined || updates.queue_count !== undefined) {
    fields.push('queue_count = ?')
    const cnt = updates.queueCount !== undefined ? updates.queueCount : updates.queue_count
    values.push(Number(cnt || 0))
  }
  if (updates.targetJobTitles !== undefined || updates.target_job_titles !== undefined) {
    fields.push('target_job_titles = ?')
    values.push(updates.targetJobTitles !== undefined ? updates.targetJobTitles : updates.target_job_titles)
  }
  if (updates.messageTemplate !== undefined || updates.message_template !== undefined) {
    fields.push('message_template = ?')
    values.push(updates.messageTemplate !== undefined ? updates.messageTemplate : updates.message_template)
  }
  if (updates.dailyLimit !== undefined || updates.daily_limit !== undefined) {
    fields.push('daily_limit = ?')
    values.push(Number(updates.dailyLimit !== undefined ? updates.dailyLimit : updates.daily_limit))
  }
  if (updates.scheduleTimes !== undefined || updates.schedule_times !== undefined) {
    fields.push('schedule_times = ?')
    values.push(updates.scheduleTimes !== undefined ? updates.scheduleTimes : updates.schedule_times)
  }
  if (updates.reelPrompt !== undefined || updates.reel_prompt !== undefined) {
    fields.push('reel_prompt = ?')
    values.push(updates.reelPrompt !== undefined ? updates.reelPrompt : updates.reel_prompt)
  }
  if (updates.config !== undefined) {
    fields.push('config = ?')
    values.push(typeof updates.config === 'object' ? JSON.stringify(updates.config) : updates.config)
  }
  if (updates.userId !== undefined || updates.user_id !== undefined) {
    fields.push('user_id = ?')
    values.push(updates.userId !== undefined ? updates.userId : updates.user_id)
  }

  if (fields.length === 0) return existing

  fields.push("updated_at = datetime('now')")
  values.push(id)

  const db = getSqliteDb()
  db.prepare(`
    UPDATE social_connections
    SET ${fields.join(', ')}
    WHERE id = ?
  `).run(...values)

  return getConnectionById(id)
}

/**
 * Delete a connection
 */
export function deleteConnection(id) {
  const existing = getConnectionById(id)
  if (!existing) {
    return false
  }

  const db = getSqliteDb()
  db.prepare('DELETE FROM social_connections WHERE id = ?').run(id)
  return true
}
