import type {
  GigApplicationShape,
  LeaderboardEntry,
  MicroGigShape,
  OutreachCampaignDetailShape,
  OutreachCampaignShape,
  OutreachContactShape,
  StoredUser,
  SubscriptionPlan,
  SubscriptionStatus,
  UserProfile,
  UserRole,
} from '@/types'
import { safeConnectToDatabase } from '@/lib/db'
import {
  ensureMemoryUser,
  getMemoryStore,
  type MemoryApplicationRecord,
  type MemoryCampaignRecord,
  type MemoryContactRecord,
  type MemoryUserRecord,
} from '@/lib/memory-store'
import { mockLeaderboard } from '@/lib/mock-data'
import { normalizePlan, normalizeRole } from '@/lib/plan'
import { createId } from '@/lib/utils'
import User from '@/models/User'
import Subscription from '@/models/Subscription'
import OutreachCampaign from '@/models/OutreachCampaign'
import OutreachContact from '@/models/OutreachContact'
import MicroGig from '@/models/MicroGig'
import GigApplication from '@/models/GigApplication'
import GigCompletion from '@/models/GigCompletion'
import UnsubscribeList from '@/models/UnsubscribeList'

function normalizeUserProfile(profile?: Partial<UserProfile> | null): UserProfile {
  const profileSkills = profile?.skills
  const skills = Array.isArray(profileSkills) ? profileSkills : []

  return {
    headline: profile?.headline,
    resumeText: profile?.resumeText,
    skills,
    targetRole: profile?.targetRole,
    preferredDomain: profile?.preferredDomain,
    location: profile?.location,
    companyRole: profile?.companyRole,
  }
}

function toStoredUser(input: {
  id: string
  name: string
  email: string
  image?: string | null
  passwordHash?: string
  role?: string | null
  subscription?: {
    plan?: string | null
    status?: string | null
    stripeCustomerId?: string
    stripeSubscriptionId?: string
    currentPeriodEnd?: Date | string | null
  } | null
  profile?: Partial<UserProfile> | null
}): StoredUser {
  return {
    id: input.id,
    name: input.name,
    email: input.email.toLowerCase(),
    image: input.image || null,
    passwordHash: input.passwordHash,
    role: normalizeRole(input.role),
    plan: normalizePlan(input.subscription?.plan),
    status:
      input.subscription?.status === 'active' ||
      input.subscription?.status === 'past_due' ||
      input.subscription?.status === 'inactive'
        ? input.subscription.status
        : 'inactive',
    stripeCustomerId: input.subscription?.stripeCustomerId,
    stripeSubscriptionId: input.subscription?.stripeSubscriptionId,
    currentPeriodEnd: input.subscription?.currentPeriodEnd
      ? new Date(input.subscription.currentPeriodEnd).toISOString()
      : undefined,
    profile: normalizeUserProfile(input.profile),
  }
}

function toCampaignShape(input: {
  id: string
  userId?: string
  company: OutreachCampaignShape['company']
  subject: string
  body: string
  tone: OutreachCampaignShape['tone']
  totalContacts: number
  sentCount: number
  failedCount: number
  openCount: number
  status: OutreachCampaignShape['status']
  followUp: OutreachCampaignShape['followUp']
  createdAt?: Date | string
}): OutreachCampaignShape {
  return {
    id: input.id,
    userId: input.userId,
    company: input.company,
    subject: input.subject,
    body: input.body,
    tone: input.tone,
    totalContacts: input.totalContacts,
    sentCount: input.sentCount,
    failedCount: input.failedCount,
    openCount: input.openCount,
    status: input.status,
    followUp: input.followUp,
    createdAt: new Date(input.createdAt || Date.now()).toISOString(),
  }
}

