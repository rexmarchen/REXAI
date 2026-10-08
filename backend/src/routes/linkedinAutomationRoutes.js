import express from 'express'
import { optionalProtect } from '../middleware/authMiddleware.js'
import { resolveAutomationUser, saveSession } from '../services/automation/userBridge.js'
import { ensureAutomationSchema } from '../services/automation/schema.js'
import { getLinkedInAccountStatus, testLinkedInToken, saveDirectLinkedInToken } from '../services/automation/linkedinTokenService.js'
import { testGeminiApiKey } from '../services/automation/geminiService.js'
import { getOrCreateSettings, updateSettings } from '../services/automation/settingsService.js'
import { addKnowledgeEntry, getRecentKnowledge } from '../services/automation/knowledgeService.js'
import { getUserRepos, syncGitHubForUser } from '../services/automation/githubService.js'
import {
  generateDraftForUser,
  getDrafts,
  getPostHistory,
  publishDraftForUser,
  rejectDraftForUser,
  runAutomationForUser
} from '../services/automation/postPipeline.js'

const router = express.Router()

const asyncRoute = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next)
  } catch (err) {
    next(err)
  }
}

function publicSettings(row) {
  return {
    scheduleEnabled: Boolean(row.schedule_enabled),
    approvalMode: row.approval_mode,
    cronTime: row.cron_time ? String(row.cron_time).slice(0, 5) : '',
    cronTimezone: row.cron_timezone,
    fullAutoEnabled: Boolean(row.full_auto_enabled),
    dailyPostLimit: Number(row.daily_post_limit || 1),
    githubUsername: row.github_username || '',
    lastRunAt: row.last_run_at,
    nextRunAt: row.next_run_at
  }
}

function normalizeSettingsPayload(body) {
  const updates = {}
  if (Object.hasOwn(body, 'scheduleEnabled')) updates.schedule_enabled = Boolean(body.scheduleEnabled)
  if (Object.hasOwn(body, 'approvalMode')) updates.approval_mode = body.approvalMode === 'auto_publish' ? 'auto_publish' : 'draft_approve'
  if (Object.hasOwn(body, 'cronTime')) updates.cron_time = body.cronTime || null
  if (Object.hasOwn(body, 'cronTimezone')) updates.cron_timezone = body.cronTimezone || 'UTC'
  if (Object.hasOwn(body, 'fullAutoEnabled')) updates.full_auto_enabled = Boolean(body.fullAutoEnabled)
  if (Object.hasOwn(body, 'dailyPostLimit')) updates.daily_post_limit = Math.max(1, Math.min(10, Number(body.dailyPostLimit || 1)))
  if (Object.hasOwn(body, 'githubUsername')) updates.github_username = String(body.githubUsername || '').trim()
  return updates
}

router.use(optionalProtect)

router.get('/status', asyncRoute(async (req, res) => {
  try {
    await ensureAutomationSchema()
    const userId = await resolveAutomationUser(req)
    const [settings, linkedin, knowledge, repos, drafts, history] = await Promise.all([
      getOrCreateSettings(userId),
      getLinkedInAccountStatus(userId),
      getRecentKnowledge(userId, 6),
      getUserRepos(userId, 8),
      getDrafts(userId, 8),
      getPostHistory(userId, 10)
    ])

    res.json({
      userId,
      linkedin,
      settings: publicSettings(settings),
      knowledge,
      repos,
      drafts,
      history
    })
  } catch (err) {
    console.warn('[LinkedIn Automation Status Warning]:', err.message)
    res.json({
      userId: req.user?.id || 1,
      linkedin: { connected: false, accountName: 'Not Connected', headline: '', expiresAt: null },
      settings: {
        scheduleEnabled: false,
        approvalMode: 'draft_approve',
        cronTime: '09:00',
        cronTimezone: 'UTC',
        fullAutoEnabled: false,
        dailyPostLimit: 1,
        githubUsername: '',
        lastRunAt: null,
        nextRunAt: null
      },
      knowledge: [],
      repos: [],
      drafts: [],
      history: []
    })
  }
}))

