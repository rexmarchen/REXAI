import { buildResumeText, normalizeFormData } from './resumeBuilder'

const STOP_WORDS = new Set([
  'about',
  'after',
  'again',
  'also',
  'and',
  'are',
  'been',
  'being',
  'build',
  'from',
  'have',
  'into',
  'just',
  'more',
  'need',
  'role',
  'such',
  'that',
  'their',
  'them',
  'they',
  'this',
  'with',
  'your',
])

const ROLE_SKILL_MAP = {
  'software engineer': ['JavaScript', 'TypeScript', 'React', 'Node.js', 'REST APIs', 'Git'],
  'frontend developer': ['React', 'JavaScript', 'CSS', 'TypeScript', 'Accessibility', 'Vite'],
  'backend developer': ['Node.js', 'Python', 'SQL', 'REST APIs', 'Docker', 'Testing'],
  'full stack developer': ['React', 'Node.js', 'TypeScript', 'SQL', 'Docker', 'AWS'],
  'data scientist': ['Python', 'SQL', 'Machine Learning', 'Pandas', 'TensorFlow', 'Tableau'],
  'product manager': ['Roadmapping', 'Analytics', 'Stakeholder Management', 'Experimentation', 'SQL'],
  designer: ['Figma', 'Design Systems', 'User Research', 'Prototyping', 'Accessibility'],
  default: ['Communication', 'Problem Solving', 'Collaboration', 'Execution'],
}

const CORE_KEYWORDS = [
  'react',
  'node.js',
  'node',
  'javascript',
  'typescript',
  'python',
  'sql',
  'aws',
  'docker',
  'kubernetes',
  'figma',
  'analytics',
  'machine learning',
  'product strategy',
  'testing',
  'accessibility',
  'leadership',
  'communication',
  'design systems',
  'rest apis',
]

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const normalizeText = (value) => String(value || '').trim()

const normalizeRole = (role) => normalizeText(role).toLowerCase()

const sanitizeBullet = (bullet) =>
  normalizeText(bullet)
    .replace(/^[-*]\s*/, '')
    .replace(/\s+/g, ' ')

const toTitleCase = (value) =>
  normalizeText(value)
    .split(/\s+/)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(' ')

