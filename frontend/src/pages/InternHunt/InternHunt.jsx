import React, { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import {
  buildLinkedInSearchUrl,
  searchInternships
} from '../../services/internHubApi'
import { predictCareerPath } from '../../services/mlServiceApi'
import { normalizeResumePrediction } from '../../services/resumePredictionAdapter'
import styles from './InternHunt.module.css'

const PARTICLE_RINGS = [
  { radius: 72, count: 24, speed: 0.0032, size: [1.1, 1.8], alpha: [0.12, 0.24] },
  { radius: 118, count: 34, speed: -0.0026, size: [0.9, 1.8], alpha: [0.1, 0.2] },
  { radius: 158, count: 42, speed: 0.0021, size: [0.8, 1.6], alpha: [0.08, 0.16] }
]

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'data', label: 'Data' },
  { value: 'ai', label: 'AI / ML' },
  { value: 'design', label: 'Design' },
  { value: 'remote', label: 'Remote' }
]

const TARGET_INTERNSHIP_COUNT = 42
const RESUME_TARGET_INTERNSHIP_COUNT = 36
const MIN_RESUME_MATCH_COUNT = 12
const LIVE_JOB_SEARCH_WINDOW_HOURS = 12
const RESUME_LIVE_JOB_SEARCH_WINDOW_HOURS = 12
const ADZUNA_ONLY_LIVE_FEED = true
const MIN_SHOWCASE_INTERNSHIPS = 10
const MAX_SHOWCASE_INTERNSHIPS = 15
const RESUME_RANDOM_POOL_LIMIT = 24
const MAX_SEARCH_VARIANTS = 3
const MAX_RESUME_SEARCH_VARIANTS = 10
const DEFAULT_SEARCH_PAGE_COUNT = 1
const RESUME_PRIMARY_SEARCH_PAGE_COUNT = 3
const RESUME_FALLBACK_SEARCH_PAGE_COUNT = 1
const MAX_RESUME_FILE_BYTES = 10 * 1024 * 1024
const ACCEPTED_RESUME_EXTENSIONS = ['.pdf', '.doc', '.docx']

const DEFAULT_FILTER_QUERY_VARIANTS = {
  all: [
    'internship',
    'software engineer intern',
    'data analyst intern',
    'machine learning intern',
    'product design intern'
  ],
  engineering: [
    'engineering internship',
    'software engineer intern',
    'frontend intern',
    'backend intern',
    'full stack intern'
  ],
  data: ['data analyst intern', 'data science intern', 'business analyst intern', 'analytics intern'],
  ai: ['machine learning intern', 'artificial intelligence intern', 'nlp intern', 'data science intern'],
  design: ['product design intern', 'ui ux intern', 'graphic design intern', 'visual design intern'],
  remote: [
    'remote internship',
    'remote software engineer intern',
    'remote data analyst intern',
    'remote machine learning intern'
  ]
}

const RESUME_CATEGORY_COVERAGE_QUERIES = {
  all: [
    'internship',
    'software internship',
    'engineering internship',
    'data internship',
    'design internship'
  ],
  engineering: [
    'software internship',
    'software engineer internship',
    'developer internship',
    'engineering internship',
    'full stack internship'
  ],
  data: [
    'data internship',
    'data analyst internship',
    'analytics internship',
    'business analyst internship',
    'data science internship'
  ],
  ai: [
    'machine learning internship',
    'ai internship',
    'data science internship',
    'nlp internship',
    'internship'
  ],
  design: [
    'product design internship',
    'ui ux internship',
    'design internship',
    'visual design internship',
    'internship'
  ],
  remote: [
    'remote internship',
    'remote software internship',
    'remote data internship',
    'remote machine learning internship',
    'remote design internship'
  ]
}

const ROLE_SUGGESTION_RULES = [
  {
    pattern: /\breact|next|frontend|html|css|javascript|typescript\b/i,
    roles: ['Frontend Developer Intern', 'React Developer Intern']
  },
  {
    pattern: /\bnode|express|backend|api|java|spring|django|flask|mongodb|postgres|mysql|sql\b/i,
    roles: ['Backend Developer Intern', 'API Developer Intern']
  },
  {
    pattern: /\bfull stack|mern|mean|react|node|javascript|typescript\b/i,
    roles: ['Full Stack Developer Intern']
  },
  {
    pattern: /\bpython|django|flask|fastapi|backend|api\b/i,
    roles: ['Python Developer Intern', 'Backend Developer Intern']
  },
  {
    pattern: /\bsoftware engineer|software developer|sde|developer\b/i,
    roles: ['Software Engineer Intern', 'Software Developer Intern']
  },
  {
    pattern: /\bpandas|numpy|analytics|analyst|excel|tableau|power bi|bi\b/i,
    roles: ['Data Analyst Intern', 'Business Analyst Intern']
  },
  {
    pattern: /\bdata science|machine learning|ml|tensorflow|pytorch|nlp|llm|computer vision\b/i,
    roles: ['Machine Learning Intern', 'AI Intern', 'Data Science Intern']
  },
  {
    pattern: /\bfigma|ui|ux|wireframe|prototype|design system|product design\b/i,
    roles: ['UI UX Design Intern', 'Product Design Intern']
  },
  {
    pattern: /\bdocker|kubernetes|aws|azure|gcp|devops|ci\/cd|cloud\b/i,
    roles: ['DevOps Intern', 'Cloud Engineering Intern']
  }
]

const INDIA_LOCATION_TERMS = [
  'india',
  'bengaluru',
  'bangalore',
  'hyderabad',
  'pune',
  'mumbai',
  'chennai',
  'gurgaon',
  'gurugram',
  'noida',
  'delhi'
]

const TITLE_STOP_WORDS = new Set([
  'and',
  'for',
  'intern',
  'internship',
  'junior',
  'with',
  'the',
  'role'
])

const RESUME_MATCH_STOP_WORDS = new Set([
  ...TITLE_STOP_WORDS,
  'all',
  'candidate',
  'co',
  'experience',
  'fellow',
  'hybrid',
  'on',
  'onsite',
  'op',
  'remote',
  'resume',
  'roles',
  'site',
  'student',
  'trainee'
])

const INTERN_ROLE_REGEX = /\b(intern|internship|trainee|apprentice|fellow|co-?op)\b/i
const INTERN_QUERY_REGEX = /\b(intern(ship)?|trainee|apprentice|fellow(ship)?|co-?op)\b/i

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const extractJobsFromResponse = (response) => {
  if (!response) {
    return []
  }

  if (Array.isArray(response)) {
    const looksLikeJobsArray = response.some(
      (row) =>
        row &&
        typeof row === 'object' &&
        ('title' in row || 'company' in row || 'apply_link' in row || 'employment_type' in row)
    )

    if (looksLikeJobsArray) {
      return response
    }

    return response.flatMap((entry) => extractJobsFromResponse(entry))
  }

  if (Array.isArray(response?.jobs)) {
    return response.jobs
  }
  if (Array.isArray(response?.results)) {
    return response.results
  }
  if (Array.isArray(response?.data)) {
    return response.data
  }

  return []
}

const inferCategory = (title, skills = []) => {
  const haystack = `${title} ${skills.join(' ')}`.toLowerCase()

  if (/design|ux|ui|figma|product/i.test(haystack)) {
    return 'design'
  }
  if (/data|analytics|sql|bi|analyst/i.test(haystack)) {
    return 'data'
  }
  if (/ai|ml|machine learning|llm|nlp|prompt|transformer/i.test(haystack)) {
    return 'ai'
  }

  return 'engineering'
}

const inferRegion = (location, isRemote) => {
  const normalizedLocation = String(location || '').trim().toLowerCase()

  if (INDIA_LOCATION_TERMS.some((term) => normalizedLocation.includes(term))) {
    return 'india'
  }

  if (!normalizedLocation && isRemote) {
    return 'global'
  }

  return 'global'
}

