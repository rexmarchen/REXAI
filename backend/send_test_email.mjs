/**
 * Direct SMTP test — sends a real email using the configured credentials.
 * Run: node send_test_email.mjs <recipient>
 */
import nodemailer from 'nodemailer'
import { config } from 'dotenv'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '.env.local') })

const to = process.argv[2] || 'apuravsharma2007@gmail.com'

console.log(`\n[REXION Email Test]`)
console.log(`  SMTP Host  : ${process.env.SMTP_HOST}`)
console.log(`  SMTP User  : ${process.env.SMTP_USER}`)
console.log(`  From       : ${process.env.EMAIL_FROM}`)
console.log(`  Sending to : ${to}`)

// Warn about known typos
const domain = to.split('@')[1] || ''
const TYPOS = new Set(['gamil.com','gmai.com','gmial.com','gmail.co','gmail.con'])
if (TYPOS.has(domain)) {
  console.warn(`\n  ⚠️  WARNING: "${domain}" looks like a typo!`)
  console.warn(`  Did you mean "gmail.com"? The email will be sent but may not be delivered.\n`)
}

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT || 465),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

try {
  const info = await transporter.sendMail({
    from:    `"REXION Career OS" <${process.env.EMAIL_FROM}>`,
    to,
    subject: 'REXION — Test Email (Delivery Verification)',
    html: `
      <div style="font-family:sans-serif;background:#0b130e;color:#f4f7f4;padding:32px;border-radius:12px;max-width:520px;">
        <div style="margin-bottom:20px;">
          <span style="color:#10b981;font-weight:800;font-size:22px;">REXION</span>
          <span style="color:#8aa392;font-size:12px;margin-left:8px;letter-spacing:0.1em;">CAREER OS</span>
        </div>
        <h2 style="color:#fff;margin:0 0 12px;">✅ Email Delivery Test</h2>
        <p style="color:#c2d1c6;">If you are reading this, your email address is working correctly and REXION can reach your inbox.</p>
        <div style="background:#0e1d15;border:1px solid rgba(16,185,129,0.15);border-radius:8px;padding:16px;margin:20px 0;">
          <div style="color:#8aa392;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Delivered to</div>
          <div style="color:#10b981;font-size:16px;font-weight:600;margin-top:6px;">${to}</div>
          <div style="color:#8aa392;font-size:11px;margin-top:8px;">Sent at: ${new Date().toISOString()}</div>
        </div>
        <p style="color:#8aa392;font-size:12px;">This is a delivery verification email from your REXION Career OS instance.</p>
      </div>
    `,
    text: `REXION Career OS — Email Delivery Test\n\nIf you are reading this, your email address is working correctly.\nDelivered to: ${to}\nSent at: ${new Date().toISOString()}`
  })

  console.log(`\n  ✅ Sent successfully!`)
  console.log(`  MessageId: ${info.messageId}`)
  console.log(`\n  If the recipient doesn't see it:`)
  console.log(`   1. Check Spam / Junk folder`)
  console.log(`   2. Check Promotions tab in Gmail`)
  console.log(`   3. Verify the address has no typos`)
} catch (err) {
  console.error(`\n  ❌ Send failed: ${err.message}`)
  if (err.responseCode === 535) console.error('  → SMTP credentials rejected. Check SMTP_PASS in .env.local')
  if (err.responseCode === 550) console.error('  → Recipient address rejected by receiving server (likely does not exist).')
  process.exit(1)
}
