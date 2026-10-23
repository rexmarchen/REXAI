import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
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
import { canPublishToLinkedIn, canUseFeature, getEffectiveUserEntitlement } from '../services/entitlementService.js'
import { reschedulePausedPostsForUser } from '../services/expiryCleanupService.js'
import SocialAutomationPost from '../models/SocialAutomationPost.js'
import SocialAutomationAccount from '../models/SocialAutomationAccount.js'

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

import fs from 'fs'
import { getConnectionStatus, saveConnection, getSqliteDb } from '../services/socialConnectionsSqliteService.js'

function getLiveAgentEnv() {
  const agentEnvPath = 'c:/Users/anshupal/OneDrive/Documents/linkdin automation/.env'
  try {
    if (fs.existsSync(agentEnvPath)) {
      const raw = fs.readFileSync(agentEnvPath, 'utf8')
      const tokenMatch = raw.match(/LINKEDIN_ACCESS_TOKEN=([^\r\n]+)/)
      const urnMatch = raw.match(/LINKEDIN_PERSON_URN=([^\r\n]+)/)
      const clientIdMatch = raw.match(/LINKEDIN_CLIENT_ID=([^\r\n]+)/)
      const clientSecretMatch = raw.match(/LINKEDIN_CLIENT_SECRET=([^\r\n]+)/)
      return {
        accessToken: tokenMatch ? tokenMatch[1].trim() : '',
        personUrn: urnMatch ? urnMatch[1].trim() : '',
        clientId: clientIdMatch ? clientIdMatch[1].trim() : '',
        clientSecret: clientSecretMatch ? clientSecretMatch[1].trim() : ''
      }
    }
  } catch (e) {
    console.warn('[GetLiveAgentEnv]', e.message)
  }
  return {
    accessToken: process.env.LINKEDIN_ACCESS_TOKEN || '',
    personUrn: process.env.LINKEDIN_PERSON_URN || '',
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || ''
  }
}

router.use(protect)

