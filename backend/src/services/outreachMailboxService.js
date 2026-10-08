import crypto from 'node:crypto'
import axios from 'axios'
import { OAuth2Client } from 'google-auth-library'
import OutreachMailbox from '../models/OutreachMailbox.js'

const appUrl = () => process.env.FRONTEND_URL || 'http://localhost:5173'
const apiUrl = () => process.env.BACKEND_URL || 'http://localhost:5000'
const stateSecret = () => process.env.OUTREACH_STATE_SECRET || process.env.JWT_SECRET || ''

const encryptionKey = () => {
  const key = process.env.OUTREACH_ENCRYPTION_KEY
  if (!key || !/^[a-fA-F0-9]{64}$/.test(key)) throw new Error('OUTREACH_ENCRYPTION_KEY must be a 64-character hex value.')
  return Buffer.from(key, 'hex')
}

const encrypt = (value) => {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url')
}

const decrypt = (value) => {
  const payload = Buffer.from(value, 'base64url')
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), payload.subarray(0, 12))
  decipher.setAuthTag(payload.subarray(12, 28))
  return Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString('utf8')
}

const createState = (userId, provider) => {
  const secret = stateSecret()
  if (!secret) throw new Error('OUTREACH_STATE_SECRET or JWT_SECRET must be configured.')
  const payload = Buffer.from(JSON.stringify({ userId, provider, exp: Date.now() + 10 * 60_000 })).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

const readState = (value, provider) => {
  const [payload, signature] = String(value || '').split('.')
  const secret = stateSecret()
  if (!payload || !signature || !secret) throw new Error('Invalid mailbox connection state.')
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error('Invalid mailbox connection state.')
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  if (data.provider !== provider || !data.userId || data.exp < Date.now()) throw new Error('Mailbox connection state expired. Try again.')
  return data.userId
}

const googleClient = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) throw new Error('Google OAuth is not configured.')
  return new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, `${apiUrl()}/api/outreach/mailboxes/google/callback`)
}

const toPublicMailbox = (mailbox) => ({
  id: String(mailbox._id), provider: mailbox.provider, email: mailbox.email, status: mailbox.status, connectedAt: mailbox.connectedAt
})

