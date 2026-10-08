import Application from '../../models/Application.js'
import CandidateProfile from '../../models/CandidateProfile.js'
import { APPLICATION_STATES, MAX_JOB_AGE_HOURS } from '../../config/constants.js'

/**
 * Generate comprehensive application reporting and analytics for a user
 *
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<Object>}
 */
export async function getCandidateApplicationReport(userId) {
  const [profile, applications] = await Promise.all([
    CandidateProfile.findOne({ userId }).lean(),
    Application.find({ userId }).sort({ createdAt: -1 }).lean()
  ])

  const total = applications.length
  const countsByState = {}
  for (const state of Object.values(APPLICATION_STATES)) {
    countsByState[state] = 0
  }

  let totalAgeHours = 0
  let freshJobsCount = 0
  let submittedCount = 0

  const domainCounts = {}

  for (const app of applications) {
    countsByState[app.state] = (countsByState[app.state] || 0) + 1

    if (app.state === APPLICATION_STATES.SUBMITTED) {
      submittedCount++
    }

    if (app.freshness?.ageHours !== undefined && Number.isFinite(app.freshness.ageHours)) {
      totalAgeHours += app.freshness.ageHours
      if (app.freshness.ageHours <= MAX_JOB_AGE_HOURS) {
        freshJobsCount++
      }
    }

    const domain = app.jobSnapshot?.domain || 'Fullstack'
    domainCounts[domain] = (domainCounts[domain] || 0) + 1
  }

  const averageJobAgeHours = applications.length > 0
    ? Number((totalAgeHours / applications.length).toFixed(1))
    : 0

  const freshnessComplianceRate = applications.length > 0
    ? Number(((freshJobsCount / applications.length) * 100).toFixed(1))
    : 100.0

  const successRate = total > 0
    ? Number(((submittedCount / total) * 100).toFixed(1))
    : 0

  return {
    candidate: {
      fullName: profile?.contactInfo?.fullName || 'Candidate',
      primaryDomain: profile?.primaryDomain || 'Fullstack',
      skillsCount: profile?.skills?.length || 0,
      totalResumeChunks: profile?.resumeChunks?.length || 0
    },
    summary: {
      totalApplications: total,
      submittedCount,
      successRate,
      averageJobAgeHours,
      freshnessComplianceRate,
      maxAllowedAgeHours: MAX_JOB_AGE_HOURS
    },
    countsByState,
    domainDistribution: domainCounts,
    recentApplications: applications.slice(0, 15).map((app) => ({
      id: app._id,
      jobTitle: app.jobTitle,
      company: app.company,
      state: app.state,
      score: app.score,
      freshness: app.freshness,
      auditEventsCount: app.auditEvents?.length || 0,
      submittedAt: app.submittedAt,
      createdAt: app.createdAt
    }))
  }
}
