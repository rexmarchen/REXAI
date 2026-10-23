import express from 'express'
import crypto from 'crypto'
import { protect } from '../middleware/authMiddleware.js'
import { register, login, googleAuth, getMe } from '../controllers/authController.js'
import { validate } from '../middleware/validationMiddleware.js'
import { registerSchema, loginSchema, googleAuthSchema } from '../utils/validators.js'

const router = express.Router()

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/google', validate(googleAuthSchema), googleAuth)
router.get('/me', protect, getMe)

// Instagram Meta OAuth initiation endpoint
router.get('/instagram', protect, (req, res) => {
  const appId = process.env.META_APP_ID || process.env.INSTAGRAM_CLIENT_ID || '1084920482910'
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/instagram/callback`
  const state = crypto.randomBytes(16).toString('hex')
  req.session.oauthState = state
  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement&response_type=code&state=${state}`

  if (req.headers.accept?.includes('application/json') || req.xhr) {
    return res.json({ success: true, authUrl, message: 'Meta OAuth authorization URL generated' })
  }
  res.redirect(authUrl)
})

router.post('/instagram', protect, (req, res) => {
  const appId = process.env.META_APP_ID || process.env.INSTAGRAM_CLIENT_ID || '1084920482910'
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/instagram/callback`
  const state = crypto.randomBytes(16).toString('hex')
  req.session.oauthState = state
  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement&response_type=code&state=${state}`

  res.json({
    success: true,
    authUrl,
    message: 'Meta OAuth authorization initiated'
  })
})

/**
 * GET & POST /api/auth/instagram/callback
 * Exchanges the short-lived OAuth authorization code for a 60-day long-lived
 * Instagram Business token via Meta Graph API and persists the user's @username to SQLite.
 */
const handleInstagramCallback = async (req, res) => {
  const code = req.query.code || req.body?.code
  const error = req.query.error || req.query.error_reason
  const errorDescription = req.query.error_description || error
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

  if (error) {
    console.warn(`[Instagram OAuth] User denied or Meta returned error: ${errorDescription}`)
    if (req.headers.accept?.includes('application/json') || req.xhr) {
      return res.status(400).json({ success: false, error: errorDescription })
    }
    return res.redirect(`${frontendUrl}/connections?error=${encodeURIComponent(errorDescription)}`)
  }

  if (!code) {
    return res.status(400).json({
      success: false,
      error: 'Missing required authorization code (?code=...)'
    })
  }

  // CSRF: validate state parameter
  const incomingState = req.query.state || req.body?.state
  if (!incomingState || incomingState !== req.session?.oauthState) {
    return res.status(400).json({
      success: false,
      error: 'Invalid or missing OAuth state parameter.'
    })
  }
  delete req.session.oauthState

  const appId = process.env.META_APP_ID || process.env.INSTAGRAM_CLIENT_ID || '1084920482910'
  const appSecret = process.env.META_APP_SECRET || process.env.INSTAGRAM_CLIENT_SECRET || ''
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/instagram/callback`

  if (!appSecret) {
    return res.status(503).json({
      success: false,
      error: 'Instagram OAuth is not configured on the server.'
    })
  }

  let longLivedToken = null
  let resolvedUsername = null
  let tokenExpiresIn = 5184000 // 60 days default

  // If live Meta App Secret is provided and not test mock code, execute live Meta Graph API exchange
  if (appSecret && !String(code).startsWith('mock_') && !String(code).startsWith('test_')) {
    try {
      // 1. Exchange authorization code for short-lived access token
      const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
      const tokenResp = await fetch(tokenUrl)
      const tokenData = await tokenResp.json()

      if (tokenData.error) {
        throw new Error(tokenData.error.message || 'Failed to exchange short-lived code')
      }

      const shortLivedToken = tokenData.access_token

      // 2. Exchange short-lived token for 60-day long-lived token
      const longLivedUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
      const llResp = await fetch(longLivedUrl)
      const llData = await llResp.json()

      longLivedToken = llData.access_token || shortLivedToken
      tokenExpiresIn = llData.expires_in || 5184000

      // 3. Query Meta Graph API to resolve Instagram Business Account username
      const meUrl = `https://graph.facebook.com/v21.0/me?fields=id,name,accounts{id,name,instagram_business_account{id,username,name,profile_picture_url}}&access_token=${longLivedToken}`
      const meResp = await fetch(meUrl)
      const meData = await meResp.json()

      const accounts = meData.accounts?.data || []
      for (const acc of accounts) {
        if (acc.instagram_business_account?.username) {
          resolvedUsername = acc.instagram_business_account.username
          break
        }
      }

      if (!resolvedUsername && meData.name) {
        resolvedUsername = meData.name.toLowerCase().replace(/[^a-z0-9_.]/g, '_')
      }
    } catch (metaErr) {
      console.warn('[Instagram OAuth] Live Meta exchange notice:', metaErr.message)
    }
  }

  if (!longLivedToken || !resolvedUsername) {
    return res.status(400).json({
      success: false,
      error: 'Failed to obtain Instagram access token.'
    })
  }

  // 4. Save to SQLite database, associated with the authenticated user
  try {
    const { saveConnection } = await import('../services/socialConnectionsSqliteService.js')

    const cleanHandle = resolvedUsername.replace(/^@/, '').trim()
    const saved = saveConnection({
      platform: 'instagram',
      accountHandle: cleanHandle,
      accessToken: longLivedToken,
      autopilotEnabled: true,
      scheduleTimes: '17:00, 19:00',
      reelPrompt: 'FLUX.1 + FFmpeg high-retention tech reels',
      telegramChatId: '',
      userId: req.user?.id || req.user?._id?.toString() || req.session?.userId || null
    })

    console.log(`[Instagram OAuth] Successfully connected @${cleanHandle} for user ${saved.userId}`)

    if (req.headers.accept?.includes('application/json') || req.xhr) {
      return res.status(200).json({
        success: true,
        message: `Successfully connected Instagram Business account @${cleanHandle}`,
        username: `@${cleanHandle}`,
        expiresInDays: 60,
        connection: saved
      })
    }

    return res.redirect(`${frontendUrl}/connections?instagram_connected=true&username=${encodeURIComponent(cleanHandle)}`)
  } catch (dbErr) {
    console.error('[Instagram OAuth] Failed to save connection to SQLite:', dbErr)
    return res.status(500).json({
      success: false,
      error: 'Failed to persist Instagram connection to SQLite database',
      details: dbErr.message
    })
  }
}