const saveMailbox = async ({ userId, provider, email, accessToken, refreshToken, expiresAt }) => {
  const mailbox = await OutreachMailbox.findOneAndUpdate(
    { userId, email: email.toLowerCase() },
    { $set: { provider, status: 'active', accessTokenEncrypted: encrypt(accessToken), refreshTokenEncrypted: encrypt(refreshToken), tokenExpiresAt: expiresAt, connectedAt: new Date() } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )
  return toPublicMailbox(mailbox)
}

export const listMailboxes = async (userId) => (await OutreachMailbox.find({ userId }).sort({ connectedAt: -1 })).map(toPublicMailbox)

export const getActiveMailbox = async (userId, mailboxId) => {
  const mailbox = await OutreachMailbox.findOne({ _id: mailboxId, userId, status: 'active' })
  if (!mailbox) throw new Error('The selected mailbox is unavailable. Reconnect it before sending.')
  return mailbox
}

export const getGoogleConnectUrl = (userId) => googleClient().generateAuthUrl({
  access_type: 'offline', prompt: 'consent', state: createState(userId, 'google'),
  scope: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/userinfo.email']
})

export const completeGoogleConnection = async (code, state) => {
  const userId = readState(state, 'google')
  const client = googleClient()
  const { tokens } = await client.getToken(code)
  if (!tokens.access_token || !tokens.refresh_token) throw new Error('Google did not return a reusable token. Remove this app in Google permissions and reconnect.')
  const profile = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` } })
  if (!profile.data?.email) throw new Error('Google did not return a mailbox address.')
  return saveMailbox({ userId, provider: 'google', email: profile.data.email, accessToken: tokens.access_token, refreshToken: tokens.refresh_token, expiresAt: new Date(tokens.expiry_date || Date.now() + 55 * 60_000) })
}

export const getMicrosoftConnectUrl = (userId) => {
  if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) throw new Error('Microsoft OAuth is not configured.')
  const params = new URLSearchParams({ client_id: process.env.MICROSOFT_CLIENT_ID, response_type: 'code', redirect_uri: `${apiUrl()}/api/outreach/mailboxes/microsoft/callback`, response_mode: 'query', scope: 'offline_access User.Read Mail.Send', state: createState(userId, 'microsoft') })
  return `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || 'common'}/oauth2/v2.0/authorize?${params}`
}

export const completeMicrosoftConnection = async (code, state) => {
  const userId = readState(state, 'microsoft')
  const tokenResponse = await axios.post(`https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || 'common'}/oauth2/v2.0/token`, new URLSearchParams({ client_id: process.env.MICROSOFT_CLIENT_ID, client_secret: process.env.MICROSOFT_CLIENT_SECRET, code, redirect_uri: `${apiUrl()}/api/outreach/mailboxes/microsoft/callback`, grant_type: 'authorization_code' }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
  const { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn } = tokenResponse.data
  const profile = await axios.get('https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName', { headers: { Authorization: `Bearer ${accessToken}` } })
  const email = profile.data.mail || profile.data.userPrincipalName
  if (!accessToken || !refreshToken || !email) throw new Error('Microsoft did not return a reusable mailbox address.')
  return saveMailbox({ userId, provider: 'microsoft', email, accessToken, refreshToken, expiresAt: new Date(Date.now() + Number(expiresIn || 3300) * 1000) })
}

export const sendViaMailbox = async ({ userId, mailboxId, to, subject, html, fromName }) => {
  const mailbox = await getActiveMailbox(userId, mailboxId)
  if (mailbox.provider === 'google') {
    const client = googleClient()
    client.setCredentials({ access_token: decrypt(mailbox.accessTokenEncrypted), refresh_token: decrypt(mailbox.refreshTokenEncrypted), expiry_date: mailbox.tokenExpiresAt.getTime() })
    const token = await client.getAccessToken()
    if (!token.token) throw new Error('Google mailbox authorization expired. Reconnect it before sending.')
    const mime = [`From: ${fromName ? `${fromName} <${mailbox.email}>` : mailbox.email}`, `To: ${to}`, `Subject: ${subject}`, 'MIME-Version: 1.0', 'Content-Type: text/html; charset=UTF-8', '', html].join('\r\n')
    await axios.post('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', { raw: Buffer.from(mime).toString('base64url') }, { headers: { Authorization: `Bearer ${token.token}` } })
    return
  }
  const refresh = await axios.post(`https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || 'common'}/oauth2/v2.0/token`, new URLSearchParams({ client_id: process.env.MICROSOFT_CLIENT_ID, client_secret: process.env.MICROSOFT_CLIENT_SECRET, refresh_token: decrypt(mailbox.refreshTokenEncrypted), grant_type: 'refresh_token', scope: 'offline_access User.Read Mail.Send' }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
  mailbox.accessTokenEncrypted = encrypt(refresh.data.access_token)
  if (refresh.data.refresh_token) mailbox.refreshTokenEncrypted = encrypt(refresh.data.refresh_token)
  mailbox.tokenExpiresAt = new Date(Date.now() + Number(refresh.data.expires_in || 3300) * 1000)
  await mailbox.save()
  await axios.post('https://graph.microsoft.com/v1.0/me/sendMail', { message: { subject, body: { contentType: 'HTML', content: html }, toRecipients: [{ emailAddress: { address: to } }], from: { emailAddress: { address: mailbox.email, name: fromName || mailbox.email } } }, saveToSentItems: true }, { headers: { Authorization: `Bearer ${refresh.data.access_token}` } })
}

export const oauthCallbackRedirect = (result) => `${appUrl()}/dashboard?outreachMailbox=${result}`