const tokenizeText = (value) =>
  normalizeText(value)
    .toLowerCase()
    .match(/[a-z0-9.+#-]{3,}/g) || []

const unique = (items) => Array.from(new Set(items.filter(Boolean)))

const getRoleSkillSuggestions = (role) => {
  const normalizedRole = normalizeRole(role)
  const matchedRole = Object.keys(ROLE_SKILL_MAP).find(
    (key) => key !== 'default' && normalizedRole.includes(key)
  )

  return ROLE_SKILL_MAP[matchedRole || 'default']
}

const extractKeywords = (jobDescription = '') => {
  const lower = normalizeText(jobDescription).toLowerCase()
  const canonicalMatches = CORE_KEYWORDS.filter((keyword) => lower.includes(keyword))
  const tokenMatches = tokenizeText(jobDescription).filter(
    (token) => !STOP_WORDS.has(token) && token.length > 3
  )

  return unique([...canonicalMatches, ...tokenMatches]).slice(0, 18)
}

const calculateCompleteness = (formData) => {
  const weights = {
    personal: 22,
    summary: 14,
    skills: 14,
    experience: 20,
    education: 14,
    projects: 8,
    certifications: 8,
  }

  let score = 0

  const personal = formData.personal
  const personalCompleted = ['name', 'email', 'phone', 'role', 'location'].filter((field) =>
    normalizeText(personal[field])
  ).length
  score += weights.personal * (personalCompleted / 5)

  if (formData.summary.trim().length >= 40) {
    score += weights.summary
  }

  if (formData.skills.length >= 3) {
    score += weights.skills
  }

  if (formData.experience.length > 0) {
    const validEntries = formData.experience.filter(
      (entry) =>
        normalizeText(entry.role) &&
        normalizeText(entry.company) &&
        (entry.bullets || []).some((bullet) => sanitizeBullet(bullet))
    ).length

    score += weights.experience * (validEntries / formData.experience.length)
  }

  if (formData.education.length > 0) {
    const validEntries = formData.education.filter(
      (entry) => normalizeText(entry.institution) && normalizeText(entry.degree)
    ).length
    score += weights.education * (validEntries / formData.education.length)
  }

  if (formData.projects.length > 0) {
    const validEntries = formData.projects.filter(
      (entry) => normalizeText(entry.name) && normalizeText(entry.description)
    ).length
    score += weights.projects * (validEntries / formData.projects.length)
  }

  if (formData.certifications.length > 0) {
    const validEntries = formData.certifications.filter((entry) => normalizeText(entry.name)).length
    score += weights.certifications * (validEntries / formData.certifications.length)
  }

  return Math.round(Math.max(0, Math.min(100, score)))
}

const detectFormattingIssues = (formData) => {
  const issues = []

  if (!normalizeText(formData.personal.email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personal.email)) {
    issues.push('Add a valid email address in the header.')
  }

  if (formData.summary.trim().length > 400) {
    issues.push('Keep the summary tighter so recruiters can scan it quickly.')
  }

  const bullets = formData.experience.flatMap((entry) => entry.bullets || [])
  const bulletsWithoutMetrics = bullets.filter(
    (bullet) => sanitizeBullet(bullet) && !/\d/.test(bullet)
  )

  if (bulletsWithoutMetrics.length >= 2) {
    issues.push('Add measurable outcomes to more experience bullets.')
  }

  if (bullets.some((bullet) => sanitizeBullet(bullet).length > 170)) {
    issues.push('Trim long bullets into sharper, one-line achievements.')
  }

  if (formData.skills.length > 16) {
    issues.push('Reduce the skills section to the most relevant skills for this role.')
  }

  if (formData.experience.some((entry) => !normalizeText(entry.startDate))) {
    issues.push('Make sure each experience entry has clear dates.')
  }

  return issues
}

const buildStrengths = (formData, matchedKeywords, completeness) => {
  const strengths = []

  if (formData.skills.length >= 6) {
    strengths.push('Strong skill coverage for recruiter keyword scans.')
  }

  if (formData.experience.length >= 2) {
    strengths.push('Multiple experience entries add credibility and career depth.')
  }

  if (matchedKeywords.length >= 5) {
    strengths.push('Good alignment between resume language and the job description.')
  }

  if (completeness >= 80) {
    strengths.push('Most core sections are filled and ready for submission.')
  }

  return strengths
}

const buildSuggestions = (formData, missingKeywords, formattingIssues, completeness) => {
  const suggestions = []

  if (missingKeywords.length > 0) {
    suggestions.push(`Work in missing keywords like ${missingKeywords.slice(0, 4).join(', ')}.`)
  }

  if (formData.summary.trim().length < 40) {
    suggestions.push('Write a stronger summary that reflects role, experience, and specialization.')
  }

  if (formData.skills.length < 6) {
    suggestions.push('Add more role-specific skills to improve ATS coverage.')
  }

  if (formData.experience.length === 0 && formData.projects.length === 0) {
    suggestions.push('Add either work experience or project work to strengthen credibility.')
  }

  formattingIssues.slice(0, 2).forEach((issue) => suggestions.push(issue))

  if (completeness < 70) {
    suggestions.push('Complete more sections before exporting or applying.')
  }

  return unique(suggestions).slice(0, 6)
}

const withMockRequest = async (operation, payload, resolver) => {
  if (payload?.signal?.aborted) {
    throw new DOMException('Request aborted', 'AbortError')
  }

  await wait(250)

  if (payload?.signal?.aborted) {
    throw new DOMException('Request aborted', 'AbortError')
  }

  return resolver()
}

export const generateSummary = async ({
  personal = {},
  skills = [],
  experience = [],
  jobDescription = '',
  signal,
} = {}) =>
  withMockRequest('generateSummary', { signal }, () => {
    const role = personal.role || 'professional'
    const years = Number(personal.years) > 0 ? Number(personal.years) : null
    const topSkills = unique(skills).slice(0, 3)
    const experienceHighlights = experience
      .flatMap((entry) => entry.bullets || [])
      .map((bullet) => sanitizeBullet(bullet))
      .filter(Boolean)
      .slice(0, 2)

    const rolePhrase = toTitleCase(role)
    const yearsPhrase = years ? `${years}+ years of experience` : 'proven experience'
    const skillsPhrase =
      topSkills.length > 0 ? `with strengths in ${topSkills.join(', ')}` : 'with a strong delivery mindset'
    const focusKeywords = extractKeywords(jobDescription).slice(0, 3)
    const alignmentPhrase =
      focusKeywords.length > 0
        ? `aligned to priorities like ${focusKeywords.join(', ')}`
        : 'focused on measurable outcomes, cross-functional execution, and quality delivery'

    const highlightPhrase =
      experienceHighlights.length > 0
        ? `Recent highlights include ${experienceHighlights.join(' and ')}.`
        : 'Known for translating goals into polished, high-impact execution.'

    return `${rolePhrase} with ${yearsPhrase}, ${skillsPhrase}, and a track record of delivering business-ready work. ${alignmentPhrase}. ${highlightPhrase}`
  })

export const improveBulletPoints = async ({
  bullets = [],
  role = '',
  jobDescription = '',
  signal,
} = {}) =>
  withMockRequest('improveBulletPoints', { signal }, () => {
    const keywords = extractKeywords(jobDescription)
    const roleSkills = getRoleSkillSuggestions(role)
    const fallbackKeyword = keywords[0] || roleSkills[0] || 'delivery quality'

    return (Array.isArray(bullets) ? bullets : []).map((bullet) => {
      const cleanedBullet = sanitizeBullet(bullet)

      if (!cleanedBullet) {
        return `Improved ${fallbackKeyword.toLowerCase()} by streamlining execution, communication, and measurable follow-through.`
      }

      const base = cleanedBullet.charAt(0).toLowerCase() + cleanedBullet.slice(1)
      const metricPhrase = /\d/.test(cleanedBullet)
        ? 'with clear business impact'
        : 'to deliver measurable results'

      return `Delivered ${base} ${metricPhrase} while strengthening ${fallbackKeyword.toLowerCase()}.`
    })
  })

export const improveBullets = (payload = {}) => improveBulletPoints(payload)

export const suggestSkills = async ({
  role = '',
  existingSkills = [],
  jobDescription = '',
  signal,
} = {}) =>
  withMockRequest('suggestSkills', { signal }, () => {
    const roleSkills = getRoleSkillSuggestions(role)
    const jdKeywords = extractKeywords(jobDescription)
      .map((keyword) => toTitleCase(keyword))
      .filter((keyword) => keyword.length <= 24)

    const existingLower = new Set(
      (Array.isArray(existingSkills) ? existingSkills : []).map((skill) => skill.toLowerCase())
    )

    return unique([...roleSkills, ...jdKeywords]).filter(
      (skill) => !existingLower.has(skill.toLowerCase())
    )
  })

export const analyzeResumeATS = async ({
  resumeData = {},
  jobDescription = '',
  signal,
} = {}) =>
  withMockRequest('analyzeResumeATS', { signal }, () => {
    const formData = normalizeFormData(resumeData)
    const resumeText = buildResumeText({ formData }).toLowerCase()
    const keywords = unique([
      ...extractKeywords(jobDescription),
      ...getRoleSkillSuggestions(formData.personal.role).map((skill) => skill.toLowerCase()),
    ]).slice(0, 18)

    const matchedKeywords = keywords.filter((keyword) => resumeText.includes(keyword.toLowerCase()))
    const missingKeywords = keywords.filter((keyword) => !matchedKeywords.includes(keyword))
    const keywordMatch = keywords.length > 0 ? Math.round((matchedKeywords.length / keywords.length) * 100) : 0
    const completeness = calculateCompleteness(formData)
    const formattingIssues = detectFormattingIssues(formData)
    const formattingScore = Math.max(0, 100 - formattingIssues.length * 14)
    const score = Math.round(completeness * 0.45 + keywordMatch * 0.35 + formattingScore * 0.2)

    return {
      score: Math.max(0, Math.min(100, score)),
      keywordMatch,
      completeness,
      matchedKeywords: matchedKeywords.map((keyword) => toTitleCase(keyword)),
      missingKeywords: missingKeywords.map((keyword) => toTitleCase(keyword)),
      formattingIssues,
      strengths: buildStrengths(formData, matchedKeywords, completeness),
      suggestions: buildSuggestions(formData, missingKeywords, formattingIssues, completeness),
    }
  })

export const optimizeResumeForJobDescription = async ({
  resumeData = {},
  jobDescription = '',
  signal,
} = {}) =>
  withMockRequest('optimizeResumeForJobDescription', { signal }, async () => {
    const formData = normalizeFormData(resumeData)
    const suggestedSummary = await generateSummary({
      personal: formData.personal,
      skills: formData.skills,
      experience: formData.experience,
      jobDescription,
      signal,
    })
    const suggestedSkills = await suggestSkills({
      role: formData.personal.role,
      existingSkills: formData.skills,
      jobDescription,
      signal,
    })
    const improvedExperience = await Promise.all(
      formData.experience.map(async (entry) => ({
        ...entry,
        bullets: await improveBulletPoints({
          bullets: entry.bullets,
          role: formData.personal.role,
          jobDescription,
          signal,
        }),
      }))
    )

    const optimizedData = {
      ...formData,
      summary:
        formData.summary.trim().length >= 40
          ? formData.summary
          : suggestedSummary,
      skills: unique([...formData.skills, ...suggestedSkills]).slice(0, 16),
      experience: improvedExperience,
    }

    const atsReport = await analyzeResumeATS({
      resumeData: optimizedData,
      jobDescription,
      signal,
    })

    return {
      optimizedData,
      atsReport,
      suggestions: atsReport.suggestions,
    }
  })
