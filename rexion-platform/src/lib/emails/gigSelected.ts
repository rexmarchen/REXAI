import { sendEmail } from '@/lib/email'

export async function sendGigSelectedEmail(input: {
  email: string
  name?: string
  gigTitle: string
  companyName: string
}) {
  await sendEmail({
    to: input.email,
    subject: `You've been selected for ${input.gigTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.7;background:#080c0c;color:#ffffff;padding:24px;">
        <div style="max-width:560px;margin:0 auto;background:#0f1a16;border:1px solid #1e2d28;border-radius:24px;padding:28px;">
          <h1 style="margin:0 0 12px;font-size:24px;">You're in.</h1>
          <p style="margin:0 0 18px;color:#8b9e99;">Hi ${input.name || 'there'}, you have been selected for a micro-gig.</p>
          <div>Gig: <strong>${input.gigTitle}</strong></div>
          <div>Company: <strong>${input.companyName}</strong></div>
        </div>
      </div>
    `,
  })
}
