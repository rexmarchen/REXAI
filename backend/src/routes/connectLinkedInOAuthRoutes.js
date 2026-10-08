import crypto from 'crypto'
import express from 'express'
import db from '../lib/db.js'
import { encrypt } from '../lib/crypto.js'
import { requireAuth } from './connectAuthRoutes.js'
import {
  LINKEDIN_CLIENT_ID,
  LINKEDIN_CLIENT_SECRET,
  LINKEDIN_REDIRECT_URI
} from '../config/env.js'

const router = express.Router()

const dashboardPath = '/connect/dashboard'
const connectPath = '/connect/auth/linkedin/connect'
const callbackPath = '/connect/auth/linkedin/callback'

function hasLinkedInConfig() {
  return Boolean(LINKEDIN_CLIENT_ID && LINKEDIN_CLIENT_SECRET && LINKEDIN_REDIRECT_URI)
}

router.get('/auth/linkedin/connect', requireAuth, (req, res) => {
  if (!hasLinkedInConfig()) {
    return res.status(503).send('LinkedIn OAuth is not configured. Set LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, and LINKEDIN_REDIRECT_URI.')
  }

  const state = crypto.randomBytes(16).toString('hex')
  req.session.linkedinOAuthState = state

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINKEDIN_CLIENT_ID,
    redirect_uri: LINKEDIN_REDIRECT_URI,
    state,
    scope: 'openid profile w_member_social'
  })

  return res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`)
})

router.get('/auth/linkedin/callback', requireAuth, async (req, res) => {
  const { code, state, error } = req.query

  if (error) {
    return res.status(400).send(`LinkedIn authorization was not completed: ${error}`)
  }

  if (!state || state !== req.session.linkedinOAuthState) {
    return res.status(400).send('Invalid OAuth state. Please try connecting LinkedIn again.')
  }

  delete req.session.linkedinOAuthState

  try {
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: LINKEDIN_REDIRECT_URI,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET
      })
    })

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${await tokenResponse.text()}`)
    }

    const tokenData = await tokenResponse.json()

    const userInfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    })

    if (!userInfoResponse.ok) {
      throw new Error(`Fetching LinkedIn user info failed: ${await userInfoResponse.text()}`)
    }

    const userInfo = await userInfoResponse.json()
    const personUrn = `urn:li:person:${userInfo.sub}`
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000)

    await db.query(
      `INSERT INTO linkedin_accounts (user_id, person_urn, access_token_encrypted, refresh_token_encrypted, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET
         person_urn = EXCLUDED.person_urn,
         access_token_encrypted = EXCLUDED.access_token_encrypted,
         refresh_token_encrypted = EXCLUDED.refresh_token_encrypted,
         expires_at = EXCLUDED.expires_at,
         connected_at = now()`,
      [
        req.session.userId,
        personUrn,
        encrypt(tokenData.access_token),
        tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null,
        expiresAt
      ]
    )

    return res.redirect(`${dashboardPath}?connected=1`)
  } catch (err) {
    console.error('LinkedIn OAuth callback error:', err)
    return res.status(500).send(`Failed to connect LinkedIn: ${err.message}`)
  }
})

router.get('/auth/linkedin/help', (req, res) => {
  res.send(`
    <h1>LinkedIn OAuth setup</h1>
    <p>Set LINKEDIN_REDIRECT_URI to the exact callback URL registered in LinkedIn.</p>
    <p>Local callback: http://localhost:5000${callbackPath}</p>
    <p><a href="${connectPath}">Connect LinkedIn</a></p>
  `)
})

export default router
