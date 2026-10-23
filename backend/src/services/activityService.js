import mongoose from 'mongoose'
import ActivityLog from '../models/ActivityLog.js'
import { getOrCompute, delPrefix } from '../lib/cacheManager.js'

const CATEGORY_MAP = {
  ai_request: 'ai',
  ai_chat: 'ai',
  ai_tutor: 'ai',
  image_generated: 'ai',
  resume_analyzed: 'resume',
  cover_letter_generated: 'resume',
  resume_uploaded: 'resume',
  ats_audited: 'resume',
  job_match: 'jobs',
  job_searched: 'jobs',
  job_saved: 'jobs',
  application_submitted: 'applications',
  application_status_changed: 'applications',
  quiz_completed: 'learning',
  code_submitted: 'learning',
  challenge_completed: 'learning',
  login: 'account',
  profile_updated: 'account'
}

/**
 * Normalizes user ID to match both ObjectId and String representations
 */
const buildUserFilter = (userId) => {
  if (!userId) return null
  const ids = [userId]
  if (typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)) {
    try {
      ids.push(new mongoose.Types.ObjectId(userId))
    } catch {
      // fallback
    }
  } else if (userId instanceof mongoose.Types.ObjectId) {
    ids.push(userId.toString())
  }
  return { $in: ids }
}

/**
 * Record a user activity persistently in the database
 */
export const recordActivity = async ({
  userId,
  type,
  category,
  title,
  description = '',
  status = 'completed',
  metadata = {},
  idempotencyKey = null,
  createdAt = new Date()
}) => {
  if (!userId || !type || !title) {
    return null
  }

  const determinedCategory = category || CATEGORY_MAP[type] || 'ai'

  try {
    // 1. Idempotency Check if key provided
    if (idempotencyKey) {
      const existing = await ActivityLog.findOne({
        userId: buildUserFilter(userId),
        idempotencyKey
      }).lean()

      if (existing) {
        return existing
      }
    }

    // 2. Short-window deduplication (5 seconds) for rapid double-clicks/retries
    const fiveSecondsAgo = new Date(Date.now() - 5000)
    const recentDuplicate = await ActivityLog.findOne({
      userId: buildUserFilter(userId),
      type,
      title,
      createdAt: { $gte: fiveSecondsAgo }
    }).lean()

    if (recentDuplicate) {
      return recentDuplicate
    }

    // 3. Persist new record
    const record = await ActivityLog.create({
      userId,
      type,
      category: determinedCategory,
      title,
      description,
      status,
      metadata,
      idempotencyKey: idempotencyKey || undefined,
      createdAt
    })

    // Invalidate cached summaries for this user across all date filters
    delPrefix(`activity:summary:${String(userId)}:`).catch(() => {})

    return record
  } catch (error) {
    console.error('[ActivityService] Failed to record activity:', error.message)
    return null
  }
}

/**
 * Parse date bounds safely
 */
const parseDateRange = (startDate, endDate) => {
  let start = null
  let end = null

  if (startDate) {
    const parsed = new Date(startDate)
    if (!isNaN(parsed.getTime())) {
      start = parsed
    }
  }

  if (endDate) {
    const parsed = new Date(endDate)
    if (!isNaN(parsed.getTime())) {
      end = parsed
    }
  }

  return { start, end }
}

/**
 * Get paginated activities for an authenticated user with filtering
 */
export const getUserActivities = async ({
  userId,
  category,
  startDate,
  endDate,
  search,
  status,
  page = 1,
  limit = 20
}) => {
  const userFilter = buildUserFilter(userId)
  if (!userFilter) {
    return { activities: [], total: 0, page: 1, totalPages: 0, hasMore: false }
  }

  const query = { userId: userFilter }

  if (category && category !== 'all') {
    query.category = category
  }

  if (status && status !== 'all') {
    query.status = status
  }

  const { start, end } = parseDateRange(startDate, endDate)
  if (start || end) {
    query.createdAt = {}
    if (start) query.createdAt.$gte = start
    if (end) query.createdAt.$lte = end
  }

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i')
    query.$or = [{ title: regex }, { description: regex }]
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))
  const skip = (pageNum - 1) * limitNum

  const [activities, total] = await Promise.all([
    ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    ActivityLog.countDocuments(query)
  ])

  const totalPages = Math.ceil(total / limitNum)

  return {
    activities,
    total,
    page: pageNum,
    totalPages,
    hasMore: pageNum < totalPages
  }
}

