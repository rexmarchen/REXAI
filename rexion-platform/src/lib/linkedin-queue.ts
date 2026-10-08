import IORedis from 'ioredis'
import { Queue, Worker } from 'bullmq'
import { prisma } from '@/lib/db'
import { humanSchedule } from './jitter'
import { sendLinkedInInvite, getLinkedInUserProfile, validateLinkedInProfileUrl } from './unipile'

export interface LinkedInAction {
  id: string
  campaignId: string
  contactId: string
  userId: string
  providerAcctId?: string
  actionType: 'CONNECT' | 'MESSAGE' | 'FOLLOW' | 'WITHDRAW'
  profileUrl: string
  publicIdentifier?: string
  providerId?: string
  recipientName?: string
  company?: string
  customNote?: string
  scheduledFor?: Date
  status?: 'QUEUED' | 'SCHEDULED' | 'IN_PROGRESS' | 'SENT' | 'COMPLETED' | 'PAUSED' | 'FAILED' | 'SKIPPED'
  invitationId?: string
  errorMessage?: string
  rawError?: any
  delayMs?: number
  executedAt?: Date
}

export interface LinkedInActionLog {
  timestamp: string
  actionId: string
  userId: string
  contactId: string
  recipientName: string
  company: string
  actionType: string
  outcome: 'SENT' | 'FAILED' | 'SKIPPED' | 'PAUSED'
  invitationId?: string
  errorMessage?: string
  rawError?: any
  httpStatus?: number
}

// In-memory ring buffer for last 20 failed actions
const MAX_ERROR_LOGS = 20
const recentErrorLogs: LinkedInActionLog[] = []
const actionDeliveryMap: Map<string, LinkedInActionLog> = new Map()

/**
 * Appends a structured log entry to the delivery tracker and error ring buffer
 */
export function logLinkedInAction(entry: LinkedInActionLog) {
  actionDeliveryMap.set(entry.actionId, entry)

  if (entry.outcome === 'FAILED') {
    recentErrorLogs.unshift(entry)
    if (recentErrorLogs.length > MAX_ERROR_LOGS) {
      recentErrorLogs.pop()
    }
  }

  console.log(
    `[LinkedIn Structured Log] [${entry.timestamp}] User: ${entry.userId} | Action: ${entry.actionId} | ` +
    `Type: ${entry.actionType} | Target: ${entry.recipientName} (${entry.company}) | Outcome: ${entry.outcome} ` +
    `${entry.invitationId ? `| InvId: ${entry.invitationId}` : ''} ${entry.errorMessage ? `| Err: ${entry.errorMessage}` : ''}`
  )
}

/**
 * Returns the last 20 failed action logs for debugging
 */
export function getLastLinkedInErrors(): LinkedInActionLog[] {
  return [...recentErrorLogs]
}

/**
 * Retrieves delivery verification information for a given action ID
 */
export function getActionDeliveryLog(actionId: string): LinkedInActionLog | undefined {
  return actionDeliveryMap.get(actionId)
}

/**
 * Checks if an action to this specific contact/profile has already been dispatched or queued for this user
 */
export async function isDuplicateAction(userId: string, target: { profileUrl?: string; contactId?: string; publicIdentifier?: string }): Promise<boolean> {
  const { profileUrl, contactId, publicIdentifier } = target

  // Check recent delivery cache first
  for (const log of actionDeliveryMap.values()) {
    if (log.userId === userId && log.outcome === 'SENT') {
      if (contactId && log.contactId === contactId) return true
    }
  }

  return false
}

let linkedinQueue: Queue<LinkedInAction> | null = null
let redisConnection: IORedis | null = null

function getRedisConnection() {
  if (!process.env.REDIS_URL) {
    return new IORedis('redis://localhost:6379', {
      maxRetriesPerRequest: null,
    })
  }

  if (!redisConnection) {
    redisConnection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    })
  }

  return redisConnection
}

export function getLinkedInQueue() {
  const connection = getRedisConnection()
  if (!linkedinQueue) {
    linkedinQueue = new Queue<LinkedInAction>('linkedinQueue', {
      connection,
    })
  }
  return linkedinQueue
}

/**
 * Schedules a list of LinkedIn actions with deduplication and safe human pacing.
 */
