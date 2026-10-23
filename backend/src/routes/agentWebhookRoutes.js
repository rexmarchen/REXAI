import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { triggerAgentPipeline } from '../services/agentTriggerService.js'

const ALLOWED_WEBHOOK_DOMAINS = new Set(
  (process.env.ALLOWED_WEBHOOK_DOMAINS || '').split(',')
    .map(d => d.trim())
    .filter(Boolean)
)

const router = express.Router()

/**
 * POST /api/agents/trigger
 * Webhook endpoint triggering background automation pipeline or n8n workflow.
 * Requires authentication. webhookUrl must be an allow-listed domain.
 */
router.post('/trigger', protect, async (req, res) => {
  try {
    const {
      platform = 'all',
      action = 'trigger',
      targetTitles = '',
      messageTemplate = '',
      dailyLimit = 25,
      autopilotEnabled = true,
      webhookUrl = null
    } = req.body || {}

    const userId = req.user.id || req.user._id?.toString()

    if (webhookUrl) {
      try {
        const url = new URL(webhookUrl)
        if (!ALLOWED_WEBHOOK_DOMAINS.has(url.hostname)) {
          return res.status(400).json({
            success: false,
            error: 'Webhook domain not in allow-list. Set ALLOWED_WEBHOOK_DOMAINS.'
          })
        }
      } catch {
        return res.status(400).json({
          success: false,
          error: 'Invalid webhook URL.'
        })
      }
    }

    const result = await triggerAgentPipeline({
      platform: String(platform).toLowerCase(),
      action,
      userId,
      targetTitles,
      messageTemplate,
      dailyLimit: Number(dailyLimit) || 25,
      autopilotEnabled: Boolean(autopilotEnabled),
      webhookUrl
    })

    return res.status(200).json({
      success: true,
      message: `Background ${result.platform} automation pipeline successfully triggered`,
      result
    })
  } catch (err) {
    console.error('[AgentWebhook] Error triggering pipeline:', err)
    return res.status(500).json({
      success: false,
      error: 'Failed to trigger agent background pipeline',
      details: err.message
    })
  }
})

/**
 * GET /api/agents/trigger
 * Health & telemetry probe for the agent webhook
 */
router.get('/trigger', async (req, res) => {
  res.json({
    success: true,
    status: 'ready',
    endpoint: '/api/agents/trigger',
    supportedPlatforms: ['linkedin', 'instagram', 'all'],
    safetyPolicy: {
      linkedInDailyHardCap: 25,
      randomizedIntervals: '8-15 minutes delay between invites'
    },
    n8nWebhookConfigured: Boolean(process.env.N8N_WEBHOOK_URL || process.env.N8N_REXION_APPLY_URL)
  })
})

export default router
