// Extended outreach types — extends base types from @/types
// These are frontend-facing, designed to be swapped to real API shapes

export type ContactVerification = 'verified' | 'likely' | 'unknown'

export interface OutreachContact {
  id: string
  firstName: string
  lastName: string
  email: string
  jobTitle: string
  companyName: string
  companyDomain?: string
  location: string
  industry?: string
  linkedinUrl?: string
  avatarUrl?: string
  verified: ContactVerification
  // populated only when viewing within a campaign
  campaignStatus?: CampaignContactStatus
}

export type CampaignContactStatus =
  | 'queued'
  | 'sending'
  | 'delivered'
  | 'opened'
  | 'replied'
  | 'bounced'
  | 'failed'

export interface CampaignDraft {
  id?: string
  name: string
  contactIds: string[]
  subject: string
  body: string
}

export type CampaignStatus = 'draft' | 'active' | 'completed' | 'paused' | 'failed'

export interface Campaign {
  id: string
  name: string
  createdAt: string
  subject: string
  body: string
  recipients: number
  delivered: number
  bounced: number
  replies: number
  status: CampaignStatus
  contacts: CampaignContact[]
}

export interface CampaignContact {
  id: string
  contact: OutreachContact
  status: CampaignContactStatus
  personalizedSubject: string
  personalizedBody: string
  sentAt?: string
  openedAt?: string
  repliedAt?: string
  error?: string
}

export interface FilterState {
  query: string
  roles: string[]
  companies: string[]
  locations: string[]
  industries: string[]
}

export interface ContactSearchResult {
  contacts: OutreachContact[]
  total: number
  isFiltered: boolean
}

export interface PersonalizationResult {
  contactId: string
  subject: string
  body: string
  missingVariables: string[]
  hasErrors: boolean
}

export const AVAILABLE_VARIABLES = [
  { group: 'Personal', key: '{{firstName}}', label: 'First Name' },
  { group: 'Personal', key: '{{lastName}}', label: 'Last Name' },
  { group: 'Personal', key: '{{jobTitle}}', label: 'Job Title' },
  { group: 'Company', key: '{{companyName}}', label: 'Company Name' },
  { group: 'Company', key: '{{industry}}', label: 'Industry' },
  { group: 'Location', key: '{{location}}', label: 'Location' },
] as const

export type VariableKey = (typeof AVAILABLE_VARIABLES)[number]['key']
