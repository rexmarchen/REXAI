import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import ActivityLog from '../src/models/ActivityLog.js'
import Prediction from '../src/models/Prediction.js'
import Resume from '../src/models/Resume.js'
import Application from '../src/models/Application.js'
import { QuizAttempt } from '../src/models/Quiz.js'
import { TutorSession } from '../src/models/TutorSession.js'
import { ProblemSubmission } from '../src/models/ProblemSubmission.js'
import User from '../src/models/User.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/rexion'

async function syncActivities() {
  console.log('[SyncActivities] Connecting to MongoDB:', MONGO_URI)
  await mongoose.connect(MONGO_URI)

  let insertedCount = 0

  // 1. Sync Predictions (Resume Analyses)
  const predictions = await Prediction.find().populate('resume', 'filename').lean()
  console.log(`[SyncActivities] Found ${predictions.length} existing Predictions`)
  for (const p of predictions) {
    if (!p.user) continue
    const key = `pred_${p._id}`
    const exists = await ActivityLog.findOne({ idempotencyKey: key })
    if (!exists) {
      await ActivityLog.create({
        userId: p.user,
        type: 'resume_analyzed',
        category: 'resume',
        title: 'AI Resume Analysis Completed',
        description: `Your resume was analyzed for ${p.prediction || 'AI/ML Engineer'} role`,
        status: 'completed',
        metadata: {
          predictionId: p._id,
          careerPath: p.prediction,
          confidence: p.confidence,
          fileName: p.resume?.filename
        },
        idempotencyKey: key,
        createdAt: p.createdAt || new Date()
      })
      insertedCount++
    }
  }

  // 2. Sync Applications
  const applications = await Application.find().lean()
  console.log(`[SyncActivities] Found ${applications.length} existing Applications`)
  for (const app of applications) {
    const userId = app.userId || app.user
    if (!userId) continue
    const key = `app_${app._id}`
    const exists = await ActivityLog.findOne({ idempotencyKey: key })
    if (!exists) {
      await ActivityLog.create({
        userId,
        type: 'application_submitted',
        category: 'applications',
        title: `Applied for ${app.jobTitle || 'Role'}`,
        description: `Application submitted to ${app.company || 'Company'}`,
        status: 'completed',
        metadata: {
          applicationId: app._id,
          company: app.company,
          title: app.jobTitle,
          status: app.status
        },
        idempotencyKey: key,
        createdAt: app.createdAt || new Date()
      })
      insertedCount++
    }
  }

  // 3. Sync Quiz Attempts
  const quizAttempts = await QuizAttempt.find().lean()
  console.log(`[SyncActivities] Found ${quizAttempts.length} existing QuizAttempts`)
  for (const qa of quizAttempts) {
    if (!qa.userId) continue
    const key = `quiz_${qa._id}`
    const exists = await ActivityLog.findOne({ idempotencyKey: key })
    if (!exists) {
      await ActivityLog.create({
        userId: qa.userId,
        type: 'quiz_completed',
        category: 'learning',
        title: 'Quiz Completed',
        description: `${qa.quizSlug || 'Technical'} Quiz completed with ${qa.scorePercentage || 0}% score`,
        status: qa.passed ? 'completed' : 'failed',
        metadata: {
          quizSlug: qa.quizSlug,
          scorePercentage: qa.scorePercentage,
          correctCount: qa.correctCount,
          timeTaken: qa.timeTaken
        },
        idempotencyKey: key,
        createdAt: qa.completedAt || qa.createdAt || new Date()
      })
      insertedCount++
    }
  }

  // 4. Sync Tutor Sessions
  const tutorSessions = await TutorSession.find().lean()
  console.log(`[SyncActivities] Found ${tutorSessions.length} existing TutorSessions`)
  for (const ts of tutorSessions) {
    if (!ts.userId || ts.userId === 'guest_user') continue
    const key = `tutor_${ts._id}`
    const exists = await ActivityLog.findOne({ idempotencyKey: key })
    if (!exists) {
      await ActivityLog.create({
        userId: ts.userId,
        type: 'ai_request',
        category: 'ai',
        title: 'AI Assistant Consultation',
        description: `Consulted AI Assistant on ${ts.title || ts.careerPath || 'Engineering'}`,
        status: 'completed',
        metadata: {
          sessionId: ts._id,
          mode: ts.mode,
          careerPath: ts.careerPath
        },
        idempotencyKey: key,
        createdAt: ts.createdAt || new Date()
      })
      insertedCount++
    }
  }

  // 5. Sync Problem Submissions
  const submissions = await ProblemSubmission.find().lean()
  console.log(`[SyncActivities] Found ${submissions.length} existing ProblemSubmissions`)
  for (const sub of submissions) {
    if (!sub.userId || sub.userId === 'guest') continue
    const key = `sub_${sub._id}`
    const exists = await ActivityLog.findOne({ idempotencyKey: key })
    if (!exists) {
      await ActivityLog.create({
        userId: sub.userId,
        type: 'code_submitted',
        category: 'learning',
        title: sub.verdict === 'ACCEPTED' ? 'Code Challenge Solved' : 'Code Challenge Attempted',
        description: `${sub.problemSlug} (${sub.passed}/${sub.total} test cases passed)`,
        status: sub.verdict === 'ACCEPTED' ? 'completed' : 'failed',
        metadata: {
          problemSlug: sub.problemSlug,
          language: sub.language,
          verdict: sub.verdict,
          runtimeMs: sub.runtimeMs
        },
        idempotencyKey: key,
        createdAt: sub.createdAt || new Date()
      })
      insertedCount++
    }
  }

  // 6. Ensure default admin / active user has representative records if none exist
  const adminUser = await User.findOne({ email: 'admin@rexion.ai' })
  if (adminUser) {
    const adminCount = await ActivityLog.countDocuments({
      $or: [{ userId: adminUser._id }, { userId: adminUser._id.toString() }]
    })
    console.log(`[SyncActivities] Admin user has ${adminCount} activities`)
    if (adminCount === 0) {
      const now = Date.now()
      const sampleActivities = [
        {
          userId: adminUser._id,
          type: 'resume_analyzed',
          category: 'resume',
          title: 'AI Resume Analysis Completed',
          description: 'Your resume was analyzed for AI/ML Engineer role',
          status: 'completed',
          metadata: { atsScore: 88, role: 'AI/ML Engineer' },
          createdAt: new Date(now - 2 * 60 * 1000) // 2m ago
        },
        {
          userId: adminUser._id,
          type: 'job_match',
          category: 'jobs',
          title: 'New Job Match Found',
          description: '23 new matches found based on your profile',
          status: 'completed',
          metadata: { matchCount: 23 },
          createdAt: new Date(now - 60 * 60 * 1000) // 1h ago
        },
        {
          userId: adminUser._id,
          type: 'application_submitted',
          category: 'applications',
          title: 'Applied for Frontend Developer Intern',
          description: 'Application submitted to TechNova Solutions',
          status: 'completed',
          metadata: { company: 'TechNova Solutions', role: 'Frontend Developer Intern' },
          createdAt: new Date(now - 3 * 60 * 60 * 1000) // 3h ago
        },
        {
          userId: adminUser._id,
          type: 'quiz_completed',
          category: 'learning',
          title: 'Quiz Completed',
          description: 'JavaScript Basics Quiz completed with 85% score',
          status: 'completed',
          metadata: { score: 85, topic: 'JavaScript' },
          createdAt: new Date(now - 5 * 60 * 60 * 1000) // 5h ago
        },
        {
          userId: adminUser._id,
          type: 'cover_letter_generated',
          category: 'resume',
          title: 'AI Cover Letter Generated',
          description: 'Cover letter generated for Product Manager role',
          status: 'completed',
          metadata: { role: 'Product Manager' },
          createdAt: new Date(now - 24 * 60 * 60 * 1000) // yesterday
        },
        {
          userId: adminUser._id,
          type: 'ai_request',
          category: 'ai',
          title: 'AI Assistant Consultation',
          description: 'Consulted AI Assistant on System Design Architecture',
          status: 'completed',
          metadata: { topic: 'System Design' },
          createdAt: new Date(now - 28 * 60 * 60 * 1000)
        }
      ]
      await ActivityLog.insertMany(sampleActivities)
      insertedCount += sampleActivities.length
      console.log(`[SyncActivities] Initialized ${sampleActivities.length} representative activities for admin user`)
    }
  }

  console.log(`[SyncActivities] Sync finished. Total new activities inserted: ${insertedCount}`)
  await mongoose.disconnect()
}

syncActivities().catch((err) => {
  console.error('[SyncActivities] Failed:', err)
  process.exit(1)
})