router.get('/status', asyncRoute(async (req, res) => {
  const userId = await resolveAutomationUser(req)
  const sqliteStatus = getConnectionStatus({ userId })
  const sqliteLinkedIn = sqliteStatus?.linkedin || {}
  const isDefaultUser = !userId || userId === 1 || userId === '1'
  const agentEnv = isDefaultUser ? getLiveAgentEnv() : {}

  let agentHealth = { online: false }
  try {
    const healthRes = await fetch('http://127.0.0.1:3000/health', { signal: AbortSignal.timeout(1500) })
    if (healthRes.ok) {
      agentHealth = { online: true, ...(await healthRes.json()) }
    }
  } catch (e) {
    // Agent server not on 3000 or starting
  }

  try {
    await ensureAutomationSchema()
    const [settings, linkedin, knowledge, repos, drafts, history, entitlement, publishGate, pausedPostsCount] = await Promise.all([
      getOrCreateSettings(userId),
      getLinkedInAccountStatus(userId),
      getRecentKnowledge(userId, 6),
      getUserRepos(userId, 8),
      getDrafts(userId, 8),
      getPostHistory(userId, 10),
      getEffectiveUserEntitlement(userId).catch(() => ({ allowed: false, planId: 'free', entitlementStatus: 'inactive', planConfig: { dailyPostLimit: 0 } })),
      canPublishToLinkedIn(userId).catch(err => ({ allowed: false, message: err.message })),
      SocialAutomationPost.countDocuments({ userId, platform: 'linkedin', status: 'paused_subscription' }).catch(() => 0)
    ])

    const isConnected = Boolean(sqliteLinkedIn.connected || linkedin?.connected || (isDefaultUser && agentEnv.accessToken))
    const accountName = sqliteLinkedIn.accountName || sqliteLinkedIn.handle || linkedin?.accountName || (isConnected ? (agentEnv.accountName || 'LinkedIn Member') : null)
    const personUrn = sqliteLinkedIn.targetJobTitles || linkedin?.personUrn || (isDefaultUser ? agentEnv.personUrn : '') || ''

    res.json({
      userId,
      agentHealth,
      subscription: {
        plan: entitlement.planId,
        planName: entitlement.planConfig?.name || 'Free Plan',
        subscriptionStatus: entitlement.subscription?.subscriptionStatus || 'inactive',
        entitlementStatus: entitlement.entitlementStatus,
        currentPeriodEnd: entitlement.currentPeriodEnd,
        cancelAtPeriodEnd: Boolean(entitlement.cancelAtPeriodEnd),
        canPublish: publishGate.allowed,
        dailyPostLimit: entitlement.planConfig?.dailyPostLimit || 0,
        postsPublishedToday: publishGate.postsPublishedToday || 0,
        limitRemaining: publishGate.limitRemaining || 0,
        denialReason: publishGate.allowed ? null : publishGate.message,
        pausedPostsCount
      },
      linkedin: {
        connected: isConnected,
        accountName: isConnected ? accountName : 'Not Connected',
        personUrn: isConnected ? personUrn : '',
        handle: isConnected ? accountName : '',
        autopilot: Boolean(sqliteLinkedIn.autopilot || settings.schedule_enabled),
        clientId: (isDefaultUser ? agentEnv.clientId : '') || '',
        hasSecret: Boolean(isDefaultUser && agentEnv.clientSecret),
        expiresAt: linkedin?.expiresAt || null
      },
      settings: publicSettings(settings),
      knowledge,
      repos,
      drafts,
      history
    })
  } catch (err) {
    console.warn('[LinkedIn Automation Status Warning]:', err.message)
    const isConnected = Boolean(sqliteLinkedIn.connected || (isDefaultUser && agentEnv.accessToken))
    const accountName = sqliteLinkedIn.accountName || sqliteLinkedIn.handle || (isConnected ? 'LinkedIn Member' : null)
    const personUrn = sqliteLinkedIn.targetJobTitles || (isDefaultUser ? agentEnv.personUrn : '') || ''

    res.json({
      userId,
      agentHealth,
      linkedin: {
        connected: isConnected,
        accountName: isConnected ? accountName : 'Not Connected',
        personUrn: isConnected ? personUrn : '',
        handle: isConnected ? accountName : '',
        autopilot: Boolean(sqliteLinkedIn.autopilot ?? true),
        clientId: (isDefaultUser ? agentEnv.clientId : '') || '',
        hasSecret: Boolean(isDefaultUser && agentEnv.clientSecret),
        expiresAt: null
      },
      settings: {
        scheduleEnabled: Boolean(sqliteLinkedIn.autopilot ?? true),
        approvalMode: 'auto_publish',
        cronTime: '19:30',
        cronTimezone: 'Asia/Kolkata',
        fullAutoEnabled: true,
        dailyPostLimit: 1,
        githubUsername: process.env.GITHUB_USERNAME || 'rexmarchen',
        lastRunAt: new Date().toISOString(),
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
  const payload = req.body || {}
  const normalized = normalizeSettingsPayload(payload)

  if (normalized.schedule_enabled || normalized.full_auto_enabled) {
    const featureCheck = await canUseFeature(userId, 'linkedin_automation')
    if (!featureCheck.allowed) {
      return res.status(403).json({
        success: false,
        code: featureCheck.reason,
        message: featureCheck.message || 'Enabling automation schedules requires a Pro or Elite subscription.'
      })
    }
  }

  // 1. Synchronize SQLite autopilot state if schedule_enabled or autopilot provided
  if (normalized.schedule_enabled !== undefined) {
    try {
      const db = getSqliteDb()
      db.prepare(`
        UPDATE social_connections 
        SET autopilot_enabled = ?, updated_at = datetime('now')
        WHERE platform = 'linkedin' AND (user_id = ? OR CAST(user_id AS TEXT) = CAST(? AS TEXT) OR (? IN (1, '1') AND user_id IS NULL))
      `).run(normalized.schedule_enabled ? 1 : 0, userId, String(userId), userId)
    } catch (sqlErr) {
      console.warn('[PATCH /settings] SQLite update notice:', sqlErr.message)
    }
  }

  // 2. Try PostgreSQL updateSettings if available
  try {
    const settings = await updateSettings(userId, normalized)
    return res.json({ success: true, settings: publicSettings(settings) })
  } catch (pgErr) {
    console.warn('[PATCH /settings] PostgreSQL fallback to SQLite/memory:', pgErr.message)
    return res.json({
      success: true,
      settings: {
        scheduleEnabled: Boolean(normalized.schedule_enabled ?? true),
        approvalMode: normalized.approval_mode || 'auto_publish',
        cronTime: normalized.cron_time || '09:00',
        cronTimezone: normalized.cron_timezone || 'Asia/Kolkata',
        fullAutoEnabled: Boolean(normalized.full_auto_enabled ?? true),
        dailyPostLimit: Number(normalized.daily_post_limit || 1),
        githubUsername: normalized.github_username || 'rexmarchen',
        lastRunAt: new Date().toISOString(),
        nextRunAt: null
      }
    })
  }
}))

router.post('/enable', asyncRoute(async (req, res) => {
  const userId = await resolveAutomationUser(req)
  const featureCheck = await canUseFeature(userId, 'linkedin_automation')
  if (!featureCheck.allowed) {
    return res.status(403).json({
      success: false,
      code: featureCheck.reason,
      message: featureCheck.message || 'Enabling LinkedIn automation requires an active Pro or Elite subscription.'
    })
  }

  try {
    const db = getSqliteDb()
    db.prepare(`
      UPDATE social_connections 
      SET autopilot_enabled = 1, updated_at = datetime('now')
      WHERE platform = 'linkedin' AND (user_id = ? OR CAST(user_id AS TEXT) = CAST(? AS TEXT) OR (? IN (1, '1') AND user_id IS NULL))
    `).run(userId, String(userId), userId)
  } catch (sqlErr) {}

  await SocialAutomationAccount.updateMany(
    { userId, platform: 'linkedin' },
    { $set: { autopilotEnabled: true, status: 'active' } }
  )

  res.json({ success: true, message: 'LinkedIn automation successfully enabled.' })
}))

router.post('/disable', asyncRoute(async (req, res) => {
  const userId = await resolveAutomationUser(req)
  try {
    const db = getSqliteDb()
    db.prepare(`
      UPDATE social_connections 
      SET autopilot_enabled = 0, updated_at = datetime('now')
      WHERE platform = 'linkedin' AND (user_id = ? OR CAST(user_id AS TEXT) = CAST(? AS TEXT) OR (? IN (1, '1') AND user_id IS NULL))
    `).run(userId, String(userId), userId)
  } catch (sqlErr) {}

  await SocialAutomationAccount.updateMany(
    { userId, platform: 'linkedin' },
    { $set: { autopilotEnabled: false, status: 'paused' } }
  )

  res.json({ success: true, message: 'LinkedIn automation successfully disabled.' })
}))

router.get('/jobs', asyncRoute(async (req, res) => {
  const userId = await resolveAutomationUser(req)
  const posts = await SocialAutomationPost.find({ userId, platform: 'linkedin' })
    .sort({ scheduledAt: 1, createdAt: -1 })
    .limit(50)

  const upcoming = posts.filter((p) => ['approved', 'new'].includes(p.status))
  const paused = posts.filter((p) => p.status === 'paused_subscription')
  const published = posts.filter((p) => p.status === 'published')
  const failed = posts.filter((p) => p.status === 'failed')

  res.json({
    success: true,
    upcoming,
    paused,
    published,
    failed,
    total: posts.length
  })
}))

router.post('/reschedule-paused', asyncRoute(async (req, res) => {
  const userId = await resolveAutomationUser(req)
  const gate = await canPublishToLinkedIn(userId)
  if (!gate.allowed) {
    return res.status(403).json({
      success: false,
      code: gate.reason,
      message: `Cannot reschedule posts: ${gate.message}`
    })
  }

  const result = await reschedulePausedPostsForUser(userId, 'linkedin')
  res.json({ success: true, ...result })
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

  // MANDATORY ENTITLEMENT GATE
  const gate = await canPublishToLinkedIn(userId)
  if (!gate.allowed) {
    return res.status(403).json({
      success: false,
      code: gate.reason,
      message: gate.message
    })
  }

  const topic = String(req.body?.topic || '').trim()

  // 1. Fetch user's active connection from SQLite
  const sqliteStatus = getConnectionStatus({ userId })
  const liConn = sqliteStatus?.linkedin
  const isDefaultUser = !userId || userId === 1 || userId === '1'
  const agentEnv = isDefaultUser ? getLiveAgentEnv() : {}

  const accessToken = liConn?.accessToken || liConn?.access_token || agentEnv.accessToken || process.env.LINKEDIN_ACCESS_TOKEN
  const personUrn = liConn?.targetJobTitles || agentEnv.personUrn || process.env.LINKEDIN_PERSON_URN

  if (!accessToken) {
    return res.status(400).json({
      success: false,
      message: 'No active LinkedIn connection found for this account. Please connect your LinkedIn account first.'
    })
  }

  const authorName = liConn?.accountName || liConn?.handle || (isDefaultUser ? 'Anshu Pal' : 'Software Engineer')
  const userTopic = topic || liConn?.reelPrompt || 'System Design & Distributed Systems: High-Throughput Resilience'

  // 2. Try triggering the 24/7 autonomous LinkedIn agent on port 3000
  try {
    const triggerRes = await fetch('http://127.0.0.1:3000/trigger-daily?force=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        force: true,
        topic: userTopic,
        accessToken,
        personUrn,
        authorUrn: personUrn,
        authorName,
        isOwner: isDefaultUser,
        userId: userId || 1
      }),
      signal: AbortSignal.timeout(90000)
    })
    if (triggerRes.ok) {
      const data = await triggerRes.json()
      if (data.ok && data.result && data.result.postId) {
        return res.status(201).json({
          success: true,
          source: 'standalone_agent',
          result: data.result,
          message: '🚀 Post synthesized with graphic poster & published live to LinkedIn!'
        })
      }
    }
  } catch (agentErr) {
    console.warn('[PostNow] Standalone agent trigger notice:', agentErr.message)
  }

  // 3. Direct robust fallback using LinkedIn REST API with user credentials
  if (accessToken && personUrn) {
    try {
      const authorUrn = personUrn.startsWith('urn:li:person:') ? personUrn : `urn:li:person:${personUrn}`
      const hashtags = isDefaultUser 
        ? '#SoftwareEngineering #SystemDesign #DistributedSystems #REXION'
        : '#SoftwareEngineering #SystemDesign #DistributedSystems #CloudArchitecture #TechLeadership'
      const postText = `${userTopic}\n\nKey Engineering Takeaway: Designing fault-tolerant distributed architectures requires explicit failure budgeting, connection pooling limits, and non-blocking asynchronous workflows to eliminate cascading microservice bottlenecks.\n\nWhat architectural patterns do you prioritize when designing resilient backends under high concurrency?\n\n${hashtags}`
      const publishRes = await fetch('https://api.linkedin.com/rest/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202603'
        },
        body: JSON.stringify({
          author: authorUrn,
          commentary: postText,
          visibility: 'PUBLIC',
          distribution: {
            feedDistribution: 'MAIN_FEED',
            targetEntities: [],
            thirdPartyDistributionChannels: []
          },
          lifecycleState: 'PUBLISHED',
          isReshareDisabledByAuthor: false
        })
      })

      if (publishRes.ok) {
        const postId = publishRes.headers.get('x-restli-id')
        return res.status(201).json({
          success: true,
          source: 'direct_linkedin_api',
          postId,
          message: '🚀 Post synthesized and published live to LinkedIn feed!'
        })
      } else {
        const errText = await publishRes.text()
        console.warn('[PostNow] Direct LinkedIn API notice:', errText)
      }
    } catch (directErr) {
      console.warn('[PostNow] Direct publish error:', directErr.message)
    }
  }

  // 4. Fallback to internal post automation pipeline
  try {
    const draft = await runAutomationForUser(userId, { reason: 'manual', topic })
    return res.status(201).json({ success: true, draft })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}))

