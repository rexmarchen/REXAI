import { runMultiUserSocialScheduler } from './automation/multiUserSocialAutomationService.js'
import { tickAutomationScheduler } from './automation/scheduler.js'
import { getSqliteDb, getAllConnections, toggleAutopilot } from './socialConnectionsSqliteService.js'

/**
 * Triggers background agent automation pipeline (or external n8n webhook)
 * Enforces LinkedIn 25 invites/day safety cap with randomized intervals
 */
export async function triggerAgentPipeline(params = {}) {
  const {
    platform = 'all',
    action = 'trigger',
    userId = null,
    targetTitles = '',
    messageTemplate = '',
    dailyLimit = 25,
    autopilotEnabled = true,
    webhookUrl = null
  } = params

  // 1. Enforce LinkedIn safety hard cap of max 25 invites/day
  const enforcedDailyLimit = Math.min(Math.max(Number(dailyLimit) || 25, 1), 25)
  const safetySettings = {
    dailyCap: enforcedDailyLimit,
    delayRangeMinutes: [8, 15],
    description: 'Enforced 25 invites/day hard cap with 8-15 min randomized delays to safeguard account'
  }

  const results = {
    platform,
    action,
    enforcedDailyLimit,
    safetySettings,
    n8nWebhook: { sent: false, error: null },
    pipelinesTriggered: [],
    timestamp: new Date().toISOString()
  }

  // 2. Dispatch to n8n Webhook if configured
  const targetN8nUrl = webhookUrl || process.env.N8N_WEBHOOK_URL || process.env.N8N_REXION_APPLY_URL
  if (targetN8nUrl) {
    try {
      const payload = {
        event: 'rexion.agent.trigger',
        platform,
        action,
        userId,
        targetTitles,
        messageTemplate,
        dailyLimit: enforcedDailyLimit,
        safetyCap: 25,
        autopilotEnabled: Boolean(autopilotEnabled),
        timestamp: new Date().toISOString()
      }

      const headers = { 'Content-Type': 'application/json' }
      if (process.env.N8N_REXION_WEBHOOK_SECRET) {
        headers['x-webhook-secret'] = process.env.N8N_REXION_WEBHOOK_SECRET
      }

      // Non-blocking fetch with timeout
      fetch(targetN8nUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(6000)
      })
        .then(async (res) => {
          if (!res.ok) {
            console.warn(`[AgentTrigger] n8n webhook returned status ${res.status}`)
          } else {
            console.log(`[AgentTrigger] n8n webhook successfully dispatched to ${targetN8nUrl}`)
          }
        })
        .catch((err) => {
          console.warn('[AgentTrigger] n8n webhook dispatch warning:', err.message)
        })

      results.n8nWebhook.sent = true
      results.n8nWebhook.url = targetN8nUrl
    } catch (webhookErr) {
      results.n8nWebhook.error = webhookErr.message
    }
  }

  // 3. Trigger internal pipelines based on platform
  const shouldTriggerLinkedIn = platform === 'all' || platform === 'linkedin'
  const shouldTriggerInstagram = platform === 'all' || platform === 'instagram'

  if (shouldTriggerLinkedIn) {
    try {
      tickAutomationScheduler().catch((e) => {
        console.warn('[AgentTrigger] LinkedIn scheduler notice:', e.message)
      })
      results.pipelinesTriggered.push('linkedin')
      console.log(`[AgentTrigger] LinkedIn campaign pipeline invoked (dailyCap: ${enforcedDailyLimit})`)
    } catch (liErr) {
      console.warn('[AgentTrigger] LinkedIn pipeline trigger notice:', liErr.message)
    }
  }

  if (shouldTriggerInstagram) {
    try {
      runMultiUserSocialScheduler().catch((e) => {
        console.warn('[AgentTrigger] Instagram scheduler notice:', e.message)
      })
      results.pipelinesTriggered.push('instagram')
      console.log('[AgentTrigger] Instagram agent pipeline invoked')
    } catch (igErr) {
      console.warn('[AgentTrigger] Instagram pipeline trigger notice:', igErr.message)
    }
  }

  // 4. Update SQLite autopilot status if a specific platform was enabled
  if (platform !== 'all' && autopilotEnabled) {
    try {
      const connections = getAllConnections({ platform })
      if (connections.length > 0) {
        toggleAutopilot(connections[0].id, true)
      }
    } catch (dbErr) {
      console.warn('[AgentTrigger] SQLite autopilot update notice:', dbErr.message)
    }
  }

  return results
}
