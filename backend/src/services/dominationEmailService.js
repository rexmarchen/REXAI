import { sendEmail } from './emailService.js'
import logger from '../utils/logger.js'

// ── Strict Single-Recipient Assertion Safeguard ────────────────────────────

/**
 * Validates that the recipient is strictly ONE valid email address matching the authenticated user.
 * Throws and logs rather than sending if the assertion fails.
 */
export function assertSingleAuthenticatedRecipient(recipient, expectedEmail = null) {
  if (!recipient || typeof recipient !== 'string') {
    const msg = `[Security Assertion Failed] Recipient is empty or not a string: ${JSON.stringify(recipient)}`
    logger.error(msg)
    throw new Error(msg)
  }

  const clean = recipient.trim().toLowerCase()

  // Guard against multiple recipients / comma-separated lists / arrays
  if (clean.includes(',') || clean.includes(';') || clean.includes(' ') || !clean.includes('@')) {
    const msg = `[Security Assertion Failed] Recipient must be exactly 1 valid email address without lists or commas. Received: "${recipient}"`
    logger.error(msg)
    throw new Error(msg)
  }

  // Guard against mismatch with authenticated session email
  if (expectedEmail) {
    const expectedClean = String(expectedEmail).trim().toLowerCase()
    if (clean !== expectedClean) {
      const msg = `[Security Assertion Failed] Recipient "${clean}" does not match authenticated user email "${expectedClean}".`
      logger.error(msg)
      throw new Error(msg)
    }
  }

  return clean
}

const normalizeTextField = (value, maxLength = 240) => {
  if (!value || typeof value !== 'string') {
    return ''
  }

  return value.trim().slice(0, maxLength)
}

const escapeHtml = (value) => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const formatMetric = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  return '--'
}

const formatList = (items, fallbackText) => {
  if (!Array.isArray(items) || items.length === 0) {
    return `
      <li style="padding:12px;border:1px dashed rgba(255,255,255,0.1);border-radius:8px;color:#8aa392;font-size:13px;list-style:none;text-align:center;">
        ${escapeHtml(fallbackText)}
      </li>
    `
  }

  return items
    .slice(0, 10)
    .map((item) => {
      let title = 'Job update'
      let company = 'Target Company'
      let status = 'Processed'
      let note = ''

      if (typeof item === 'string') {
        // Parse "Role at Company — Note/Status" string
        const atParts = item.split(/\s+at\s+/i)
        if (atParts.length > 1) {
          title = atParts[0].trim()
          const dashParts = atParts[1].split(/\s+[—–-]\s+/)
          company = dashParts[0].trim()
          if (dashParts[1]) status = dashParts[1].trim()
        } else {
          title = item.trim()
        }
      } else if (typeof item === 'object' && item !== null) {
        title = item.title || item.jobTitle || item.role || 'Job update'
        company = item.company || item.organization || 'Target Company'
        status = item.status || item.reason || 'Recorded'
        note = item.evidence || item.reason || ''
      }

      const stLower = status.toLowerCase()
      let statusColor = '#e27d7d'
      let statusBg = 'rgba(226,125,125,0.12)'
      let statusIcon = '✗'
      let statusText = status

      if (['applied', 'sent', 'completed', 'ok', 'success'].some(s => stLower.includes(s))) {
        statusColor = '#48c484'
        statusBg = 'rgba(72,196,132,0.15)'
        statusIcon = '✓'
        statusText = 'Applied'
      } else if (['manual', 'manual_required', 'external'].some(s => stLower.includes(s))) {
        statusColor = '#58a6ff'
        statusBg = 'rgba(88,166,255,0.15)'
        statusIcon = '⚡'
        statusText = 'Manual Link'
      } else if (['queued', 'processing', 'applying'].some(s => stLower.includes(s))) {
        statusColor = '#d29922'
        statusBg = 'rgba(210,153,34,0.15)'
        statusIcon = '⏱'
        statusText = 'In Progress'
      } else {
        statusColor = '#e27d7d'
        statusBg = 'rgba(226,125,125,0.12)'
        statusIcon = '✗'
        statusText = status.length > 20 ? 'Failed' : status
      }

      return `
        <li style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.04);list-style:none;display:flex;justify-content:between;align-items:start;gap:8px;">
          <div style="flex:1;">
            <strong style="color:#ffffff;font-size:14px;">${escapeHtml(title)}</strong>
            <div style="color:#8aa392;font-size:12px;margin-top:2px;">at ${escapeHtml(company)}</div>
            ${note ? `<div style="color:#6e7681;font-size:11px;margin-top:4px;">${escapeHtml(note.slice(0, 100))}</div>` : ''}
          </div>
          <span style="color:${statusColor};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;background:${statusBg};border:1px solid ${statusColor}33;padding:4px 10px;border-radius:6px;white-space:nowrap;display:inline-flex;align-items:center;gap:4px;">
            <span>${statusIcon}</span> ${escapeHtml(statusText)}
          </span>
        </li>
      `
    })
    .join('')
}

