import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const backendRoot = path.resolve(__dirname, '../..')

const LLM_PROVIDER = String(process.env.LLM_PROVIDER || 'local').trim().toLowerCase()
const OPENAI_API_KEY = String(process.env.OPENAI_API_KEY || '').trim()
const OPENAI_MODEL = String(process.env.OPENAI_MODEL || 'gpt-4o-mini').trim()
const USE_OPENAI_LLM = LLM_PROVIDER === 'openai' && OPENAI_API_KEY.length > 0
const LLM_STORE_LIMIT = 200

const SKILL_LIBRARY = [
  { key: 'javascript', label: 'JavaScript', weight: 8, domains: ['frontend', 'backend'] },
  { key: 'react', label: 'React', weight: 8, domains: ['frontend'] },
  { key: 'typescript', label: 'TypeScript', weight: 8, domains: ['frontend', 'backend'] },
  { key: 'node', label: 'Node.js', weight: 8, domains: ['backend'] },
  { key: 'python', label: 'Python', weight: 8, domains: ['backend', 'ai'] },
  { key: 'sql', label: 'SQL', weight: 7, domains: ['data', 'backend'] },
  { key: 'mongodb', label: 'MongoDB', weight: 6, domains: ['data', 'backend'] },
  { key: 'aws', label: 'AWS', weight: 7, domains: ['cloud', 'devops'] },
  { key: 'docker', label: 'Docker', weight: 7, domains: ['devops', 'cloud'] },
  { key: 'kubernetes', label: 'Kubernetes', weight: 7, domains: ['devops', 'cloud'] },
  { key: 'machine learning', label: 'Machine Learning', weight: 8, domains: ['ai', 'data'] },
  { key: 'tensorflow', label: 'TensorFlow', weight: 6, domains: ['ai'] },
  { key: 'pytorch', label: 'PyTorch', weight: 6, domains: ['ai'] },
  { key: 'git', label: 'Git', weight: 5, domains: ['devops'] }
]

const DOMAIN_TECH_RECOMMENDATIONS = {
  frontend: [
    'TypeScript',
    'Next.js',
    'React Server Components',
    'Playwright',
    'Web Performance Profiling'
  ],
  backend: [
    'Node.js API Security',
    'FastAPI',
    'GraphQL Federation',
    'Event-Driven Architecture',
    'gRPC'
  ],
  data: ['PostgreSQL Tuning', 'Vector Databases', 'dbt', 'DuckDB', 'Data Contracts'],
  cloud: ['AWS Lambda', 'Terraform', 'Cloud Security Posture', 'Observability', 'FinOps'],
  devops: ['Kubernetes', 'GitHub Actions', 'SRE Incident Playbooks', 'Docker Slim Images'],
  ai: ['LLM Prompt Engineering', 'RAG Pipelines', 'LangChain', 'MLOps', 'Model Evaluation']
}

const llmModelsDirectory = path.join(backendRoot, 'llm-models')
mkdirSync(llmModelsDirectory, { recursive: true })

const llmStorePath = path.join(llmModelsDirectory, 'resume-analysis-store.json')
ensureJsonStoreFile(llmStorePath)

function ensureJsonStoreFile(storePath) {
  try {
    const content = readFileSync(storePath, 'utf8')
    const parsed = JSON.parse(content)
    if (!Array.isArray(parsed)) {
      writeFileSync(storePath, '[]')
    }
  } catch {
    writeFileSync(storePath, '[]')
  }
}