function toContactShape(input: {
  id: string
  campaignId?: string
  userId?: string
  name: string
  role: string
  email: string
  confidence: OutreachContactShape['confidence']
  linkedinUrl?: string
  status?: OutreachContactShape['status']
  sentAt?: string | Date
  openedAt?: string | Date
  error?: string
}): OutreachContactShape {
  return {
    id: input.id,
    campaignId: input.campaignId,
    userId: input.userId,
    name: input.name,
    role: input.role,
    email: input.email,
    confidence: input.confidence,
    linkedinUrl: input.linkedinUrl,
    status: input.status || 'queued',
    sentAt: input.sentAt ? new Date(input.sentAt).toISOString() : undefined,
    openedAt: input.openedAt ? new Date(input.openedAt).toISOString() : undefined,
    error: input.error,
  }
}

function toGigShape(input: {
  id: string
  companyId?: string
  company: MicroGigShape['company']
  title: string
  description: string
  skills: string[]
  domain: string
  pay: number
  duration: number
  location: MicroGigShape['location']
  spotsTotal: number
  spotsFilled: number
  isPreHiring: boolean
  closingDate: string | Date
  status: MicroGigShape['status']
  activeRoles?: number
}): MicroGigShape {
  return {
    id: input.id,
    companyId: input.companyId,
    company: input.company,
    title: input.title,
    description: input.description,
    skills: input.skills,
    domain: input.domain,
    pay: input.pay,
    duration: input.duration,
    location: input.location,
    spotsTotal: input.spotsTotal,
    spotsFilled: input.spotsFilled,
    isPreHiring: input.isPreHiring,
    closingDate: new Date(input.closingDate).toISOString(),
    status: input.status,
    activeRoles: input.activeRoles,
  }
}

function toApplicationShape(input: MemoryApplicationRecord): GigApplicationShape {
  return {
    id: input.id,
    gigId: input.gigId,
    userId: input.userId,
    resumeUrl: input.resumeUrl,
    pitch: input.pitch,
    startDate: input.startDate,
    status: input.status,
    appliedAt: input.appliedAt,
  }
}

async function hasDatabase() {
  return Boolean(await safeConnectToDatabase())
}

export async function findUserByEmail(email: string) {
  const normalizedEmail = email.toLowerCase()
  if (await hasDatabase()) {
    const user = await User.findOne({ email: normalizedEmail }).select('+password')
    if (!user) {
      return null
    }

    return toStoredUser({
      id: String(user._id),
      name: user.name,
      email: user.email,
      image: user.image,
      passwordHash: user.password,
      role: user.role,
      subscription: user.subscription,
      profile: user.profile,
    })
  }

  return getMemoryStore().users.find((record) => record.email === normalizedEmail) || null
}

export async function findUserById(id: string) {
  if (await hasDatabase()) {
    const user = await User.findById(id).select('+password')
    if (!user) {
      return null
    }

    return toStoredUser({
      id: String(user._id),
      name: user.name,
      email: user.email,
      image: user.image,
      passwordHash: user.password,
      role: user.role,
      subscription: user.subscription,
      profile: user.profile,
    })
  }

  return getMemoryStore().users.find((record) => record.id === id) || null
}

export async function findUserByStripeCustomerId(stripeCustomerId: string) {
  if (await hasDatabase()) {
    const user = await User.findOne({
      'subscription.stripeCustomerId': stripeCustomerId,
    }).select('+password')

    if (!user) {
      return null
    }

    return toStoredUser({
      id: String(user._id),
      name: user.name,
      email: user.email,
      image: user.image,
      passwordHash: user.password,
      role: user.role,
      subscription: user.subscription,
      profile: user.profile,
    })
  }

  return (
    getMemoryStore().users.find((record) => record.stripeCustomerId === stripeCustomerId) || null
  )
}

export async function createUserRecord(input: {
  name: string
  email: string
  passwordHash?: string
  image?: string | null
  role?: UserRole
}) {
  const normalizedEmail = input.email.toLowerCase()
  if (await hasDatabase()) {
    const user = await User.create({
      name: input.name,
      email: normalizedEmail,
      password: input.passwordHash,
      image: input.image,
      role: input.role || 'candidate',
      subscription: {
        plan: 'free',
        status: 'inactive',
      },
      profile: {
        skills: [],
      },
    })

    return toStoredUser({
      id: String(user._id),
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      subscription: user.subscription,
      profile: user.profile,
    })
  }

  const store = getMemoryStore()
  const user: MemoryUserRecord = {
    id: createId('user'),
    name: input.name,
    email: normalizedEmail,
    image: input.image || null,
    passwordHash: input.passwordHash,
    role: input.role || 'candidate',
    plan: 'free',
    status: 'inactive',
    profile: {
      skills: [],
    },
  }

  store.users.push(user)
  return user
}