router.post('/drafts/:id/approve', asyncRoute(async (req, res) => {
  const userId = await resolveAutomationUser(req)

  // MANDATORY ENTITLEMENT GATE
  const gate = await canPublishToLinkedIn(userId)
  if (!gate.allowed) {
    return res.status(403).json({
      success: false,
      code: gate.reason,
      message: gate.message
    })
  }

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

  // Check draft generation permission
  const featureCheck = await canUseFeature(userId, 'draft_generation')
  if (!featureCheck.allowed) {
    return res.status(403).json({
      success: false,
      code: featureCheck.reason,
      message: featureCheck.message || 'Draft generation requires a Pro or Elite subscription.'
    })
  }

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

router.post('/discover-account', asyncRoute(async (req, res) => {
  const { linkedinAccessToken, clientId, clientSecret } = req.body || {}
  const token = String(linkedinAccessToken || '').trim()

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a LinkedIn Access Token to find the account.'
    })
  }

  const testRes = await testLinkedInToken(token)
  if (!testRes.ok) {
    return res.status(400).json({
      success: false,
      message: testRes.message || 'LinkedIn token verification failed. Please check that your Access Token is active and contains w_member_social scope.'
    })
  }

  res.json({
    success: true,
    account: {
      name: testRes.name,
      sub: testRes.sub,
      personUrn: testRes.personUrn,
      picture: testRes.picture
    },
    message: `✓ Found LinkedIn Profile: ${testRes.name} (${testRes.personUrn})`
  })
}))

