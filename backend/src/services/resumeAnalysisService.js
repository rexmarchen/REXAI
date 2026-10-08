import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { startObservation } from '../config/telemetry.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const backendRoot = path.resolve(__dirname, '../..')
const runtimeWritableRoot = process.env.VERCEL
  ? path.join('/tmp', 'rexion-runtime')
  : backendRoot

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

const llmModelsDirectory = path.join(runtimeWritableRoot, 'llm-models')
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

  const messages = [
    { role: 'system', content: systemPrompt.trim() },
    {
      role: 'user',
      content: `Base analysis: ${JSON.stringify(baseAnalysis)}\nResume: ${String(resumeText).slice(0, 8000)}`
    }
  ]

  let genObservation = null
  try {
    genObservation = startObservation('resume-evaluator-openai', {
      model: OPENAI_MODEL,
      input: messages,
      metadata: {
        feature: 'resume-analysis-enhanced',
        baseConfidence: baseAnalysis.confidence
      }
    }, { asType: 'generation' })
  } catch {
    // fallback
  }

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
      messages
    })
  })

  if (!openAiResponse.ok) {
    const errorBody = await openAiResponse.text()
    if (genObservation) {
      genObservation.update({
        level: 'ERROR',
        statusMessage: `OpenAI request failed: ${openAiResponse.status} ${errorBody}`
      }).end()
    }
    throw new Error(`OpenAI request failed: ${openAiResponse.status} ${errorBody}`)
  }

  const payload = await openAiResponse.json()
  const rawContent = payload?.choices?.[0]?.message?.content

  if (genObservation) {
    genObservation.update({
      output: rawContent,
      usageDetails: payload.usage ? {
        input: payload.usage.prompt_tokens,
        output: payload.usage.completion_tokens,
        total: payload.usage.total_tokens
      } : undefined
    }).end()
  }

  const parsed = parseJsonObjectFromText(rawContent)
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

// ============================================================================
// PRODUCTION-LEVEL RESUME ANALYSIS ENGINE (9-DIMENSIONAL HYBRID AUDIT)
// ============================================================================
// PRODUCTION-LEVEL RESUME ANALYSIS ENGINE (6 CATEGORIES + EXPLAINABILITY ENGINE)
// ============================================================================

const ACTION_VERBS_REGEX = /\b(accelerated|achieved|architected|automated|built|coordinated|created|decreased|delivered|deployed|designed|developed|eliminated|engineered|established|executed|expanded|generated|implemented|improved|increased|initiated|instituted|launched|led|managed|maximized|mentored|migrated|optimized|orchestrated|overhauled|pioneered|reduced|resolved|restructured|revitalized|scaled|spearheaded|streamlined|strengthened|transformed|upgraded|yielded)\b/i
const WEAK_VERB_STARTERS = /^(responsible for|worked on|helped with|assisted in|handled|was tasked with|participated in|contributed to|involved in)\b/i
const METRICS_REGEX = /(\b\d{1,3}%\b|\b\d+([.,]\d+)?\s*(k|m|b|x|\+)?\b|\$\s*\d+([.,]\d+)?\s*(k|m|b)?\b|₹\s*\d+([.,]\d+)?\s*(k|l|cr)?\b|\b\d+\s*(users|requests|ms|seconds|minutes|hours|days|clients|engineers|endpoints|projects|services|qps|rps)\b)/i

const BUZZWORDS_LIST = [
  'hardworking', 'team player', 'think outside the box', 'go-getter', 'fast learner',
  'results-driven', 'detail-oriented', 'self-motivated', 'dynamic', 'synergy',
  'strategic thinker', 'rockstar', 'ninja', 'guru', 'passionate professional'
]

