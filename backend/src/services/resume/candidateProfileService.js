import CandidateProfile from '../../models/CandidateProfile.js'
import { CAREER_DOMAINS } from '../../config/constants.js'
import { ingestResume } from './resumeIngestionService.js'
import logger from '../../utils/logger.js'

/**
 * Keywords mapped to domain classification
 */
const DOMAIN_KEYWORDS = {
  [CAREER_DOMAINS.AI_ML]: [
    'machine learning', 'deep learning', 'pytorch', 'tensorflow', 'nlp', 'computer vision',
    'llm', 'transformers', 'scikit-learn', 'data science', 'generative ai', 'reinforcement learning',
    'rag', 'langchain', 'huggingface'
  ],
  [CAREER_DOMAINS.CYBERSECURITY]: [
    'cybersecurity', 'infosec', 'penetration testing', 'soc', 'siem', 'vulnerability',
    'owasp', 'cryptography', 'incident response', 'ethical hacking', 'firewall', 'cissp', 'ceh'
  ],
  [CAREER_DOMAINS.FULLSTACK]: [
    'full stack', 'fullstack', 'mern', 'mean', 'react', 'node', 'express', 'next.js', 'vue', 'django'
  ],
  [CAREER_DOMAINS.BACKEND]: [
    'backend', 'node.js', 'express', 'django', 'fastapi', 'spring boot', 'go', 'golang',
    'microservices', 'postgresql', 'mongodb', 'redis', 'kafka', 'grpc', 'rest api', 'sql'
  ],
  [CAREER_DOMAINS.FRONTEND]: [
    'frontend', 'front-end', 'react', 'vue', 'angular', 'svelte', 'typescript', 'javascript',
    'tailwind', 'css3', 'html5', 'redux', 'next.js', 'ui/ux', 'web accessibility'
  ],
  [CAREER_DOMAINS.DEVOPS_CLOUD]: [
    'devops', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'k8s', 'terraform', 'ci/cd',
    'jenkins', 'github actions', 'ansible', 'helm', 'cloud infrastructure', 'observability'
  ],
  [CAREER_DOMAINS.DATA_ENGINEERING]: [
    'data engineering', 'spark', 'hadoop', 'airflow', 'dbt', 'snowflake', 'databricks',
    'bigquery', 'etl', 'data pipeline', 'kafka', 'flink'
  ],
  [CAREER_DOMAINS.MOBILE]: [
    'react native', 'flutter', 'ios', 'android', 'swift', 'kotlin', 'mobile app', 'xcode'
  ],
  [CAREER_DOMAINS.BLOCKCHAIN]: [
    'solidity', 'smart contracts', 'ethereum', 'web3', 'rust', 'hyperledger', 'defi', 'blockchain'
  ],
  [CAREER_DOMAINS.EMBEDDED_SYSTEMS]: [
    'embedded', 'firmware', 'c', 'c++', 'rtos', 'microcontroller', 'iot', 'arm', 'verilog', 'fpga'
  ]
}

/**
 * Classify domains with confidence scores based on text & skills
 */
export function classifyCareerDomains(text, skills = []) {
  const normalizedText = `${text} ${skills.join(' ')}`.toLowerCase()
  const domainScores = []

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    let matchCount = 0
    for (const kw of keywords) {
      if (normalizedText.includes(kw.toLowerCase())) {
        matchCount++
      }
    }

    if (matchCount > 0) {
      const confidence = Math.min(1.0, (matchCount / Math.min(keywords.length, 5)) * 0.9 + 0.1)
      domainScores.push({
        domain,
        confidence: Number(confidence.toFixed(2)),
        matchedKeywordsCount: matchCount
      })
    }
  }

  domainScores.sort((a, b) => b.confidence - a.confidence)

  const primaryDomain = domainScores[0]?.domain || CAREER_DOMAINS.FULLSTACK
  const secondaryDomains = domainScores.slice(1, 4).map((d) => d.domain)

  return {
    primaryDomain,
    secondaryDomains,
    domainScores
  }
}

/**
 * Extract contact information and location from resume text with robust international support
 */
