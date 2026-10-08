import express from 'express'
import { ROLES_CATALOG, analyzeSkillGap, getSkillGraphData } from '../services/skillGapEngineService.js'
import { getOrGenerateSkillGraph } from '../services/aiSkillGraphService.js'
import { getUserSkillsDashboardData } from '../services/userSkillsService.js'
import CandidateProfile from '../models/CandidateProfile.js'
import { ProblemSubmission } from '../models/ProblemSubmission.js'
import { QuizAttempt } from '../models/Quiz.js'
import { TopicMastery } from '../models/TutorQuiz.js'
import { optionalProtect } from '../middleware/authMiddleware.js'

const router = express.Router()

// GET /api/skill-gap/user-skills-summary - Real production calculated statistics
router.get('/user-skills-summary', optionalProtect, async (req, res) => {
  try {
    const roleId = req.query.roleId || 'ai-engineer'
    const userId = req.user?._id || req.user?.id || req.headers['x-user-id'] || req.query.userId || null
    const quizScores = req.query.quizScores || null
    const solvedSlugs = req.query.solvedSlugs || null

    const result = await getUserSkillsDashboardData({
      userId,
      roleId,
      quizScores,
      solvedSlugs
    })

    return res.status(200).json(result)
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/skill-gap/roles
router.get('/roles', (req, res) => {
  return res.status(200).json({
    success: true,
    roles: Object.values(ROLES_CATALOG).map((r) => ({
      id: r.id,
      name: r.name,
      domain: r.domain,
      benchmarkSkills: r.benchmarkSkills
    }))
  })
})

// GET /api/skill-gap/graph
router.get('/graph', optionalProtect, async (req, res) => {
  try {
    const roleId = req.query.roleId || 'ai-engineer'
    let userSkills = []
    let profile = null
    const solvedSlugs = new Set()
    let quizAttempts = []
    let topicMasteries = []
    let timeSpentSecs = 0
    const userId = req.user?._id || req.user?.id || req.headers['x-user-id'] || req.query.userId || null

    // Check if client provided local/guest solves via query
    if (req.query.solvedSlugs) {
      String(req.query.solvedSlugs)
        .split(',')
        .forEach((s) => {
          if (s.trim()) solvedSlugs.add(s.trim().toLowerCase())
        })
    }

    // Check if client provided local/guest quiz scores via query
    if (req.query.quizScores) {
      try {
        const clientScores = typeof req.query.quizScores === 'string' ? JSON.parse(req.query.quizScores) : req.query.quizScores
        if (typeof clientScores === 'object' && clientScores !== null) {
          Object.entries(clientScores).forEach(([slug, score]) => {
            quizAttempts.push({
              quizSlug: slug,
              scorePercentage: Number(score) || 0,
              xpEarned: Math.round(Number(score) || 0)
            })
          })
        }
      } catch (_) {}
    }

    try {
      if (userId && String(userId) !== 'guest') {
        profile = await CandidateProfile.findOne({ userId }).lean()
        if (profile?.skills?.length) {
          userSkills = profile.skills
        }

        // Submissions strictly for this user (Code Arena & Production Challenges)
        const userSubs = await ProblemSubmission.find({
          userId: String(userId),
          verdict: 'ACCEPTED'
        }).lean()
        userSubs.forEach((s) => {
          if (s.problemSlug) solvedSlugs.add(s.problemSlug.toLowerCase())
          if (s.runtimeMs) timeSpentSecs += Math.round(s.runtimeMs / 1000)
        })

        // Quiz attempts strictly for this user
        const attempts = await QuizAttempt.find({
          userId: String(userId)
        }).lean()
        quizAttempts = attempts.map((a) => {
          if (a.timeTaken) timeSpentSecs += a.timeTaken
          return {
            quizSlug: a.quizSlug,
            scorePercentage: a.scorePercentage || 0,
            xpEarned: a.xpEarned || 0
          }
        })

        // AI Tutor Topic Mastery strictly for this user
        const masteries = await TopicMastery.find({ userId: String(userId) }).lean()
        topicMasteries = masteries.map((m) => ({
          topic: m.topic,
          mastery: m.mastery || 0
        }))
      }
    } catch (dbErr) {
      console.warn('Skill graph db fetch warning:', dbErr.message)
    }

    const graphData = await getSkillGraphData({
      roleId,
      userSkills,
      profile,
      solvedSlugs: Array.from(solvedSlugs),
      quizAttempts,
      topicMasteries,
      timeSpentMinutes: Math.round(timeSpentSecs / 60)
    })

    return res.status(200).json({
      success: true,
      data: graphData
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

// POST /api/skill-gap/generate-custom-path - On-demand AI path synthesizer
router.post('/generate-custom-path', optionalProtect, async (req, res) => {
  try {
    const { roleTitle } = req.body
    if (!roleTitle || !roleTitle.trim()) {
      return res.status(400).json({ success: false, message: 'roleTitle is required' })
    }
    const cleanTitle = roleTitle.trim()
    const roleSlug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    
    // Synthesize or retrieve graph via AI service
    await getOrGenerateSkillGraph(roleSlug, cleanTitle)

    // Compute live user scores strictly against their history
    let userSkills = []
    let profile = null
    const solvedSlugs = new Set()
    let quizAttempts = []
    let topicMasteries = []
    let timeSpentSecs = 0
    const userId = req.user?._id || req.user?.id || req.headers['x-user-id'] || req.body?.userId || null

    if (userId && String(userId) !== 'guest') {
      try {
        profile = await CandidateProfile.findOne({ userId }).lean()
        if (profile?.skills?.length) userSkills = profile.skills

        const userSubs = await ProblemSubmission.find({ userId: String(userId), verdict: 'ACCEPTED' }).lean()
        userSubs.forEach((s) => {
          if (s.problemSlug) solvedSlugs.add(s.problemSlug.toLowerCase())
          if (s.runtimeMs) timeSpentSecs += Math.round(s.runtimeMs / 1000)
        })

        const attempts = await QuizAttempt.find({ userId: String(userId) }).lean()
        quizAttempts = attempts.map((a) => {
          if (a.timeTaken) timeSpentSecs += a.timeTaken
          return { quizSlug: a.quizSlug, scorePercentage: a.scorePercentage || 0, xpEarned: a.xpEarned || 0 }
        })

        const masteries = await TopicMastery.find({ userId: String(userId) }).lean()
        topicMasteries = masteries.map((m) => ({ topic: m.topic, mastery: m.mastery || 0 }))
      } catch (_) {}
    }

    const graphData = await getSkillGraphData({
      roleId: roleSlug,
      userSkills,
      profile,
      solvedSlugs: Array.from(solvedSlugs),
      quizAttempts,
      topicMasteries,
      timeSpentMinutes: Math.round(timeSpentSecs / 60)
    })

    return res.status(200).json({
      success: true,
      roleId: roleSlug,
      roleName: cleanTitle,
      data: graphData
    })
  } catch (err) {
    console.error('generate-custom-path error:', err)
    return res.status(500).json({ success: false, message: err.message })
  }
})

// POST /api/skill-gap (standard route matching user's provided route.ts)
router.post('/', optionalProtect, async (req, res) => {
  try {
    const { role = 'frontend-developer', skills = [] } = req.body
    const result = await analyzeSkillGap({
      roleId: role,
      skills,
      userId: req.user?._id || req.user?.id || null
    })
    return res.status(200).json(result)
  } catch (err) {
    return res.status(500).json({ error: 'Failed to analyze skill gap', message: err.message })
  }
})

// POST /api/skill-gap/analyze
router.post('/analyze', optionalProtect, async (req, res) => {
  try {
    const { roleId = 'frontend-developer', skills = [] } = req.body
    const result = await analyzeSkillGap({
      roleId,
      skills,
      userId: req.user?._id || req.user?.id || null
    })
    return res.status(200).json({
      success: true,
      data: result
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/skill-gap/profile-skills
router.get('/profile-skills', optionalProtect, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(200).json({ success: true, skills: ['React', 'JavaScript', 'HTML/CSS', 'Git', 'TypeScript'] })
    }
    const profile = await CandidateProfile.findOne({ userId: req.user._id || req.user.id }).lean()
    const skills = profile?.skills?.length ? profile.skills : ['React', 'JavaScript', 'HTML/CSS', 'Git', 'TypeScript']
    return res.status(200).json({
      success: true,
      skills,
      name: profile?.fullName || 'Candidate'
    })
  } catch (err) {
    return res.status(200).json({ success: true, skills: ['React', 'JavaScript', 'HTML/CSS', 'Git', 'TypeScript'] })
  }
})

export default router
