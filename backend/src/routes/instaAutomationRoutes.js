import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
  getUserSocialStatus,
  connectUserSocialAccount,
  disconnectUserSocialAccount,
  getUserQueue,
  getUserHistory,
  generateUserPost,
  publishUserPostLive,
  toggleUserAutopilot,
  updateUserSocialSettings,
  verifyInstagramToken,
  ensureContinuousScheduleBuffer,
  exchangeForLongLivedToken
} from '../services/automation/multiUserSocialAutomationService.js'
import { generateInstaContent, publishPostNow } from '../services/automation/instaAgentService.js'

const router = express.Router()

const asyncRoute = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next)
  } catch (err) {
    next(err)
  }
}

// User identity is derived strictly from the verified JWT session.
function resolveUserId(req) {
  if (!req.user) return null
  return req.user._id?.toString() || req.user.id?.toString()
}

router.use(protect)

// 1. Get comprehensive status of Instagram agent for current user
router.get('/status', asyncRoute(async (req, res) => {
  const userId = resolveUserId(req)
  const status = await getUserSocialStatus(userId, 'instagram')
  res.json(status)
}))

// 2. Discover and verify Instagram account using Meta Graph API & running agent
router.post('/discover-account', asyncRoute(async (req, res) => {
  const { accessToken, igAccessToken, appId, appSecret } = req.body || {}
  const token = String(accessToken || igAccessToken || '').trim()

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Meta Graph Access Token is required to discover your Instagram account.'
    })
  }

  try {
    // 1. Try agent server on port 8080
    const agentRes = await fetch('http://127.0.0.1:8080/api/discover-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: token, appId, appSecret }),
      signal: AbortSignal.timeout(15000)
    })
    if (agentRes.ok) {
      const data = await agentRes.json()
      return res.json(data)
    }
  } catch (agentErr) {
    console.warn('[InstaRoute] Port 8080 agent discovery notice:', agentErr.message)
  }

  // 2. Direct fallback using Meta Graph API
  try {
    const verified = await verifyInstagramToken(token, { appId, appSecret })
    return res.json({
      success: true,
      account: {
        id: verified.platformUserId,
        igUserId: verified.platformUserId,
        username: verified.accountUsername,
        accountName: verified.accountName,
        avatar: verified.accountAvatar,
        appId
      },
      message: `✓ Verified Instagram Profile: @${verified.accountUsername} (${verified.platformUserId})`
    })
  } catch (verifyErr) {
    return res.status(400).json({
      success: false,
      message: verifyErr.message || 'Instagram token verification failed. Please ensure your token has instagram_basic and instagram_content_publish scopes.'
    })
  }
}))

// 3. Connect user's Instagram account (Token & username)
router.post('/connect', asyncRoute(async (req, res) => {
  const userId = resolveUserId(req)
  const { accessToken, platformUserId, accountUsername, accountName, defaultTone } = req.body || {}
  const result = await connectUserSocialAccount(userId, 'instagram', {
    accessToken,
    platformUserId,
    accountUsername,
    accountName,
    defaultTone
  })
  res.json(result)
}))

// 4. Disconnect user's Instagram account
router.post('/disconnect', asyncRoute(async (req, res) => {
  const userId = resolveUserId(req)
  const result = await disconnectUserSocialAccount(userId, 'instagram')
  res.json(result)
}))

// 5. Get user's queued posts and drafts
router.get('/queue', asyncRoute(async (req, res) => {
  const userId = resolveUserId(req)
  const limit = Math.min(50, Number(req.query.limit || 20))
  const queue = await getUserQueue(userId, 'instagram', limit)
  res.json({ queue })
}))

// 6. Get user's published history and analytics
router.get('/history', asyncRoute(async (req, res) => {
  const userId = resolveUserId(req)
  const limit = Math.min(50, Number(req.query.limit || 20))
  const history = await getUserHistory(userId, 'instagram', limit)
  res.json({ history })
}))

// 7. Generate an AI Reel from custom topic OR GitHub repository
router.post('/generate', asyncRoute(async (req, res) => {
  const userId = resolveUserId(req)
  const { topic, githubRepo, kind = 'REEL', tone = 'creator' } = req.body || {}
  
  try {
    const result = await generateInstaContent({
      topic,
      githubRepo,
      userId,
      authorName: req.user?.name || 'Creator',
      kind,
      tone
    })
    return res.status(201).json(result)
  } catch (err) {
    const fallback = await generateUserPost(userId, 'instagram', { topic: topic || githubRepo, kind, tone })
    return res.status(201).json(fallback)
  }
}))

// 8. Publish a draft or next in queue immediately
router.post('/publish-now', asyncRoute(async (req, res) => {
  const userId = resolveUserId(req)
  const { postId } = req.body || {}
  
  try {
    const result = await publishPostNow(postId)
    if (result && result.success) return res.json(result)
  } catch (err) {
    console.warn('[InstaPublish] Agent publish error, falling back:', err.message)
  }

  const result = await publishUserPostLive(userId, 'instagram', postId)
  res.json(result)
}))

// 9. Toggle autopilot for this user
router.post('/autopilot/toggle', asyncRoute(async (req, res) => {
  const userId = resolveUserId(req)
  const { enable } = req.body
  const result = await toggleUserAutopilot(userId, 'instagram', enable)
  res.json(result)
}))

// 10. Update user's settings
router.patch('/settings', asyncRoute(async (req, res) => {
  const userId = resolveUserId(req)
  const result = await updateUserSocialSettings(userId, 'instagram', req.body || {})
  res.json(result)
}))

// 11. Auto-replenish 7-day continuous schedule buffer
router.post('/replenish-buffer', asyncRoute(async (req, res) => {
  const userId = resolveUserId(req)
  const days = Math.min(14, Math.max(1, Number(req.body?.days || 7)))
  const result = await ensureContinuousScheduleBuffer(userId, 'instagram', days)
  res.json(result)
}))

// 12. Exchange token for 60-day Long-Lived Token
router.post('/exchange-token', asyncRoute(async (req, res) => {
  const { shortLivedToken } = req.body || {}
  const result = await exchangeForLongLivedToken(shortLivedToken)
  res.json(result)
}))

// 13. Test Instagram token validity
router.post('/test-connection', asyncRoute(async (req, res) => {
  const { igAccessToken } = req.body || {}
  try {
    const verified = await verifyInstagramToken(igAccessToken)
    res.json({ instagram: { ok: true, accountName: verified.accountName, username: verified.accountUsername } })
  } catch (e) {
    res.json({ instagram: { ok: false, message: e.message } })
  }
}))

export default router
