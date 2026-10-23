/**
 * Canonical Plan Configurations for REXION AI
 * Defines feature entitlements, limits, and behavior for each tier.
 */

export const PLANS = {
  free: {
    id: 'free',
    name: 'Candidate Free Starter',
    description: 'Scout job matches and manual profile management.',
    priceMonthlyUsd: 0,
    priceMonthlyInr: 0,
    linkedinAutomationAllowed: false,
    dailyPostLimit: 0,
    maxConnectedAccounts: 0,
    schedulingAllowed: false,
    recurringSchedulesAllowed: false,
    fullAutoPilotAllowed: false,
    allowedAutomationFeatures: []
  },
  pro: {
    id: 'pro',
    name: 'Pro Career Accelerator',
    description: 'Active LinkedIn engineering automation, human cadence & schedule controls.',
    priceMonthlyUsd: 19,
    priceMonthlyInr: 999,
    priceAnnualUsd: 144,
    priceAnnualInr: 8988,
    linkedinAutomationAllowed: true,
    dailyPostLimit: 3,
    maxConnectedAccounts: 1,
    schedulingAllowed: true,
    recurringSchedulesAllowed: true,
    fullAutoPilotAllowed: false,
    allowedAutomationFeatures: [
      'draft_generation',
      'post_now',
      'scheduled_posts',
      'github_sync',
      'knowledge_notes',
      'anti_ban_jitter'
    ]
  },
  elite: {
    id: 'elite',
    name: 'Elite Domination Suite',
    description: 'Autonomous 24/7 continuous schedule buffer, flagship apply agent, multi-account.',
    priceMonthlyUsd: 49,
    priceMonthlyInr: 2499,
    priceAnnualUsd: 372,
    priceAnnualInr: 22488,
    linkedinAutomationAllowed: true,
    dailyPostLimit: 10,
    maxConnectedAccounts: 3,
    schedulingAllowed: true,
    recurringSchedulesAllowed: true,
    fullAutoPilotAllowed: true,
    allowedAutomationFeatures: [
      'draft_generation',
      'post_now',
      'scheduled_posts',
      'github_sync',
      'knowledge_notes',
      'anti_ban_jitter',
      'continuous_buffer',
      'full_auto_pilot',
      'multi_account'
    ]
  }
}

/**
 * Resolves plan configuration with fallback to 'free'
 */
export function getPlanConfig(planId) {
  const normalized = String(planId || 'free').toLowerCase().trim()
  return PLANS[normalized] || PLANS.free
}

export default PLANS
