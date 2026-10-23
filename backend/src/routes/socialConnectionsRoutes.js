import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
  getAllConnections,
  getConnectionById,
  getConnectionStatus,
  saveConnection,
  toggleAutopilot,
  updateConnection,
  deleteConnection
} from '../services/socialConnectionsSqliteService.js'
import { triggerAgentPipeline } from '../services/agentTriggerService.js'

const router = express.Router()

const asyncRoute = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next)
  } catch (err) {
    next(err)
  }
}

// User identity is derived strictly from the verified JWT session.
// Client-supplied userId in query/body is never trusted.
function resolveUserId(req) {
  if (!req.user) return null
  return req.user.id || req.user._id?.toString()
}

router.use(protect)

/**
 * GET /api/connections/status & /api/social-connections/status
 * Dynamic Live Telemetry Status from SQLite
 */
router.get('/status', asyncRoute(async (req, res) => {
  const userId = resolveUserId(req)
  const status = getConnectionStatus({ userId: userId || undefined })
  res.json(status)
}))

/**
 * GET /api/social-connections
 * List connections with optional filters (?platform=linkedin|instagram&userId=...)
 */
router.get('/', asyncRoute(async (req, res) => {
  const userId = resolveUserId(req)
  const platform = req.query.platform ? String(req.query.platform).toLowerCase() : null

  const connections = getAllConnections({
    userId: userId || undefined,
    platform: platform || undefined
  })

  res.json({
    success: true,
    count: connections.length,
    connections
  })
}))

/**
 * POST /api/social-connections/toggle
 * Toggle by platform or id
 */
router.post('/toggle', asyncRoute(async (req, res) => {
  const { id, platform, autopilot_enabled, autopilotEnabled, enable } = req.body || {}
  const explicitlyEnabled = autopilot_enabled !== undefined
    ? autopilot_enabled
    : (autopilotEnabled !== undefined ? autopilotEnabled : (enable !== undefined ? enable : null))

  let targetId = id ? Number(id) : null
  if (!targetId && platform) {
    const userId = resolveUserId(req)
    const list = getAllConnections({ userId: userId || undefined, platform: platform.toLowerCase() })
    if (list.length > 0) targetId = list[0].id
  }

  if (!targetId) {
    return res.status(400).json({ success: false, error: 'Target connection ID or active platform required to toggle' })
  }

  const updated = toggleAutopilot(targetId, explicitlyEnabled)

  if (updated.autopilot_enabled) {
    triggerAgentPipeline({
      platform: updated.platform,
      action: 'toggle_autopilot',
      userId: updated.user_id,
      targetTitles: updated.target_job_titles,
      messageTemplate: updated.message_template,
      dailyLimit: updated.daily_limit,
      autopilotEnabled: true
    }).catch((e) => console.warn('[SocialConnections] Trigger error:', e.message))
  }

  res.json({
    success: true,
    message: `Autopilot for @${updated.account_handle} is now ${updated.autopilot_enabled ? 'ENABLED' : 'DISABLED'}`,
    connection: updated
  })
}))

/**
 * GET /api/social-connections/:id
 * Retrieve a single connection
 */
router.get('/:id', asyncRoute(async (req, res) => {
  const id = Number(req.params.id)
  if (!id) {
    return res.status(400).json({ success: false, error: 'Valid connection ID is required' })
  }

  const connection = getConnectionById(id)
  if (!connection) {
    return res.status(404).json({ success: false, error: 'Connection not found' })
  }

  res.json({
    success: true,
    connection
  })
}))

/**
 * POST /api/social-connections
 * Create or upsert a connection
 */
