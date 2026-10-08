export * from './profile'

export type SubscriptionPlan = 'free' | 'pro' | 'elite'
export type SubscriptionStatus = 'active' | 'past_due' | 'inactive'
export type UserRole = 'user' | 'candidate' | 'company' | 'admin'
export type ContactConfidence = 'verified' | 'likely' | 'guessed'
export type OutreachTone = 'professional' | 'bold' | 'friendly'
export type OutreachStatus = 'queued' | 'sending' | 'sent' | 'partial_failed' | 'failed'
export type OutreachContactStatus = 'queued' | 'sent' | 'failed' | 'opened' | 'replied'
export type GigLocation = 'remote' | 'hybrid' | 'onsite'
export type GigStatus = 'pending' | 'active' | 'closed' | 'rejected'

export interface CompanyProfile {
  name: string
  domain: string
  logo?: string
  industry?: string
  size?: string
  location?: string
  linkedinUrl?: string
  hiringStatus?: 'Active Hiring' | 'Unknown'
}

export interface UserProfile {
  phone?: string
  college?: string
  degree?: string
  graduationYear?: number
  headline?: string
  resumeText?: string
  skills: string[]
  targetRole?: string
  preferredDomain?: string
  location?: string
  linkedinUrl?: string
  githubUrl?: string
  portfolioUrl?: string
  resumeUrl?: string
  companyRole?: string
}

export interface SessionUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  plan: SubscriptionPlan
  role: UserRole
}

export interface OutreachContactShape {
  id: string
  name: string
  role: string
  email: string
  confidence: ContactConfidence
  linkedinUrl?: string
  campaignId?: string
  userId?: string
  status?: OutreachContactStatus
  sentAt?: string
  openedAt?: string
  error?: string
}

export interface OutreachCampaignShape {
  id: string
  userId?: string
  company: CompanyProfile
  subject: string
  body: string
  tone: OutreachTone
  totalContacts: number
  sentCount: number
  failedCount: number
  openCount: number
  status: OutreachStatus
  followUp: {
    enabled: boolean
    days: number
    message: string
    scheduledAt?: string
  }
  createdAt: string
}

export interface OutreachCampaignDetailShape extends OutreachCampaignShape {
  contacts: OutreachContactShape[]
}

export interface MicroGigShape {
  id: string
  companyId?: string
  company: {
    name: string
    logo?: string
    rating?: number
    linkedinUrl?: string
    location?: string
  }
  title: string
  description: string
  skills: string[]
  domain: string
  pay: number
  duration: number
  location: GigLocation
  spotsTotal: number
  spotsFilled: number
  isPreHiring: boolean
  closingDate: string
  status: GigStatus
  activeRoles?: number
}

export interface GigApplicationShape {
  id: string
  gigId: string
  userId: string
  resumeUrl?: string
  pitch: string
  startDate: string
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected'
  appliedAt: string
}

export type ApplicationBatchSource = 'micro-gigs'
export type ApplicationBatchStatus = 'completed' | 'failed'
export type ApplicationBatchItemStatus = 'applied' | 'skipped' | 'failed'

export interface ApplicationBatchItemShape {
  targetId: string
  title: string
  companyName: string
  status: ApplicationBatchItemStatus
  note?: string
}

export interface ApplicationBatchShape {
  id: string
  userId: string
  source: ApplicationBatchSource
  totalJobsProcessed: number
  successfulApplications: number
  skippedApplications: number
  failedApplications: number
  status: ApplicationBatchStatus
  results: ApplicationBatchItemShape[]
  createdAt: string
  completedAt?: string
}

export interface MicroGigMatchShape {
  gig: MicroGigShape
  score: number
  explanation: string
}

export interface LeaderboardEntry {
  id: string
  rank: number
  name: string
  college: string
  gig: string
  company: string
  daysToOffer: number
  earnings: number
  domain: string
}

export interface DashboardStat {
  id: string
  label: string
  value: string
  change: string
  tone: 'default' | 'positive' | 'accent'
}

export interface ActivityItem {
  id: string
  title: string
  timestamp: string
  category: 'outreach' | 'job' | 'gig' | 'billing'
}

export interface StoredUser {
  id: string
  name: string
  email: string
  image?: string | null
  avatar?: string | null
  passwordHash?: string
  role: UserRole
  plan: SubscriptionPlan
  status: SubscriptionStatus
  emailVerified?: boolean
  isActive?: boolean
  lastLogin?: string
  loginCount?: number
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  currentPeriodEnd?: string
  profile: UserProfile
}