export async function upsertOAuthUser(input: {
  email: string
  name?: string | null
  image?: string | null
  googleSub?: string
}) {
  const existing = await findUserByEmail(input.email)
  if (existing) {
    if (await hasDatabase()) {
      await User.updateOne(
        { email: input.email.toLowerCase() },
        {
          $set: {
            name: input.name || existing.name,
            image: input.image || existing.image,
            'authProviders.google.sub': input.googleSub,
            'authProviders.google.email': input.email.toLowerCase(),
          },
        }
      )
      return (await findUserByEmail(input.email)) as StoredUser
    }

    return ensureMemoryUser(input) as StoredUser
  }

  if (await hasDatabase()) {
    const user = await User.create({
      name: input.name || 'REXION User',
      email: input.email.toLowerCase(),
      image: input.image,
      authProviders: {
        google: {
          sub: input.googleSub,
          email: input.email.toLowerCase(),
        },
      },
      subscription: {
        plan: 'free',
        status: 'inactive',
      },
      profile: {
        skills: [],
      },
    })

    return toStoredUser({
      id: String(user._id),
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      subscription: user.subscription,
      profile: user.profile,
    })
  }

  return ensureMemoryUser(input) as StoredUser
}

export async function ensureSessionUser(input: {
  id?: string
  email?: string | null
  name?: string | null
  image?: string | null
  plan?: SubscriptionPlan
  role?: UserRole
}) {
  if (input.id) {
    const existingById = await findUserById(input.id)
    if (existingById) {
      return existingById
    }
  }

  if (input.email) {
    const existingByEmail = await findUserByEmail(input.email)
    if (existingByEmail) {
      return existingByEmail
    }
  }

  const memoryUser = ensureMemoryUser(input)
  if (memoryUser) {
    memoryUser.plan = input.plan || memoryUser.plan
    memoryUser.role = input.role || memoryUser.role
    return memoryUser
  }

  return null
}

export async function updateUserSubscriptionRecord(input: {
  userId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  currentPeriodEnd?: Date
}) {
  if (await hasDatabase()) {
    await User.updateOne(
      { _id: input.userId },
      {
        $set: {
          'subscription.plan': input.plan,
          'subscription.status': input.status,
          'subscription.stripeCustomerId': input.stripeCustomerId,
          'subscription.stripeSubscriptionId': input.stripeSubscriptionId,
          'subscription.currentPeriodEnd': input.currentPeriodEnd,
        },
      }
    )

    await Subscription.findOneAndUpdate(
      { userId: input.userId },
      {
        plan: input.plan,
        status: input.status,
        stripeCustomerId: input.stripeCustomerId,
        stripeSubscriptionId: input.stripeSubscriptionId,
        currentPeriodEnd: input.currentPeriodEnd,
      },
      {
        upsert: true,
        new: true,
      }
    )

    return findUserById(input.userId)
  }

  const store = getMemoryStore()
  const user = store.users.find((record) => record.id === input.userId)
  if (!user) {
    return null
  }

  user.plan = input.plan
  user.status = input.status
  user.stripeCustomerId = input.stripeCustomerId
  user.stripeSubscriptionId = input.stripeSubscriptionId
  user.currentPeriodEnd = input.currentPeriodEnd?.toISOString()
  return user
}

export async function listUserCampaigns(userId: string) {
  if (await hasDatabase()) {
    const campaigns = await OutreachCampaign.find({ userId }).sort({ createdAt: -1 }).lean()
    return campaigns.map((campaign) =>
      toCampaignShape({
        id: String(campaign._id),
        userId: String(campaign.userId),
        company: campaign.company,
        subject: campaign.subject,
        body: campaign.body,
        tone: campaign.tone,
        totalContacts: campaign.totalContacts,
        sentCount: campaign.sentCount,
        failedCount: campaign.failedCount,
        openCount: campaign.openCount,
        status: campaign.status,
        followUp: campaign.followUp,
        createdAt: campaign.createdAt,
      })
    )
  }

  return getMemoryStore()
    .campaigns.filter((campaign) => campaign.userId === userId)
    .sort((left, right) => +new Date(right.createdAt) - +new Date(left.createdAt))
}

