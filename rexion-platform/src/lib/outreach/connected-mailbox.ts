import crypto from 'node:crypto'
import { ConfidentialClientApplication } from '@azure/msal-node'
import { google } from 'googleapis'
import OutreachMailbox from '@/models/OutreachMailbox'
import { connectToDatabase } from '@/lib/db'

type MailboxProvider = 'google' | 'microsoft'

type ConnectedMailbox = {
  id: string
  provider: MailboxProvider
  email: string
  status: 'active' | 'disconnected'
  connectedAt: Date
}

type MailboxDocument = {
  _id: { toString(): string }
  userId: { toString(): string }
  provider: MailboxProvider
  email: string
  status: 'active' | 'disconnected'
  accessTokenEncrypted: string
  refreshTokenEncrypted: string
  tokenExpiresAt: Date
  connectedAt: Date
  save(): Promise<unknown>
}

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
]
const MICROSOFT_SCOPES = ['Mail.Send', 'User.Read', 'offline_access']

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
}

function encryptionKey() {
  const value = process.env.OUTREACH_ENCRYPTION_KEY
  if (!value || !/^[a-fA-F0-9]{64}$/.test(value)) {
    throw new Error('OUTREACH_ENCRYPTION_KEY must be a 64-character hex value before connecting a mailbox.')
  }
  return Buffer.from(value, 'hex')
}

function encrypt(value: string) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url')
}

function decrypt(value: string) {
  const payload = Buffer.from(value, 'base64url')
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), payload.subarray(0, 12))
  decipher.setAuthTag(payload.subarray(12, 28))
  return Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString('utf8')
}

function stateSecret() {
  return process.env.OUTREACH_STATE_SECRET || process.env.NEXTAUTH_SECRET || process.env.REXION_UNSUBSCRIBE_SECRET || ''
}

function createState(userId: string, provider: MailboxProvider) {
  const secret = stateSecret()
  if (!secret) throw new Error('Configure OUTREACH_STATE_SECRET or NEXTAUTH_SECRET before connecting a mailbox.')
  const payload = Buffer.from(JSON.stringify({ userId, provider, exp: Date.now() + 10 * 60_000 })).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

function readState(value: string, expectedProvider: MailboxProvider) {
  const secret = stateSecret()
  const [payload, signature] = value.split('.')
  if (!secret || !payload || !signature) throw new Error('Invalid mailbox connection state.')
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error('Invalid mailbox connection state.')
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { userId: string; provider: MailboxProvider; exp: number }
  if (data.provider !== expectedProvider || !data.userId || data.exp < Date.now()) throw new Error('Mailbox connection state expired. Please try again.')
  return data.userId
}

function googleClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) throw new Error('Google OAuth is not configured.')
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, `${appUrl()}/api/outreach/mailboxes/google/callback`)
}

function microsoftClient() {
  const { MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID = 'common' } = process.env
  if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) throw new Error('Microsoft OAuth is not configured.')
  return new ConfidentialClientApplication({
    auth: {
      clientId: MICROSOFT_CLIENT_ID,
      clientSecret: MICROSOFT_CLIENT_SECRET,
      authority: `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}`,
    },
  })
}

function toMailbox(input: MailboxDocument): ConnectedMailbox {
  return { id: input._id.toString(), provider: input.provider, email: input.email, status: input.status, connectedAt: input.connectedAt }
}

async function storeMailbox(input: { userId: string; provider: MailboxProvider; email: string; accessToken: string; refreshToken: string; expiresAt: Date }) {
  await connectToDatabase()
  const mailbox = await OutreachMailbox.findOneAndUpdate(
    { userId: input.userId, email: input.email.toLowerCase() },
    {
      $set: {
        provider: input.provider,
        status: 'active',
        accessTokenEncrypted: encrypt(input.accessToken),
        refreshTokenEncrypted: encrypt(input.refreshToken),
        tokenExpiresAt: input.expiresAt,
        connectedAt: new Date(),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )
  return toMailbox(mailbox as MailboxDocument)
}

export async function listConnectedMailboxes(userId: string): Promise<ConnectedMailbox[]> {
  await connectToDatabase()
  const mailboxes = await OutreachMailbox.find({ userId }).sort({ connectedAt: -1 }).lean()
  return mailboxes.map((mailbox) => toMailbox(mailbox as unknown as MailboxDocument))
}

export async function getConnectedMailbox(userId: string, mailboxId: string) {
  const mailbox = await findActiveMailbox(userId, mailboxId)
  return toMailbox(mailbox)
}

export async function disconnectMailbox(userId: string, mailboxId: string) {
  await connectToDatabase()
  const result = await OutreachMailbox.updateOne({ _id: mailboxId, userId }, { $set: { status: 'disconnected' } })
  return result.matchedCount === 1
}

export async function createGoogleConnectUrl(userId: string) {
  return googleClient().generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: GOOGLE_SCOPES, state: createState(userId, 'google') })
}