router.get('/instagram/callback', protect, handleInstagramCallback)
router.post('/instagram/callback', protect, handleInstagramCallback)

/**
 * GET /api/auth/linkedin
 * LinkedIn OAuth initiation endpoint (matches Instagram OAuth flow)
 */
router.get('/linkedin', protect, (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID
  if (!clientId) {
    return res.status(503).json({ success: false, error: 'LinkedIn OAuth is not configured on the server.' })
  }
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/linkedin/callback`
  const state = crypto.randomBytes(16).toString('hex')
  req.session.linkedinOAuthState = state
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=openid%20profile%20w_member_social%20email`

  if (req.headers.accept?.includes('application/json') || req.xhr) {
    return res.json({ success: true, authUrl, message: 'LinkedIn OAuth authorization URL generated' })
  }
  res.redirect(authUrl)
})

router.post('/linkedin', protect, (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID
  if (!clientId) {
    return res.status(503).json({ success: false, error: 'LinkedIn OAuth is not configured on the server.' })
  }
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/linkedin/callback`
  const state = crypto.randomBytes(16).toString('hex')
  req.session.linkedinOAuthState = state
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=openid%20profile%20w_member_social%20email`

  res.json({ success: true, authUrl, message: 'LinkedIn OAuth authorization initiated' })
})

/**
 * GET & POST /api/auth/linkedin/callback
 * Exchanges LinkedIn OAuth code for access token, fetches profile name/urn,
 * and saves connection to SQLite social_connections table.
 */
const handleLinkedInCallback = async (req, res) => {
  const code = req.query.code || req.body?.code
  const error = req.query.error
  const errorDescription = req.query.error_description || error
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

  if (error) {
    console.warn(`[LinkedIn OAuth] User denied or LinkedIn returned error: ${errorDescription}`)
    if (req.headers.accept?.includes('application/json') || req.xhr) {
      return res.status(400).json({ success: false, error: errorDescription })
    }
    return res.redirect(`${frontendUrl}/connections?error=${encodeURIComponent(errorDescription)}`)
  }

  if (!code) {
    return res.status(400).json({
      success: false,
      error: 'Missing required authorization code (?code=...)'
    })
  }

  // CSRF: validate state parameter
  const incomingState = req.query.state || req.body?.state
  if (!incomingState || incomingState !== req.session?.linkedinOAuthState) {
    return res.status(400).json({
      success: false,
      error: 'Invalid or missing OAuth state parameter.'
    })
  }
  delete req.session.linkedinOAuthState

  const clientId = process.env.LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/linkedin/callback`

  if (!clientId || !clientSecret) {
    return res.status(503).json({
      success: false,
      error: 'LinkedIn OAuth is not configured on the server.'
    })
  }

  let accessToken = null
  let profileName = null
  let personUrn = null

  try {
    const tokenResp = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret
      })
    })

    if (tokenResp.ok) {
      const tokenData = await tokenResp.json()
      accessToken = tokenData.access_token

      const profileResp = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (profileResp.ok) {
        const profile = await profileResp.json()
        profileName = profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim()
        personUrn = `urn:li:person:${profile.sub}`
      }
    } else {
      throw new Error(`LinkedIn token exchange failed: ${tokenResp.status}`)
    }
  } catch (err) {
    console.warn('[LinkedIn OAuth] Token exchange error:', err.message)
    return res.status(400).json({
      success: false,
      error: 'Failed to exchange LinkedIn authorization code.'
    })
  }

  if (!accessToken || !profileName) {
    return res.status(400).json({
      success: false,
      error: 'Failed to obtain LinkedIn access token.'
    })
  }

  try {
    const { saveConnection } = await import('../services/socialConnectionsSqliteService.js')
    const saved = saveConnection({
      platform: 'linkedin',
      accountHandle: profileName,
      accessToken,
      autopilotEnabled: true,
      scheduleTimes: '09:30',
      reelPrompt: 'System Architecture & Engineering Best Practices',
      userId: req.user?.id || req.user?._id?.toString() || req.session?.userId || null
    })

    console.log(`[LinkedIn OAuth] Successfully linked ${profileName} for user ${saved.userId}`)

    if (req.headers.accept?.includes('application/json') || req.xhr) {
      return res.status(200).json({
        success: true,
        message: `Successfully connected LinkedIn account: ${profileName}`,
        profileName,
        connection: saved
      })
    }

    return res.redirect(`${frontendUrl}/connections?linkedin_connected=true&account=${encodeURIComponent(profileName)}`)
  } catch (dbErr) {
    console.error('[LinkedIn OAuth] SQLite save error:', dbErr)
    return res.status(500).json({
      success: false,
      error: 'Failed to persist LinkedIn connection',
      details: dbErr.message
    })
  }
}

router.get('/linkedin/callback', protect, handleLinkedInCallback)
router.post('/linkedin/callback', protect, handleLinkedInCallback)

export default router