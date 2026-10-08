import {
  getAllProblems,
  getProblemBySlug,
  getRawProblemBySlug,
  recordSubmission,
  getChallengesOverview
} from '../services/problemService.js'
import { executeProblemTests } from '../services/codeRunner.js'
import { synthesizeAndValidateChallenge } from '../services/challengeScraperService.js'

// GET /api/code-arena/overview
export async function getOverview(req, res) {
  try {
    const userId = req.user?._id || req.query.userId || 'guest'
    const data = await getChallengesOverview(userId)
    res.json({ success: true, ...data })
  } catch (err) {
    console.error('[CodeArenaController] getOverview error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// POST /api/code-arena/sync-challenges
export async function syncChallenges(req, res) {
  try {
    const result = await synthesizeAndValidateChallenge()
    res.json({ success: true, challenge: result })
  } catch (err) {
    console.error('[CodeArenaController] syncChallenges error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// GET /api/code-arena/problems
export async function getProblems(req, res) {
  try {
    const { difficulty, topic, category, q, page, limit } = req.query
    const result = getAllProblems({
      difficulty,
      topic,
      category,
      q,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50
    })
    res.json({ success: true, ...result })
  } catch (err) {
    console.error('[CodeArenaController] getProblems error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// GET /api/code-arena/problems/:slug
export async function getProblem(req, res) {
  try {
    const { slug } = req.params
    const problem = getProblemBySlug(slug)
    if (!problem) {
      return res.status(404).json({ success: false, error: `Problem '${slug}' not found` })
    }
    res.json({ success: true, problem })
  } catch (err) {
    console.error('[CodeArenaController] getProblem error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// POST /api/code-arena/problems/:slug/run
// Runs against sample test cases for immediate user feedback
export async function runCode(req, res) {
  try {
    const { slug } = req.params
    const { language = 'python', code } = req.body

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, error: 'Code is required' })
    }

    const rawProblem = getRawProblemBySlug(slug)
    if (!rawProblem) {
      return res.status(404).json({ success: false, error: `Problem '${slug}' not found` })
    }

    const sampleTests = (rawProblem.tests || []).filter((t) => t.isSample)
    if (sampleTests.length === 0) {
      // Fallback to first 3 tests if no sample flag
      sampleTests.push(...(rawProblem.tests || []).slice(0, 3))
    }

    const result = await executeProblemTests({
      language,
      code,
      functionName: rawProblem.functionName,
      checker: rawProblem.checker || 'EXACT',
      tests: sampleTests,
      timeLimitSec: rawProblem.timeLimitSec || 2,
      memoryLimitKb: rawProblem.memoryLimitKb || 128000,
      mode: 'run'
    })

    res.json({
      success: true,
      mode: 'run',
      ...result
    })
  } catch (err) {
    console.error('[CodeArenaController] runCode error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// POST /api/code-arena/problems/:slug/submit
// Evaluates against all test cases, awards XP, and records submission
export async function submitCode(req, res) {
  try {
    const { slug } = req.params
    const { language = 'python', code, userId } = req.body

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, error: 'Code is required' })
    }

    const rawProblem = getRawProblemBySlug(slug)
    if (!rawProblem) {
      return res.status(404).json({ success: false, error: `Problem '${slug}' not found` })
    }

    const result = await executeProblemTests({
      language,
      code,
      functionName: rawProblem.functionName,
      checker: rawProblem.checker || 'EXACT',
      tests: rawProblem.tests || [],
      timeLimitSec: rawProblem.timeLimitSec || 2,
      memoryLimitKb: rawProblem.memoryLimitKb || 128000,
      mode: 'submit'
    })

    let xpAwarded = 0
    if (result.verdict === 'ACCEPTED') {
      xpAwarded = rawProblem.xp || 50
    }

    const submission = await recordSubmission({
      userId: userId || req.user?._id || 'guest',
      problemSlug: slug,
      language,
      code,
      verdict: result.verdict,
      passed: result.passed,
      total: result.total,
      runtimeMs: result.runtimeMs,
      xpAwarded
    })

    res.json({
      success: true,
      mode: 'submit',
      xpAwarded,
      submissionId: submission?._id,
      ...result
    })
  } catch (err) {
    console.error('[CodeArenaController] submitCode error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}
