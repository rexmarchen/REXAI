import bcrypt from 'bcryptjs'
import type {
  ApplicationBatchShape,
  GigApplicationShape,
  LeaderboardEntry,
  MicroGigShape,
  OutreachCampaignShape,
  OutreachContactShape,
  StoredUser,
} from '@/types'
import { mockCampaigns, mockContacts, mockLeaderboard, mockMicroGigs, mockUsers } from '@/lib/mock-data'
import { isDemoModeEnabled } from '@/lib/runtime'
import { createId } from '@/lib/utils'

export type MemoryUserRecord = StoredUser

export interface MemoryCampaignRecord extends OutreachCampaignShape {
  userId: string
}

export interface MemoryContactRecord extends OutreachContactShape {
  userId: string
  campaignId?: string
}

export type MemoryApplicationRecord = GigApplicationShape
export type MemoryApplicationBatchRecord = ApplicationBatchShape

interface MemoryStore {
  users: MemoryUserRecord[]
  campaigns: MemoryCampaignRecord[]
  contacts: MemoryContactRecord[]
  gigs: MicroGigShape[]
  applications: MemoryApplicationRecord[]
  applicationBatches: MemoryApplicationBatchRecord[]
  leaderboard: LeaderboardEntry[]
  unsubscribedEmails: string[]
}

declare global {
  // eslint-disable-next-line no-var
  var rexionMemoryStore: MemoryStore | undefined
}

export function getMemoryStore(): MemoryStore {
  if (!global.rexionMemoryStore) {
    const demoModeEnabled = isDemoModeEnabled()
    const demoPasswordHash = bcrypt.hashSync('password123', 10)
    global.rexionMemoryStore = {
      users: demoModeEnabled
        ? mockUsers.map((user) => ({
            ...user,
            passwordHash: demoPasswordHash,
          }))
        : [],
      campaigns: demoModeEnabled
        ? mockCampaigns.map((campaign) => ({
            ...campaign,
            userId: campaign.userId || 'user_demo',
          }))
        : [],
      contacts: demoModeEnabled
        ? mockContacts.map((contact) => ({
            ...contact,
            userId: 'user_demo',
            campaignId: mockCampaigns[0]?.id,
          }))
        : [],
      gigs: demoModeEnabled ? [...mockMicroGigs] : [],
      applications: [],
      applicationBatches: [],
      leaderboard: demoModeEnabled ? [...mockLeaderboard] : [],
      unsubscribedEmails: [],
    }
  }

  return global.rexionMemoryStore
}

export function ensureMemoryUser(partialUser: {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
}) {
  if (!isDemoModeEnabled()) {
    return null
  }

  const store = getMemoryStore()
  const email = partialUser.email?.toLowerCase()

  if (!email) {
    return null
  }

  const existing = store.users.find((user) => user.email === email)
  if (existing) {
    if (partialUser.name && existing.name !== partialUser.name) {
      existing.name = partialUser.name
    }
    if (partialUser.image) {
      existing.image = partialUser.image
    }
    return existing
  }

  const newUser: MemoryUserRecord = {
    id: partialUser.id || createId('user'),
    name: partialUser.name || 'REXION User',
    email,
    image: partialUser.image || null,
    role: 'user',
    plan: 'free',
    status: 'inactive',
    profile: {
      skills: [],
    },
  }

  store.users.push(newUser)
  return newUser
}