const normalizeDeliveryResult = (delivery) => {
  if (delivery?.status === 'sent') {
    return delivery
  }

  return {
    status: 'failed',
    provider: delivery?.provider || null,
    reason: delivery?.reason || 'The backend could not send the notification email.',
    sentAt: delivery?.sentAt || null
  }
}

const detectConfiguredProvider = () => {
  if (normalizeTextField(process.env.SMTP_HOST, 300)) {
    return 'smtp'
  }

  return null
}

const extractDeliveryReason = (error) => {
  return error?.message || 'The backend could not send the notification email.'
}

const getDashboardUrl = () => {
  return normalizeTextField(process.env.APP_URL || process.env.FRONTEND_URL, 500) || 'http://localhost:5173'
}

const buildLaunchEmailCopy = ({
  fullName,
  targetRole,
  runId
}) => {
  const recipientName = normalizeTextField(fullName, 120) || 'there'
  const role = normalizeTextField(targetRole, 120) || 'your selected role'
  const dashboardUrl = getDashboardUrl()
  const subject = `[REXION] 1-Click Autopilot initiated for ${role}`

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#030705;color:#f4f7f4;padding:40px 20px;line-height:1.6;margin:0;">
      <div style="max-width:600px;margin:0 auto;background-color:#0b130e;border:1px solid rgba(16,185,129,0.15);border-radius:24px;padding:32px;box-shadow:0 12px 30px rgba(0,0,0,0.5);">
        
        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:between;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:20px;margin-bottom:28px;">
          <div>
            <span style="color:#10b981;font-weight:800;font-size:20px;letter-spacing:-0.03em;">REXION</span>
            <span style="color:#8aa392;font-size:12px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;margin-left:8px;">Career OS</span>
          </div>
        </div>

        <!-- Title -->
        <p style="margin:0 0 8px;color:#10b981;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;">1-Click Mode Launch</p>
        <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;line-height:1.3;color:#ffffff;">Autopilot Initiated</h1>
        <p style="margin:0 0 24px;color:#c2d1c6;font-size:15px;">Hi ${escapeHtml(recipientName)}, we have successfully queued your automated job application run for <strong>${escapeHtml(role)}</strong>.</p>

        <!-- Stats Card -->
        <div style="background-color:#0e1d15;border:1px solid rgba(16,185,129,0.1);border-radius:16px;padding:20px;margin-bottom:28px;">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:16px;">
            <div>
              <div style="color:#8aa392;font-size:10px;text-transform:uppercase;letter-spacing:0.15em;">Target Role</div>
              <div style="margin-top:6px;font-size:15px;font-weight:600;color:#ffffff;">${escapeHtml(role)}</div>
            </div>
            <div>
              <div style="color:#8aa392;font-size:10px;text-transform:uppercase;letter-spacing:0.15em;">Run Identifier</div>
              <div style="margin-top:6px;font-size:15px;font-weight:600;color:#ffffff;font-family:monospace;">#${escapeHtml(runId || 'Pending')}</div>
            </div>
            <div>
              <div style="color:#8aa392;font-size:10px;text-transform:uppercase;letter-spacing:0.15em;">Initial Status</div>
              <div style="margin-top:6px;font-size:15px;font-weight:600;color:#10b981;">Queued & Running</div>
            </div>
          </div>
        </div>

        <p style="margin:0 0 24px;color:#8aa392;font-size:13px;">Our browser automation workers are actively processing verified application fields. You will receive a full breakdown email once this run completes.</p>

        <!-- CTA -->
        <div style="text-align:center;margin-bottom:28px;">
          <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;background-color:#10b981;color:#042f1a;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px;transition:background-color 0.2s;">Open Application Dashboard</a>
        </div>

        <!-- Footer -->
        <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;text-align:center;color:#8aa392;font-size:11px;">
          <p style="margin:0 0 4px;">This is an automated notification from your REXION Career OS workspace.</p>
          <p style="margin:0;">Delivered directly to your registered account.</p>
        </div>

      </div>
    </div>
  `

  const text = [
    `REXION Career OS — 1-Click Autopilot Initiated`,
    `============================================`,
    `Hi ${recipientName},`,
    ``,
    `Your automated run for "${role}" has been queued.`,
    ``,
    `- Target Role: ${role}`,
    `- Run ID: #${runId || 'Pending'}`,
    `- Current Status: Queued`,
    ``,
    `Our workers are preparing your applications. Open your dashboard to view matches:`,
    `${dashboardUrl}`,
    ``,
    `Best,`,
    `The REXION Team`
  ].join('\n')

  return {
    subject,
    html,
    text
  }
}