export async function getCampaignDetail(userId: string, campaignId: string) {
  if (await hasDatabase()) {
    const campaign = await OutreachCampaign.findOne({ _id: campaignId, userId }).lean()
    if (!campaign) {
      return null
    }

    const contacts = await OutreachContact.find({ campaignId: campaign._id, userId }).lean()
    return {
      ...toCampaignShape({
        id: String(campaign._id),
        userId: String(campaign.userId),
        company: campaign.company,
        subject: campaign.subject,
        body: campaign.body,
        tone: campaign.tone,
        totalContacts: campaign.totalContacts,
        sentCount: campaign.sentCount,
        failedCount: campaign.failedCount,
        openCount: campaign.openCount,
        status: campaign.status,
        followUp: campaign.followUp,
        createdAt: campaign.createdAt,
      }),
      contacts: contacts.map((contact) =>
        toContactShape({
          id: String(contact._id),
          campaignId: String(contact.campaignId),
          userId: String(contact.userId),
          name: contact.name,
          role: contact.role,
          email: contact.email,
          confidence: contact.confidence,
          linkedinUrl: contact.linkedinUrl,
          status: contact.status,
          sentAt: contact.sentAt,
          openedAt: contact.openedAt,
          error: contact.error,
        })
      ),
    } satisfies OutreachCampaignDetailShape
  }

  const store = getMemoryStore()
  const campaign = store.campaigns.find((record) => record.id === campaignId && record.userId === userId)
  if (!campaign) {
    return null
  }

  return {
    ...campaign,
    contacts: store.contacts.filter((record) => record.campaignId === campaignId && record.userId === userId),
  }
}

export async function createCampaignRecord(input: {
  userId: string
  company: OutreachCampaignShape['company']
  subject: string
  body: string
  tone: OutreachCampaignShape['tone']
  contacts: OutreachContactShape[]
  followUp: OutreachCampaignShape['followUp']
  status: OutreachCampaignShape['status']
}) {
  const totalContacts = input.contacts.length
  const sentCount = input.contacts.filter((contact) => contact.status === 'sent' || contact.status === 'opened').length
  const failedCount = input.contacts.filter((contact) => contact.status === 'failed').length
  const openCount = input.contacts.filter((contact) => contact.status === 'opened').length

  if (await hasDatabase()) {
    const campaign = await OutreachCampaign.create({
      userId: input.userId,
      company: input.company,
      subject: input.subject,
      body: input.body,
      tone: input.tone,
      totalContacts,
      sentCount,
      failedCount,
      openCount,
      status: input.status,
      followUp: {
        ...input.followUp,
        scheduledAt: input.followUp.enabled
          ? new Date(Date.now() + input.followUp.days * 86400000)
          : undefined,
      },
    })

    await OutreachContact.insertMany(
      input.contacts.map((contact) => ({
        campaignId: campaign._id,
        userId: input.userId,
        name: contact.name,
        role: contact.role,
        email: contact.email,
        confidence: contact.confidence,
        linkedinUrl: contact.linkedinUrl,
        status: contact.status || 'queued',
        sentAt: contact.sentAt,
        openedAt: contact.openedAt,
        error: contact.error,
      }))
    )

    return getCampaignDetail(input.userId, String(campaign._id))
  }

  const store = getMemoryStore()
  const campaignId = createId('campaign')
  const record: MemoryCampaignRecord = {
    id: campaignId,
    userId: input.userId,
    company: input.company,
    subject: input.subject,
    body: input.body,
    tone: input.tone,
    totalContacts,
    sentCount,
    failedCount,
    openCount,
    status: input.status,
    followUp: {
      ...input.followUp,
      scheduledAt: input.followUp.enabled
        ? new Date(Date.now() + input.followUp.days * 86400000).toISOString()
        : undefined,
    },
    createdAt: new Date().toISOString(),
  }

  const contacts: MemoryContactRecord[] = input.contacts.map((contact) => ({
    ...contact,
    id: contact.id || createId('contact'),
    campaignId,
    userId: input.userId,
    status: contact.status || 'queued',
  }))

  store.campaigns.unshift(record)
  store.contacts.push(...contacts)

  return {
    ...record,
    contacts,
  }
}

