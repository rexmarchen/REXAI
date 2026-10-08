// Campaign Service — isolated mock implementation
// Replace function bodies when real backend is available.
//
// Usage:
//   const campaign = await campaignService.create(draft)
//   const status = await campaignService.getStatus(campaign.id)

import type { Campaign, CampaignDraft, PersonalizationResult } from '@/types/outreach'
import { MOCK_CAMPAIGNS } from './mock-data'
import { resolveVariables, getMissingVariables } from './variables'
import { contactService } from './contact-service'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// In-memory store for drafted campaigns (cleared on refresh — use backend for persistence)
const localCampaigns = new Map<string, Campaign>(MOCK_CAMPAIGNS.map((c) => [c.id, c]))

export const campaignService = {
  /**
   * Get all campaigns for the current user.
   * Replace body with: GET /api/outreach/campaigns
   */
  async getAll(): Promise<Campaign[]> {
    await delay(400)
    return [...localCampaigns.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },

  /**
   * Get a single campaign by ID.
   * Replace body with: GET /api/outreach/campaigns/:id
   */
  async getById(id: string): Promise<Campaign | null> {
    await delay(300)
    return localCampaigns.get(id) ?? null
  },

  /**
   * Preview personalized emails for all selected contacts.
   * Replace body with: POST /api/outreach/campaigns/preview
   */
  async preview(draft: CampaignDraft): Promise<PersonalizationResult[]> {
    await delay(350)
    const contacts = await contactService.getByIds(draft.contactIds)

    return contacts.map((contact) => {
      const personalizedSubject = resolveVariables(draft.subject, contact)
      const personalizedBody = resolveVariables(draft.body, contact)
      const missingSubject = getMissingVariables(draft.subject, contact)
      const missingBody = getMissingVariables(draft.body, contact)
      const missing = [...new Set([...missingSubject, ...missingBody])]

      return {
        contactId: contact.id,
        subject: personalizedSubject,
        body: personalizedBody,
        missingVariables: missing,
        hasErrors: missing.length > 0,
      }
    })
  },

  /**
   * Create a campaign (saves draft, does not send).
   * Replace body with: POST /api/outreach/campaigns
   */
  async create(draft: CampaignDraft): Promise<Campaign> {
    await delay(500)
    const contacts = await contactService.getByIds(draft.contactIds)
    const id = `camp_${Date.now()}`
    const campaign: Campaign = {
      id,
      name: draft.name || 'Untitled Campaign',
      createdAt: new Date().toISOString(),
      subject: draft.subject,
      body: draft.body,
      recipients: contacts.length,
      delivered: 0,
      bounced: 0,
      replies: 0,
      status: 'draft',
      contacts: contacts.map((c, i) => ({
        id: `cc_${id}_${i}`,
        contact: c,
        status: 'queued',
        personalizedSubject: resolveVariables(draft.subject, c),
        personalizedBody: resolveVariables(draft.body, c),
      })),
    }
    localCampaigns.set(id, campaign)
    return campaign
  },

  /**
   * Send a campaign. Returns an async iterator-like callback pattern.
   * Replace body with: POST /api/outreach/campaigns/:id/send  (SSE or polling)
   *
   * onProgress is called for each contact as it's "sent"
   */
  async send(
    campaignId: string,
    onProgress: (contactId: string, status: 'delivered' | 'failed') => void
  ): Promise<void> {
    const campaign = localCampaigns.get(campaignId)
    if (!campaign) throw new Error('Campaign not found')

    for (const cc of campaign.contacts) {
      await delay(600 + Math.random() * 400)
      // 90% delivery success rate in mock
      const success = Math.random() > 0.1
      cc.status = success ? 'delivered' : 'failed'
      cc.sentAt = new Date().toISOString()
      onProgress(cc.id, success ? 'delivered' : 'failed')
    }

    campaign.delivered = campaign.contacts.filter((c) => c.status === 'delivered').length
    campaign.bounced = campaign.contacts.filter((c) => c.status === 'failed').length
    campaign.status = 'active'
    localCampaigns.set(campaignId, campaign)
  },

  /**
   * Get current status of a campaign.
   * Replace body with: GET /api/outreach/campaigns/:id/status
   */
  async getStatus(campaignId: string): Promise<Campaign['status'] | null> {
    await delay(200)
    return localCampaigns.get(campaignId)?.status ?? null
  },
}