router.post('/', asyncRoute(async (req, res) => {
  const {
    id,
    platform,
    account_handle,
    accountHandle,
    access_token,
    accessToken,
    li_at_cookie,
    telegram_chat_id,
    telegramChatId,
    autopilot_enabled,
    autopilotEnabled,
    queue_count,
    queueCount,
    target_job_titles,
    targetJobTitles,
    message_template,
    messageTemplate,
    daily_limit,
    dailyLimit,
    schedule_times,
    scheduleTimes,
    reel_prompt,
    reelPrompt,
    config
  } = req.body || {}

  const handle = account_handle || accountHandle
  const token = access_token || accessToken || li_at_cookie || ''
  const tgId = telegram_chat_id || telegramChatId || ''
  const isAutopilot = autopilot_enabled !== undefined ? autopilot_enabled : autopilotEnabled
  const qCount = queue_count !== undefined ? queue_count : queueCount
  const targetTitles = target_job_titles || targetJobTitles || ''
  const msgTemplate = message_template || messageTemplate || ''
  const dLimit = daily_limit !== undefined ? daily_limit : dailyLimit
  const sTimes = schedule_times || scheduleTimes || '17:00, 19:00'
  const rPrompt = reel_prompt || reelPrompt || ''
  const resolvedUser = resolveUserId(req)

  if (!platform) {
    return res.status(400).json({ success: false, error: "Missing required field: 'platform' ('linkedin' or 'instagram')" })
  }
  if (!handle) {
    return res.status(400).json({ success: false, error: "Missing required field: 'account_handle'" })
  }

  const saved = saveConnection({
    id: id ? Number(id) : null,
    userId: resolvedUser ? (Number.isFinite(Number(resolvedUser)) ? Number(resolvedUser) : String(resolvedUser)) : null,
    platform,
    accountHandle: handle,
    accessToken: token,
    telegramChatId: tgId,
    autopilotEnabled: Boolean(isAutopilot),
    queueCount: Number(qCount || 0),
    targetJobTitles: targetTitles,
    messageTemplate: msgTemplate,
    dailyLimit: dLimit,
    scheduleTimes: sTimes,
    reelPrompt: rPrompt,
    config: config || '{}'
  })

  if (saved.autopilot_enabled) {
    triggerAgentPipeline({
      platform: saved.platform,
      action: saved.platform === 'linkedin' ? 'start_campaign' : 'enable_autopilot',
      userId: saved.user_id,
      targetTitles: saved.target_job_titles,
      messageTemplate: saved.message_template,
      dailyLimit: saved.daily_limit,
      autopilotEnabled: true
    }).catch((e) => console.warn('[SocialConnections] Trigger error:', e.message))
  }

  res.status(201).json({
    success: true,
    message: `Successfully connected ${saved.platform} account @${saved.account_handle}`,
    connection: saved
  })
}))

/**
 * PATCH /api/social-connections/:id/toggle
 * POST /api/social-connections/:id/toggle
 * Toggle autopilot status
 */
const handleToggle = asyncRoute(async (req, res) => {
  const id = Number(req.params.id)
  if (!id) {
    return res.status(400).json({ success: false, error: 'Valid connection ID is required' })
  }

  const explicitlyEnabled = req.body?.autopilot_enabled !== undefined
    ? req.body.autopilot_enabled
    : (req.body?.autopilotEnabled !== undefined ? req.body.autopilotEnabled : (req.body?.enable !== undefined ? req.body.enable : null))

  const updated = toggleAutopilot(id, explicitlyEnabled)

  if (updated.autopilot_enabled) {
    triggerAgentPipeline({
      platform: updated.platform,
      action: 'toggle_autopilot',
      userId: updated.user_id,
      targetTitles: updated.target_job_titles,
      messageTemplate: updated.message_template,
      dailyLimit: updated.daily_limit,
      autopilotEnabled: true
    }).catch((e) => console.warn('[SocialConnections] Trigger error:', e.message))
  }

  res.json({
    success: true,
    message: `Autopilot for @${updated.account_handle} is now ${updated.autopilot_enabled ? 'ENABLED' : 'DISABLED'}`,
    connection: updated
  })
})

router.patch('/:id/toggle', handleToggle)
router.post('/:id/toggle', handleToggle)

/**
 * POST /api/connections/trigger
 * Direct webhook trigger alias
 */
router.post('/trigger', asyncRoute(async (req, res) => {
  const result = await triggerAgentPipeline(req.body || {})
  res.json({ success: true, result })
}))

/**
 * PATCH /api/social-connections/:id
 * Partial update for a connection
 */
router.patch('/:id', asyncRoute(async (req, res) => {
  const id = Number(req.params.id)
  if (!id) {
    return res.status(400).json({ success: false, error: 'Valid connection ID is required' })
  }

  const updated = updateConnection(id, req.body || {})

  res.json({
    success: true,
    message: `Updated connection @${updated.account_handle}`,
    connection: updated
  })
}))

/**
 * DELETE /api/social-connections/:id
 * Delete/disconnect a connection
 */
router.delete('/:id', asyncRoute(async (req, res) => {
  const id = Number(req.params.id)
  if (!id) {
    return res.status(400).json({ success: false, error: 'Valid connection ID is required' })
  }

  const deleted = deleteConnection(id)
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Connection not found or already deleted' })
  }

  res.json({
    success: true,
    message: `Connection #${id} successfully disconnected`
  })
}))

export default router
