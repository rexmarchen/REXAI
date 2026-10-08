import db from '../../lib/db.js'
import { decrypt, encrypt } from '../../lib/crypto.js'
import {
  LINKEDIN_CLIENT_ID,
  LINKEDIN_CLIENT_SECRET,
  LINKEDIN_VERSION
} from '../../config/env.js'
import { ensureAutomationSchema } from './schema.js'

const REFRESH_WINDOW_MS = 10 * 60 * 1000

async function refreshLinkedInToken(account) {
  if (!account.refresh_token_encrypted) {
    throw new Error('LinkedIn token is expired and no refresh token is stored. Reconnect LinkedIn.')
  }

  const refreshToken = decrypt(account.refresh_token_encrypted)
  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: LINKEDIN_CLIENT_ID,
      client_secret: LINKEDIN_CLIENT_SECRET
    })
  })

  if (!response.ok) {
    throw new Error(`LinkedIn token refresh failed: ${await response.text()}`)
  }

  const data = await response.json()
  const expiresAt = new Date(Date.now() + Number(data.expires_in || 0) * 1000)
  const encryptedAccessToken = encrypt(data.access_token)
  const encryptedRefreshToken = data.refresh_token
    ? encrypt(data.refresh_token)
    : account.refresh_token_encrypted

  await db.query(
    `UPDATE linkedin_accounts
     SET access_token_encrypted = $1,
         refresh_token_encrypted = $2,
         expires_at = $3,
         connected_at = now()
     WHERE user_id = $4`,
    [encryptedAccessToken, encryptedRefreshToken, expiresAt, account.user_id]
  )

  return {
    accessToken: data.access_token,
    personUrn: account.person_urn,
    expiresAt
  }
}

export async function getLinkedInAccountStatus(userId) {
  await ensureAutomationSchema()
  const result = await db.query(
    `SELECT user_id, person_urn, expires_at, connected_at
     FROM linkedin_accounts
     WHERE user_id = $1`,
    [userId]
  )

  const account = result.rows[0]
  if (!account) {
    return { connected: false }
  }

  return {
    connected: true,
    personUrn: account.person_urn,
    expiresAt: account.expires_at,
    connectedAt: account.connected_at,
    needsReconnect: new Date(account.expires_at).getTime() <= Date.now()
  }
}

export async function getLinkedInAccessForUser(userId) {
  await ensureAutomationSchema()
  const result = await db.query(
    `SELECT user_id, person_urn, access_token_encrypted, refresh_token_encrypted, expires_at
     FROM linkedin_accounts
     WHERE user_id = $1`,
    [userId]
  )

  const account = result.rows[0]
  if (!account) {
    throw new Error('Connect LinkedIn before running automation.')
  }

  const expiresAt = new Date(account.expires_at)
  if (expiresAt.getTime() - Date.now() <= REFRESH_WINDOW_MS) {
    return refreshLinkedInToken(account)
  }

  return {
    accessToken: decrypt(account.access_token_encrypted),
    personUrn: account.person_urn,
    expiresAt
  }
}

export async function publishLinkedInPostForUser(userId, text, imageUrn = null) {
  const { accessToken, personUrn } = await getLinkedInAccessForUser(userId)
  const body = {
    author: personUrn,
    commentary: text,
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: []
    },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false
  }

  if (imageUrn) {
    body.content = { media: { id: imageUrn } }
  }

  const response = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': LINKEDIN_VERSION || '202405'
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw new Error(`LinkedIn post error: ${await response.text()}`)
  }

  return response.headers.get('x-restli-id')
}

export async function testLinkedInToken(accessToken) {
  if (!accessToken) return { ok: false, message: 'Access token is required.' }
  try {
    const res = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    if (!res.ok) {
      const err = await res.text()
      return { ok: false, message: `LinkedIn API returned ${res.status}: ${err}` }
    }
    const data = await res.json()
    return {
      ok: true,
      name: data.name || `${data.given_name || ''} ${data.family_name || ''}`.trim() || 'LinkedIn User',
      sub: data.sub,
      personUrn: `urn:li:person:${data.sub}`,
      picture: data.picture || null
    }
  } catch (err) {
    return { ok: false, message: err.message }
  }
}

export async function saveDirectLinkedInToken(userId, { accessToken, personUrn, name = 'LinkedIn User' }) {
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
  const encrypted = encrypt(accessToken)

  try {
    await ensureAutomationSchema()
    await db.query(
      `INSERT INTO linkedin_accounts (user_id, person_urn, access_token_encrypted, expires_at, connected_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (user_id)
       DO UPDATE SET person_urn = EXCLUDED.person_urn,
                     access_token_encrypted = EXCLUDED.access_token_encrypted,
                     expires_at = EXCLUDED.expires_at,
                     connected_at = now()`,
      [userId, personUrn, encrypted, expiresAt]
    )
  } catch (err) {
    console.warn('[Direct Token Storage Notice]:', err.message)
  }

  return { connected: true, personUrn, name, expiresAt }
}