const formatPostedLabel = (job) => {
  const postedHours = Number(job?.posted_hours_ago)
  if (Number.isFinite(postedHours) && postedHours >= 0) {
    if (postedHours < 1) {
      return 'just now'
    }
    if (postedHours < 24) {
      return `${postedHours} hour${postedHours === 1 ? '' : 's'} ago`
    }
    const days = Math.round(postedHours / 24)
    if (days < 7) {
      return `${days} day${days === 1 ? '' : 's'} ago`
    }
    const weeks = Math.round(days / 7)
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  }

  const postedDate = String(job?.posted_date || '').trim()
  if (!postedDate) {
    return 'recently'
  }

  const parsed = new Date(postedDate)
  if (Number.isNaN(parsed.getTime())) {
    return 'recently'
  }

  const diffHours = Math.max(0, Math.round((Date.now() - parsed.getTime()) / (1000 * 60 * 60)))
  if (diffHours < 24) {
    return `${Math.max(1, diffHours)} hour${diffHours === 1 ? '' : 's'} ago`
  }
  const diffDays = Math.round(diffHours / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

const formatMode = (job) => {
  const text = `${job?.location || ''} ${job?.description || ''} ${job?.employment_type || ''}`.toLowerCase()
  if (job?.is_remote || /remote|work from home|wfh/.test(text)) {
    return 'Remote'
  }
  if (/hybrid/.test(text)) {
    return 'Hybrid'
  }
  return 'On-site'
}

const formatCompensation = (job) => {
  const salary = String(job?.salary || '').trim()
  return salary || 'Comp not listed'
}

const formatBytes = (size) => {
  const numericSize = Number(size)
  if (!Number.isFinite(numericSize) || numericSize < 0) {
    return '0 B'
  }

  if (numericSize < 1024) {
    return `${numericSize} B`
  }

  const kb = numericSize / 1024
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`
  }

  return `${(kb / 1024).toFixed(2)} MB`
}

const resolvePostedHoursAgo = (job) => {
  const explicitHours = Number(job?.posted_hours_ago)
  if (Number.isFinite(explicitHours) && explicitHours >= 0) {
    return explicitHours
  }

  const postedDate = String(job?.posted_date || '').trim()
  if (!postedDate) {
    return null
  }

  const parsed = new Date(postedDate)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  const diffHours = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60)))
  return Number.isFinite(diffHours) ? diffHours : null
}

const isWithinFreshnessWindow = (job, freshnessWindow = LIVE_JOB_SEARCH_WINDOW_HOURS) => {
  const postedHoursAgo = resolvePostedHoursAgo(job)
  return Number.isFinite(postedHoursAgo) && postedHoursAgo >= 0 && postedHoursAgo <= freshnessWindow
}

const normalizeProvider = (source, applyLink = '') => {
  const normalizedSource = String(source || '').trim().toLowerCase()
  const normalizedApplyLink = String(applyLink || '').trim().toLowerCase()

  if (normalizedSource.includes('linkedin') || normalizedApplyLink.includes('linkedin.com')) {
    return 'linkedin'
  }
  if (normalizedSource.includes('adzuna') || normalizedApplyLink.includes('adzuna')) {
    return 'adzuna'
  }

  return null
}

const formatProviderLabel = (provider) => {
  if (provider === 'linkedin') {
    return 'LinkedIn'
  }
  if (provider === 'adzuna') {
    return 'Adzuna'
  }
  return 'Live'
}

const buildPrimaryApplyLabel = (provider) =>
  provider === 'linkedin' ? 'Apply on LinkedIn' : 'Apply via Adzuna'

const getInternshipRecencyRank = (internship) => {
  const postedHoursAgo = Number(internship?.postedHoursAgo)
  return Number.isFinite(postedHoursAgo) && postedHoursAgo >= 0 ? postedHoursAgo : Number.POSITIVE_INFINITY
}

const sortInternshipsByRecency = (items = []) =>
  [...items].sort((left, right) => {
    const recencyDelta = getInternshipRecencyRank(left) - getInternshipRecencyRank(right)
    if (recencyDelta !== 0) {
      return recencyDelta
    }

    return Number(right.featured) - Number(left.featured)
  })

const shuffleItems = (items = []) => {
  const nextItems = [...items]
  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]]
  }
  return nextItems
}

const selectShowcaseInternships = (items = [], { resumeGuided = false } = {}) => {
  if (items.length <= MAX_SHOWCASE_INTERNSHIPS) {
    return items
  }

  const candidatePool = resumeGuided ? items.slice(0, Math.min(items.length, RESUME_RANDOM_POOL_LIMIT)) : items
  const maxCount = Math.min(MAX_SHOWCASE_INTERNSHIPS, candidatePool.length)
  const minCount = Math.min(MIN_SHOWCASE_INTERNSHIPS, maxCount)
  const selectionCount =
    maxCount <= minCount ? maxCount : minCount + Math.floor(Math.random() * (maxCount - minCount + 1))

  return shuffleItems(candidatePool).slice(0, selectionCount)
}

const validateResumeFile = (file) => {
  if (!file) {
    return 'Please choose a resume file first.'
  }

  const name = String(file.name || '').toLowerCase()
  const validExtension = ACCEPTED_RESUME_EXTENSIONS.some((extension) => name.endsWith(extension))
  if (!validExtension) {
    return 'Only PDF, DOC, and DOCX resumes are supported.'
  }

  if (Number(file.size || 0) > MAX_RESUME_FILE_BYTES) {
    return 'Resume file is too large. Max size is 10 MB.'
  }

  return ''
}

const deriveResumeSearchQuery = (prediction) => {
  const role = sanitizePredictedRoleForSearch(prediction?.predicted_role)
  const skills = Array.isArray(prediction?.skills)
    ? prediction.skills
        .map((skill) => String(skill || '').trim())
        .filter(Boolean)
    : []

  const standoutSkill = skills.find((skill) => !role.toLowerCase().includes(skill.toLowerCase()))

  if (role && standoutSkill) {
    return toInternshipSearchPhrase(`${role} ${standoutSkill}`)
  }

  if (role) {
    return toInternshipSearchPhrase(role)
  }

  if (skills.length > 0) {
    return toInternshipSearchPhrase(skills.slice(0, 2).join(' '))
  }

  return 'software internship'
}

const toDisplayTitle = (value) =>
  String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) =>
      token.length <= 3 ? token.toUpperCase() : `${token.charAt(0).toUpperCase()}${token.slice(1)}`
    )
    .join(' ')

const getConfidenceTier = (confidence) => {
  const normalized = clamp(Number(confidence || 0), 0, 1)

  if (normalized >= 0.75) {
    return { label: 'High', summary: 'Role prediction is strong, so job roles are tightly matched.' }
  }

  if (normalized >= 0.5) {
    return {
      label: 'Medium',
      summary: 'Role prediction is decent, so job roles are balanced with skill-based matches.'
    }
  }

  return {
    label: 'Low',
    summary: 'Role prediction is broad, so job roles are expanded using your strongest skills.'
  }
}

const ensureInternshipTitle = (value) => {
  const normalized = String(value || '').trim()

  if (!normalized) {
    return 'Internship'
  }

  if (INTERN_ROLE_REGEX.test(normalized)) {
    return toDisplayTitle(normalized)
  }

  return toDisplayTitle(`${normalized} Intern`)
}

const dedupeTextItems = (items = []) => {
  const output = []
  const seen = new Set()

  for (const item of items) {
    const normalized = String(item || '').trim()
    if (!normalized) {
      continue
    }

    const key = normalized.toLowerCase()
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    output.push(normalized)
  }

  return output
}

const normalizeSearchPhrase = (value) =>
  String(value || '')
    .replace(/[|,/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const sanitizePredictedRoleForSearch = (value) => {
  const normalized = normalizeSearchPhrase(value)
  if (!normalized) {
    return ''
  }

  const withoutApprentice = normalized
    .replace(/\b(apprentice|trainee|fellow(ship)?|co-?op)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return withoutApprentice || normalized
}

const toInternshipSearchPhrase = (value) => {
  const normalized = sanitizePredictedRoleForSearch(value)
  if (!normalized) {
    return ''
  }

  return INTERN_QUERY_REGEX.test(normalized) ? normalized : `${normalized} internship`
}

const buildResumeRoleSuggestions = (prediction) => {
  if (!prediction) {
    return []
  }

  const predictedRole = ensureInternshipTitle(sanitizePredictedRoleForSearch(prediction?.predicted_role))
  const skills = dedupeTextItems(prediction?.skills || [])
  const category = inferCategory(prediction?.predicted_role, skills)
  const categoryDefaults = (DEFAULT_FILTER_QUERY_VARIANTS[category] || DEFAULT_FILTER_QUERY_VARIANTS.all).map(
    (item) => ensureInternshipTitle(item)
  )
  const corpus = `${prediction?.predicted_role || ''} ${skills.join(' ')}`.toLowerCase()
  const skillRoles = ROLE_SUGGESTION_RULES.filter((rule) => rule.pattern.test(corpus)).flatMap(
    (rule) => rule.roles
  )
  const confidence = clamp(Number(prediction?.confidence || 0), 0, 1)

  const orderedSuggestions =
    confidence >= 0.75
      ? [predictedRole, ...skillRoles, ...categoryDefaults]
      : confidence >= 0.5
        ? [predictedRole, ...skillRoles, ...categoryDefaults]
        : [...skillRoles, ...categoryDefaults, predictedRole]

  return dedupeTextItems(orderedSuggestions).filter(Boolean).slice(0, 8)
}

const buildResumeSearchQueries = (prediction, activeFilter, typedQuery = '') => {
  if (!prediction) {
    return buildSearchVariants(typedQuery, activeFilter)
  }

  const predictedRole = sanitizePredictedRoleForSearch(prediction?.predicted_role)
  const roleSuggestions = buildResumeRoleSuggestions(prediction)
  const skills = dedupeTextItems(prediction?.skills || []).slice(0, 4)
  const predictedCategory = inferCategory(predictedRole, skills)
  const activeCoverageKey = activeFilter === 'all' ? predictedCategory || 'all' : activeFilter
  const broadCoverageQueries = RESUME_CATEGORY_COVERAGE_QUERIES[activeCoverageKey] || RESUME_CATEGORY_COVERAGE_QUERIES.all
  const baseQueries = [
    ...broadCoverageQueries,
    typedQuery,
    predictedRole,
    ...roleSuggestions,
    predictedRole && skills[0] ? `${predictedRole} ${skills[0]}` : '',
    predictedRole && skills.length > 1 ? `${predictedRole} ${skills.slice(0, 2).join(' ')}` : '',
    ...skills.slice(0, 2).map((skill) => `${skill} internship`),
    ...(DEFAULT_FILTER_QUERY_VARIANTS[activeCoverageKey] || DEFAULT_FILTER_QUERY_VARIANTS.all),
    'internship'
  ]
    .map((item) => String(item || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  const internshipQueries = baseQueries.flatMap((item) =>
    INTERN_QUERY_REGEX.test(item) ? [item] : [item, `${item} internship`, `${item} intern`]
  )

  const remoteAwareQueries =
    activeFilter === 'remote'
      ? internshipQueries.flatMap((item) =>
          /\bremote\b/i.test(item) ? [item] : [`remote ${item}`, `${item} remote`]
        )
      : internshipQueries

  return dedupeTextItems(remoteAwareQueries).slice(0, MAX_RESUME_SEARCH_VARIANTS)
}

const buildBoardCoverageQueries = (activeFilter, resumePrediction = null) => {
  const predictedCategory = resumePrediction
    ? inferCategory(
        sanitizePredictedRoleForSearch(resumePrediction?.predicted_role),
        dedupeTextItems(resumePrediction?.skills || [])
      )
    : null

  const activeCoverageKey = activeFilter === 'all' ? predictedCategory || 'all' : activeFilter
  const fallbackQueries = dedupeTextItems([
    ...(RESUME_CATEGORY_COVERAGE_QUERIES[activeCoverageKey] || RESUME_CATEGORY_COVERAGE_QUERIES.all),
    ...(DEFAULT_FILTER_QUERY_VARIANTS[activeCoverageKey] || DEFAULT_FILTER_QUERY_VARIANTS.all),
    'internship'
  ])

  return fallbackQueries.slice(0, 8)
}

const tokenizeResumeMatchTerms = (value) =>
  String(value || '')
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 2 && !RESUME_MATCH_STOP_WORDS.has(item))

const tokenizeSearchTerms = (value) =>
  String(value || '')
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 1)

const findResumeLabelMatches = (labels, corpus) => {
  if (!Array.isArray(labels) || !corpus) {
    return []
  }

  return labels.filter((label) => {
    const normalizedLabel = String(label || '').trim().toLowerCase()
    if (!normalizedLabel) {
      return false
    }

    if (corpus.includes(normalizedLabel)) {
      return true
    }

    return tokenizeResumeMatchTerms(normalizedLabel).some((token) => corpus.includes(token))
  })
}

const buildResumeSearchProfile = (prediction) => {
  if (!prediction) {
    return null
  }

  const predictedRole = sanitizePredictedRoleForSearch(prediction?.predicted_role)
  const skills = dedupeTextItems(prediction?.skills || []).slice(0, 12)
  const missingSkills = dedupeTextItems(prediction?.missing_skills || []).slice(0, 8)
  const roleSuggestions = buildResumeRoleSuggestions(prediction)

  return {
    predictedRole,
    predictedCategory: inferCategory(predictedRole, skills),
    roleSuggestions,
    roleTerms: dedupeTextItems(
      roleSuggestions.flatMap((role) => tokenizeResumeMatchTerms(role))
    ).slice(0, 12),
    skills,
    missingSkills,
    confidence: clamp(Number(prediction?.confidence || 0), 0, 1),
    atsScore: clamp(Math.round(Number(prediction?.ats_score || 0)), 0, 100)
  }
}

const scoreInternshipForResume = (internship, profile) => {
  if (!profile) {
    return null
  }

  const corpus = [
    internship.title,
    internship.company,
    internship.location,
    internship.mode,
    internship.category,
    internship.description,
    ...internship.tags
  ]
    .join(' ')
    .toLowerCase()

  const matchedRoleTerms = profile.roleTerms.filter((term) => corpus.includes(term)).slice(0, 4)
  const matchedSkills = findResumeLabelMatches(profile.skills, corpus).slice(0, 4)
  const missingSkillHits = findResumeLabelMatches(profile.missingSkills, corpus).slice(0, 3)

  let score = 28

  if (matchedRoleTerms.length > 0) {
    score += 18
  }

  score += Math.min(32, matchedSkills.length * 8)
  score += internship.category === profile.predictedCategory ? 10 : 0
  score += Math.min(8, Math.round(profile.confidence * 10))
  score += Math.min(6, Math.round(profile.atsScore / 20))
  score -= Math.min(15, missingSkillHits.length * 5)

  const normalizedScore = clamp(Math.round(score), 22, 99)
  const tone =
    normalizedScore >= 78 ? 'high' : normalizedScore >= 58 ? 'medium' : 'low'
  const label =
    tone === 'high' ? 'High Fit' : tone === 'medium' ? 'Strong Match' : 'Stretch'

  let summary = profile.predictedRole
    ? `Aligned with ${profile.predictedRole}`
    : 'Ranked by your resume analysis'

  if (matchedSkills.length > 0) {
    summary = `Matched skills: ${matchedSkills.join(', ')}`
  } else if (missingSkillHits.length > 0) {
    summary = `May need: ${missingSkillHits.join(', ')}`
  }

  return {
    score: normalizedScore,
    tone,
    label,
    matchedSkills,
    missingSkillHits,
    summary
  }
}

const extractTags = (job) => {
  const directSkills = Array.isArray(job?.required_skills)
    ? job.required_skills
        .map((skill) => String(skill || '').trim())
        .filter(Boolean)
        .slice(0, 3)
    : []

  if (directSkills.length > 0) {
    return directSkills
  }

  const titleWords = String(job?.title || '')
    .split(/[^a-zA-Z0-9+#.]+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !TITLE_STOP_WORDS.has(word.toLowerCase()))

  return Array.from(new Set(titleWords)).slice(0, 3)
}

const dedupeInternshipCards = (items = []) => {
  const seen = new Set()

  return items.filter((item) => {
    const key = `${item?.title}|${item?.company}|${item?.location}`.toLowerCase()
    if (!key.trim() || seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

const mergeUniqueInternshipPools = (primaryItems = [], supplementalGroups = [], targetCount = Number.POSITIVE_INFINITY) => {
  if (primaryItems.length >= targetCount) {
    return [...primaryItems]
  }

  const output = [...primaryItems]
  const seen = new Set(
    primaryItems.map((item) => `${item?.title}|${item?.company}|${item?.location}`.toLowerCase())
  )

  for (const group of supplementalGroups) {
    for (const item of group || []) {
      const key = `${item?.title}|${item?.company}|${item?.location}`.toLowerCase()
      if (!key.trim() || seen.has(key)) {
        continue
      }

      seen.add(key)
      output.push(item)

      if (output.length >= targetCount) {
        return output
      }
    }
  }

  return output
}

const buildResumeSuggestedDescription = (prediction, tags = []) => {
  const predictedRole = String(prediction?.predicted_role || '').trim()
  const skillsText = tags.length > 0 ? tags.join(', ') : ''

  if (predictedRole && skillsText) {
    return `Resume-matched internship search for ${predictedRole} using ${skillsText}.`
  }

  if (predictedRole) {
    return `Resume-matched internship search for ${predictedRole}.`
  }

  if (skillsText) {
    return `Resume-matched internship search using ${skillsText}.`
  }

  return 'Resume-matched live role built from your uploaded profile.'
}

const normalizeResumeLiveMatch = (
  job,
  index,
  prediction,
  { fallbackLocation = 'Location not listed', forceRemote = false } = {}
) => {
  const tags = dedupeTextItems([
    ...extractTags(job),
    ...(Array.isArray(prediction?.skills) ? prediction.skills.slice(0, 4) : [])
  ]).slice(0, 4)
  const rawApplyLink = String(job?.apply_link || '').trim()
  const title = String(job?.title || '').trim() || String(prediction?.predicted_role || '').trim()
  const company = String(job?.company || 'Unknown company').trim() || 'Unknown company'
  const location = String(job?.location || '').trim() || fallbackLocation
  const mode = forceRemote ? 'Remote' : formatMode(job)
  const provider = normalizeProvider(job?.source, rawApplyLink)
  const postedHoursAgo = resolvePostedHoursAgo(job)
  const postedDate = String(job?.posted_date || '').trim()
  const compensation = formatCompensation(job)
  const linkedInSearchUrl = buildLinkedInSearchUrl({ title, company, location, mode })

  if (!provider || !rawApplyLink || !Number.isFinite(postedHoursAgo)) {
    return null
  }

  return {
    id: `resume-${index}-${company}-${title}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
    title,
    company,
    location,
    description: String(job?.description || '').trim() || buildResumeSuggestedDescription(prediction, tags),
    mode,
    duration: String(job?.employment_type || '').trim() || 'Internship',
    stipend: compensation,
    posted: formatPostedLabel({ ...job, posted_hours_ago: postedHoursAgo, posted_date: postedDate }),
    postedHoursAgo,
    postedDate,
    category: inferCategory(title, tags),
    region: inferRegion(location, forceRemote || Boolean(job?.is_remote)),
    featured: index < 2,
    tags,
    provider,
    source: formatProviderLabel(provider),
    directApplyUrl: rawApplyLink,
    directApplyLabel: buildPrimaryApplyLabel(provider),
    linkedInUrl: linkedInSearchUrl,
    hasDirectApply: true,
    isResumeFallback: true
  }
}

const isRateLimitError = (error) => {
  const statusCode = Number(error?.statusCode || error?.response?.status || 0)
  if (statusCode === 429) {
    return true
  }

  return /\b429\b|rate limit|too many requests/i.test(String(error?.message || ''))
}

const getLiveSearchErrorDetail = (error) => {
  if (isRateLimitError(error)) {
    return 'Adzuna rate limit reached. Please wait a minute and try again.'
  }

  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    'Live search failed.'
  )
}

