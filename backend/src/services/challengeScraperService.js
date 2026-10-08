import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Problem } from '../models/Problem.js'
import { executeProblemTests } from './codeRunner.js'
import { loadProblemsFromDisk } from './problemService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROBLEMS_DIR = path.resolve(__dirname, '../data/problems')

/**
 * Validates a generated challenge by executing its canonical reference solution
 * in the real sandbox runner against all provided test cases.
 */
export async function validateChallengeInSandbox(problemData) {
  try {
    const { starterCode, referenceSolution, functionName, tests, checker = 'EXACT' } = problemData
    const code = referenceSolution?.python || starterCode?.python

    if (!code || !tests || tests.length === 0) {
      return { valid: false, reason: 'Missing reference code or test cases' }
    }

    const execResult = await executeProblemTests({
      language: 'python',
      code,
      functionName,
      checker,
      tests,
      timeLimitSec: 3,
      memoryLimitKb: 128000,
      mode: 'submit'
    })

    if (execResult.verdict === 'ACCEPTED' && execResult.passed === execResult.total) {
      return { valid: true, execResult }
    }

    return {
      valid: false,
      reason: `Sandbox failed: ${execResult.verdict} (${execResult.passed}/${execResult.total} passed). Error: ${execResult.error || 'Test mismatch'}`
    }
  } catch (err) {
    return { valid: false, reason: err.message }
  }
}

/**
 * Scrapes/synthesizes a fresh question and verifies it in sandbox before saving.
 */
export async function synthesizeAndValidateChallenge(customPrompt) {
  const existing = loadProblemsFromDisk()
  const existingSlugs = new Set(existing.map((p) => p.slug))

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    console.warn('[ChallengeScraper] No LLM API key configured for live synthesis.')
    return null
  }

  const prompt = `You are a Principal Software Engineer and Staff Interviewer at Google/Meta.
Generate a brand new, highly realistic, runnable coding interview challenge.
Return ONLY a valid JSON object with NO markdown formatting, NO backticks.

JSON schema:
{
  "slug": "kebab-case-unique-name",
  "title": "Clear Problem Title",
  "difficulty": "Easy" | "Medium" | "Hard",
  "category": "dsa" | "python" | "javascript" | "sql" | "rag" | "system-design",
  "topics": ["Array", "Two Pointers"],
  "statement": "Detailed markdown problem statement with inputs, outputs, and real-world scenario.",
  "constraints": "1 <= nums.length <= 10^5\\n-10^9 <= nums[i] <= 10^9",
  "hint": "Consider using two pointers or hash map.",
  "functionName": "solutionFunction",
  "checker": "EXACT",
  "starterCode": {
    "python": "class Solution:\\n    def solutionFunction(self, nums):\\n        # Write your code here\\n        pass",
    "javascript": "function solutionFunction(nums) {\\n    // Write your code here\\n}"
  },
  "referenceSolution": {
    "python": "class Solution:\\n    def solutionFunction(self, nums):\\n        # Canonical correct implementation\\n        return sorted(nums)"
  },
  "tests": [
    { "input": "[3, 1, 2]", "expected": "[1, 2, 3]", "isSample": true },
    { "input": "[1]", "expected": "[1]", "isSample": true },
    { "input": "[]", "expected": "[]", "isSample": false }
  ],
  "companies": [{ "name": "Google", "slug": "google" }],
  "xp": 50
}`

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://rexion.ai',
        'X-Title': 'Rexion Challenge Synthesizer'
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      })
    })

    if (!res.ok) {
      console.warn('[ChallengeScraper] OpenRouter request failed:', res.status)
      return null
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    if (!content) return null

    const cleaned = content.replace(/^```json/i, '').replace(/```$/i, '').trim()
    const parsed = JSON.parse(cleaned)

    if (existingSlugs.has(parsed.slug)) {
      parsed.slug = `${parsed.slug}-${Date.now().toString(36)}`
    }

    // Run Sandbox verification
    const validation = await validateChallengeInSandbox(parsed)
    if (!validation.valid) {
      console.warn(`[ChallengeScraper] Synthesized challenge '${parsed.title}' failed sandbox validation: ${validation.reason}`)
      return null
    }

    // Persist to disk and DB
    if (!fs.existsSync(PROBLEMS_DIR)) {
      fs.mkdirSync(PROBLEMS_DIR, { recursive: true })
    }

    const filePath = path.join(PROBLEMS_DIR, `${parsed.slug}.json`)
    fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf8')
    console.log(`[ChallengeScraper] Saved verified challenge to ${filePath}`)

    await Problem.findOneAndUpdate(
      { slug: parsed.slug },
      { ...parsed, published: true },
      { upsert: true, new: true }
    ).catch(() => {})

    return parsed
  } catch (err) {
    console.error('[ChallengeScraper] Error synthesizing challenge:', err.message)
    return null
  }
}
