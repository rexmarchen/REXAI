import { buildUnsubscribeFooter, sendEmail } from '@/lib/email'
import type { ApplicationBatchShape, StoredUser } from '@/types'

function renderResultItems(
  results: ApplicationBatchShape['results'],
  status: 'applied' | 'skipped' | 'failed'
) {
  const items = results.filter((result) => result.status === status)
  if (!items.length) {
    return ''
  }

  return items
    .map(
      (item) =>
        `<li><strong>${item.title}</strong> at ${item.companyName}${
          item.note ? ` <span style="color:#9bb0a0;">(${item.note})</span>` : ''
        }</li>`
    )
    .join('')
}

export async function sendMicroGigApplyAllSummaryEmail(user: StoredUser, batch: ApplicationBatchShape) {
  if (!user.email) {
    return
  }

  const appliedList = renderResultItems(batch.results, 'applied')
  const skippedList = renderResultItems(batch.results, 'skipped')
  const failedList = renderResultItems(batch.results, 'failed')

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.7;color:#f5f7f5;background:#0a100c;padding:24px;border-radius:16px;">
      <h1 style="margin:0 0 16px;font-size:24px;">Your Apply All batch is complete</h1>
      <p style="margin:0 0 16px;">Hi ${user.name || 'there'}, your matched micro-gig applications have been processed.</p>
      <ul style="margin:0 0 18px;padding-left:20px;">
        <li><strong>Total processed:</strong> ${batch.totalJobsProcessed}</li>
        <li><strong>Applied:</strong> ${batch.successfulApplications}</li>
        <li><strong>Skipped:</strong> ${batch.skippedApplications}</li>
        <li><strong>Failed:</strong> ${batch.failedApplications}</li>
      </ul>
      ${
        appliedList
          ? `<h2 style="margin:20px 0 8px;font-size:18px;">Applied</h2><ul style="margin:0;padding-left:20px;">${appliedList}</ul>`
          : ''
      }
      ${
        skippedList
          ? `<h2 style="margin:20px 0 8px;font-size:18px;">Skipped</h2><ul style="margin:0;padding-left:20px;">${skippedList}</ul>`
          : ''
      }
      ${
        failedList
          ? `<h2 style="margin:20px 0 8px;font-size:18px;">Failed</h2><ul style="margin:0;padding-left:20px;">${failedList}</ul>`
          : ''
      }
      ${buildUnsubscribeFooter(user.email)}
    </div>
  `

  await sendEmail({
    to: user.email,
    subject: `Apply All complete: ${batch.successfulApplications} applications sent`,
    html,
  })
}