const isInternshipJob = (job) => {
  const title = String(job?.title || '').trim()
  const employmentType = String(job?.employment_type || '').trim()
  const description = String(job?.description || '').trim()
  return INTERN_ROLE_REGEX.test(`${title} ${employmentType} ${description}`)
}

const normalizeLiveInternship = (job, index) => {
  const title = String(job?.title || 'Internship').trim() || 'Internship'
  const company = String(job?.company || 'Unknown company').trim() || 'Unknown company'
  const location = String(job?.location || '').trim() || (job?.is_remote ? 'Remote' : 'Location not listed')
  const tags = extractTags(job)
  const category = inferCategory(title, tags)
  const mode = formatMode(job)
  const sourceApplyUrl = String(job?.apply_link || '').trim()
  const provider = normalizeProvider(job?.source, sourceApplyUrl)
  const postedHoursAgo = resolvePostedHoursAgo(job)
  const postedDate = String(job?.posted_date || '').trim()
  const linkedInSearchUrl = buildLinkedInSearchUrl({ title, company, location, mode })

  if (!provider || !sourceApplyUrl || !Number.isFinite(postedHoursAgo)) {
    return null
  }

  return {
    id: `live-${index}-${company}-${title}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
    title,
    company,
    location,
    description: String(job?.description || '').trim(),
    mode,
    duration: String(job?.employment_type || '').trim() || 'Internship',
    stipend: formatCompensation(job),
    posted: formatPostedLabel({ ...job, posted_hours_ago: postedHoursAgo, posted_date: postedDate }),
    postedHoursAgo,
    postedDate,
    category,
    region: inferRegion(location, Boolean(job?.is_remote)),
    featured: index < 2,
    tags,
    provider,
    source: formatProviderLabel(provider),
    directApplyUrl: sourceApplyUrl,
    directApplyLabel: buildPrimaryApplyLabel(provider),
    linkedInUrl: linkedInSearchUrl,
    hasDirectApply: true,
    isResumeFallback: false
  }
}

const normalizeLiveResults = (response) => {
  const rows = extractJobsFromResponse(response)

  const normalized = rows
    .filter((job) => isInternshipJob(job) && isWithinFreshnessWindow(job, LIVE_JOB_SEARCH_WINDOW_HOURS))
    .map((job, index) => normalizeLiveInternship(job, index))
    .filter((job) => job && job.title && job.company && job.hasDirectApply)

  return sortInternshipsByRecency(dedupeInternshipCards(normalized))
}

const buildResumeFallbackInternships = (prediction, activeFilter, region) => {
  return []
}

const matchesFilters = (internship, normalizedQuery, activeFilter, region) => {
  const searchableText = [
    internship.title,
    internship.company,
    internship.location,
    internship.mode,
    internship.category,
    internship.source,
    internship.description,
    ...internship.tags
  ]
    .join(' ')
    .toLowerCase()

  const queryTokens = tokenizeSearchTerms(normalizedQuery)
  const matchesQuery =
    !normalizedQuery ||
    searchableText.includes(normalizedQuery) ||
    (queryTokens.length > 0 && queryTokens.every((token) => searchableText.includes(token)))

  const matchesFilter =
    activeFilter === 'all' ||
    (activeFilter === 'remote' && internship.mode.toLowerCase() === 'remote') ||
    internship.category === activeFilter

  const matchesRegion = region === 'all' || internship.region === region

  return matchesQuery && matchesFilter && matchesRegion
}

const buildSearchVariants = (query, activeFilter, resumeRoleSuggestions = []) => {
  const normalizedQuery = query.trim()

  if (resumeRoleSuggestions.length > 0) {
    return dedupeTextItems(resumeRoleSuggestions).slice(0, MAX_SEARCH_VARIANTS)
  }

  if (!normalizedQuery) {
    return DEFAULT_FILTER_QUERY_VARIANTS[activeFilter] || DEFAULT_FILTER_QUERY_VARIANTS.all
  }

  const variants = [normalizedQuery]

  if (!INTERN_QUERY_REGEX.test(normalizedQuery)) {
    variants.push(`${normalizedQuery} internship`, `${normalizedQuery} intern`)
  }

  if (activeFilter === 'remote' && !/\bremote\b/i.test(normalizedQuery)) {
    variants.unshift(`remote ${normalizedQuery}`)
    variants.push(`${normalizedQuery} remote internship`)
  }

  return Array.from(new Set(variants.map((item) => item.trim()).filter(Boolean))).slice(
    0,
    MAX_SEARCH_VARIANTS
  )
}

const buildLiveSearchRequests = (
  query,
  activeFilter,
  region,
  resumePrediction = null,
  useResumeRoleSuggestions = false
) => {
  const preferredLocation = region === 'india' ? 'India' : undefined
  const remote = activeFilter === 'remote' ? true : undefined

  if (useResumeRoleSuggestions && resumePrediction) {
    const resumeQueries = buildResumeSearchQueries(resumePrediction, activeFilter, query)
    const boardCoverageQueries = buildBoardCoverageQueries(activeFilter, resumePrediction)
    const preferredRequests = resumeQueries.map((searchQuery, index) => ({
      query: searchQuery,
      location: preferredLocation,
      remote,
      numPages: index < 4 ? RESUME_PRIMARY_SEARCH_PAGE_COUNT : RESUME_FALLBACK_SEARCH_PAGE_COUNT,
      limit: RESUME_TARGET_INTERNSHIP_COUNT,
      postedWithinHours: RESUME_LIVE_JOB_SEARCH_WINDOW_HOURS,
      adzunaOnly: ADZUNA_ONLY_LIVE_FEED,
      refresh: true
    }))
    const broadenedRequests =
      region === 'india'
        ? resumeQueries.slice(0, 4).map((searchQuery) => ({
            query: searchQuery,
            location: undefined,
            remote,
            numPages: RESUME_FALLBACK_SEARCH_PAGE_COUNT,
            limit: RESUME_TARGET_INTERNSHIP_COUNT,
            postedWithinHours: RESUME_LIVE_JOB_SEARCH_WINDOW_HOURS,
            adzunaOnly: ADZUNA_ONLY_LIVE_FEED,
            refresh: true
          }))
        : []
    const boardCoverageRequests = boardCoverageQueries.map((searchQuery, index) => ({
      query: searchQuery,
      location: preferredLocation,
      remote,
      numPages: index < 3 ? RESUME_PRIMARY_SEARCH_PAGE_COUNT : RESUME_FALLBACK_SEARCH_PAGE_COUNT,
      limit: RESUME_TARGET_INTERNSHIP_COUNT,
      postedWithinHours: RESUME_LIVE_JOB_SEARCH_WINDOW_HOURS,
      adzunaOnly: ADZUNA_ONLY_LIVE_FEED,
      refresh: true
    }))
    const broadenedCoverageRequests =
      region === 'india'
        ? boardCoverageQueries.map((searchQuery, index) => ({
            query: searchQuery,
            location: undefined,
            remote,
            numPages: index < 2 ? RESUME_PRIMARY_SEARCH_PAGE_COUNT : RESUME_FALLBACK_SEARCH_PAGE_COUNT,
            limit: RESUME_TARGET_INTERNSHIP_COUNT,
            postedWithinHours: RESUME_LIVE_JOB_SEARCH_WINDOW_HOURS,
            adzunaOnly: ADZUNA_ONLY_LIVE_FEED,
            refresh: true
          }))
        : []

    const dedupedRequests = []
    const seen = new Set()

    for (const request of [
      ...preferredRequests,
      ...broadenedRequests,
      ...boardCoverageRequests,
      ...broadenedCoverageRequests
    ]) {
      const key = `${request.query}|${request.location || 'all'}|${String(request.remote)}|${request.numPages}`
      if (seen.has(key)) {
        continue
      }

      seen.add(key)
      dedupedRequests.push(request)
    }

    return dedupedRequests
  }

  const resumeRoleSuggestions = useResumeRoleSuggestions ? buildResumeRoleSuggestions(resumePrediction) : []

  return buildSearchVariants(query, activeFilter, resumeRoleSuggestions).map((searchQuery) => ({
    query: searchQuery,
    location: preferredLocation,
    remote,
    numPages: DEFAULT_SEARCH_PAGE_COUNT,
    limit: TARGET_INTERNSHIP_COUNT,
    postedWithinHours: LIVE_JOB_SEARCH_WINDOW_HOURS,
    adzunaOnly: ADZUNA_ONLY_LIVE_FEED,
    refresh: false
  }))
}

const InternHunt = () => {
  const canvasRef = useRef(null)
  const liveFeedRef = useRef(null)
  const resumeSectionRef = useRef(null)
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [region, setRegion] = useState('india')
  const [internships, setInternships] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [feedError, setFeedError] = useState('')
  const [lastSyncedLabel, setLastSyncedLabel] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeAnalysis, setResumeAnalysis] = useState(null)
  const [resumeAnalysisError, setResumeAnalysisError] = useState('')
  const [isResumeAnalyzing, setIsResumeAnalyzing] = useState(false)
  const [isResumeDragActive, setIsResumeDragActive] = useState(false)
  const [resumeAppliedQuery, setResumeAppliedQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const resumeFileValidationError = useMemo(() => validateResumeFile(resumeFile), [resumeFile])
  const isResumeGuidedSearch =
    Boolean(resumeAnalysis) &&
    Boolean(resumeAppliedQuery.trim()) &&
    deferredQuery.trim().toLowerCase() === resumeAppliedQuery.trim().toLowerCase()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const context = canvas.getContext('2d')
    if (!context) return undefined

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const pointer = { x: 0, y: 0, active: false }
    let width = 0
    let height = 0
    let dpr = 1
    let frameId = 0

    const particles = []

    const randRange = (min, max) => min + Math.random() * (max - min)

    const createParticles = () => {
      particles.length = 0
      const centerX = width * 0.96
      const centerY = Math.max(140, height * 0.18)

      PARTICLE_RINGS.forEach((ring, ringIndex) => {
        for (let i = 0; i < ring.count; i += 1) {
          const angle = (Math.PI * 2 * i) / ring.count + Math.random() * 0.4
          const orbitRadius = ring.radius + randRange(-16, 16)
          const x = centerX + Math.cos(angle) * orbitRadius
          const y = centerY + Math.sin(angle) * orbitRadius
          particles.push({
            ringIndex,
            angle,
            orbitRadius,
            orbitSpeed: ring.speed + randRange(-0.0009, 0.0009),
            size: randRange(ring.size[0], ring.size[1]),
            alpha: randRange(ring.alpha[0], ring.alpha[1]),
            x,
            y,
            vx: 0,
            vy: 0
          })
        }
      })
    }

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      createParticles()
    }

    const movePointer = (x, y) => {
      pointer.x = x
      pointer.y = y
      pointer.active = true
    }

    const handleMouseMove = (event) => movePointer(event.clientX, event.clientY)
    const handleTouchMove = (event) => {
      if (!event.touches || event.touches.length === 0) return
      const touch = event.touches[0]
      movePointer(touch.clientX, touch.clientY)
    }
    const clearPointer = () => {
      pointer.active = false
    }

    const drawFrame = () => {
      context.clearRect(0, 0, width, height)
      const centerX = width * 0.96
      const centerY = Math.max(140, height * 0.18)

      context.lineWidth = 1
      context.strokeStyle = 'rgba(0, 229, 255, 0.15)'
      for (let i = 0; i < PARTICLE_RINGS.length; i += 1) {
        context.beginPath()
        context.arc(centerX, centerY, PARTICLE_RINGS[i].radius, 0, Math.PI * 2)
        context.stroke()
      }

      const repelRadius = 88
      const repelRadiusSquared = repelRadius * repelRadius

      particles.forEach((particle) => {
        const ring = PARTICLE_RINGS[particle.ringIndex]
        particle.angle += particle.orbitSpeed
        const targetX = centerX + Math.cos(particle.angle) * particle.orbitRadius
        const targetY = centerY + Math.sin(particle.angle) * particle.orbitRadius

        particle.vx += (targetX - particle.x) * 0.018
        particle.vy += (targetY - particle.y) * 0.018

        if (pointer.active) {
          const dx = particle.x - pointer.x
          const dy = particle.y - pointer.y
          const distanceSquared = dx * dx + dy * dy

          if (distanceSquared < repelRadiusSquared) {
            const distance = Math.sqrt(distanceSquared) || 1
            const force = (repelRadius - distance) / repelRadius
            particle.vx += (dx / distance) * force * 1.3
            particle.vy += (dy / distance) * force * 1.3
          }
        }

        particle.vx *= 0.91
        particle.vy *= 0.91
        particle.x += particle.vx
        particle.y += particle.vy

        context.beginPath()
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        context.fillStyle = `rgba(0, 229, 255, ${particle.alpha})`
        context.fill()

        if (ring.radius === PARTICLE_RINGS[0].radius) {
          context.beginPath()
          context.arc(particle.x, particle.y, particle.size + 1.8, 0, Math.PI * 2)
          context.fillStyle = 'rgba(0, 229, 255, 0.08)'
          context.fill()
        }
      })

      if (!prefersReducedMotion) {
        frameId = window.requestAnimationFrame(drawFrame)
      }
    }

    resize()
    drawFrame()

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('mouseleave', clearPointer)
    window.addEventListener('touchend', clearPointer)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('mouseleave', clearPointer)
      window.removeEventListener('touchend', clearPointer)
      if (frameId) window.cancelAnimationFrame(frameId)
    }
  }, [])

  const liveSearchRequests = useMemo(
    () =>
      buildLiveSearchRequests(
        deferredQuery,
        activeFilter,
        region,
        resumeAnalysis,
        isResumeGuidedSearch
      ),
    [activeFilter, deferredQuery, isResumeGuidedSearch, region, resumeAnalysis]
  )

  const resumeSearchProfile = useMemo(
    () => buildResumeSearchProfile(resumeAnalysis),
    [resumeAnalysis]
  )
  const resumeRoleSuggestions = useMemo(
    () => buildResumeRoleSuggestions(resumeAnalysis),
    [resumeAnalysis]
  )
  const resumeConfidenceTier = useMemo(
    () => getConfidenceTier(resumeAnalysis?.confidence),
    [resumeAnalysis]
  )
  const resumeFallbackInternships = useMemo(
    () => buildResumeFallbackInternships(resumeAnalysis, activeFilter, region),
    [activeFilter, region, resumeAnalysis]
  )
  const desiredInternshipCount = isResumeGuidedSearch ? RESUME_TARGET_INTERNSHIP_COUNT : TARGET_INTERNSHIP_COUNT

  const scrollToSection = (sectionRef) => {
    if (sectionRef?.current && typeof sectionRef.current.scrollIntoView === 'function') {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleResumeFileSelected = (selectedFile) => {
    const nextFile =
      selectedFile instanceof File ? selectedFile : selectedFile?.[0] instanceof File ? selectedFile[0] : null

    setIsResumeDragActive(false)
    setResumeFile(nextFile)
    setResumeAnalysis(null)
    setResumeAppliedQuery('')
    setResumeAnalysisError(nextFile ? validateResumeFile(nextFile) : '')
  }

  const handleResumeDragOver = (event) => {
    event.preventDefault()
    setIsResumeDragActive(true)
  }

  const handleResumeDragLeave = (event) => {
    event.preventDefault()
    setIsResumeDragActive(false)
  }

  const handleResumeDrop = (event) => {
    event.preventDefault()
    setIsResumeDragActive(false)
    handleResumeFileSelected(event.dataTransfer?.files?.[0] || null)
  }

  const handleResumeAnalyze = async () => {
    const validationError = resumeFileValidationError
    if (validationError) {
      setResumeAnalysisError(validationError)
      return
    }

    setIsResumeAnalyzing(true)
    setResumeAnalysisError('')

    try {
      const predictionResponse = await predictCareerPath(resumeFile, {
        location: region === 'india' ? 'India' : undefined,
        remote: activeFilter === 'remote',
        postedWithinHours: LIVE_JOB_SEARCH_WINDOW_HOURS
      })

      const normalizedPrediction = normalizeResumePrediction(predictionResponse)
      if (!normalizedPrediction) {
        throw new Error('Resume analysis returned an invalid response.')
      }

      const nextQuery = deriveResumeSearchQuery(normalizedPrediction)

      startTransition(() => {
        setResumeAnalysis(normalizedPrediction)
        setResumeAppliedQuery(nextQuery)
        setActiveFilter('all')
        setQuery(nextQuery)
      })

      window.requestAnimationFrame(() => {
        scrollToSection(liveFeedRef)
      })
    } catch (requestError) {
      const isNetworkFailure =
        !requestError?.response &&
        /network error|failed to fetch|load failed|ecconnrefused|err_network/i.test(
          String(requestError?.message || '')
        )
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api')
      const mlBaseUrl = import.meta.env.VITE_ML_SERVICE_BASE_URL || 'http://127.0.0.1:8000'

      setResumeAnalysisError(
        isNetworkFailure
          ? `Resume analysis is unreachable. Checked backend (${apiBaseUrl}) and ML service (${mlBaseUrl}).`
          : requestError?.response?.data?.message ||
              requestError?.response?.data?.detail ||
              requestError?.detail ||
              requestError?.message ||
              'Unable to analyze this resume right now.'
      )
    } finally {
      setIsResumeAnalyzing(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const loadInternships = async () => {
      setIsLoading(true)
      setFeedError('')

      try {
        const fulfilledResponses = []
        let partialFailureCount = 0
        let firstFailure = null

        for (const request of liveSearchRequests) {
          try {
            const response = await searchInternships(request.query, {
              location: request.location,
              remote: request.remote,
              numPages: request.numPages,
              limit: request.limit,
              postedWithinHours: request.postedWithinHours || LIVE_JOB_SEARCH_WINDOW_HOURS,
              adzunaOnly: request.adzunaOnly,
              refresh: Boolean(request.refresh)
            })

            if (cancelled) {
              return
            }

            fulfilledResponses.push(response)

            if (normalizeLiveResults(fulfilledResponses).length >= desiredInternshipCount) {
              break
            }
          } catch (error) {
            partialFailureCount += 1
            firstFailure ??= error

            if (isRateLimitError(error)) {
              break
            }
          }
        }

        if (cancelled) {
          return
        }

        if (fulfilledResponses.length === 0) {
          throw firstFailure || new Error('Live search failed.')
        }

        const normalized = normalizeLiveResults(fulfilledResponses).slice(0, desiredInternshipCount)
        const providerError = fulfilledResponses
          .map((response) => String(response?.meta?.error || '').trim())
          .find(Boolean)
        const rateLimited = isRateLimitError(firstFailure) || isRateLimitError({ message: providerError })

        startTransition(() => {
          setInternships(normalized)
          setLastSyncedLabel(
            new Date().toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit'
            })
          )
          setFeedError(
            normalized.length === 0
              ? providerError
                ? `Live internship feed is unavailable right now. ${providerError}`
                : `No live internships from the last ${LIVE_JOB_SEARCH_WINDOW_HOURS} hours matched this search yet.`
              : rateLimited
                ? 'Adzuna is rate-limiting right now. Showing the freshest available internships.'
                : partialFailureCount > 0 || providerError
                  ? 'Some live searches timed out. Showing the freshest available internships.'
                  : ''
          )
        })
      } catch (error) {
        if (cancelled) {
          return
        }

        const detail = getLiveSearchErrorDetail(error)

        startTransition(() => {
          setInternships([])
          setLastSyncedLabel('')
          setFeedError(`Live internship feed is unavailable right now. ${detail}`)
        })
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadInternships()

    return () => {
      cancelled = true
    }
  }, [desiredInternshipCount, liveSearchRequests])

  const rankInternshipsByResume = (items) => {
    const recencySortedItems = sortInternshipsByRecency(items)

    if (!resumeSearchProfile) {
      return recencySortedItems
    }

    return recencySortedItems
      .map((internship) => ({
        ...internship,
        resumeFit: scoreInternshipForResume(internship, resumeSearchProfile)
      }))
      .sort((left, right) => {
        const rightScore = Number(right.resumeFit?.score || 0)
        const leftScore = Number(left.resumeFit?.score || 0)
        if (rightScore !== leftScore) {
          return rightScore - leftScore
        }

        const recencyDelta = getInternshipRecencyRank(left) - getInternshipRecencyRank(right)
        if (recencyDelta !== 0) {
          return recencyDelta
        }

        return Number(right.featured) - Number(left.featured)
      })
  }

  const visibleLiveInternships = useMemo(() => {
    // When the search is being driven by resume analysis, the live requests already use
    // resume-derived role suggestions. Avoid filtering those results back out with the
    // raw resume query string shown in the input.
    const normalizedQuery = isResumeGuidedSearch ? '' : deferredQuery.trim().toLowerCase()

    const visibleInternships = internships.filter((internship) =>
      matchesFilters(internship, normalizedQuery, activeFilter, region)
    )

    return rankInternshipsByResume(visibleInternships)
  }, [activeFilter, deferredQuery, internships, isResumeGuidedSearch, region, resumeSearchProfile])

  const visibleResumeFallbackInternships = useMemo(() => {
    const normalizedQuery = isResumeGuidedSearch ? '' : deferredQuery.trim().toLowerCase()

    const visibleInternships = resumeFallbackInternships.filter((internship) =>
      matchesFilters(internship, normalizedQuery, activeFilter, region)
    )

    return rankInternshipsByResume(visibleInternships)
  }, [
    activeFilter,
    deferredQuery,
    isResumeGuidedSearch,
    region,
    resumeFallbackInternships,
    resumeSearchProfile
  ])

  const visibleExpandedRegionLiveInternships = useMemo(() => {
    if (region === 'all') {
      return []
    }

    const normalizedQuery = isResumeGuidedSearch ? '' : deferredQuery.trim().toLowerCase()
    const visibleInternships = internships.filter((internship) =>
      matchesFilters(internship, normalizedQuery, activeFilter, 'all')
    )

    return rankInternshipsByResume(visibleInternships)
  }, [activeFilter, deferredQuery, internships, isResumeGuidedSearch, region, resumeSearchProfile])

  const visibleExpandedRegionResumeFallbackInternships = useMemo(() => {
    if (!resumeSearchProfile || region === 'all') {
      return []
    }

    const visibleInternships = resumeFallbackInternships.filter((internship) =>
      matchesFilters(internship, '', activeFilter, 'all')
    )

    return rankInternshipsByResume(visibleInternships)
  }, [activeFilter, region, resumeFallbackInternships, resumeSearchProfile])

  const filteredInternships = useMemo(() => {
    if (!resumeSearchProfile) {
      if (
        region !== 'all' &&
        visibleLiveInternships.length < MIN_SHOWCASE_INTERNSHIPS &&
        visibleExpandedRegionLiveInternships.length > visibleLiveInternships.length
      ) {
        return sortInternshipsByRecency(
          mergeUniqueInternshipPools(
            visibleLiveInternships,
            [visibleExpandedRegionLiveInternships],
            MIN_SHOWCASE_INTERNSHIPS
          )
        )
      }

      return visibleLiveInternships
    }

    const visibleCountTarget = Math.max(MIN_RESUME_MATCH_COUNT, visibleLiveInternships.length)
    if (
      visibleLiveInternships.length >= MIN_RESUME_MATCH_COUNT &&
      visibleResumeFallbackInternships.length === 0 &&
      visibleExpandedRegionLiveInternships.length === 0 &&
      visibleExpandedRegionResumeFallbackInternships.length === 0
    ) {
      return visibleLiveInternships
    }

    return rankInternshipsByResume(
      mergeUniqueInternshipPools(
        visibleLiveInternships,
        [
          visibleExpandedRegionLiveInternships,
          visibleResumeFallbackInternships,
          visibleExpandedRegionResumeFallbackInternships
        ],
        visibleCountTarget
      )
    ).slice(0, visibleCountTarget)
  }, [
    region,
    resumeSearchProfile,
    visibleExpandedRegionLiveInternships,
    visibleExpandedRegionResumeFallbackInternships,
    visibleLiveInternships,
    visibleResumeFallbackInternships
  ])

  const isShowingAllAvailable =
    filteredInternships.length > 0 && filteredInternships.length < MIN_SHOWCASE_INTERNSHIPS
  const showcaseLabel =
    filteredInternships.length === 0
      ? 'Awaiting live results'
      : isShowingAllAvailable
        ? `Showing all ${filteredInternships.length} live results`
        : `Randomized ${MIN_SHOWCASE_INTERNSHIPS}-${MAX_SHOWCASE_INTERNSHIPS} picks`

  const displayedInternships = useMemo(() => {
    const showcase = selectShowcaseInternships(filteredInternships, {
      resumeGuided: Boolean(resumeSearchProfile)
    })

    return resumeSearchProfile ? rankInternshipsByResume(showcase) : sortInternshipsByRecency(showcase)
  }, [filteredInternships, resumeSearchProfile])

  const isShowingResumeFallback = false

  const liveMetrics = useMemo(
    () => ({
      liveRoles: displayedInternships.length,
      directApplyLinks: displayedInternships.filter((internship) => internship.hasDirectApply).length,
      postedFreshCount: displayedInternships.filter(
        (internship) =>
          Number.isFinite(Number(internship.postedHoursAgo)) &&
          Number(internship.postedHoursAgo) <= LIVE_JOB_SEARCH_WINDOW_HOURS
      ).length,
      adzunaCount: displayedInternships.filter((internship) => internship.provider === 'adzuna').length,
      linkedInCount: displayedInternships.filter((internship) => internship.provider === 'linkedin').length
    }),
    [displayedInternships]
  )

  const isResumeQueryActive =
    Boolean(resumeAppliedQuery) &&
    query.trim().toLowerCase() === resumeAppliedQuery.trim().toLowerCase()

  const hasFatalFeedError = Boolean(feedError) && internships.length === 0
  const hasFeedWarning = Boolean(feedError) && (internships.length > 0 || isShowingResumeFallback)
  const hasLiveResults = displayedInternships.length > 0
  const showOfflineState = hasFatalFeedError && !isShowingResumeFallback

  const feedStatusClassName = isLoading
    ? styles.statusLoading
    : isShowingResumeFallback
      ? styles.statusWarning
      : showOfflineState
      ? styles.statusOffline
      : hasFeedWarning
        ? styles.statusWarning
        : hasLiveResults
          ? styles.statusLive
          : styles.statusIdle

  const feedStatusLabel = isLoading
    ? 'Syncing the latest internships...'
    : isShowingResumeFallback
      ? 'Showing live opportunities tuned to your resume'
      : showOfflineState
      ? 'Live internship board offline'
      : hasFeedWarning
        ? 'Live internship board degraded'
        : hasLiveResults
          ? 'Live opportunities ready'
          : `No new internships in last ${LIVE_JOB_SEARCH_WINDOW_HOURS} hours`

  const sourceMixLabel =
    liveMetrics.adzunaCount > 0 ? 'Adzuna live feed' : 'Live feed waiting'

  return (
    <section className={styles.page}>
      <canvas ref={canvasRef} className={styles.particleCanvas} aria-hidden="true" />
      <div className={styles.scanLine} aria-hidden="true" />

      <div className={styles.boardIntro}>
        <div className={styles.boardEyebrow}>Intern Hunt Production Feed</div>
        <div className={styles.boardHeadingRow}>
          <div>
            <h1 className={styles.boardTitle}>Live Internship Board</h1>
            <p className={styles.boardCopy}>
              Fresh Adzuna internships with exact direct apply links, ranked by your resume analysis
              across a live {sourceMixLabel} stream.
            </p>
          </div>
          <span className={`${styles.statusPill} ${feedStatusClassName}`}>{feedStatusLabel}</span>
        </div>

        <div className={styles.metricGrid}>
          <div className={styles.metricCard}>
            <span className={styles.metricValue}>{liveMetrics.liveRoles}</span>
            <span className={styles.metricLabel}>Live internships</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricValue}>{liveMetrics.directApplyLinks}</span>
            <span className={styles.metricLabel}>Direct apply links</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricValue}>{liveMetrics.postedFreshCount}</span>
            <span className={styles.metricLabel}>Posted in last {LIVE_JOB_SEARCH_WINDOW_HOURS}h</span>
          </div>
        </div>

        <div className={styles.boardMetaRow}>
          <span className={styles.boardMetaPill}>{sourceMixLabel}</span>
          <span className={styles.randomPill}>{showcaseLabel}</span>
          {lastSyncedLabel && <span className={styles.statusMeta}>Updated {lastSyncedLabel}</span>}
        </div>

        {feedError && <p className={styles.statusError}>{feedError}</p>}
      </div>

      <div className={styles.controlsCard}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search by role, skill, company, or location"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className={styles.divider} />
          <select value={region} onChange={(event) => setRegion(event.target.value)}>
            <option value="all">All regions</option>
            <option value="india">India</option>
            <option value="global">International</option>
          </select>
        </div>

        <div className={styles.filterRow}>
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`${styles.filterChip} ${activeFilter === filter.value ? styles.activeChip : ''}`}
              onClick={() => setActiveFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={liveFeedRef} className={styles.feedHeader}>
        <div>
          <div className={styles.feedEyebrow}>Unified live feed</div>
          <h2 className={styles.feedTitle}>{displayedInternships.length} live matches in view</h2>
        </div>
        <p className={styles.feedCopy}>
          {isShowingAllAvailable
            ? `Showing every genuine Adzuna internship returned in the last ${LIVE_JOB_SEARCH_WINDOW_HOURS} hours for the current search.`
            : resumeSearchProfile
              ? `Resume fit leads the ranking, then a randomized live set keeps ${MIN_SHOWCASE_INTERNSHIPS}-${MAX_SHOWCASE_INTERNSHIPS} fresh options rotating.`
              : `Showing a randomized Adzuna set of ${MIN_SHOWCASE_INTERNSHIPS}-${MAX_SHOWCASE_INTERNSHIPS} internships posted within the last ${LIVE_JOB_SEARCH_WINDOW_HOURS} hours.`}
        </p>
      </div>

      <div className={styles.mainGrid}>
        <aside ref={resumeSectionRef} className={styles.resumeRail}>
          <div className={styles.resumePanel}>
            <div className={styles.panelHeaderRow}>
              <div>
                <div className={styles.panelEyebrow}>Resume Match AI</div>
                <h3 className={styles.panelTitle}>
                  Upload once and let live internships reshape around your resume.
                </h3>
                <p className={styles.panelCopy}>
                  Intern Hunt reads your resume, predicts your best-fit role, and re-ranks live
                  Adzuna openings posted in the last {LIVE_JOB_SEARCH_WINDOW_HOURS} hours.
                </p>
              </div>
              <div className={styles.panelRadar} aria-hidden="true">
                <span />
                <span />
                <span />
                <i />
              </div>
            </div>

            <input
              id="intern-hunt-resume-input"
              type="file"
              accept=".pdf,.doc,.docx"
              className={styles.resumeFileInput}
              onChange={(event) => handleResumeFileSelected(event.target.files?.[0])}
              onClick={(event) => {
                event.target.value = null
              }}
            />

            <div
              className={`${styles.dropzone} ${isResumeDragActive ? styles.dropzoneActive : ''}`}
              onDragEnter={handleResumeDragOver}
              onDragOver={handleResumeDragOver}
              onDragLeave={handleResumeDragLeave}
              onDrop={handleResumeDrop}
            >
              <span className={styles.dropzoneBadge}>
                {resumeFile ? 'Resume attached' : 'Drop your resume here'}
              </span>
              <div className={styles.dropzoneTitle}>
                {resumeFile ? resumeFile.name : 'PDF, DOC, or DOCX up to 10 MB'}
              </div>
              <p className={styles.dropzoneCopy}>
                {resumeFile
                  ? `Ready to analyze ${resumeFile.name} and refresh the live board.`
                  : 'Drag and drop your resume, or browse to upload it directly into the match engine.'}
              </p>
              <label htmlFor="intern-hunt-resume-input" className={styles.ghostButton}>
                {resumeFile ? 'Replace Resume' : 'Choose Resume'}
              </label>
            </div>

            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleResumeAnalyze}
                disabled={isResumeAnalyzing || !resumeFile || Boolean(resumeFileValidationError)}
              >
                {isResumeAnalyzing ? 'Analyzing Resume...' : 'Analyze and Match'}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => scrollToSection(liveFeedRef)}
              >
                View Live Board
              </button>
            </div>

            <p className={styles.fileMeta}>
              {resumeFile
                ? `${resumeFile.name} (${formatBytes(resumeFile.size)})`
                : 'Accepted formats: PDF, DOC, DOCX.'}
            </p>

            {!resumeAnalysis && !resumeAnalysisError && (
              <p className={styles.helperText}>
                The same trained model from Resume Predictor powers this workflow. Once analysis is
                complete, the board updates automatically with stronger role-fit ordering and a new
                randomized live Adzuna showcase.
              </p>
            )}

            {resumeAnalysisError && <p className={styles.errorBanner}>{resumeAnalysisError}</p>}

            {resumeAnalysis && (
              <div className={styles.analysisStack}>
                <div className={styles.analysisGrid}>
                  <div className={styles.analysisCard}>
                    <span className={styles.analysisLabel}>Predicted Role</span>
                    <strong className={styles.analysisValue}>
                      {resumeAnalysis.predicted_role || 'Not detected'}
                    </strong>
                  </div>
                  <div className={styles.analysisCard}>
                    <span className={styles.analysisLabel}>Confidence</span>
                    <strong className={styles.analysisValue}>
                      {Math.round(Number(resumeAnalysis.confidence || 0) * 100)}%
                    </strong>
                  </div>
                  <div className={styles.analysisCard}>
                    <span className={styles.analysisLabel}>ATS Score</span>
                    <strong className={styles.analysisValue}>
                      {Math.round(Number(resumeAnalysis.ats_score || 0))}%
                    </strong>
                  </div>
                  <div className={styles.analysisCard}>
                    <span className={styles.analysisLabel}>Experience</span>
                    <strong className={styles.analysisValue}>
                      {Number(resumeAnalysis.experience_years || 0)} yrs
                    </strong>
                  </div>
                </div>

                <div className={styles.analysisCallout}>
                  <p className={styles.analysisNarrative}>
                    {isResumeQueryActive ? (
                      <>
                        Live search is now tuned to <strong>{resumeAppliedQuery}</strong>, and the
                        board is sorted by resume fit first, then refreshed with randomized live
                        picks.
                      </>
                    ) : (
                      <>
                        Resume analysis is ready. Recommended internship query:{' '}
                        <strong>{resumeAppliedQuery}</strong>. Current board results may also
                        reflect extra search or filter changes.
                      </>
                    )}
                  </p>
                  <p className={styles.helperText}>
                    Confidence is <strong>{resumeConfidenceTier.label.toLowerCase()}</strong>.{' '}
                    {resumeConfidenceTier.summary}
                  </p>
                </div>

                <div className={styles.chipSection}>
                  <div className={styles.chipSectionHead}>Suggested Roles</div>
                  <div className={styles.chipRow}>
                    {resumeRoleSuggestions.length > 0 ? (
                      resumeRoleSuggestions.map((role) => (
                        <span key={`resume-role-${role}`} className={styles.skillChip}>
                          {role}
                        </span>
                      ))
                    ) : (
                      <span className={styles.helperText}>No role suggestions were generated yet.</span>
                    )}
                  </div>
                </div>

                <div className={styles.chipSection}>
                  <div className={styles.chipSectionHead}>Extracted Skills</div>
                  <div className={styles.chipRow}>
                    {resumeAnalysis.skills.length > 0 ? (
                      resumeAnalysis.skills.slice(0, 8).map((skill) => (
                        <span key={`resume-skill-${skill}`} className={styles.skillChip}>
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className={styles.helperText}>No skills were extracted from this resume.</span>
                    )}
                  </div>
                </div>

                <div className={styles.chipSection}>
                  <div className={styles.chipSectionHead}>Gap Signals</div>
                  <div className={styles.chipRow}>
                    {resumeAnalysis.missing_skills.length > 0 ? (
                      resumeAnalysis.missing_skills.slice(0, 6).map((skill) => (
                        <span key={`resume-missing-${skill}`} className={styles.missingChip}>
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className={styles.helperText}>
                        No critical missing skills were flagged for this resume.
                      </span>
                    )}
                  </div>
                </div>

                {resumeAnalysis.weaknesses.length > 0 && (
                  <p className={styles.insightNote}>
                    <strong>Top insight:</strong> {resumeAnalysis.weaknesses[0]}
                  </p>
                )}
              </div>
            )}
          </div>
        </aside>

        <div className={styles.cardsGrid}>
          {displayedInternships.length === 0 && (
            <div className={styles.emptyState}>
              {isLoading
                ? 'Loading the live internship board...'
                : resumeSearchProfile
                  ? `No internships from the last ${LIVE_JOB_SEARCH_WINDOW_HOURS} hours matched your resume profile yet. Try switching region or broadening the search.`
                  : `No internships from the last ${LIVE_JOB_SEARCH_WINDOW_HOURS} hours matched the current filters. Try broader keywords or switch region.`}
            </div>
          )}

          {displayedInternships.map((internship, index) => (
            <article
              key={internship.id}
              className={`${styles.card} ${internship.featured ? styles.featuredCard : ''}`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className={styles.logo}>{internship.company.charAt(0)}</div>
              <div className={styles.cardBody}>
                <div className={styles.cardTop}>
                  <h3>{internship.title}</h3>
                  {internship.featured && <span className={`${styles.badge} ${styles.badgeFeatured}`}>Featured</span>}
                  <span className={`${styles.badge} ${styles.badgeLive}`}>Live</span>
                  {internship.resumeFit && (
                    <span
                      className={`${styles.badge} ${styles.fitBadge} ${
                        internship.resumeFit.tone === 'high'
                          ? styles.fitHigh
                          : internship.resumeFit.tone === 'medium'
                            ? styles.fitMedium
                            : styles.fitLow
                      }`}
                    >
                      {internship.resumeFit.label} {internship.resumeFit.score}%
                    </span>
                  )}
                  <span className={`${styles.badge} ${styles.badgeSource}`}>
                    {internship.source}
                  </span>
                </div>
                <p className={styles.companyLine}>
                  <strong>{internship.company}</strong>
                  <span>{internship.location}</span>
                  <span>{internship.mode}</span>
                </p>
                <p className={styles.metaLine}>
                  <span>{internship.duration}</span>
                  <span>Posted {internship.posted}</span>
                  <span>{internship.stipend}</span>
                </p>
                {internship.resumeFit && <p className={styles.fitMeta}>{internship.resumeFit.summary}</p>}
                <div className={styles.tagRow}>
                  {internship.tags.map((tag) => (
                    <span key={`${internship.id}-${tag}`} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className={styles.cardActions}>
                <a
                  className={styles.applyBtn}
                  href={internship.directApplyUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${internship.title} at ${internship.company} via ${internship.source}`}
                >
                  {internship.directApplyLabel}
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>

    </section>
  )
}

export default InternHunt
