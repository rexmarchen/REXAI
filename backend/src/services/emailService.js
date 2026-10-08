import fs from 'node:fs'
import path from 'node:path'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import { logger } from '../utils/logger.js'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config({ path: path.join(process.cwd(), '.env') })

const DEFAULT_FROM_EMAIL = 'team@rexion.ai'

const normalizeTextField = (value, maxLength = 400) =>
  String(value || '')
    .trim()
    .slice(0, maxLength)

const getFromAddress = () =>
  normalizeTextField(process.env.EMAIL_FROM || process.env.SENDGRID_FROM_EMAIL, 160) ||
  DEFAULT_FROM_EMAIL

/**
 * Creates and returns a Nodemailer transporter instance configured via environment variables.
 * Enables connection pooling by default if SMTP credentials are provided.
 */
const getTransporter = () => {
  const host = normalizeTextField(process.env.SMTP_HOST, 300)
  const user = normalizeTextField(process.env.SMTP_USER, 300)
  const pass = normalizeTextField(process.env.SMTP_PASS, 500)

  if (!host || !user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true' || Number(process.env.SMTP_PORT) === 465,
    pool: String(process.env.SMTP_POOL).toLowerCase() === 'true', // Reuse TCP connections if explicitly enabled
    maxConnections: 5,
    maxMessages: 100,
    auth: {
      user,
      pass
    }
  })
}

/**
 * Writes an email payload to the filesystem as an HTML file. Used when no email provider
 * is configured or during local development/test fallbacks.
 */
const saveLocalEmailPreview = ({ to, subject, html, text }) => {
  const normalizedRecipient = normalizeTextField(to, 200).toLowerCase()
  const filename = `email_${Date.now()}_${normalizedRecipient.replace(/[^a-zA-Z0-9]/g, '_')}.html`
  const uploadsDir = path.join(process.cwd(), 'uploads')
  const emailsDir = path.join(uploadsDir, 'emails')
  try {
    if (!fs.existsSync(emailsDir)) {
      fs.mkdirSync(emailsDir, { recursive: true })
    }
    fs.writeFileSync(path.join(emailsDir, filename), html, 'utf8')
    const previewUrl = `/api/domination/email/${filename}`
    logger.info(`[EMAIL PREVIEW] E-mail saved locally to uploads/emails/${filename}. Access it via: http://localhost:5000${previewUrl}`)
    return {
      status: 'sent',
      provider: 'local_preview',
      sentAt: new Date().toISOString(),
      previewUrl,
      filename
    }
  } catch (err) {
    logger.error(`Failed to write local email preview file: ${err.message}`)
    return {
      status: 'skipped',
      provider: null,
      reason: `No email provider configured. Local write failed: ${err.message}`
    }
  }
}

/**
 * Core transactional & outreach email dispatcher.
 * Supports standard Nodemailer options (to, subject, html, text, cc, bcc, attachments, replyTo).
 */
// Common single-character domain typos that result in silent delivery failures.
const SUSPICIOUS_DOMAINS = new Set([
  'gamil.com', 'gmai.com', 'gmial.com', 'gmail.co', 'gmail.con',
  'yaho.com', 'yahooo.com', 'hotmai.com', 'hotmail.con',
  'outlok.com', 'outloo.com', 'outloook.com',
])

export const sendEmail = async ({ to, subject, html, text, cc, bcc, attachments, replyTo }) => {
  let normalizedRecipient = normalizeTextField(to, 200).toLowerCase()

  if (normalizedRecipient) {
    normalizedRecipient = normalizedRecipient
      .replace(/@gamil\.com$/i, '@gmail.com')
      .replace(/@gmai\.com$/i, '@gmail.com')
      .replace(/@gmial\.com$/i, '@gmail.com')
      .replace(/@gmail\.co$/i, '@gmail.com')
      .replace(/@gmail\.con$/i, '@gmail.com')
      .replace(/@yaho\.com$/i, '@yahoo.com')
      .replace(/@hotmai\.com$/i, '@hotmail.com')
  }

  const normalizedSubject = normalizeTextField(subject, 240)

  if (!normalizedRecipient || !normalizedRecipient.includes('@')) {
    return {
      status: 'skipped',
      provider: null,
      reason: 'Recipient email address is missing or invalid.'
    }
  }

  // Warn about known typo domains if any remain
  const recipientDomain = normalizedRecipient.split('@')[1] || ''
  if (SUSPICIOUS_DOMAINS.has(recipientDomain)) {
    logger.warn(`[EMAIL] Suspicious domain detected in recipient address "${normalizedRecipient}".`)
  }

  if (!normalizedSubject || !normalizeTextField(html, 20000)) {
    return {
      status: 'skipped',
      provider: 'smtp',
      reason: 'Email subject or body is missing.'
    }
  }

  const transporter = getTransporter()

  if (!transporter) {
    logger.info('No SMTP credentials configured. Saving email to local preview.')
    return saveLocalEmailPreview({ to, subject, html, text })
  }

  try {
    const mailOptions = {
      from: getFromAddress(),
      to: normalizedRecipient,
      subject: normalizedSubject,
      html,
      text,
      replyTo: replyTo || process.env.EMAIL_REPLY_TO || getFromAddress(),
      ...(cc && { cc }),
      ...(bcc && { bcc }),
      ...(attachments && { attachments })
    }

    logger.info(`[SMTP] Attempting to send email to "${normalizedRecipient}" with subject "${normalizedSubject}"...`)
    const info = await transporter.sendMail(mailOptions)
    logger.info(`[SMTP] Email successfully sent to "${normalizedRecipient}"! MessageId: ${info?.messageId || 'N/A'}`)
    return {
      status: 'sent',
      provider: 'smtp',
      sentAt: new Date().toISOString()
    }
  } catch (err) {
    logger.error(`[SMTP] Delivery failed: ${err.message}`)
    logger.warn('[SMTP] Falling back to local email preview file.')
    return saveLocalEmailPreview({ to, subject, html, text })
  }
}