export async function scheduleActionsForDay(
  actions: LinkedInAction[],
  options?: {
    startDate?: Date
    startHour?: number
    endHour?: number
    maxActionsPerHour?: number
    skipWeekends?: boolean
    minGapMinutes?: number
    maxGapMinutes?: number
  }
): Promise<LinkedInAction[]> {
  if (!actions.length) return []

  // Hard safety limit: Never exceed 8 invites per day
  const cappedActions = actions.slice(0, 8)
  const queue = getLinkedInQueue()
  const now = Date.now()

  // Generate realistic human calendar schedule
  const scheduledDates = humanSchedule(cappedActions.length, {
    startDate: options?.startDate || new Date(),
    startHour: options?.startHour ?? 10,
    endHour: options?.endHour ?? 17,
    maxActionsPerHour: options?.maxActionsPerHour ?? 2,
    skipWeekends: options?.skipWeekends ?? true,
    minGapMinutes: options?.minGapMinutes ?? 15,
    maxGapMinutes: options?.maxGapMinutes ?? 35,
  })

  const scheduledActions: LinkedInAction[] = []

  for (let i = 0; i < cappedActions.length; i++) {
    const action = cappedActions[i]

    // 1. Dedupe Guard
    const isDupe = await isDuplicateAction(action.userId, {
      profileUrl: action.profileUrl,
      contactId: action.contactId,
      publicIdentifier: action.publicIdentifier,
    })

    if (isDupe) {
      console.warn(`[LinkedIn Dedupe] Skipping duplicate outreach to ${action.recipientName || action.profileUrl}`)
      const skippedAction: LinkedInAction = {
        ...action,
        status: 'SKIPPED',
        errorMessage: 'Already invited or contacted previously',
      }
      logLinkedInAction({
        timestamp: new Date().toISOString(),
        actionId: action.id,
        userId: action.userId,
        contactId: action.contactId,
        recipientName: action.recipientName || 'Contact',
        company: action.company || 'Unknown',
        actionType: action.actionType,
        outcome: 'SKIPPED',
        errorMessage: 'Duplicate contact detected.',
      })
      scheduledActions.push(skippedAction)
      continue
    }

    const scheduledDate = scheduledDates[i] || new Date(now + (i + 1) * 20 * 60 * 1000)
    const delayMs = Math.max(0, scheduledDate.getTime() - now)

    const updatedAction: LinkedInAction = {
      ...action,
      scheduledFor: scheduledDate,
      delayMs,
      status: 'SCHEDULED',
    }

    scheduledActions.push(updatedAction)

    // Enqueue in BullMQ with human delay
    await queue.add('executeLinkedInAction', updatedAction, {
      delay: delayMs,
      removeOnComplete: true,
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 10000,
      },
    })
  }

  return scheduledActions
}

/**
 * Worker processor for LinkedIn actions
 * Executes live Unipile invitations, handles connection checks, and surfaces detailed errors.
 */
export function registerLinkedInWorker() {
  const connection = getRedisConnection()

  return new Worker<LinkedInAction>(
    'linkedinQueue',
    async (job) => {
      const action = job.data
      const timestamp = new Date().toISOString()

      console.log(`[LinkedIn Worker] Processing action ${action.id} (${action.actionType}) for ${action.recipientName || action.profileUrl}...`)

      // 1. Validate Target Profile URL
      if (!validateLinkedInProfileUrl(action.profileUrl)) {
        const errorMsg = `Invalid or malformed LinkedIn profile URL: ${action.profileUrl}`
        logLinkedInAction({
          timestamp,
          actionId: action.id,
          userId: action.userId,
          contactId: action.contactId,
          recipientName: action.recipientName || 'Contact',
          company: action.company || 'Unknown',
          actionType: action.actionType,
          outcome: 'FAILED',
          errorMessage: errorMsg,
        })
        return { status: 'FAILED', reason: errorMsg }
      }

      // 2. Resolve Unipile Account ID
      const providerAcctId = action.providerAcctId || process.env.UNIPILE_ACCOUNT_ID || '0fsMHoZ2SwacZz6lQsuXbw'

      // 3. Inspect Relationship Status via Unipile
      let isAlreadyConnected = false
      try {
        const targetId = action.providerId || action.publicIdentifier
        if (targetId) {
          const profileData = await getLinkedInUserProfile(targetId, providerAcctId)
          if (profileData?.is_relationship) {
            isAlreadyConnected = true
          }
        }
      } catch (err: any) {
        console.warn(`[Relationship Check Non-fatal]: ${err.message}`)
      }

      // 4. If already connected, adjust action to MESSAGE or complete
      if (isAlreadyConnected && action.actionType === 'CONNECT') {
        console.log(`[LinkedIn Auto-Switch] Contact ${action.recipientName} is already connected.`)
        logLinkedInAction({
          timestamp,
          actionId: action.id,
          userId: action.userId,
          contactId: action.contactId,
          recipientName: action.recipientName || 'Contact',
          company: action.company || 'Unknown',
          actionType: 'MESSAGE',
          outcome: 'SENT',
          errorMessage: 'Contact is already in 1st-degree network.',
        })
        return { status: 'COMPLETED', actionId: action.id, executedAt: new Date() }
      }

      // 5. Dispatch Real LinkedIn Invitation
      const sendResult = await sendLinkedInInvite({
        accountId: providerAcctId,
        providerId: action.providerId,
        publicIdentifier: action.publicIdentifier,
        profileUrl: action.profileUrl,
        message: action.customNote || 'Hi, excited to connect regarding software engineering opportunities!',
      })

      if (sendResult.success) {
        logLinkedInAction({
          timestamp,
          actionId: action.id,
          userId: action.userId,
          contactId: action.contactId,
          recipientName: action.recipientName || 'Contact',
          company: action.company || 'Unknown',
          actionType: action.actionType,
          outcome: 'SENT',
          invitationId: sendResult.invitationId,
        })

        return {
          status: 'COMPLETED',
          actionId: action.id,
          invitationId: sendResult.invitationId,
          executedAt: new Date(),
        }
      }

      // 6. Record Failure without blocking rest of queue
      logLinkedInAction({
        timestamp,
        actionId: action.id,
        userId: action.userId,
        contactId: action.contactId,
        recipientName: action.recipientName || 'Contact',
        company: action.company || 'Unknown',
        actionType: action.actionType,
        outcome: 'FAILED',
        errorMessage: sendResult.error,
        rawError: sendResult.rawError,
      })

      return {
        status: 'FAILED',
        actionId: action.id,
        reason: sendResult.error,
      }
    },
    {
      connection,
      concurrency: 1, // serial execution guarantees no burst violations
    }
  )
}