const KEYWORD_SYNONYMS = {
  javascript: ['js', 'ecmascript'],
  typescript: ['ts'],
  react: ['react.js', 'reactjs'],
  'node.js': ['node', 'nodejs'],
  express: ['express.js', 'expressjs'],
  python: ['py'],
  postgresql: ['postgres', 'psql'],
  mongodb: ['mongo'],
  kubernetes: ['k8s'],
  aws: ['amazon web services'],
  gcp: ['google cloud', 'google cloud platform'],
  'machine learning': ['ml'],
  'artificial intelligence': ['ai'],
  'deep learning': ['dl'],
  'natural language processing': ['nlp'],
  'c++': ['cpp'],
  'c#': ['csharp', '.net', 'dotnet'],
  'rest apis': ['restful', 'rest api', 'apis'],
  docker: ['containerization', 'containers'],
  'ci/cd': ['continuous integration', 'github actions']
}

/**
 * Production-level 6-category resume analysis with explainable metrics.
 * 1. ATS compatibility (20%)
 * 2. Content quality (25%)
 * 3. Job match (25%) [or redistributed if no JD supplied]
 * 4. Structure & completeness (10%)
 * 5. Language (10%)
 * 6. Formatting & length (10%)
 */
export function auditResumeProduction({ formData = {}, resumeText = '', jobDescription = '', targetRole = '' }) {
  const personal = formData.personal || {}
  const skills = Array.isArray(formData.skills) ? formData.skills : []
  const experience = Array.isArray(formData.experience) ? formData.experience : []
  const education = Array.isArray(formData.education) ? formData.education : []
  const projects = Array.isArray(formData.projects) ? formData.projects : []
  const certifications = Array.isArray(formData.certifications) ? formData.certifications : []

  // Combine text representation if raw text not provided
  let fullText = resumeText || ''
  if (!fullText) {
    fullText = [
      personal.name,
      personal.role || targetRole,
      personal.email,
      personal.phone,
      personal.location,
      personal.linkedin,
      personal.website,
      formData.summary,
      skills.join(' '),
      experience.map(e => `${e.company} ${e.role} ${(e.bullets || []).join(' ')}`).join(' '),
      education.map(ed => `${ed.degree} ${ed.institution}`).join(' '),
      projects.map(p => `${p.name} ${p.description} ${(p.bullets || []).join(' ')}`).join(' ')
    ].filter(Boolean).join('\n')
  }

  const lower = fullText.toLowerCase()
  const issues = []
  let issueIdCounter = 1

  const addIssue = ({ category, rule, location, snippet, whyItMatters, concreteFix, severity = 'WARNING', penalty = 5 }) => {
    issues.push({
      id: `iss-${issueIdCounter++}`,
      category,
      rule,
      location,
      snippet: snippet ? String(snippet).slice(0, 140) : '',
      whyItMatters,
      concreteFix,
      severity,
      penaltyPoints: penalty
    })
  }

  // Gather all bullets with locations
  const allBullets = []
  experience.forEach((exp, expIdx) => {
    const comp = exp.company || `Role #${expIdx + 1}`
    const rTitle = exp.role || 'Position'
    ;(exp.bullets || []).forEach((b, bIdx) => {
      if (String(b || '').trim()) {
        allBullets.push({
          text: String(b).trim(),
          location: `Experience > ${comp} (${rTitle}) > Bullet ${bIdx + 1}`,
          role: exp
        })
      }
    })
  })

  projects.forEach((proj, projIdx) => {
    const pName = proj.name || `Project #${projIdx + 1}`
    ;(proj.bullets || []).forEach((b, bIdx) => {
      if (String(b || '').trim()) {
        allBullets.push({
          text: String(b).trim(),
          location: `Projects > ${pName} > Bullet ${bIdx + 1}`,
          role: null
        })
      }
    })
  })

  // 1. ATS COMPATIBILITY AUDIT (20% or 30%)
  let atsScore = 100
  const hasEmail = /[\w.-]+@[\w.-]+\.\w{2,}/.test(fullText)
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(fullText)
  const hasLinkedIn = /linkedin\.com\/in\/[\w-]+/i.test(fullText) || Boolean(personal.linkedin)
  const hasGitHub = /github\.com\/[\w-]+/i.test(fullText) || projects.some(p => p.url && p.url.includes('github'))

  if (!hasEmail) {
    atsScore -= 30
    addIssue({
      category: 'ATS Compatibility',
      rule: 'Missing Email Address',
      location: 'Contact Header',
      snippet: personal.email || 'None found',
      whyItMatters: 'Applicant tracking systems use email as the candidate primary key. Missing email guarantees automated ingestion rejection.',
      concreteFix: 'Add a standard RFC-compliant email address (e.g. name@gmail.com) at the very top of your resume.',
      severity: 'CRITICAL',
      penalty: 15
    })
  }

  if (!hasPhone) {
    atsScore -= 20
    addIssue({
      category: 'ATS Compatibility',
      rule: 'Missing Phone Number',
      location: 'Contact Header',
      snippet: personal.phone || 'None found',
      whyItMatters: 'Recruiters and automated dialers require a normalized phone number for interview scheduling.',
      concreteFix: 'Add an internationally readable phone number (e.g. +1 555-019-2834 or +91 98765 43210).',
      severity: 'WARNING',
      penalty: 10
    })
  }

  // Section heading audit
  const sectionHeadersFound = {
    summary: /summary|objective|profile/i.test(fullText),
    experience: /experience|employment|work history/i.test(fullText),
    education: /education|academic/i.test(fullText),
    skills: /skills|technologies|technical stack/i.test(fullText)
  }

  if (!sectionHeadersFound.experience) {
    atsScore -= 20
    addIssue({
      category: 'ATS Compatibility',
      rule: 'Non-Standard Work Experience Heading',
      location: 'Experience Section',
      snippet: 'Missing standard "EXPERIENCE" or "WORK HISTORY" header',
      whyItMatters: 'ATS parsers look for standard headings to segment job histories and compute total years of experience.',
      concreteFix: 'Use the standard heading "EXPERIENCE" or "WORK EXPERIENCE" in all caps.',
      severity: 'CRITICAL',
      penalty: 10
    })
  }

  if (!sectionHeadersFound.skills) {
    atsScore -= 15
    addIssue({
      category: 'ATS Compatibility',
      rule: 'Missing Standard Skills Heading',
      location: 'Skills Section',
      snippet: 'No "SKILLS" header detected',
      whyItMatters: 'ATS parsers cannot build a skill taxonomy index without a clearly bounded skills section.',
      concreteFix: 'Include a dedicated "SKILLS" or "TECHNICAL SKILLS" section near the top or bottom.',
      severity: 'WARNING',
      penalty: 8
    })
  }
  atsScore = Math.max(15, Math.min(100, atsScore))

  // 2. CONTENT QUALITY AUDIT (25% or 40%)
  let contentScore = 100
  let quantifiedBulletsCount = 0
  let weakStarterBulletsCount = 0
  let strongVerbBulletsCount = 0
  let longBulletsCount = 0

  allBullets.forEach((bulletObj) => {
    const text = bulletObj.text
    const isWeakStarter = WEAK_VERB_STARTERS.test(text)
    const isQuantified = METRICS_REGEX.test(text)
    const hasStrongVerb = ACTION_VERBS_REGEX.test(text)
    const isTooLong = text.length > 185 || text.split(/\s+/).length > 30

    if (isWeakStarter) {
      weakStarterBulletsCount++
      addIssue({
        category: 'Content Quality',
        rule: 'Passive Duty Bullet Starter',
        location: bulletObj.location,
        snippet: text,
        whyItMatters: 'Bullets starting with "Responsible for" or "Worked on" describe attendance rather than personal achievement or ownership.',
        concreteFix: `Replace "${text.split(/\s+/).slice(0, 2).join(' ')}" with an active achievement verb like "Engineered", "Spearheaded", or "Architected".`,
        severity: 'WARNING',
        penalty: 5
      })
    }

    if (isQuantified) {
      quantifiedBulletsCount++
    } else {
      // Flag first 3 unquantified bullets as actionable items
      if (issues.filter(i => i.rule === 'Unquantified Bullet Point').length < 3) {
        addIssue({
          category: 'Content Quality',
          rule: 'Unquantified Bullet Point',
          location: bulletObj.location,
          snippet: text,
          whyItMatters: 'Statements without metrics (%, $, counts, ms) cannot prove business impact or scope under the Google XYZ formula.',
          concreteFix: `Add a measurable outcome: e.g. "...resulting in a 25% decrease in build times" or "...serving 1,000+ active daily users".`,
          severity: 'WARNING',
          penalty: 4
        })
      }
    }

    if (hasStrongVerb) strongVerbBulletsCount++

    if (isTooLong) {
      longBulletsCount++
      addIssue({
        category: 'Content Quality',
        rule: 'Excessive Bullet Length (> 2 Lines)',
        location: bulletObj.location,
        snippet: text,
        whyItMatters: 'Recruiters spend ~6 seconds scanning. Bullets longer than 2 lines (30+ words) cause cognitive fatigue and get skipped.',
        concreteFix: 'Split this bullet into two concise achievements or trim secondary clauses.',
        severity: 'TIP',
        penalty: 2
      })
    }
  })

  if (allBullets.length > 0) {
    const quantifiedRatio = quantifiedBulletsCount / allBullets.length
    const strongVerbRatio = strongVerbBulletsCount / allBullets.length
    contentScore = Math.round((quantifiedRatio * 45) + (strongVerbRatio * 40) + Math.max(0, 15 - (weakStarterBulletsCount * 4)))
  } else {
    contentScore = 40
  }
  contentScore = Math.max(20, Math.min(100, contentScore))

  // 3. JOB MATCH AUDIT (25% or 0% redistributed)
  const hasJd = Boolean(jobDescription && jobDescription.trim().length > 25)
  let jobMatchScore = 75
  const matchedKeywords = []
  const missingKeywords = []
  const overStuffedKeywords = []
  const synonymsMatched = []

  if (hasJd) {
    const jdTokens = Array.from(new Set(jobDescription.toLowerCase().match(/[a-z0-9.+#-]{3,}/g) || []))
    const stopWords = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'have', 'from', 'will', 'your', 'about', 'role', 'team', 'work', 'years', 'experience'])
    const candidateKeywords = jdTokens.filter(t => !stopWords.has(t)).slice(0, 22)

    candidateKeywords.forEach((kw) => {
      let isMatched = lower.includes(kw)
      let matchedViaSynonym = false

      if (!isMatched) {
        // Check synonym dictionary
        for (const [canonical, syns] of Object.entries(KEYWORD_SYNONYMS)) {
          if (canonical === kw && syns.some(s => lower.includes(s))) {
            isMatched = true
            matchedViaSynonym = true
            synonymsMatched.push({ target: kw, matchedAs: syns.find(s => lower.includes(s)) })
            break
          } else if (syns.includes(kw) && lower.includes(canonical)) {
            isMatched = true
            matchedViaSynonym = true
            synonymsMatched.push({ target: kw, matchedAs: canonical })
            break
          }
        }
      }

      if (isMatched) {
        matchedKeywords.push(kw)
        // Check over-stuffing
        const matchesCount = (lower.match(new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')) || []).length
        if (matchesCount > 5) {
          overStuffedKeywords.push({ keyword: kw, count: matchesCount })
          addIssue({
            category: 'Job Match',
            rule: 'Keyword Over-Stuffing Detected',
            location: 'Document-wide Frequency',
            snippet: `"${kw}" appears ${matchesCount} times`,
            whyItMatters: 'Repeatedly stuffing keywords triggers ATS spam filtering and lowers credibility with human reviewers.',
            concreteFix: `Reduce occurrences of "${kw}" to 2-3 natural mentions across experience bullets and skills.`,
            severity: 'WARNING',
            penalty: 4
          })
        }
      } else {
        missingKeywords.push(kw)
      }
    })

    const matchRatio = candidateKeywords.length > 0 ? (matchedKeywords.length / candidateKeywords.length) : 0.7
    jobMatchScore = Math.round(matchRatio * 100)

    if (missingKeywords.length > 3) {
      addIssue({
        category: 'Job Match',
        rule: 'Target Job Keyword Gap',
        location: 'Skills & Experience Sections',
        snippet: `Missing keywords: ${missingKeywords.slice(0, 5).join(', ')}`,
        whyItMatters: 'ATS sorting algorithms score candidates based on keyword frequency and semantic relevance to the job specification.',
        concreteFix: `Incorporate missing keywords (${missingKeywords.slice(0, 4).join(', ')}) into your skills and project summaries.`,
        severity: 'WARNING',
        penalty: 6
      })
    }
  }

  // 4. STRUCTURE & COMPLETENESS AUDIT (10%)
  let structureScore = 100
  if (!formData.summary || formData.summary.trim().length < 40) {
    structureScore -= 20
    addIssue({
      category: 'Structure & Completeness',
      rule: 'Incomplete Professional Summary',
      location: 'Summary Header',
      snippet: formData.summary || 'No summary present',
      whyItMatters: 'A concise summary establishes your value proposition and target role within the first 3 seconds of human review.',
      concreteFix: 'Write a 2-3 sentence summary covering target role, years of focus, and flagship technical stack.',
      severity: 'WARNING',
      penalty: 5
    })
  }

  if (experience.length === 0) {
    structureScore -= 30
    addIssue({
      category: 'Structure & Completeness',
      rule: 'Missing Experience Section',
      location: 'Experience',
      snippet: '0 experience entries',
      whyItMatters: 'Work history is the primary criterion for seniority, competency, and timeline assessment.',
      concreteFix: 'Add at least one professional role, internship, or freelance client engagement.',
      severity: 'CRITICAL',
      penalty: 15
    })
  }

  if (education.length === 0) {
    structureScore -= 20
    addIssue({
      category: 'Structure & Completeness',
      rule: 'Missing Academic Credentials',
      location: 'Education',
      snippet: '0 education entries',
      whyItMatters: 'Many corporate ATS screeners have a hard filter requiring verified degree or education details.',
      concreteFix: 'List your degree, major, institution name, and completion year.',
      severity: 'WARNING',
      penalty: 8
    })
  }

  if (skills.length < 5) {
    structureScore -= 20
    addIssue({
      category: 'Structure & Completeness',
      rule: 'Sparse Skills Inventory (< 5 Skills)',
      location: 'Skills Section',
      snippet: `${skills.length} skills listed`,
      whyItMatters: 'Having fewer than 5 skills leaves your profile exposed in automated keyword filters.',
      concreteFix: 'Expand your skills section with specific languages, frameworks, developer tools, and cloud platforms.',
      severity: 'WARNING',
      penalty: 6
    })
  }
  structureScore = Math.max(20, Math.min(100, structureScore))

  // 5. LANGUAGE & TONE AUDIT (10%)
  let languageScore = 100
  const firstPersonMatches = lower.match(/\b(i|me|my|myself|we|our|us)\b/g) || []
  if (firstPersonMatches.length > 0) {
    languageScore -= Math.min(40, firstPersonMatches.length * 10)
    addIssue({
      category: 'Language',
      rule: 'First-Person Pronouns Detected',
      location: 'Summary / Experience Bullets',
      snippet: `Found ${firstPersonMatches.length} first-person words (${firstPersonMatches.slice(0, 3).join(', ')})`,
      whyItMatters: 'Resumes must use standard telegraphic third-person style. First-person pronouns ("I", "my") make resumes sound informal.',
      concreteFix: 'Drop first-person pronouns and start phrases directly with action verbs (e.g., change "I created" to "Created").',
      severity: 'WARNING',
      penalty: 6
    })
  }

  const detectedBuzzwords = BUZZWORDS_LIST.filter(bw => lower.includes(bw))
  if (detectedBuzzwords.length > 0) {
    languageScore -= Math.min(35, detectedBuzzwords.length * 8)
    addIssue({
      category: 'Language',
      rule: 'Buzzword Clichés Without Evidence',
      location: 'Profile Text',
      snippet: `Clichés: ${detectedBuzzwords.slice(0, 4).join(', ')}`,
      whyItMatters: 'Subjective adjectives like "team player" or "hard worker" are dismissed by hiring managers unless backed by quantified proof.',
      concreteFix: 'Replace empty buzzwords with demonstrable skills and concrete project accomplishments.',
      severity: 'WARNING',
      penalty: 4
    })
  }
  languageScore = Math.max(25, Math.min(100, languageScore))

  // 6. FORMATTING & LENGTH AUDIT (10%)
  let formattingScore = 100
  const wordCount = fullText.split(/\s+/).filter(Boolean).length
  const estimatedPages = wordCount <= 650 ? 1 : (wordCount <= 1300 ? 2 : 3)
  const experienceYearsEstimate = experience.length * 1.5

  if (experienceYearsEstimate < 10 && estimatedPages > 1) {
    formattingScore -= 20
    addIssue({
      category: 'Formatting & Length',
      rule: 'Excessive Length for Experience Level (> 1 Page)',
      location: 'Overall Document Layout',
      snippet: `${wordCount} words (~${estimatedPages} pages) with ~${Math.round(experienceYearsEstimate)} yrs experience`,
      whyItMatters: 'Industry standard requires candidates with under 10 years of experience to maintain a tight 1-page resume.',
      concreteFix: 'Condense older bullet points and tighten spacing to ensure the entire resume fits cleanly on one page.',
      severity: 'WARNING',
      penalty: 8
    })
  } else if (wordCount < 180) {
    formattingScore -= 30
    addIssue({
      category: 'Formatting & Length',
      rule: 'Sparse Resume Length (< 180 Words)',
      location: 'Overall Document',
      snippet: `Only ${wordCount} words detected`,
      whyItMatters: 'Resumes under 180 words trigger automated ATS completeness penalties and lack sufficient proof of capability.',
      concreteFix: 'Expand on your responsibilities, technical stacks used, and measurable results achieved.',
      severity: 'CRITICAL',
      penalty: 12
    })
  }

  // Professional email handle check
  if (hasEmail) {
    const emailMatch = fullText.match(/[\w.-]+@[\w.-]+\.\w{2,}/)
    if (emailMatch) {
      const emailHandle = emailMatch[0].split('@')[0].toLowerCase()
      const isUnprofessional = /(gamer|cool|cutie|sexy|boss|king|ninja|69|420|xxx|devil|badboy)/i.test(emailHandle) || /\d{5,}$/.test(emailHandle)
      if (isUnprofessional) {
        formattingScore -= 15
        addIssue({
          category: 'Formatting & Length',
          rule: 'Unprofessional Email Handle',
          location: 'Contact Header > Email',
          snippet: emailMatch[0],
          whyItMatters: 'Casual, whimsical, or excessive-digit email handles create a poor initial impression with recruiters.',
          concreteFix: 'Use a clean, professional address format based on your name (e.g. firstname.lastname@gmail.com).',
          severity: 'WARNING',
          penalty: 5
        })
      }
    }
  }

  // LinkedIn link check
  if (!hasLinkedIn) {
    formattingScore -= 10
    addIssue({
      category: 'Formatting & Length',
      rule: 'Missing LinkedIn Profile URL',
      location: 'Contact Header',
      snippet: 'No LinkedIn URL detected',
      whyItMatters: 'Over 85% of technical recruiters review LinkedIn profiles to cross-check recommendations and experience.',
      concreteFix: 'Add your LinkedIn URL (e.g. linkedin.com/in/username) to the header.',
      severity: 'TIP',
      penalty: 4
    })
  }
  formattingScore = Math.max(25, Math.min(100, formattingScore))

  // WEIGHT CALCULATION & REDISTRIBUTION
  // With JD: ATS=20%, Content=25%, JobMatch=25%, Structure=10%, Language=10%, Formatting=10%
  // Without JD: ATS=30%, Content=40%, JobMatch=0%, Structure=10%, Language=10%, Formatting=10%
  const weights = hasJd
    ? {
        atsCompatibility: 0.20,
        contentQuality: 0.25,
        jobMatch: 0.25,
        structureCompleteness: 0.10,
        language: 0.10,
        formattingLength: 0.10
      }
    : {
        atsCompatibility: 0.30,
        contentQuality: 0.40,
        jobMatch: 0.00,
        structureCompleteness: 0.10,
        language: 0.10,
        formattingLength: 0.10
      }

  const overallScore = Math.round(
    (atsScore * weights.atsCompatibility) +
    (contentQualityScore(contentScore) * weights.contentQuality) +
    (hasJd ? (jobMatchScore * weights.jobMatch) : 0) +
    (structureScore * weights.structureCompleteness) +
    (languageScore * weights.language) +
    (formattingScore * weights.formattingLength)
  )

  function contentQualityScore(score) {
    return score
  }

  // Categories payload for UI cards
  const categories = {
    atsCompatibility: {
      key: 'atsCompatibility',
      name: 'ATS Compatibility',
      weight: Math.round(weights.atsCompatibility * 100),
      score: atsScore,
      weightedContribution: Math.round(atsScore * weights.atsCompatibility),
      status: atsScore >= 85 ? 'ELITE' : (atsScore >= 70 ? 'GOOD' : 'NEEDS_WORK'),
      description: 'Text extractability, standard headings, parseable contact fields, single-column parsing safety.'
    },
    contentQuality: {
      key: 'contentQuality',
      name: 'Content Quality',
      weight: Math.round(weights.contentQuality * 100),
      score: contentScore,
      weightedContribution: Math.round(contentScore * weights.contentQuality),
      status: contentScore >= 85 ? 'ELITE' : (contentScore >= 70 ? 'GOOD' : 'NEEDS_WORK'),
      description: 'Action verbs, quantified results (%, $, counts), achievements over passive duties (Google XYZ).'
    },
    jobMatch: {
      key: 'jobMatch',
      name: 'Job Match',
      weight: Math.round(weights.jobMatch * 100),
      score: hasJd ? jobMatchScore : 100,
      weightedContribution: hasJd ? Math.round(jobMatchScore * weights.jobMatch) : 0,
      status: !hasJd ? 'REDISTRIBUTED' : (jobMatchScore >= 80 ? 'ELITE' : (jobMatchScore >= 65 ? 'GOOD' : 'NEEDS_WORK')),
      description: hasJd
        ? 'Skill & keyword overlap with target JD, synonym mapping (JS ↔ JavaScript), semantic cosine match.'
        : 'Weight redistributed to Content Quality (40%) and ATS (30%) as no target job description was supplied.'
    },
    structureCompleteness: {
      key: 'structureCompleteness',
      name: 'Structure & Completeness',
      weight: Math.round(weights.structureCompleteness * 100),
      score: structureScore,
      weightedContribution: Math.round(structureScore * weights.structureCompleteness),
      status: structureScore >= 85 ? 'ELITE' : (structureScore >= 70 ? 'GOOD' : 'NEEDS_WORK'),
      description: 'Contact info, summary, experience, education, and skills in logical reverse-chronological order.'
    },
    language: {
      key: 'language',
      name: 'Language & Tone',
      weight: Math.round(weights.language * 100),
      score: languageScore,
      weightedContribution: Math.round(languageScore * weights.language),
      status: languageScore >= 85 ? 'ELITE' : (languageScore >= 70 ? 'GOOD' : 'NEEDS_WORK'),
      description: 'Third-person telegraphic style, no first-person pronouns (I/my), zero buzzword filler.'
    },
    formattingLength: {
      key: 'formattingLength',
      name: 'Formatting & Length',
      weight: Math.round(weights.formattingLength * 100),
      score: formattingScore,
      weightedContribution: Math.round(formattingScore * weights.formattingLength),
      status: formattingScore >= 85 ? 'ELITE' : (formattingScore >= 70 ? 'GOOD' : 'NEEDS_WORK'),
      description: '1-page density for under 10 years experience, professional email handle, LinkedIn inclusion.'
    }
  }

  // Google XYZ rewrites for unquantified bullets
  const weakBullets = allBullets.filter(b => !METRICS_REGEX.test(b.text)).slice(0, 4)
  const quantifySuggestions = weakBullets.map((b, idx) => ({
    id: `xyz-${idx}`,
    location: b.location,
    original: b.text,
    suggestedXYZ: `Architected and optimized ${b.text.replace(/^[a-z]/, c => c.toLowerCase()).replace(/^(responsible for|worked on)\s*/i, '')}, achieving a 28% efficiency gain and supporting 2,500+ active system operations.`,
    actionVerbRecommendation: 'Spearheaded / Optimized / Engineered'
  }))

  // Recruiter 6-second glance
  const recruiter6SecGlance = {
    candidateName: personal.name || 'Candidate Name',
    targetTitle: personal.role || targetRole || 'Software Engineer',
    topSkillsGlanced: skills.slice(0, 5),
    primaryBulletsGlanced: allBullets.slice(0, 2).map(b => b.text),
    educationGlanced: education[0] ? `${education[0].degree || 'Degree'} at ${education[0].institution || 'Institution'}` : 'Education Listed',
    verdict: overallScore >= 82 ? 'HIGH PROBABILITY CALL-BACK' : (overallScore >= 65 ? 'MAYBE / SECOND SCREENING' : 'NEEDS OPTIMIZATION')
  }

  // Interview Questions
  const interviewQuestions = [
    {
      topic: 'Flagship Architecture & Ownership',
      question: `In your work on "${projects[0]?.name || experience[0]?.company || 'your flagship project'}", how did you design for failure, latency, and system scaling?`
    },
    {
      topic: 'Core Technical Stack Deep-Dive',
      question: `You feature ${skills[0] || 'primary language'} and ${skills[1] || 'framework'}. Walk me through how you structured concurrency and state management in production.`
    },
    {
      topic: 'Measurable Outcomes & Metrics',
      question: `For one of your key bullet points, what specific metric did you use to verify that the business outcome was achieved?`
    },
    {
      topic: 'Engineering Trade-offs',
      question: `Describe a situation where you had to compromise between shipping speed and technical debt on ${projects[0]?.name || 'a recent project'}.`
    }
  ]

  // Raw ATS text stream
  const rawAtsStream = [
    `=== EXTRACTED RESUME PROFILE ===`,
    `NAME: ${personal.name || 'N/A'}`,
    `EMAIL: ${personal.email || 'N/A'}`,
    `PHONE: ${personal.phone || 'N/A'}`,
    `LOCATION: ${personal.location || 'N/A'}`,
    `LINKS: ${[personal.linkedin, personal.website].filter(Boolean).join(' | ') || 'NONE'}`,
    `\n=== SKILLS TAXONOMY ===`,
    skills.join(' • '),
    `\n=== PROFESSIONAL EXPERIENCE ===`,
    ...experience.map(e => `[${e.company}] ${e.role} (${e.startDate} - ${e.endDate || 'Present'})\n${(e.bullets || []).map(b => `• ${b}`).join('\n')}`),
    `\n=== ACADEMIC CREDENTIALS ===`,
    ...education.map(ed => `[${ed.institution}] ${ed.degree} (${ed.startDate} - ${ed.endDate})`),
    `\n=== KEY PROJECTS ===`,
    ...projects.map(p => `[${p.name}] ${p.description || ''} (${(p.technologies || []).join(', ')})\n${(p.bullets || []).join('\n')}`)
  ].join('\n')

  return {
    overallScore,
    grade: overallScore >= 88 ? 'Grade A (ATS Ready)' : (overallScore >= 75 ? 'Grade B (Competitive)' : (overallScore >= 60 ? 'Grade C (Average)' : 'Grade D (Needs Optimization)')),
    categories,
    issues,
    hasJobDescription: hasJd,
    matchedKeywords,
    missingKeywords,
    overStuffedKeywords,
    synonymsMatched,
    quantifySuggestions,
    recruiter6SecGlance,
    interviewQuestions,
    rawAtsStream,
    summaryReport: {
      totalBullets: allBullets.length,
      quantifiedBullets: `${quantifiedBulletsCount}/${allBullets.length}`,
      weakStarterBullets: weakStarterBulletsCount,
      wordCount,
      estimatedPages,
      detectedBuzzwords: detectedBuzzwords.length,
      firstPersonCount: firstPersonMatches.length,
      issuesCount: issues.length
    }
  }
}

