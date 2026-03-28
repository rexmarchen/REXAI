import sgMail from '@sendgrid/mail'
import nodemailer from 'nodemailer'

export interface EmailPayload {
  to: string
  subject: string
  html: string
}

function getFromAddress() {
  return process.env.SENDGRID_FROM_EMAIL || 'team@rexion.ai'
}

function createSmtpTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export function buildUnsubscribeFooter(email: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const token = Buffer.from(email).toString('base64url')
  return `<p style="margin-top:24px;color:#7f8b83;font-size:12px;">Unsubscribe from REXION outreach emails: <a href="${appUrl}/api/unsubscribe?token=${token}" style="color:#30d480;">unsubscribe</a></p>`
}

export async function sendEmail(payload: EmailPayload) {
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    await sgMail.send({
      to: payload.to,
      from: getFromAddress(),
      subject: payload.subject,
      html: payload.html,
    })
    return
  }

  const transport = createSmtpTransport()
  if (transport) {
    await transport.sendMail({
      to: payload.to,
      from: getFromAddress(),
      subject: payload.subject,
      html: payload.html,
    })
    return
  }

  console.info('Email delivery skipped because no provider is configured.', payload)
}