router.post('/connect-session', asyncRoute(async (req, res) => {
  const userId = await resolveAutomationUser(req)
  if (req.session) {
    req.session.userId = userId
    await saveSession(req)
  }
  res.json({ connectUrl: '/connect/auth/linkedin/connect' })
}))

router.patch('/settings', asyncRoute(async (req, res) => {
  const userId = await resolveAutomationUser(req)
  const settings = await updateSettings(userId, normalizeSettingsPayload(req.body || {}))
  res.json({ settings: publicSettings(settings) })
}))

router.post('/knowledge/notes', asyncRoute(async (req, res) => {
  const userId = await resolveAutomationUser(req)
  const title = String(req.body?.title || '').trim()
  const content = String(req.body?.content || '').trim()

  if (!content) {
    return res.status(400).json({ message: 'Note content is required.' })
  }

  const entry = await addKnowledgeEntry(userId, {
    entryType: 'note',
    source: 'dashboard',
    title,
    content
  })

  res.status(201).json({ entry })
}))

router.post('/github/sync', asyncRoute(async (req, res) => {
  const userId = await resolveAutomationUser(req)
  const username = String(req.body?.username || '').trim()

  if (username) {
    await updateSettings(userId, { github_username: username })
  }

  const settings = await getOrCreateSettings(userId)
  const result = await syncGitHubForUser(userId, username || settings.github_username)
  res.json(result)
}))

router.post('/post-now', asyncRoute(async (req, res) => {
  const userId = await resolveAutomationUser(req)
  const topic = String(req.body?.topic || '').trim()
  const draft = await runAutomationForUser(userId, { reason: 'manual', topic })
  res.status(201).json({ draft })
}))

router.post('/drafts/:id/approve', asyncRoute(async (req, res) => {
  const userId = await resolveAutomationUser(req)
  const draft = await publishDraftForUser(userId, req.params.id)
  res.json({ draft })
}))

router.post('/drafts/:id/reject', asyncRoute(async (req, res) => {
  const userId = await resolveAutomationUser(req)
  const draft = await rejectDraftForUser(userId, req.params.id)
  res.json({ draft })
}))

router.post('/drafts', asyncRoute(async (req, res) => {
  const userId = await resolveAutomationUser(req)
  const topic = String(req.body?.topic || '').trim()
  const draft = await generateDraftForUser(userId, { topic, sourceType: 'manual' })
  res.status(201).json({ draft })
}))

router.post('/test-connection', asyncRoute(async (req, res) => {
  const { geminiApiKey, linkedinAccessToken } = req.body || {}
  
  const [geminiResult, linkedinResult] = await Promise.all([
    geminiApiKey ? testGeminiApiKey(geminiApiKey) : Promise.resolve(null),
    linkedinAccessToken ? testLinkedInToken(linkedinAccessToken) : Promise.resolve(null)
  ])

  res.json({
    gemini: geminiResult || { ok: false, message: 'No Gemini API key provided' },
    linkedin: linkedinResult || { ok: false, message: 'No LinkedIn token provided' }
  })
}))

router.post('/save-keys', asyncRoute(async (req, res) => {
  const userId = await resolveAutomationUser(req)
  const { geminiApiKey, linkedinAccessToken, linkedinPersonUrn, githubUsername } = req.body || {}

  const updates = {}
  if (githubUsername) {
    updates.github_username = String(githubUsername).trim()
  }
  if (Object.keys(updates).length > 0) {
    await updateSettings(userId, updates)
  }

  let linkedinStatus = null
  if (linkedinAccessToken) {
    let resolvedUrn = linkedinPersonUrn
    let resolvedName = 'LinkedIn User'
    const testRes = await testLinkedInToken(linkedinAccessToken)
    if (testRes.ok) {
      resolvedUrn = testRes.personUrn || resolvedUrn
      resolvedName = testRes.name || resolvedName
    }
    linkedinStatus = await saveDirectLinkedInToken(userId, {
      accessToken: linkedinAccessToken,
      personUrn: resolvedUrn || `urn:li:person:direct_${userId}`,
      name: resolvedName
    })
  }

  res.json({
    success: true,
    message: 'Keys and settings updated successfully.',
    linkedin: linkedinStatus
  })
}))

export default router