export function extractContactInfo(rawText, extracted = {}) {
  const text = String(rawText || '')
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)

  // Robust international phone regex: matches +91 9876543210, +91-98765-43210, etc.
  const phoneMatch = text.match(/(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{2,5}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}/)
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i)
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i)
  const portfolioMatch = text.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:dev|me|io|com|app|ai))(?:\/[^\s]*)?/i)

  // Extract location from city/state patterns
  let location = ''
  const locationMatch = text.match(/\b([A-Z][a-zA-Z\s]+),\s*(Himachal Pradesh|Karnataka|Punjab|Delhi|Maharashtra|Tamil Nadu|Telangana|Uttar Pradesh|Haryana|West Bengal|Gujarat|California|New York|Texas|Washington|India|USA|United States)\b/i)
  if (locationMatch) {
    location = `${locationMatch[1].trim()}, ${locationMatch[2].trim()}, India`
  } else {
    const cityMatch = text.match(/\b(Bangalore|Bengaluru|Mohali|Palampur|Delhi|New Delhi|Noida|Gurgaon|Gurugram|Mumbai|Hyderabad|Pune|Chennai|Kolkata)\b/i)
    if (cityMatch) {
      location = `${cityMatch[1].trim()}, India`
    }
  }

  const isInvalidName = (n) => !n || n.length < 2 || /\b(experience|education|skills|contact|profile|project|intern|engineer|developer|management|system)\b/i.test(n)

  // Extract name from first few non-empty lines if extracted.name is missing or invalid
  let candidateName = (!isInvalidName(extracted.name) ? extracted.name : '')
  if (!candidateName) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2 && l.length < 40)
    for (const l of lines.slice(0, 8)) {
      if (!/@|http|\.com|\.io|\.pdf|\d/.test(l) && /^[a-zA-Z\s.-]+$/.test(l) && !isInvalidName(l)) {
        candidateName = l
        break
      }
    }
  }

  return {
    fullName: candidateName || 'Candidate',
    email: emailMatch ? emailMatch[0] : '',
    phone: phoneMatch ? phoneMatch[0].trim() : '',
    location: location || 'India',
    linkedinUrl: linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : '',
    githubUrl: githubMatch ? (githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`) : '',
    portfolioUrl: portfolioMatch ? (portfolioMatch[0].startsWith('http') ? portfolioMatch[0] : `https://${portfolioMatch[0]}`) : ''
  }
}

/**
 * Build & persist candidate profile from ingested resume
 */
export async function createOrUpdateCandidateProfile({
  userId,
  filePath,
  buffer,
  mimetype,
  customPreferences = {}
}) {
  const ingestionResult = await ingestResume({ filePath, buffer, mimetype, userId })
  const { rawText, chunks, extracted, fileHash } = ingestionResult

  const contactInfo = extractContactInfo(rawText, extracted)
  const domainClassification = classifyCareerDomains(rawText, extracted.skills)

  const fullName = contactInfo.fullName || customPreferences.fullName || 'Candidate'
  const email = contactInfo.email || customPreferences.email || 'candidate@rexion.ai'
  const phone = contactInfo.phone || customPreferences.phone || '+91 8544780822'
  const location = contactInfo.location || customPreferences.location || 'India'

  const profileData = {
    userId,
    fullName,
    email,
    phone,
    location,
    linkedinUrl: contactInfo.linkedinUrl || '',
    githubUrl: contactInfo.githubUrl || '',
    portfolioUrl: contactInfo.portfolioUrl || '',
    resumeRawText: rawText,
    resumeFileHash: fileHash,
    resumeChunks: chunks,
    contactInfo: {
      fullName,
      email,
      phone,
      location,
      linkedinUrl: contactInfo.linkedinUrl || '',
      githubUrl: contactInfo.githubUrl || '',
      portfolioUrl: contactInfo.portfolioUrl || ''
    },
    primaryDomain: domainClassification.primaryDomain,
    secondaryDomains: domainClassification.secondaryDomains,
    skills: extracted.skills || [],
    experienceYears: extracted.experience_years || 0,
    education: extracted.education ? [{ degree: typeof extracted.education === 'string' ? extracted.education : extracted.education?.degree || '' }] : [],
    certifications: Array.isArray(extracted.certifications)
      ? extracted.certifications.map(c => typeof c === 'string' ? { name: c } : c)
      : [],
    workAuthorization: 'Authorized',
    requireSponsorship: false,
    applicationPreferences: {
      targetRoles: [extracted.predicted_role].filter(Boolean),
      minSalary: customPreferences.minSalary || 0,
      jobTypes: customPreferences.jobTypes || ['Full-time', 'Contract'],
      autoSubmitSafe: customPreferences.autoSubmitSafe !== undefined ? customPreferences.autoSubmitSafe : true
    },
    lastIngestedAt: new Date()
  }

  const updatedProfile = await CandidateProfile.findOneAndUpdate(
    { userId },
    { $set: profileData },
    { upsert: true, new: true }
  )

  logger.info(`Candidate profile updated for userId ${userId}: ${fullName} (${email}), primary domain: ${profileData.primaryDomain}`)
  return updatedProfile
}
