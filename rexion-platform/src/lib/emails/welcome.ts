import { sendEmail } from '@/lib/email'
import { getAppUrl } from '@/lib/runtime'
import { escapeHtml } from '@/lib/utils'

export async function sendWelcomeEmail(email: string, name = 'there') {
  const appUrl = getAppUrl()
  const joined = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
  }).format(new Date())
  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.7;background:#080c0c;color:#ffffff;padding:24px;">
      <div style="max-width:620px;margin:0 auto;background:#0f1a16;border:1px solid #1e2d28;border-radius:24px;overflow:hidden;">
        <div style="padding:28px 28px 16px;border-bottom:1px solid #1e2d28;">
          <div style="display:inline-flex;align-items:center;gap:10px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#8b9e99;">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:999px;background:#10b981;color:#04110d;font-weight:700;">Rx</span>
            REXION AI
          </div>
        </div>
        <div style="padding:28px;">
          <h1 style="margin:0 0 12px;font-size:28px;line-height:1.1;">Hey ${safeName}, welcome aboard.</h1>
          <p style="margin:0 0 20px;color:#8b9e99;">
            Your account is live on REXION AI, the AI-powered career operating system built for India's job seekers.
          </p>
          <div style="display:grid;gap:10px;margin:0 0 24px;">
            <div>- Account created</div>
            <div>- Free plan activated</div>
            <div>- AI systems ready</div>
          </div>
          <div style="margin:0 0 24px;">
            <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#8b9e99;margin-bottom:10px;">What you can do right now</div>
            <div>- Analyze your resume</div>
            <div>- Find matching jobs</div>
            <div>- Browse micro-internships</div>
            <div>- Track your applications</div>
          </div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin:0 0 24px;">
            <a href="${appUrl}/dashboard" style="display:inline-flex;padding:12px 18px;border-radius:999px;background:#10b981;color:#04110d;font-weight:700;text-decoration:none;">Open Your Dashboard</a>
            <a href="${appUrl}/dashboard/billing" style="display:inline-flex;padding:12px 18px;border-radius:999px;border:1px solid #2a4a3e;color:#ffffff;text-decoration:none;">Upgrade to Pro</a>
          </div>
          <div style="padding:18px;border-radius:18px;background:#162420;border:1px solid #1e2d28;">
            <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#8b9e99;margin-bottom:10px;">Account details</div>
            <div>Email: ${safeEmail}</div>
            <div>Plan: Free</div>
            <div>Joined: ${joined}</div>
          </div>
          <p style="margin:24px 0 0;color:#8b9e99;">Team REXION AI<br />Built for India's job seekers.</p>
        </div>
      </div>
    </div>
  `

  await sendEmail({
    to: email,
    subject: 'Welcome to REXION AI - Your Career OS is Live',
    html,
  })
}
