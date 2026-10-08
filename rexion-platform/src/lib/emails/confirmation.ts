import { sendEmail } from '@/lib/email'

export async function sendOutreachConfirmationEmail(input: {
  email: string
  name?: string
  companyName: string
  recipients: number
  subject: string
}) {
  await sendEmail({
    to: input.email,
    subject: `Outreach launched for ${input.companyName}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.7;background:#080c0c;color:#ffffff;padding:24px;">
        <div style="max-width:560px;margin:0 auto;background:#0f1a16;border:1px solid #1e2d28;border-radius:24px;padding:28px;">
          <h1 style="margin:0 0 12px;font-size:24px;">Mission launched.</h1>
          <p style="margin:0 0 18px;color:#8b9e99;">Hi ${input.name || 'there'}, your outreach campaign is queued and ready to work.</p>
          <div>Company: <strong>${input.companyName}</strong></div>
          <div>Recipients: <strong>${input.recipients}</strong></div>
          <div>Subject: <strong>${input.subject}</strong></div>
        </div>
      </div>
    `,
  })
}