export async function updateCampaignContactDeliveryStatus(input: {
  campaignId: string
  contactId: string
  userId: string
  status: 'sent' | 'failed' | 'opened'
  error?: string
}) {
  if (await hasDatabase()) {
    await OutreachContact.updateOne(
      {
        _id: input.contactId,
        campaignId: input.campaignId,
        userId: input.userId,
      },
      {
        $set: {
          status: input.status,
          sentAt: input.status === 'sent' ? new Date() : undefined,
          openedAt: input.status === 'opened' ? new Date() : undefined,
          error: input.error,
        },
      }
    )

    const [campaign, sentCount, failedCount, openCount] = await Promise.all([
      OutreachCampaign.findOne({ _id: input.campaignId, userId: input.userId }),
      OutreachContact.countDocuments({
        campaignId: input.campaignId,
        userId: input.userId,
        status: { $in: ['sent', 'opened'] },
      }),
      OutreachContact.countDocuments({
        campaignId: input.campaignId,
        userId: input.userId,
        status: 'failed',
      }),
      OutreachContact.countDocuments({
        campaignId: input.campaignId,
        userId: input.userId,
        status: 'opened',
      }),
    ])

    if (!campaign) {
      return
    }

    const nextStatus =
      failedCount > 0 && sentCount > 0
        ? 'partial_failed'
        : failedCount > 0 && sentCount === 0
          ? 'failed'
          : sentCount >= (campaign.totalContacts || 0)
            ? 'sent'
            : 'sending'

    await OutreachCampaign.updateOne(
      { _id: input.campaignId, userId: input.userId },
      {
        $set: {
          sentCount,
          failedCount,
          openCount,
          status: nextStatus,
        },
      }
    )

    return
  }

  const store = getMemoryStore()
  const contact = store.contacts.find(
    (record) =>
      record.id === input.contactId &&
      record.campaignId === input.campaignId &&
      record.userId === input.userId
  )
  const campaign = store.campaigns.find(
    (record) => record.id === input.campaignId && record.userId === input.userId
  )

  if (!contact || !campaign) {
    return
  }

  contact.status = input.status
  contact.error = input.error
  if (input.status === 'sent') {
    contact.sentAt = new Date().toISOString()
  }
  if (input.status === 'opened') {
    contact.openedAt = new Date().toISOString()
  }

  const sentCount = store.contacts.filter(
    (record) =>
      record.campaignId === input.campaignId &&
      record.userId === input.userId &&
      (record.status === 'sent' || record.status === 'opened')
  ).length
  const failedCount = store.contacts.filter(
    (record) =>
      record.campaignId === input.campaignId &&
      record.userId === input.userId &&
      record.status === 'failed'
  ).length
  const openCount = store.contacts.filter(
    (record) =>
      record.campaignId === input.campaignId &&
      record.userId === input.userId &&
      record.status === 'opened'
  ).length

  campaign.sentCount = sentCount
  campaign.failedCount = failedCount
  campaign.openCount = openCount
  campaign.status =
    failedCount > 0 && sentCount > 0
      ? 'partial_failed'
      : failedCount > 0 && sentCount === 0
        ? 'failed'
        : sentCount >= campaign.totalContacts
          ? 'sent'
          : 'sending'
}

export async function countSentContactsSince(userId: string, since: Date) {
  if (await hasDatabase()) {
    return OutreachContact.countDocuments({
      userId,
      sentAt: {
        $gte: since,
      },
    })
  }

  return getMemoryStore().contacts.filter(
    (contact) =>
      contact.userId === userId &&
      Boolean(contact.sentAt) &&
      new Date(contact.sentAt as string) >= since
  ).length
}

