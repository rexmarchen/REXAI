import express from 'express'
import { optionalProtect } from '../middleware/authMiddleware.js'
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

const router = express.Router()

const asyncRoute = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next)
  } catch (err) {
    next(err)
  }
}

function resolveUserId(req) {
  return req.user?._id?.toString() || req.user?.id?.toString() || req.headers['x-user-id'] || 'default_user'
}

router.use(optionalProtect)

// 1. Get comprehensive status of Instagram agent for current user
router.get('/status', asyncRoute(async (req, res) => {
  const userId = resolveUserId(req)
  const status = await getUserSocialStatus(userId, 'instagram')
  res.json(status)
}))

// 2. Connect user's Instagram account (Token & username)
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

// 3. Disconnect user's Instagram account
router.post('/disconnect', asyncRoute(async (req, res) => {
  const userId = resolveUserId(req)
  const result = await disconnectUserSocialAccount(userId, 'instagram')
  res.json(result)
}))

// 4. Get user's queued posts and drafts
router.get('/queue', asyncRoute(async (req, res) => {
  const userId = resolveUserId(req)
  const limit = Math.min(50, Number(req.query.limit || 20))
  const queue = await getUserQueue(userId, 'instagram', limit)
  res.json({ queue })
}))

// 5. Get user's published history and analytics
router.get('/history', asyncRoute(async (req, res) => {
  const userId = resolveUserId(req)
  const limit = Math.min(50, Number(req.query.limit || 20))
  const history = await getUserHistory(userId, 'instagram', limit)
  res.json({ history })
}))

// 6. Generate an AI post/reel for this user
router.post('/generate', asyncRoute(async (req, res) => {
  const userId = resolveUserId(req)
  const { topic, kind, tone } = req.body || {}
  const result = await generateUserPost(userId, 'instagram', { topic, kind, tone })
  res.status(201).json(result)
}))

// 7. Publish a draft or next in queue immediately
router.post('/publish-now', asyncRoute(async (req, res) => {
  const userId = resolveUserId(req)
  const { postId } = req.body || {}
  const result = await publishUserPostLive(userId, 'instagram', postId)
  res.json(result)
}))

// 8. Toggle autopilot for this user
router.post('/autopilot/toggle', asyncRoute(async (req, res) => {
  const userId = resolveUserId(req)
  const { enable } = req.body
  const result = await toggleUserAutopilot(userId, 'instagram', enable)
  res.json(result)
}))

// 9. Update user's settings
router.patch('/settings', asyncRoute(async (req, res) => {
  const userId = resolveUserId(req)
  const result = await updateUserSocialSettings(userId, 'instagram', req.body || {})
  res.json(result)
}))

// 10. Auto-replenish 7-day continuous schedule buffer
router.post('/replenish-buffer', asyncRoute(async (req, res) => {
  const userId = resolveUserId(req)
  const days = Math.min(14, Math.max(1, Number(req.body?.days || 7)))
  const result = await ensureContinuousScheduleBuffer(userId, 'instagram', days)
  res.json(result)
}))

// 11. Exchange token for 60-day Long-Lived Token
router.post('/exchange-token', asyncRoute(async (req, res) => {
  const { shortLivedToken } = req.body || {}
  const result = await exchangeForLongLivedToken(shortLivedToken)
  res.json(result)
}))

// 12. Test Instagram token validity
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
