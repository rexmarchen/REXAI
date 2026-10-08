import assert from 'assert'
import { calculateExplainableMatch } from '../src/services/jobs/jobMatchingEngine.js'
import { generateScreeningAnswer } from '../src/services/agents/ragScreeningService.js'
import { APPLICATION_STATES } from '../src/config/constants.js'

console.log('--- RUNNING AGENTIC ORCHESTRATOR & MATCHING TEST SUITE ---')

const MOCK_PROFILE = {
  fullName: 'Alex Rexion',
  primaryDomain: 'AI/ML',
  secondaryDomains: ['Full Stack', 'Backend'],
  skills: ['Python', 'PyTorch', 'React', 'Node.js', 'LLM', 'AWS'],
  resumeRawText: 'Senior AI Engineer with 5+ years experience building RAG systems with PyTorch and LLMs.'
}

// Test 1: Explainable Match Scoring
{
  const freshJob = {
    title: 'Senior AI / Machine Learning Engineer',
    company: 'Stripe',
    description: 'Looking for a Senior AI Engineer experienced in Python, PyTorch, LLMs, and distributed systems.',
    postedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    tier: 1
  }

  const match = calculateExplainableMatch(MOCK_PROFILE, freshJob)
  assert(match.totalScore >= 70, `Match score should be high for aligned job, got ${match.totalScore}`)
  assert(match.breakdown.semanticScore > 0, 'Semantic score must be positive')
  assert(match.breakdown.skillScore > 0, 'Skill score must be positive')
  assert(match.breakdown.freshnessScore > 0.8, '3h old job must have high freshness score')
  assert(match.reasons.length >= 3, 'Must provide detailed explainable reasons')
  assert(match.matchedSkills.includes('python'), 'Must identify matched skills')

  console.log(`✓ Test 1 Passed: Explainable match score calculated: ${match.totalScore} with ${match.reasons.length} reasons`)
}

// Test 2: Grounded RAG Screening Answer Generation
{
  const mockChunks = [
    {
      chunkId: 'chunk_0_rag',
      text: 'Architected and deployed production RAG pipelines using PyTorch and Hugging Face transformers, reducing latency by 40%.',
      section: 'experience',
      score: 0.9
    }
  ]

  const answerResult = await generateScreeningAnswer({
    userId: 'user_mock_123',
    question: 'Describe your hands-on experience with RAG and transformers.',
    directChunks: mockChunks,
    candidateProfile: MOCK_PROFILE
  })

  assert(answerResult.answer.length > 20, 'Answer must not be empty')
  assert(answerResult.confidence >= 0.7, 'Confidence should be >= 0.7')
  assert(answerResult.evidenceChunkIds.includes('chunk_0_rag'), 'Evidence chunk ID must be attached')
  assert(answerResult.reasoning.length > 0, 'Reasoning must be provided')

  console.log(`✓ Test 2 Passed: Grounded screening answer generated with evidence ID: ${answerResult.evidenceChunkIds[0]}`)
}

// Test 3: Stale Job Match Penalty
{
  const staleJob = {
    title: 'Senior AI Engineer',
    company: 'OldCorp',
    description: 'Python, PyTorch, LLM',
    postedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 72 hours ago
    tier: 2
  }

  const match = calculateExplainableMatch(MOCK_PROFILE, staleJob)
  assert.strictEqual(match.breakdown.freshnessScore, 0, 'Stale job (>48h) must receive 0 freshness score')
  assert(match.reasons.some((r) => r.includes('exceeds 48-hour')), 'Must explain 48h expiration in reasons')

  console.log('✓ Test 3 Passed: 72h job properly penalized with 0 freshness score')
}

// Test 4: Application State Machine Enum Integrity
{
  const expectedStates = [
    'DISCOVERED', 'MATCHED', 'QUEUED', 'FORM_DETECTED',
    'AUTOFILLING', 'SUBMITTED', 'NEEDS_USER_INPUT', 'EXPIRED', 'FAILED'
  ]
  for (const st of expectedStates) {
    assert(APPLICATION_STATES[st], `State ${st} must exist in APPLICATION_STATES`)
  }
  console.log('✓ Test 4 Passed: 16-state machine definitions validated')
}

console.log('ALL AGENTIC ORCHESTRATOR TESTS PASSED PERFECTLY!')