function readLlmStoreRecords() {
  try {
    const raw = readFileSync(llmStorePath, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistLlmAnalysis(fileName, analysis) {
  try {
    const records = readLlmStoreRecords()
    records.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fileName,
      confidence: analysis.confidence,
      confidenceLevel: analysis.confidenceLevel,
      llmModel: analysis.llmModel,
      analysisMethod: analysis.analysisMethod,
      weaknesses: analysis.weaknesses,
      technologyRecommendations: analysis.technologyRecommendations,
      createdAt: new Date().toISOString()
    })

    writeFileSync(llmStorePath, JSON.stringify(records.slice(0, LLM_STORE_LIMIT), null, 2))
  } catch (error) {
    console.error('Unable to persist LLM analysis store:', error.message)
  }
}

function normalizeResumeText(rawText) {
  return String(rawText || '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractResumeText(resumeData) {
  if (typeof resumeData === 'string') {
    return normalizeResumeText(resumeData)
  }

  const utf8Text = normalizeResumeText(resumeData?.toString('utf8'))
  const latinText = normalizeResumeText(resumeData?.toString('latin1'))

  if (!latinText) {
    return utf8Text
  }

  if (!utf8Text) {
    return latinText
  }

  const utf8WordCount = utf8Text.split(' ').length
  const latinWordCount = latinText.split(' ').length
  return utf8WordCount >= latinWordCount * 0.65 ? utf8Text : latinText
}

export function getConfidenceLevel(confidence) {
  if (confidence >= 85) {
    return 'High'
  }

  if (confidence >= 70) {
    return 'Moderate'
  }

  return 'Needs Improvement'
}

function getPredictionMessage(confidence) {
  if (confidence >= 85) {
    return 'Strong profile detected. High match for Full-Stack / Software Engineer roles.'
  }

  if (confidence >= 70) {
    return 'Good profile detected. Suitable for junior-to-mid software development roles.'
  }

  return 'Resume uploaded successfully. Improve role-specific details for better interview conversion.'
}

function collectSignals(normalizedContent) {
  const detectedSkills = SKILL_LIBRARY.filter((skill) => normalizedContent.includes(skill.key))
  const missingSkills = SKILL_LIBRARY.filter((skill) => !normalizedContent.includes(skill.key))
  const detectedDomains = new Set()

  for (const skill of detectedSkills) {
    for (const domain of skill.domains) {
      detectedDomains.add(domain)
    }
  }

  return {
    normalizedContent,
    detectedSkills,
    missingSkills,
    detectedDomains,
    hasProjects: /\bprojects?\b/.test(normalizedContent),
    hasExperience: /\bexperience\b|\bemployment\b|\bwork history\b/.test(normalizedContent),
    hasEducation: /\beducation\b|\bcollege\b|\buniversity\b|\bbachelor\b|\bmaster\b/.test(
      normalizedContent
    ),
    hasCertifications: /\bcertification\b|\bcertified\b|\bcertificate\b/.test(normalizedContent),
    hasSummary: /\bsummary\b|\bprofile\b|\bobjective\b/.test(normalizedContent),
    quantifiedImpactCount: (
      normalizedContent.match(/(\b\d{1,3}%\b|\b\d+\+\b|\$\d+[kmb]?\b|\b\d{2,}\b)/g) || []
    ).length,
    hasEmail: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/.test(normalizedContent),
    hasPhone: /\+?\d[\d\s().-]{7,}\d/.test(normalizedContent),
    wordCount: normalizedContent ? normalizedContent.split(/\s+/).length : 0
  }
}

function calculateConfidence(signals) {
  let score = 48
  score += signals.detectedSkills.reduce((sum, skill) => sum + skill.weight, 0)
  score += signals.hasExperience ? 10 : -8
  score += signals.hasProjects ? 9 : -10
  score += signals.hasEducation ? 6 : 0
  score += signals.hasSummary ? 3 : 0
  score += signals.hasCertifications ? 4 : 0

  if (signals.quantifiedImpactCount >= 5) {
    score += 8
  } else if (signals.quantifiedImpactCount >= 2) {
    score += 4
  } else {
    score -= 6
  }

  score += signals.hasEmail && signals.hasPhone ? 4 : -5

  if (signals.wordCount < 170) {
    score -= 12
  } else if (signals.wordCount < 260) {
    score -= 4
  } else if (signals.wordCount > 1200) {
    score -= 8
  }

  return Math.max(45, Math.min(98, Math.round(score)))
}

function sanitizeStringList(value, fallback = [], maxItems = 6) {
  if (!Array.isArray(value)) {
    return fallback
  }

  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, maxItems)
}

function buildWeaknesses(signals) {
  const items = []
  if (!signals.hasProjects) {
    items.push('Project section is missing or too light, so practical skills are hard to verify.')
  }
  if (!signals.hasExperience) {
    items.push('Work experience impact is unclear. Add ownership and role outcomes.')
  }
  if (signals.quantifiedImpactCount === 0) {
    items.push('Achievements are not quantified. Add metrics like %, time saved, or revenue impact.')
  }
  if (!(signals.hasEmail && signals.hasPhone)) {
    items.push('Contact details are incomplete, which can reduce interview callbacks.')
  }
  for (const skill of signals.missingSkills.slice(0, 3)) {
    items.push(`Limited evidence of ${skill.label} in recent work.`)
  }
  if (items.length === 0) {
    items.push('No major weaknesses detected. Focus next on role-specific keyword alignment.')
  }
  return items.slice(0, 6)
}

function buildPrecautions(signals) {
  const items = []
  if (signals.wordCount < 220) {
    items.push('Do not submit a one-page resume with very limited detail; expand impact statements.')
  }
  if (signals.wordCount > 1000) {
    items.push('Do not overload the resume. Keep it concise and high-impact.')
  }
  if (!signals.hasProjects) {
    items.push('Do not apply without at least one strong project section linked to real outcomes.')
  }
  if (signals.quantifiedImpactCount < 2) {
    items.push('Do not use only generic claims. Add measurable results in top achievements.')
  }
  if (!signals.hasSummary) {
    items.push('Do not skip your profile summary. Add a short role-aligned summary at the top.')
  }
  if (items.length === 0) {
    items.push('Avoid using the same resume for every role; customize skills per job description.')
  }
  return items.slice(0, 6)
}

function buildTechnologyRecommendations(signals) {
  const recommendations = []
  const domains = signals.detectedDomains.size
    ? Array.from(signals.detectedDomains)
    : ['frontend', 'backend', 'devops']

  for (const domain of domains) {
    for (const tech of DOMAIN_TECH_RECOMMENDATIONS[domain] || []) {
      if (!signals.normalizedContent.includes(tech.toLowerCase()) && !recommendations.includes(tech)) {
        recommendations.push(tech)
      }
    }
  }

  if (!signals.detectedDomains.has('ai')) {
    for (const tech of DOMAIN_TECH_RECOMMENDATIONS.ai) {
      if (!signals.normalizedContent.includes(tech.toLowerCase()) && !recommendations.includes(tech)) {
        recommendations.push(tech)
      }
    }
  }

  return recommendations.slice(0, 6)
}

function buildImprovementPlan(signals, technologyRecommendations) {
  const plan = []
  if (signals.quantifiedImpactCount < 2) {
    plan.push('Rewrite at least 3 bullet points using action + metric + business result format.')
  }
  if (!signals.hasProjects) {
    plan.push('Add one flagship project with architecture choices, stack used, and measurable impact.')
  }
  if (!signals.hasCertifications) {
    plan.push('Complete one relevant certification and include it near the top of the resume.')
  }
  if (technologyRecommendations.length > 0) {
    plan.push(
      `Build a short project using ${technologyRecommendations.slice(0, 2).join(' and ')} and link it.`
    )
  }
  plan.push('Tailor keywords to every job description before applying.')
  return plan.slice(0, 6)
}

function buildVoiceSummary(analysis) {
  const topWeakness = analysis.weaknesses[0] || 'No major weakness detected.'
  const topImprovement = analysis.improvementPlan[0] || 'Strengthen role-specific details.'
  const topTech = analysis.technologyRecommendations.slice(0, 2).join(' and ')

  return `AI coach update. Your resume confidence is ${analysis.confidence} percent and the confidence level is ${analysis.confidenceLevel}. Key weakness: ${topWeakness} Priority improvement: ${topImprovement} Learn ${topTech || 'modern cloud and AI technologies'} to improve future opportunities.`
}

function buildHeuristicAnalysis(resumeText) {
  const normalizedContent = normalizeResumeText(resumeText).toLowerCase()
  const signals = collectSignals(normalizedContent)
  const confidence = calculateConfidence(signals)
  const confidenceLevel = getConfidenceLevel(confidence)
  const technologyRecommendations = buildTechnologyRecommendations(signals)

  const analysis = {
    prediction: getPredictionMessage(confidence),
    confidence,
    confidenceLevel,
    weaknesses: buildWeaknesses(signals),
    precautions: buildPrecautions(signals),
    technologyRecommendations,
    improvementPlan: buildImprovementPlan(signals, technologyRecommendations),
    llmModel: 'local-llm-v1',
    analysisMethod: 'heuristic-local-llm',
    voiceSummary: ''
  }

  analysis.voiceSummary = buildVoiceSummary(analysis)
  return analysis
}

function parseJsonObjectFromText(rawText) {
  if (!rawText) {
    return null
  }

  try {
    return JSON.parse(String(rawText))
  } catch {
    const text = String(rawText)
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) {
      return null
    }
    try {
      return JSON.parse(text.slice(start, end + 1))
    } catch {
      return null
    }
  }
}