export async function completeGoogleConnection(code: string, state: string) {
  const userId = readState(state, 'google')
  const client = googleClient()
  const { tokens } = await client.getToken(code)
  if (!tokens.refresh_token || !tokens.access_token) throw new Error('Google did not return a reusable mailbox token. Disconnect the app in Google and try again.')
  client.setCredentials(tokens)
  const profile = await google.oauth2({ version: 'v2', auth: client }).userinfo.get()
  if (!profile.data.email) throw new Error('Google did not return a mailbox address.')
  return storeMailbox({ userId, provider: 'google', email: profile.data.email, accessToken: tokens.access_token, refreshToken: tokens.refresh_token, expiresAt: new Date(tokens.expiry_date || Date.now() + 55 * 60_000) })
}

export async function createMicrosoftConnectUrl(userId: string) {
  return microsoftClient().getAuthCodeUrl({ scopes: MICROSOFT_SCOPES, redirectUri: `${appUrl()}/api/outreach/mailboxes/microsoft/callback`, state: createState(userId, 'microsoft'), prompt: 'consent' })
}

export async function completeMicrosoftConnection(code: string, state: string) {
  const userId = readState(state, 'microsoft')
  const client = microsoftClient()
  const result = await client.acquireTokenByCode({ code, scopes: MICROSOFT_SCOPES, redirectUri: `${appUrl()}/api/outreach/mailboxes/microsoft/callback` })
  if (!result?.account?.username || !result.accessToken) throw new Error('Microsoft did not return a mailbox address.')
  return storeMailbox({ userId, provider: 'microsoft', email: result.account.username, accessToken: result.accessToken, refreshToken: client.getTokenCache().serialize(), expiresAt: result.expiresOn || new Date(Date.now() + 55 * 60_000) })
}

async function findActiveMailbox(userId: string, mailboxId: string) {
  await connectToDatabase()
  const mailbox = await OutreachMailbox.findOne({ _id: mailboxId, userId, status: 'active' })
  if (!mailbox) throw new Error('The selected mailbox is unavailable. Reconnect it before sending.')
  return mailbox as unknown as MailboxDocument
}

function rawMime(input: { fromEmail: string; fromName?: string; to: string; subject: string; html: string }) {
  const messageId = `${crypto.randomUUID()}@rexion.ai`
  return [
    `From: ${input.fromName ? `${input.fromName} <${input.fromEmail}>` : input.fromEmail}`,
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    `Message-ID: <${messageId}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    '',
    input.html,
  ].join('\r\n')
}

export async function sendViaConnectedMailbox(input: { userId: string; mailboxId: string; to: string; subject: string; html: string; fromName?: string }) {
  const mailbox = await findActiveMailbox(input.userId, input.mailboxId)
  const mime = rawMime({ fromEmail: mailbox.email, fromName: input.fromName, to: input.to, subject: input.subject, html: input.html })

  if (mailbox.provider === 'google') {
    const client = googleClient()
    client.setCredentials({ access_token: decrypt(mailbox.accessTokenEncrypted), refresh_token: decrypt(mailbox.refreshTokenEncrypted), expiry_date: mailbox.tokenExpiresAt.getTime() })
    client.on('tokens', async (tokens) => {
      if (tokens.access_token) mailbox.accessTokenEncrypted = encrypt(tokens.access_token)
      if (tokens.refresh_token) mailbox.refreshTokenEncrypted = encrypt(tokens.refresh_token)
      mailbox.tokenExpiresAt = new Date(tokens.expiry_date || Date.now() + 55 * 60_000)
      await mailbox.save()
    })
    await google.gmail({ version: 'v1', auth: client }).users.messages.send({ userId: 'me', requestBody: { raw: Buffer.from(mime).toString('base64url') } })
    return
  }

  const client = microsoftClient()
  client.getTokenCache().deserialize(decrypt(mailbox.refreshTokenEncrypted))
  const account = (await client.getTokenCache().getAllAccounts()).find((entry) => entry.username === mailbox.email)
  if (!account) throw new Error('Microsoft mailbox authorization expired. Reconnect the mailbox before sending.')
  const token = await client.acquireTokenSilent({ account, scopes: MICROSOFT_SCOPES })
  if (!token?.accessToken) throw new Error('Microsoft mailbox authorization expired. Reconnect the mailbox before sending.')
  mailbox.accessTokenEncrypted = encrypt(token.accessToken)
  mailbox.refreshTokenEncrypted = encrypt(client.getTokenCache().serialize())
  mailbox.tokenExpiresAt = token.expiresOn || new Date(Date.now() + 55 * 60_000)
  await mailbox.save()
  const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', { method: 'POST', headers: { Authorization: `Bearer ${token.accessToken}`, 'Content-Type': 'text/plain' }, body: mime })
  if (!response.ok) throw new Error(`Microsoft delivery failed: ${await response.text()}`)
}
