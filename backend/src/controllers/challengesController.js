import { DEDICATED_CHALLENGES } from '../data/challengesData.js'
import { executeProblemTests } from '../services/codeRunner.js'
import { ProblemSubmission } from '../models/ProblemSubmission.js'

// In-memory completed challenges for guest sessions
const guestSolvedSet = new Set()

export async function getChallengesList(req, res) {
  try {
    const userId = req.user?._id || req.query.userId || 'guest'

    // Compute category counts
    const categoryCounts = {
      all: DEDICATED_CHALLENGES.length,
      python: 0,
      javascript: 0,
      dsa: 0,
      sql: 0,
      rag: 0,
      'system-design': 0,
      devops: 0,
      'web-dev': 0,
      other: 0
    }

    let totalTestCases = 0
    const difficultyCounts = { Easy: 0, Medium: 0, Hard: 0 }

    DEDICATED_CHALLENGES.forEach((ch) => {
      totalTestCases += (ch.tests || []).length
      difficultyCounts[ch.difficulty] = (difficultyCounts[ch.difficulty] || 0) + 1
      if (categoryCounts[ch.category] !== undefined) {
        categoryCounts[ch.category]++
      } else {
        categoryCounts.other++
      }
    })

    // Fetch user solved challenges
    let solvedSlugs = new Set(guestSolvedSet)
    let userXp = 0

    if (userId && userId !== 'guest') {
      try {
        const subs = await ProblemSubmission.find({ userId, verdict: 'ACCEPTED' }).lean()
        subs.forEach((s) => {
          solvedSlugs.add(s.problemSlug)
          userXp += s.xpAwarded || 0
        })
      } catch (err) {
        // fallback
      }
    }

    const challenges = DEDICATED_CHALLENGES.map((ch) => ({
      id: ch.id,
      slug: ch.slug,
      title: ch.title,
      desc: ch.desc,
      category: ch.category,
      tags: ch.tags,
      difficulty: ch.difficulty,
      xp: ch.xp,
      isNew: ch.isNew,
      locked: ch.locked,
      icon: ch.icon,
      isCompleted: solvedSlugs.has(ch.slug) || solvedSlugs.has(ch.id)
    }))

    res.json({
      success: true,
      stats: {
        totalChallenges: DEDICATED_CHALLENGES.length,
        totalTestCases,
        activeSolvers: 12480,
        userSolvedCount: solvedSlugs.size,
        userXpEarned: userXp,
        difficultyCounts
      },
      categoryCounts,
      challenges
    })
  } catch (err) {
    console.error('[ChallengesController] getChallengesList error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function getChallengeById(req, res) {
  try {
    const { id } = req.params
    const challenge = DEDICATED_CHALLENGES.find((ch) => ch.id === id || ch.slug === id)
    if (!challenge) {
      return res.status(404).json({ success: false, error: `Challenge '${id}' not found` })
    }

    const sampleTests = (challenge.tests || []).filter((t) => t.isSample)
    res.json({
      success: true,
      challenge: {
        id: challenge.id,
        slug: challenge.slug,
        title: challenge.title,
        desc: challenge.desc,
        statement: challenge.statement,
        category: challenge.category,
        tags: challenge.tags,
        difficulty: challenge.difficulty,
        xp: challenge.xp,
        starterCode: challenge.starterCode,
        functionName: challenge.functionName,
        sampleTests
      }
    })
  } catch (err) {
    console.error('[ChallengesController] getChallengeById error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function runChallenge(req, res) {
  try {
    const { id } = req.params
    const { language = 'python', code } = req.body

    const challenge = DEDICATED_CHALLENGES.find((ch) => ch.id === id || ch.slug === id)
    if (!challenge) {
      return res.status(404).json({ success: false, error: `Challenge '${id}' not found` })
    }

    const sampleTests = (challenge.tests || []).filter((t) => t.isSample)
    const result = await executeProblemTests({
      language,
      code,
      functionName: challenge.functionName,
      checker: 'EXACT',
      tests: sampleTests.length > 0 ? sampleTests : challenge.tests.slice(0, 2),
      timeLimitSec: 3,
      memoryLimitKb: 128000,
      mode: 'run'
    })

    res.json({ success: true, mode: 'run', ...result })
  } catch (err) {
    console.error('[ChallengesController] runChallenge error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function submitChallenge(req, res) {
  try {
    const { id } = req.params
    const { language = 'python', code, userId } = req.body

    const challenge = DEDICATED_CHALLENGES.find((ch) => ch.id === id || ch.slug === id)
    if (!challenge) {
      return res.status(404).json({ success: false, error: `Challenge '${id}' not found` })
    }

    const result = await executeProblemTests({
      language,
      code,
      functionName: challenge.functionName,
      checker: 'EXACT',
      tests: challenge.tests || [],
      timeLimitSec: 3,
      memoryLimitKb: 128000,
      mode: 'submit'
    })

    let xpAwarded = 0
    if (result.verdict === 'ACCEPTED') {
      xpAwarded = challenge.xp || 50
      guestSolvedSet.add(challenge.slug)
      guestSolvedSet.add(challenge.id)

      if (userId && userId !== 'guest') {
        try {
          await ProblemSubmission.create({
            userId,
            problemSlug: challenge.slug,
            language,
            code,
            verdict: 'ACCEPTED',
            passed: result.passed,
            total: result.total,
            runtimeMs: result.runtimeMs,
            xpAwarded
          })
        } catch (subErr) {
          // non-critical
        }
      }
    }

    res.json({
      success: true,
      mode: 'submit',
      xpAwarded,
      ...result
    })
  } catch (err) {
    console.error('[ChallengesController] submitChallenge error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}