export async function listGigs() {
  if (await hasDatabase()) {
    const gigs = await MicroGig.find({ status: { $in: ['active', 'pending'] } }).sort({ createdAt: -1 }).lean()
    return gigs.map((gig) =>
      toGigShape({
        id: String(gig._id),
        companyId: gig.companyId ? String(gig.companyId) : undefined,
        company: gig.company,
        title: gig.title,
        description: gig.description,
        skills: gig.skills || [],
        domain: gig.domain,
        pay: gig.pay,
        duration: gig.duration,
        location: gig.location,
        spotsTotal: gig.spotsTotal,
        spotsFilled: gig.spotsFilled,
        isPreHiring: gig.isPreHiring,
        closingDate: gig.closingDate,
        status: gig.status,
        activeRoles: gig.activeRoles,
      })
    )
  }

  return [...getMemoryStore().gigs]
}

export async function getGigById(id: string) {
  if (await hasDatabase()) {
    const gig = await MicroGig.findById(id).lean()
    if (!gig) {
      return null
    }

    return toGigShape({
      id: String(gig._id),
      companyId: gig.companyId ? String(gig.companyId) : undefined,
      company: gig.company,
      title: gig.title,
      description: gig.description,
      skills: gig.skills || [],
      domain: gig.domain,
      pay: gig.pay,
      duration: gig.duration,
      location: gig.location,
      spotsTotal: gig.spotsTotal,
      spotsFilled: gig.spotsFilled,
      isPreHiring: gig.isPreHiring,
      closingDate: gig.closingDate,
      status: gig.status,
      activeRoles: gig.activeRoles,
    })
  }

  return getMemoryStore().gigs.find((gig) => gig.id === id) || null
}

export async function createGigApplicationRecord(input: {
  gigId: string
  userId: string
  resumeUrl?: string
  pitch: string
  startDate: string
}) {
  if (await hasDatabase()) {
    const application = await GigApplication.create({
      gigId: input.gigId,
      userId: input.userId,
      resumeUrl: input.resumeUrl,
      pitch: input.pitch,
      startDate: new Date(input.startDate),
    })

    return {
      id: String(application._id),
      gigId: String(application.gigId),
      userId: String(application.userId),
      resumeUrl: application.resumeUrl,
      pitch: application.pitch,
      startDate: new Date(application.startDate).toISOString(),
      status: application.status,
      appliedAt: new Date(application.appliedAt).toISOString(),
    } satisfies GigApplicationShape
  }

  const store = getMemoryStore()
  const application: MemoryApplicationRecord = {
    id: createId('application'),
    gigId: input.gigId,
    userId: input.userId,
    resumeUrl: input.resumeUrl,
    pitch: input.pitch,
    startDate: new Date(input.startDate).toISOString(),
    status: 'pending',
    appliedAt: new Date().toISOString(),
  }

  store.applications.push(application)
  const gig = store.gigs.find((record) => record.id === input.gigId)
  if (gig && gig.spotsFilled < gig.spotsTotal) {
    gig.spotsFilled += 1
  }
  return toApplicationShape(application)
}