async function getOpenAiEnhancedAnalysis(resumeText, baseAnalysis) {
  const systemPrompt = `
You are an expert resume evaluator.
Return only JSON:
{
  "prediction": "string",
  "confidence": number,
  "confidenceLevel": "High|Moderate|Needs Improvement",
  "weaknesses": ["string"],
  "precautions": ["string"],
  "technologyRecommendations": ["string"],
  "improvementPlan": ["string"],
  "voiceSummary": "string"
}
`

  const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt.trim() },
        {
          role: 'user',
          content: `Base analysis: ${JSON.stringify(baseAnalysis)}\nResume: ${String(resumeText).slice(0, 8000)}`
        }
      ]
    })
  })

  if (!openAiResponse.ok) {
    const errorBody = await openAiResponse.text()
    throw new Error(`OpenAI request failed: ${openAiResponse.status} ${errorBody}`)
  }

  const payload = await openAiResponse.json()
  const parsed = parseJsonObjectFromText(payload?.choices?.[0]?.message?.content)
  if (!parsed) {
    throw new Error('OpenAI returned invalid JSON output.')
  }

  const confidenceValue = Number(parsed?.confidence)
  const confidence = Number.isFinite(confidenceValue)
    ? Math.max(45, Math.min(98, Math.round(confidenceValue)))
    : baseAnalysis.confidence

  const enhanced = {
    prediction: String(parsed?.prediction || baseAnalysis.prediction),
    confidence,
    confidenceLevel: getConfidenceLevel(confidence),
    weaknesses: sanitizeStringList(parsed?.weaknesses, baseAnalysis.weaknesses),
    precautions: sanitizeStringList(parsed?.precautions, baseAnalysis.precautions),
    technologyRecommendations: sanitizeStringList(
      parsed?.technologyRecommendations,
      baseAnalysis.technologyRecommendations
    ),
    improvementPlan: sanitizeStringList(parsed?.improvementPlan, baseAnalysis.improvementPlan),
    llmModel: payload?.model || OPENAI_MODEL,
    analysisMethod: 'openai-enhanced',
    voiceSummary: String(parsed?.voiceSummary || '')
  }

  if (!enhanced.voiceSummary) {
    enhanced.voiceSummary = buildVoiceSummary(enhanced)
  }

  return enhanced
}