/**
 * Get high-level summary metrics, breakdown, and top activities for the dashboard
 */
export const getUserActivitySummaryUncached = async ({
  userId,
  startDate,
  endDate
}) => {
  const userFilter = buildUserFilter(userId)
  if (!userFilter) {
    return {
      kpis: {},
      totalActivities: 0,
      breakdown: [],
      topActivities: []
    }
  }

  const { start, end } = parseDateRange(startDate, endDate)

  // Determine current period query
  const currentQuery = { userId: userFilter }
  if (start || end) {
    currentQuery.createdAt = {}
    if (start) currentQuery.createdAt.$gte = start
    if (end) currentQuery.createdAt.$lte = end
  }

  // Calculate prior period query for growth trends
  let priorQuery = null
  if (start && end) {
    const duration = end.getTime() - start.getTime()
    const priorEnd = new Date(start.getTime())
    const priorStart = new Date(start.getTime() - duration)
    priorQuery = {
      userId: userFilter,
      createdAt: { $gte: priorStart, $lte: priorEnd }
    }
  } else if (start && !end) {
    const duration = Date.now() - start.getTime()
    const priorEnd = new Date(start.getTime())
    const priorStart = new Date(start.getTime() - duration)
    priorQuery = {
      userId: userFilter,
      createdAt: { $gte: priorStart, $lte: priorEnd }
    }
  }

  // Fetch current period aggregation
  const [
    totalActivities,
    categoryCounts,
    typeCounts,
    titleCounts,
    priorCounts
  ] = await Promise.all([
    ActivityLog.countDocuments(currentQuery),
    ActivityLog.aggregate([
      { $match: currentQuery },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]),
    ActivityLog.aggregate([
      { $match: currentQuery },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]),
    ActivityLog.aggregate([
      { $match: currentQuery },
      { $group: { _id: '$title', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]),
    priorQuery
      ? ActivityLog.aggregate([
          { $match: priorQuery },
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ])
      : Promise.resolve([])
  ])

  // Map type counts
  const typeMap = {}
  typeCounts.forEach((tc) => {
    typeMap[tc._id] = tc.count
  })

  // Map category counts
  const categoryMap = {}
  categoryCounts.forEach((cc) => {
    categoryMap[cc._id] = cc.count
  })

  // Map prior type counts
  const priorTypeMap = {}
  priorCounts.forEach((pc) => {
    priorTypeMap[pc._id] = pc.count
  })

  // Calculate 5 specific KPI values matching the design reference:
  // 1. AI Requests (ai_request, ai_chat, ai_tutor)
  const aiCurrent = (typeMap['ai_request'] || 0) + (typeMap['ai_chat'] || 0) + (typeMap['ai_tutor'] || 0)
  const aiPrior = (priorTypeMap['ai_request'] || 0) + (priorTypeMap['ai_chat'] || 0) + (priorTypeMap['ai_tutor'] || 0)
  const aiDiff = aiCurrent - aiPrior

  // 2. Resumes Analyzed (resume_analyzed, ats_audited)
  const resumesCurrent = (typeMap['resume_analyzed'] || 0) + (typeMap['ats_audited'] || 0)
  const resumesPrior = (priorTypeMap['resume_analyzed'] || 0) + (priorTypeMap['ats_audited'] || 0)
  const resumesDiff = resumesCurrent - resumesPrior

  // 3. Job Matches (job_match)
  const jobMatchesCurrent = typeMap['job_match'] || 0
  const jobMatchesPrior = priorTypeMap['job_match'] || 0
  const jobMatchesDiff = jobMatchesCurrent - jobMatchesPrior

  // 4. Applications (application_submitted, application_status_changed)
  const applicationsCurrent = (typeMap['application_submitted'] || 0) + (typeMap['application_status_changed'] || 0)
  const applicationsPrior = (priorTypeMap['application_submitted'] || 0) + (priorTypeMap['application_status_changed'] || 0)
  const applicationsDiff = applicationsCurrent - applicationsPrior

  // 5. Quiz Attempts (quiz_completed, challenge_completed)
  const quizzesCurrent = (typeMap['quiz_completed'] || 0) + (typeMap['challenge_completed'] || 0)
  const quizzesPrior = (priorTypeMap['quiz_completed'] || 0) + (priorTypeMap['challenge_completed'] || 0)
  const quizzesDiff = quizzesCurrent - quizzesPrior

  const kpis = {
    aiRequests: {
      value: aiCurrent,
      changeText: aiDiff >= 0 ? `+${aiDiff} this week` : `${aiDiff} this week`,
      positive: aiDiff >= 0
    },
    resumesAnalyzed: {
      value: resumesCurrent,
      changeText: resumesDiff >= 0 ? `+${resumesDiff} this week` : `${resumesDiff} this week`,
      positive: resumesDiff >= 0
    },
    jobMatches: {
      value: jobMatchesCurrent,
      changeText: jobMatchesDiff >= 0 ? `+${jobMatchesDiff} this week` : `${jobMatchesDiff} this week`,
      positive: jobMatchesDiff >= 0
    },
    applications: {
      value: applicationsCurrent,
      changeText: applicationsDiff >= 0 ? `+${applicationsDiff} this week` : `${applicationsDiff} this week`,
      positive: applicationsDiff >= 0
    },
    quizAttempts: {
      value: quizzesCurrent,
      changeText: quizzesDiff >= 0 ? `+${quizzesDiff} this week` : `${quizzesDiff} this week`,
      positive: quizzesDiff >= 0
    }
  }

  // Format Breakdown for the Donut Chart matching screenshot:
  // Categories: AI Requests, Job Matches, Applications, Resumes, Quizzes
  const total = totalActivities || 1 // avoid div by 0
  const breakdown = [
    {
      id: 'ai',
      label: 'AI Requests',
      count: aiCurrent,
      percentage: totalActivities ? Math.round((aiCurrent / totalActivities) * 100) : 0,
      color: '#E07A5F' // Terracotta Orange
    },
    {
      id: 'jobs',
      label: 'Job Matches',
      count: jobMatchesCurrent,
      percentage: totalActivities ? Math.round((jobMatchesCurrent / totalActivities) * 100) : 0,
      color: '#5C9E7A' // Sage / Forest Green
    },
    {
      id: 'applications',
      label: 'Applications',
      count: applicationsCurrent,
      percentage: totalActivities ? Math.round((applicationsCurrent / totalActivities) * 100) : 0,
      color: '#8B7FF5' // Soft Violet / Indigo
    },
    {
      id: 'resume',
      label: 'Resumes',
      count: resumesCurrent,
      percentage: totalActivities ? Math.round((resumesCurrent / totalActivities) * 100) : 0,
      color: '#E86A61' // Coral / Terracotta Pink
    },
    {
      id: 'learning',
      label: 'Quizzes',
      count: quizzesCurrent,
      percentage: totalActivities ? Math.round((quizzesCurrent / totalActivities) * 100) : 0,
      color: '#F4B042' // Amber / Golden Yellow
    }
  ]

  // Top Activities
  const topActivities = titleCounts.map((tc) => ({
    title: tc._id,
    count: tc.count
  }))

  return {
    kpis,
    totalActivities,
    breakdown,
    topActivities
  }
}

/**
 * Cached wrapper for user activity summary (2-minute TTL with stampede protection)
 */
export const getUserActivitySummary = async ({ userId, startDate, endDate }) => {
  const uId = String(userId || '')
  const cacheKey = `activity:summary:${uId}:${startDate || ''}:${endDate || ''}`

  return getOrCompute(
    cacheKey,
    () => getUserActivitySummaryUncached({ userId, startDate, endDate }),
    120 // 2-minute TTL
  )
}

/**
 * Generate CSV data for export
 */
export const exportUserActivitiesCsv = async ({
  userId,
  category,
  startDate,
  endDate,
  search
}) => {
  const result = await getUserActivities({
    userId,
    category,
    startDate,
    endDate,
    search,
    page: 1,
    limit: 5000 // reasonable export limit
  })

  const rows = [
    ['Activity ID', 'Timestamp (UTC)', 'Category', 'Type', 'Title', 'Description', 'Status', 'Metadata']
  ]

  result.activities.forEach((act) => {
    const metadataStr = act.metadata ? JSON.stringify(act.metadata).replace(/"/g, '""') : ''
    const row = [
      act._id.toString(),
      new Date(act.createdAt).toISOString(),
      act.category,
      act.type,
      `"${(act.title || '').replace(/"/g, '""')}"`,
      `"${(act.description || '').replace(/"/g, '""')}"`,
      act.status,
      `"${metadataStr}"`
    ]
    rows.push(row)
  })

  return rows.map((r) => r.join(',')).join('\n')
}