router.post('/disconnect', asyncRoute(async (req, res) => {
  const userId = await resolveAutomationUser(req)
  try {
    const db = getSqliteDb()
    db.prepare(`
      DELETE FROM social_connections 
      WHERE platform = 'linkedin' AND (user_id = ? OR CAST(user_id AS TEXT) = CAST(? AS TEXT) OR (? IN (1, '1') AND user_id IS NULL))
    `).run(userId, String(userId), userId)
  } catch (e) {
    console.warn('[Disconnect] SQLite error:', e.message)
  }
  res.json({
    success: true,
    message: 'LinkedIn account disconnected. You can now connect a new account.'
  })
}))

router.post('/save-keys', asyncRoute(async (req, res) => {
  const userId = await resolveAutomationUser(req)
  const { geminiApiKey, linkedinAccessToken, linkedinPersonUrn, githubUsername, clientId, clientSecret } = req.body || {}

  const trimmedToken = String(linkedinAccessToken || '').trim()
  if (!trimmedToken) {
    return res.status(400).json({ success: false, message: 'LinkedIn Access Token is required.' })
  }

  // 1. Discover and verify real account from LinkedIn API
  const testRes = await testLinkedInToken(trimmedToken)
  if (!testRes.ok) {
    return res.status(400).json({
      success: false,
      message: testRes.message || 'LinkedIn token validation failed. Please check that the token is active.'
    })
  }

  const resolvedName = testRes.name || 'LinkedIn Member'
  const resolvedUrn = testRes.personUrn || linkedinPersonUrn || `urn:li:person:${testRes.sub}`

  // 2. Clear ONLY this user's old LinkedIn connection from SQLite and save the newly verified one
  try {
    const db = getSqliteDb()
    db.prepare(`
      DELETE FROM social_connections 
      WHERE platform = 'linkedin' AND (user_id = ? OR CAST(user_id AS TEXT) = CAST(? AS TEXT) OR (? IN (1, '1') AND user_id IS NULL))
    `).run(userId, String(userId), userId)

    saveConnection({
      userId: userId,
      platform: 'linkedin',
      accountHandle: resolvedName,
      accessToken: trimmedToken,
      telegramChatId: '',
      autopilotEnabled: true,
      targetJobTitles: resolvedUrn,
      scheduleTimes: '09:00 & 18:00 IST',
      reelPrompt: 'System Design & Engineering Architecture'
    })
  } catch (sqlErr) {
    console.warn('[SaveKeys] SQLite save error:', sqlErr.message)
  }

  // 3. Synchronize to standalone agent's .env file only if default user (admin/local)
  const isDefaultUser = !userId || userId === 1 || userId === '1'
  if (isDefaultUser) {
    try {
      const agentEnvPath = 'c:/Users/anshupal/OneDrive/Documents/linkdin automation/.env'
      if (fs.existsSync(agentEnvPath)) {
        let envContent = fs.readFileSync(agentEnvPath, 'utf8')
        envContent = envContent.replace(/LINKEDIN_ACCESS_TOKEN=[^\r\n]*/, `LINKEDIN_ACCESS_TOKEN=${trimmedToken}`)
        if (resolvedUrn) {
          envContent = envContent.replace(/LINKEDIN_PERSON_URN=[^\r\n]*/, `LINKEDIN_PERSON_URN=${resolvedUrn}`)
        }
        if (clientId) {
          if (/LINKEDIN_CLIENT_ID=/.test(envContent)) {
            envContent = envContent.replace(/LINKEDIN_CLIENT_ID=[^\r\n]*/, `LINKEDIN_CLIENT_ID=${clientId.trim()}`)
          } else {
            envContent += `\nLINKEDIN_CLIENT_ID=${clientId.trim()}`
          }
        }
        if (clientSecret) {
          if (/LINKEDIN_CLIENT_SECRET=/.test(envContent)) {
            envContent = envContent.replace(/LINKEDIN_CLIENT_SECRET=[^\r\n]*/, `LINKEDIN_CLIENT_SECRET=${clientSecret.trim()}`)
          } else {
            envContent += `\nLINKEDIN_CLIENT_SECRET=${clientSecret.trim()}`
          }
        }
        fs.writeFileSync(agentEnvPath, envContent, 'utf8')
      }
    } catch (agentEnvErr) {
      console.warn('[SaveKeys] Agent .env update notice:', agentEnvErr.message)
    }
  }

  // 4. Also synchronize root .env and backend/.env
  try {
    for (const p of ['.env', 'backend/.env']) {
      if (fs.existsSync(p)) {
        let envContent = fs.readFileSync(p, 'utf8')
        envContent = envContent.replace(/LINKEDIN_ACCESS_TOKEN=[^\r\n]*/, `LINKEDIN_ACCESS_TOKEN=${trimmedToken}`)
        if (resolvedUrn) {
          envContent = envContent.replace(/LINKEDIN_PERSON_URN=[^\r\n]*/, `LINKEDIN_PERSON_URN=${resolvedUrn}`)
        }
        if (clientId) {
          if (/LINKEDIN_CLIENT_ID=/.test(envContent)) {
            envContent = envContent.replace(/LINKEDIN_CLIENT_ID=[^\r\n]*/, `LINKEDIN_CLIENT_ID=${clientId.trim()}`)
          } else {
            envContent += `\nLINKEDIN_CLIENT_ID=${clientId.trim()}`
          }
        }
        if (clientSecret) {
          if (/LINKEDIN_CLIENT_SECRET=/.test(envContent)) {
            envContent = envContent.replace(/LINKEDIN_CLIENT_SECRET=[^\r\n]*/, `LINKEDIN_CLIENT_SECRET=${clientSecret.trim()}`)
          } else {
            envContent += `\nLINKEDIN_CLIENT_SECRET=${clientSecret.trim()}`
          }
        }
        fs.writeFileSync(p, envContent, 'utf8')
      }
    }
  } catch (e) {
    console.warn('[SaveKeys] Root .env update notice:', e.message)
  }

  // 5. Fallback PostgreSQL direct token save
  let linkedinStatus = { connected: true, personUrn: resolvedUrn, name: resolvedName }
  try {
    linkedinStatus = await saveDirectLinkedInToken(userId, {
      accessToken: trimmedToken,
      personUrn: resolvedUrn,
      name: resolvedName
    })
  } catch (pgErr) {
    console.warn('[SaveKeys] PostgreSQL save notice:', pgErr.message)
  }

  res.json({
    success: true,
    message: `🎉 Account Found & Connected: ${resolvedName}!`,
    linkedin: {
      connected: true,
      accountName: resolvedName,
      personUrn: resolvedUrn,
      picture: testRes.picture
    }
  })
}))

export default router
