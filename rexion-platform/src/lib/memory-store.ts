import bcrypt from 'bcryptjs'
import type {
  GigApplicationShape,
  LeaderboardEntry,
  MicroGigShape,
  OutreachCampaignShape,
  OutreachContactShape,
  StoredUser,
} from '@/types'
import { mockCampaigns, mockContacts, mockLeaderboard, mockMicroGigs, mockUsers } from '@/lib/mock-data'

export interface MemoryUserRecord extends StoredUser {}

export interface MemoryCampaignRecord extends OutreachCampaignShape {
  userId: string
}

export interface MemoryContactRecord extends OutreachContactShape {
  userId: string
  campaignId?: string
}

export interface MemoryApplicationRecord extends GigApplicationShape {}

interface MemoryStore {
  users: MemoryUserRecord[]
  campaigns: MemoryCampaignRecord[]
  contacts: MemoryContactRecord[]
  gigs: MicroGigShape[]
  applications: MemoryApplicationRecord[]
  leaderboard: LeaderboardEntry[]
  unsubscribedEmails: string[]
}

declare global {
  // eslint-disable-next-line no-var
  var rexionMemoryStore: MemoryStore | undefined
}

export function getMemoryStore(): MemoryStore {
  if (!global.rexionMemoryStore) {
    const demoPasswordHash = bcrypt.hashSync('password123', 10)
    global.rexionMemoryStore = {
      users: mockUsers.map((user) => ({
        ...user,
        passwordHash: demoPasswordHash,
      })),
      campaigns: mockCampaigns.map((campaign) => ({
        ...campaign,
        userId: campaign.userId || 'user_demo',
      })),
      contacts: mockContacts.map((contact) => ({
        ...contact,
        userId: 'user_demo',
        campaignId: mockCampaigns[0]?.id,
      })),
      gigs: [...mockMicroGigs],
      applications: [],
      leaderboard: [...mockLeaderboard],
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
    id: partialUser.id || `user_${Math.random().toString(36).slice(2, 10)}`,
    name: partialUser.name || 'REXION User',
    email,
    image: partialUser.image || null,
    role: 'candidate',
    plan: 'free',
    status: 'inactive',
    profile: {
      skills: [],
    },
  }

  store.users.push(newUser)
  return newUser
}