const buildCompletionEmailCopy = ({
  fullName,
  targetRole,
  runId,
  status,
  summary,
  appliedJobs,
  failedJobs
}) => {
  const recipientName = normalizeTextField(fullName, 120) || 'there'
  const role = normalizeTextField(targetRole, 120) || 'your selected role'
  const normalizedStatus = normalizeTextField(status, 40).toLowerCase() || 'completed'
  const dashboardUrl = getDashboardUrl()
  const jobsFound = formatMetric(summary?.totalJobsFound ?? ((appliedJobs?.length || 0) + (failedJobs?.length || 0)))
  const jobsApplied = formatMetric(summary?.totalApplied ?? (appliedJobs?.length || 0))
  const avgScore = summary?.avgScore ? `${Number(summary.avgScore).toFixed(0)}%` : '--'

  const isFailed = normalizedStatus === 'failed' && (appliedJobs?.length || 0) === 0
  const isPartial = normalizedStatus === 'partial'
  
  const subject = isFailed
    ? `[ALERT] REXION 1-Click Autopilot failed for ${role}`
    : `[RESULTS] REXION 1-Click Autopilot complete for ${role}`

  const statusLabel = isFailed
    ? 'Automation Run Failed'
    : isPartial
      ? 'Autopilot Completed with Warnings'
      : 'Autopilot Successfully Executed'

  const statusColor = isFailed ? '#e27d7d' : isPartial ? '#e2a97d' : '#10b981'

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#030705;color:#f4f7f4;padding:40px 20px;line-height:1.6;margin:0;">
      <div style="max-width:600px;margin:0 auto;background-color:#0b130e;border:1px solid rgba(16,185,129,0.15);border-radius:24px;padding:32px;box-shadow:0 12px 30px rgba(0,0,0,0.5);">
        
        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:between;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:20px;margin-bottom:28px;">
          <div>
            <span style="color:#10b981;font-weight:800;font-size:20px;letter-spacing:-0.03em;">REXION</span>
            <span style="color:#8aa392;font-size:12px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;margin-left:8px;">Career OS</span>
          </div>
        </div>

        <!-- Title -->
        <p style="margin:0 0 8px;color:${statusColor};font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;">1-Click Mode Results</p>
        <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;line-height:1.3;color:#ffffff;">${escapeHtml(statusLabel)}</h1>
        <p style="margin:0 0 24px;color:#c2d1c6;font-size:15px;">Hi ${escapeHtml(recipientName)}, REXION finished executing your autopilot run for the ${escapeHtml(role)} target.</p>

        <!-- Stats Grid -->
        <div style="background-color:#0e1d15;border:1px solid rgba(16,185,129,0.1);border-radius:16px;padding:20px;margin-bottom:28px;">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:16px;">
            <div>
              <div style="color:#8aa392;font-size:10px;text-transform:uppercase;letter-spacing:0.15em;">Run Identifier</div>
              <div style="margin-top:6px;font-size:15px;font-weight:600;color:#ffffff;font-family:monospace;">#${escapeHtml(runId || 'Pending')}</div>
            </div>
            <div>
              <div style="color:#8aa392;font-size:10px;text-transform:uppercase;letter-spacing:0.15em;">Jobs Found</div>
              <div style="margin-top:6px;font-size:18px;font-weight:700;color:#ffffff;">${escapeHtml(jobsFound)}</div>
            </div>
            <div>
              <div style="color:#8aa392;font-size:10px;text-transform:uppercase;letter-spacing:0.15em;">Jobs Applied</div>
              <div style="margin-top:6px;font-size:18px;font-weight:700;color:#10b981;">${escapeHtml(jobsApplied)}</div>
            </div>
            <div>
              <div style="color:#8aa392;font-size:10px;text-transform:uppercase;letter-spacing:0.15em;">Avg Match Score</div>
              <div style="margin-top:6px;font-size:18px;font-weight:700;color:#10b981;">${escapeHtml(avgScore)}</div>
            </div>
          </div>
        </div>

        <!-- Detailed Lists -->
        <div style="margin-bottom:28px;">
          <h3 style="color:#ffffff;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:8px;margin-bottom:12px;">Applied Applications</h3>
          <ul style="padding:0;margin:0 0 24px 0;">
            ${formatList(appliedJobs, 'No successful submissions recorded in this run.')}
          </ul>

          <h3 style="color:#ffffff;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:8px;margin-bottom:12px;">Failed or Skipped</h3>
          <ul style="padding:0;margin:0 0 24px 0;">
            ${formatList(failedJobs, 'All candidate profiles matched successfully without failures.')}
          </ul>
        </div>

        <!-- CTA -->
        <div style="text-align:center;margin-bottom:28px;">
          <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;background-color:#10b981;color:#042f1a;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px;transition:background-color 0.2s;">Open Application Dashboard</a>
        </div>

        <!-- Footer -->
        <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;text-align:center;color:#8aa392;font-size:11px;">
          <p style="margin:0 0 4px;">This is an automated notification from your REXION Career OS workspace.</p>
          <p style="margin:0;">Delivered strictly to your registered account.</p>
        </div>

      </div>
    </div>
  `

  const text = [
    `REXION Career OS — 1-Click Autopilot Results`,
    `===========================================`,
    `Hi ${recipientName},`,
    ``,
    `Autopilot status: ${statusLabel}`,
    ``,
    `- Target Role: ${role}`,
    `- Run ID: #${runId || 'Pending'}`,
    `- Jobs Found: ${jobsFound}`,
    `- Jobs Applied: ${jobsApplied}`,
    `- Avg Score: ${avgScore}`,
    ``,
    `Open your dashboard for the full breakdown:`,
    `${dashboardUrl}`,
    ``,
    `Best,`,
    `The REXION Team`
  ].join('\n')

  return {
    subject,
    html,
    text
  }
}