export async function analyzeResumeContent(resumeData, fileName = 'resume') {
  const resumeText = extractResumeText(resumeData)
  const heuristicAnalysis = buildHeuristicAnalysis(resumeText)

  if (!USE_OPENAI_LLM) {
    persistLlmAnalysis(fileName, heuristicAnalysis)
    return heuristicAnalysis
  }

  try {
    const enhanced = await getOpenAiEnhancedAnalysis(resumeText, heuristicAnalysis)
    persistLlmAnalysis(fileName, enhanced)
    return enhanced
  } catch (error) {
    console.error('OpenAI analysis failed, using local fallback:', error.message)
    const fallback = {
      ...heuristicAnalysis,
      llmModel: `local-llm-v1 (openai fallback from ${OPENAI_MODEL})`,
      analysisMethod: 'heuristic-local-fallback'
    }
    fallback.voiceSummary = buildVoiceSummary(fallback)
    persistLlmAnalysis(fileName, fallback)
    return fallback
  }
}

export function serializeAnalysis(analysis) {
  return JSON.stringify({
    prediction: analysis.prediction,
    confidence: analysis.confidence,
    confidenceLevel: analysis.confidenceLevel,
    weaknesses: analysis.weaknesses,
    precautions: analysis.precautions,
    technologyRecommendations: analysis.technologyRecommendations,
    improvementPlan: analysis.improvementPlan,
    voiceSummary: analysis.voiceSummary,
    llmModel: analysis.llmModel,
    analysisMethod: analysis.analysisMethod
  })
}

export function parseStoredAnalysis(rawJson) {
  if (!rawJson) {
    return {}
  }

  try {
    const parsed = JSON.parse(rawJson)
    return typeof parsed === 'object' && parsed ? parsed : {}
  } catch {
    return {}
  }
}

export function getLlmRuntimeInfo() {
  return {
    provider: USE_OPENAI_LLM ? `openai (${OPENAI_MODEL})` : 'local-llm-v1',
    storePath: llmStorePath
  }
}