export async function createGigRecord(input: {
  userId: string
  companyName: string
  title: string
  description: string
  skills: string[]
  domain: string
  pay: number
  duration: number
  location: MicroGigShape['location']
  spotsTotal: number
  isPreHiring: boolean
}) {
  if (await hasDatabase()) {
    const gig = await MicroGig.create({
      companyId: input.userId,
      company: {
        name: input.companyName,
        logo: input.companyName.slice(0, 1).toUpperCase(),
        rating: 4.8,
      },
      title: input.title,
      description: input.description,
      skills: input.skills,
      domain: input.domain,
      pay: input.pay,
      duration: input.duration,
      location: input.location,
      spotsTotal: input.spotsTotal,
      spotsFilled: 0,
      isPreHiring: input.isPreHiring,
      closingDate: new Date(Date.now() + 7 * 86400000),
      status: 'pending',
      activeRoles: input.isPreHiring ? 2 : 0,
    })

    return toGigShape({
      id: String(gig._id),
      companyId: String(gig.companyId),
      company: gig.company,
      title: gig.title,
      description: gig.description,
      skills: gig.skills,
      domain: gig.domain,
      pay: gig.pay,
      duration: gig.duration,
      location: gig.location,
      spotsTotal: gig.spotsTotal,
      spotsFilled: gig.spotsFilled,
      isPreHiring: gig.isPreHiring,
      closingDate: gig.closingDate,
      status: gig.status,
      activeRoles: gig.activeRoles,
    })
  }

  const store = getMemoryStore()
  const gig: MicroGigShape = {
    id: createId('gig'),
    companyId: input.userId,
    company: {
      name: input.companyName,
      logo: input.companyName.slice(0, 1).toUpperCase(),
      rating: 4.8,
    },
    title: input.title,
    description: input.description,
    skills: input.skills,
    domain: input.domain,
    pay: input.pay,
    duration: input.duration,
    location: input.location,
    spotsTotal: input.spotsTotal,
    spotsFilled: 0,
    isPreHiring: input.isPreHiring,
    closingDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    status: 'pending',
    activeRoles: input.isPreHiring ? 2 : 0,
  }

  store.gigs.unshift(gig)
  return gig
}

export async function listLeaderboardEntries() {
  if (await hasDatabase()) {
    const completions = await GigCompletion.find({ convertedToFullTime: true }).sort({ daysToConversion: 1 }).lean()
    return completions.map(
      (completion, index) =>
        ({
          id: String(completion._id),
          rank: index + 1,
          name: `Candidate ${index + 1}`,
          college: 'REXION Network',
          gig: 'Micro-Gig Sprint',
          company: 'Hiring Partner',
          daysToOffer: completion.daysToConversion || 0,
          earnings: completion.earnings || 0,
          domain: 'General',
        }) satisfies LeaderboardEntry
    )
  }

  const store = getMemoryStore()
  return store.leaderboard.length ? [...store.leaderboard] : [...mockLeaderboard]
}

export async function addUnsubscribedEmail(email: string) {
  const normalizedEmail = email.toLowerCase()
  if (await hasDatabase()) {
    await UnsubscribeList.findOneAndUpdate(
      { email: normalizedEmail },
      { email: normalizedEmail },
      { upsert: true, new: true }
    )
    return
  }

  const store = getMemoryStore()
  if (!store.unsubscribedEmails.includes(normalizedEmail)) {
    store.unsubscribedEmails.push(normalizedEmail)
  }
}

export async function isEmailUnsubscribed(email: string) {
  const normalizedEmail = email.toLowerCase()
  if (await hasDatabase()) {
    const record = await UnsubscribeList.findOne({ email: normalizedEmail }).lean()
    return Boolean(record)
  }

  return getMemoryStore().unsubscribedEmails.includes(normalizedEmail)
}

export async function exportUserData(userId: string) {
  const user = await findUserById(userId)
  const campaigns = await listUserCampaigns(userId)
  const details = await Promise.all(campaigns.map((campaign) => getCampaignDetail(userId, campaign.id)))
  const gigs = await listGigs()
  const applications = getMemoryStore().applications.filter((application) => application.userId === userId)

  return {
    exportedAt: new Date().toISOString(),
    user,
    campaigns: details.filter(Boolean),
    gigs,
    applications,
  }
}

export async function deleteUserData(userId: string) {
  if (await hasDatabase()) {
    await Promise.all([
      User.deleteOne({ _id: userId }),
      Subscription.deleteMany({ userId }),
      OutreachCampaign.deleteMany({ userId }),
      OutreachContact.deleteMany({ userId }),
      GigApplication.deleteMany({ userId }),
      GigCompletion.deleteMany({ userId }),
    ])
    return
  }

  const store = getMemoryStore()
  store.users = store.users.filter((user) => user.id !== userId)
  store.campaigns = store.campaigns.filter((campaign) => campaign.userId !== userId)
  store.contacts = store.contacts.filter((contact) => contact.userId !== userId)
  store.applications = store.applications.filter((application) => application.userId !== userId)
}