// ── Public Dispatch APIs (Strict Single-Recipient) ─────────────────────────

export const sendDominationLaunchEmail = async ({ to, fullName, targetRole, runId, expectedUserEmail = null }) => {
  const verifiedRecipient = assertSingleAuthenticatedRecipient(to, expectedUserEmail)

  const message = buildLaunchEmailCopy({
    fullName,
    targetRole,
    runId
  })

  logger.info(`[Domination Email] Dispatching launch email to authenticated user: ${verifiedRecipient}`)

  try {
    const delivery = await sendEmail({
      to: verifiedRecipient,
      subject: message.subject,
      html: message.html,
      text: message.text
    })
    return normalizeDeliveryResult(delivery)
  } catch (error) {
    logger.error(`[Domination Email] Failed to send launch email to ${verifiedRecipient}: ${error.message}`)
    return {
      status: 'failed',
      provider: detectConfiguredProvider(),
      reason: extractDeliveryReason(error),
      sentAt: null
    }
  }
}

export const sendDominationCompletionEmail = async ({
  to,
  fullName,
  targetRole,
  runId,
  status,
  summary,
  appliedJobs,
  failedJobs,
  expectedUserEmail = null
}) => {
  const verifiedRecipient = assertSingleAuthenticatedRecipient(to, expectedUserEmail)

  const message = buildCompletionEmailCopy({
    fullName,
    targetRole,
    runId,
    status,
    summary,
    appliedJobs,
    failedJobs
  })

  logger.info(`[Domination Email] Dispatching completion summary email to authenticated user: ${verifiedRecipient}`)

  try {
    const delivery = await sendEmail({
      to: verifiedRecipient,
      subject: message.subject,
      html: message.html,
      text: message.text
    })
    return normalizeDeliveryResult(delivery)
  } catch (error) {
    logger.error(`[Domination Email] Failed to send completion email to ${verifiedRecipient}: ${error.message}`)
    return {
      status: 'failed',
      provider: detectConfiguredProvider(),
      reason: extractDeliveryReason(error),
      sentAt: null
    }
  }
}
