import React, { useEffect, useMemo, useRef, useState } from 'react'
import JobMatchingEngine from '../../components/resume/JobMatchingEngine'
import VoiceAssistant from '../../components/resume/VoiceAssistant'
import { matchResumesWithJob, uploadResumesToAts } from '../../services/atsApi'
import { predictCareerPath, searchJobs } from '../../services/mlServiceApi'
import styles from './ResumePredictor.module.css'

const MAX_FILE_BYTES = 10 * 1024 * 1024
const ACCEPTED_EXTENSIONS = ['.pdf', '.doc', '.docx']
const REMOTE_SLOT_COUNT = 5
const REMOTE_FETCH_TIMEOUT_MS = 12000
const INDIA_LOCATION_KEYWORDS = [
  'india',
  'bengaluru',
  'bangalore',
  'hyderabad',
  'pune',
  'mumbai',
  'chennai',
  'gurugram',
  'gurgaon',
  'noida',
  'delhi',
  'ncr',
  'new delhi'
]

const STEPS = [
  { id: 1, label: 'Upload Resume' },
  { id: 2, label: 'Prediction Results' },
  { id: 3, label: 'Job Matching' }
]

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function cleanReadableText(value, maxLength = 240) {
  const normalized = String(value || '')
    .replace(/\u0000/g, ' ')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) {
    return ''
  }

  const alphaNumericCount = (normalized.match(/[A-Za-z0-9]/g) || []).length
  if (alphaNumericCount === 0) {
    return ''
  }

  if (maxLength > 0 && normalized.length > maxLength) {
    return `${normalized.slice(0, maxLength).trim()}...`
  }

  return normalized
}

function sanitizeList(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => cleanReadableText(item, 120))
    .filter(Boolean)
}

function dedupeTextList(items) {
  const seen = new Set()
  const output = []

  for (const item of sanitizeList(items)) {
    const key = item.toLowerCase()
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    output.push(item)
  }

  return output
}

function truncateText(value, maxLength = 220) {
  const text = String(value || '').trim()
  if (text.length <= maxLength) {
    return text
  }
  return `${text.slice(0, maxLength).trim()}...`
}

function cleanDescription(value) {
  const raw = String(value || '')
  const withoutTags = raw.replace(/<[^>]*>/g, ' ')
  const decoded = withoutTags
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/')
  return truncateText(decoded.replace(/\s+/g, ' ').trim(), 260)
}

function parseExperienceYears(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value))
  }

  const text = String(value || '').toLowerCase()
  if (!text) {
    return 0
  }

  const rangeMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)/)
  if (rangeMatch) {
    const high = Number.parseFloat(rangeMatch[2])
    if (Number.isFinite(high)) {
      return Math.max(0, Math.round(high))
    }
  }

  const singleMatch = text.match(/(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)/)
  if (singleMatch) {
    const years = Number.parseFloat(singleMatch[1])
    if (Number.isFinite(years)) {
      return Math.max(0, Math.round(years))
    }
  }

  const plainNumber = Number.parseFloat(text)
  if (Number.isFinite(plainNumber)) {
    return Math.max(0, Math.round(plainNumber))
  }

  return 0
}

function sanitizeJobs(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((job, index) => ({
      id: String(job?.id || job?.apply_link || `${index}`),
      title: String(job?.title || 'Untitled role').trim(),
      company: String(job?.company || 'Unknown company').trim(),
      location: String(job?.location || 'Location not specified').trim(),
      description: cleanDescription(job?.description || ''),
      apply_link: String(job?.apply_link || '').trim(),
      posted_date: String(job?.posted_date || '').trim(),
      is_remote: Boolean(job?.is_remote),
      employment_type: String(job?.employment_type || '').trim(),
      source: String(job?.source || '').trim()
    }))
    .filter((job) => job.title)
}

function jobKey(job) {
  return `${String(job?.title || '').toLowerCase()}-${String(job?.company || '').toLowerCase()}-${String(job?.location || '').toLowerCase()}`
}

function dedupeJobs(jobs) {
  const seen = new Set()
  const output = []
  for (const job of jobs) {
    const key = jobKey(job)
    if (!key.trim() || seen.has(key)) {
      continue
    }
    seen.add(key)
    output.push(job)
  }
  return output
}

function isIndianLocation(value) {
  const text = String(value || '').toLowerCase()
  return INDIA_LOCATION_KEYWORDS.some((keyword) => text.includes(keyword))
}

function isIndianJob(job) {
  const locationText = String(job?.location || '').toLowerCase()
  if (isIndianLocation(locationText)) {
    return true
  }

  const deepCorpus = `${job?.title || ''} ${job?.description || ''} ${job?.apply_link || ''} ${job?.source || ''} ${
    job?.company || ''
  }`.toLowerCase()
  if (isIndianLocation(deepCorpus)) {
    return true
  }

  return /(?:\.in\/|\.co\.in\/)/.test(deepCorpus)
}

function isRemoteJob(job) {
  if (job?.is_remote) {
    return true
  }
  const corpus =
    `${job?.location || ''} ${job?.employment_type || ''} ${job?.title || ''} ${job?.description || ''} ${
      job?.apply_link || ''
    }`.toLowerCase()
  return /\bremote\b|\bwork from home\b|\bwfh\b|\banywhere\b/.test(corpus)
}

function computeInterestScore(job, role, skills) {
  const roleTokens = String(role || '')
    .toLowerCase()
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 2)
  const skillTokens = sanitizeList(skills)
    .map((item) => item.toLowerCase())
    .filter((item) => item.length > 2)
    .slice(0, 12)
  const corpus = `${job.title} ${job.description} ${job.company}`.toLowerCase()

  let score = 35
  for (const token of roleTokens) {
    if (corpus.includes(token)) {
      score += 8
    }
  }
  for (const token of skillTokens) {
    if (corpus.includes(token)) {
      score += 4
    }
  }
  if (isRemoteJob(job)) {
    score += 6
  }
  return clamp(score, 20, 99)
}

function sortByInterest(jobs, role, skills) {
  return [...jobs]
    .map((job) => ({
      ...job,
      interest_score: computeInterestScore(job, role, skills)
    }))
    .sort((left, right) => right.interest_score - left.interest_score)
}

function sourceLabel(job) {
  const explicit = String(job?.source || '').trim()
  if (explicit) {
    return explicit
  }
  const link = String(job?.apply_link || '').toLowerCase()
  if (link.includes('linkedin')) {
    return 'LinkedIn'
  }
  if (link.includes('naukri')) {
    return 'Naukri'
  }
  if (link.includes('indeed')) {
    return 'Indeed'
  }
  return 'Live Source'
}

function withTimeout(promise, timeoutMs) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return promise
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('REQUEST_TIMEOUT'))
    }, timeoutMs)

    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

function normalizePrediction(data) {
  if (!data || typeof data !== 'object') {
    return null
  }

  // Handle ML Service response format (career_path, confidence, ats_score, jobs)
  if (data.career_path) {
    const rawConfidence = Number(data.confidence)
    const confidence =
      Number.isFinite(rawConfidence) && rawConfidence > 1
        ? clamp(rawConfidence / 100, 0, 1)
        : clamp(rawConfidence || 0, 0, 1)
    const experienceYears = parseExperienceYears(data.experience_years || data.required_experience)

    return {
      name: cleanReadableText(data.name, 80),
      skills: sanitizeList(data.extracted_skills || data.skills || data.required_skills || []),
      education: cleanReadableText(data.education || data.required_education, 180),
      certifications: sanitizeList(data.certifications || []),
      projects: sanitizeList(data.projects || []),
      experience_years: Number.isFinite(experienceYears) ? Math.max(0, experienceYears) : 0,
      predicted_role: cleanReadableText(data.career_path || data.predicted_role, 80),
      confidence,
      ats_score: Number(data.ats_score || 0),
      predicted_category: cleanReadableText(data.predicted_category, 80),
      job_description_used: cleanReadableText(data.job_description_used, 320),
      missing_skills: sanitizeList(data.missing_skills || []),
      weaknesses: sanitizeList(data.weaknesses || data.resume_weaknesses || []),
      jobs: sanitizeJobs(data.jobs)
    }
  }

  // Handle legacy backend response format
  const rawConfidence = Number(data.confidence)
  const confidence =
    Number.isFinite(rawConfidence) && rawConfidence > 1
      ? clamp(rawConfidence / 100, 0, 1)
      : clamp(rawConfidence || 0, 0, 1)

  const experienceYears = parseExperienceYears(data.experience_years || data.required_experience)

  return {
    name: cleanReadableText(data.name, 80),
    skills: sanitizeList(data.skills),
    education: cleanReadableText(data.education, 180),
    certifications: sanitizeList(data.certifications),
    projects: sanitizeList(data.projects),
    experience_years: Number.isFinite(experienceYears) ? Math.max(0, experienceYears) : 0,
    predicted_role: cleanReadableText(data.predicted_role, 80),
    confidence,
    ats_score: Number(data.ats_score || 0),
    predicted_category: cleanReadableText(data.predicted_category, 80),
    job_description_used: cleanReadableText(data.job_description_used, 320),
    missing_skills: sanitizeList(data.missing_skills),
    weaknesses: sanitizeList(data.weaknesses),
    jobs: sanitizeJobs(data.jobs)
  }
}

function formatBytes(size) {
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

  const mb = kb / 1024
  return `${mb.toFixed(2)} MB`
}

function buildAutoJobDescription(prediction, skills) {
  const role = String(prediction?.predicted_role || '').trim() || 'Software Engineer'
  const years = Number(prediction?.experience_years || 0)
  const normalizedSkills = sanitizeList(skills).slice(0, 12)
  const skillsText = normalizedSkills.length
    ? normalizedSkills.join(', ')
    : 'software development, problem solving, API development'

  return [
    `Hiring for ${role}.`,
    `Required skills: ${skillsText}.`,
    years > 0 ? `Preferred experience: around ${years} years.` : 'Experience: 0-5 years.',
    'Must be able to build production-ready solutions and collaborate with cross-functional teams.'
  ].join(' ')
}

function buildWeaknessInsights(prediction, missingSkills) {
  if (!prediction) {
    return []
  }

  const insights = [...dedupeTextList(prediction.weaknesses || [])]
  const atsScore = clamp(Math.round(Number(prediction.ats_score || 0)), 0, 100)
  const confidencePercent = Math.round(clamp(Number(prediction.confidence || 0), 0, 1) * 100)
  const detectedSkillsCount = sanitizeList(prediction.skills).length

  if (atsScore < 55) {
    insights.push(
      'ATS score is below shortlist benchmark. Add stronger role-specific keywords and quantified achievements.'
    )
  } else if (atsScore < 75) {
    insights.push(
      'ATS score is moderate. Tighten role alignment and measurable impact statements to improve recruiter screening.'
    )
  }

  if (confidencePercent < 55) {
    insights.push('Role prediction confidence is low. Resume narrative may be broad and needs clearer positioning.')
  }

  if (detectedSkillsCount > 0 && detectedSkillsCount < 6) {
    insights.push('Skill coverage appears limited for competitive screening. Add relevant frameworks and tool depth.')
  }

  const prioritizedMissing = dedupeTextList(missingSkills).slice(0, 5)
  if (prioritizedMissing.length > 0) {
    insights.push(`Top missing skills: ${prioritizedMissing.join(', ')}.`)
  }

  if (insights.length === 0) {
    insights.push('No major weakness detected. Keep improving role-specific outcomes and project impact metrics.')
  }

  return dedupeTextList(insights).slice(0, 4)
}

function buildVoiceAssistantSummary(prediction, weaknesses, missingSkills) {
  if (!prediction) {
    return ''
  }

  const atsScore = clamp(Math.round(Number(prediction.ats_score || 0)), 0, 100)
  const role = cleanReadableText(prediction.predicted_role || 'your target role', 80) || 'your target role'
  const leadWeakness =
    cleanReadableText(Array.isArray(weaknesses) ? weaknesses[0] : '', 180) || 'No major weakness detected.'
  const prioritizedMissing = dedupeTextList(missingSkills).slice(0, 5)
  const missingLine = prioritizedMissing.length
    ? prioritizedMissing.join(', ')
    : 'No critical missing skills detected for the current job description.'

  return [
    'Resume analysis complete.',
    `ATS score is ${atsScore} percent for ${role}.`,
    `Primary weakness: ${leadWeakness}`,
    `Missing skills to prioritize: ${missingLine}`,
    'Next step: update your resume with targeted keywords and measurable outcomes, then run ATS match again.'
  ].join(' ')
}

const ResumePredictor = ({ embedded = false }) => {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [prediction, setPrediction] = useState(null)
  const [editedSkills, setEditedSkills] = useState([])
  const [newSkill, setNewSkill] = useState('')
  const [showMatching, setShowMatching] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [analysisStarted, setAnalysisStarted] = useState(false)
  const [jobDescriptionInput, setJobDescriptionInput] = useState('')
  const [jobLocation, setJobLocation] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(true)
  const [atsJobDescription, setAtsJobDescription] = useState('')
  const [atsExtraFiles, setAtsExtraFiles] = useState([])
  const [atsLoading, setAtsLoading] = useState(false)
  const [atsError, setAtsError] = useState('')
  const [atsResults, setAtsResults] = useState([])
  const [remoteJobsLoading, setRemoteJobsLoading] = useState(false)
  const [remoteJobsError, setRemoteJobsError] = useState('')
  const [remoteJobs, setRemoteJobs] = useState({
    india: [],
    international: []
  })

  useEffect(() => {
    if (!prediction) {
      setEditedSkills([])
      return
    }

    setEditedSkills(sanitizeList(prediction.skills))
  }, [prediction])

  useEffect(() => {
    if (showMatching) {
      setStep(3)
      return
    }

    if (loading || prediction || (analysisStarted && error)) {
      setStep(2)
      return
    }

    setStep(1)
  }, [analysisStarted, loading, prediction, showMatching, error])

  useEffect(() => {
    if (!prediction) {
      setRemoteJobs({ india: [], international: [] })
      setRemoteJobsError('')
      setRemoteJobsLoading(false)
      return
    }

    let cancelled = false

    const loadRemoteJobs = async () => {
      setRemoteJobsLoading(true)
      setRemoteJobsError('')

      const role = String(prediction.predicted_role || 'Software Engineer').trim()
      const interestSkills = sanitizeList(editedSkills.length ? editedSkills : prediction.skills).slice(0, 3)
      const roleQuery = role
      const skillsQuery = interestSkills.length ? `${role} ${interestSkills.join(' ')}`.trim() : role
      const indiaQueries = Array.from(
        new Set([
          `${roleQuery} India remote`,
          interestSkills.length ? `${roleQuery} ${interestSkills[0]} India remote` : ''
        ])
      )
        .filter(Boolean)
        .slice(0, 1)
      const intlQueries = Array.from(
        new Set([
          `${roleQuery} remote`,
          skillsQuery && skillsQuery !== roleQuery ? `${skillsQuery} remote` : ''
        ])
      )
        .filter(Boolean)
        .slice(0, 1)

      try {
        const requestSpecs = [
          ...indiaQueries.map((query) => ({
            bucket: 'india',
            run: () =>
              withTimeout(
                searchJobs(query, {
                  remote: true,
                  page: 1
                }),
                REMOTE_FETCH_TIMEOUT_MS
              )
          })),
          ...intlQueries.map((query) => ({
            bucket: 'international',
            run: () =>
              withTimeout(
                searchJobs(query, {
                  remote: true,
                  page: 1
                }),
                REMOTE_FETCH_TIMEOUT_MS
              )
          }))
        ]

        const settledResponses = await Promise.allSettled(requestSpecs.map((spec) => spec.run()))
        const fulfilled = settledResponses
          .map((result, index) => ({ result, spec: requestSpecs[index] }))
          .filter((item) => item.result.status === 'fulfilled')
          .map((item) => ({
            bucket: item.spec.bucket,
            payload: item.result.value
          }))

        if (fulfilled.length === 0) {
          throw new Error('NO_LIVE_JOB_RESPONSES')
        }

        const livePayloads = fulfilled.map((item) => item.payload)
        const liveJobs = sanitizeJobs(livePayloads.flatMap((payload) => payload?.jobs || []))
        const predictionJobs = sanitizeJobs(prediction.jobs || [])
        const allMeta = livePayloads.map((payload) => payload?.meta).filter(Boolean)
        const providerSet = new Set(
          allMeta
            .map((meta) => String(meta?.provider || '').trim().toLowerCase())
            .filter(Boolean)
        )
        const providerError =
          allMeta.find((meta) => typeof meta?.error === 'string' && meta.error.trim())?.error || ''
        const providerErrorLower = providerError.toLowerCase()

        const indiaPool = dedupeJobs(
          [
            ...liveJobs.filter((job) => isIndianJob(job)),
            ...predictionJobs.filter((job) => isIndianJob(job))
          ].filter((job) => isRemoteJob(job))
        )
        const intlPool = dedupeJobs(
          [
            ...liveJobs.filter((job) => !isIndianJob(job)),
            ...predictionJobs.filter((job) => !isIndianJob(job))
          ].filter((job) => isRemoteJob(job))
        )

        const rankedIndia = sortByInterest(indiaPool, role, interestSkills)
        const rankedIntl = sortByInterest(intlPool, role, interestSkills)

        const topIndia = rankedIndia.slice(0, REMOTE_SLOT_COUNT)
        const topIntl = rankedIntl.slice(0, REMOTE_SLOT_COUNT)

        if (!cancelled) {
          setRemoteJobs({
            india: topIndia,
            international: topIntl
          })
          if (providerSet.has('none')) {
            setRemoteJobsError(
              'JSearch API key is missing. Add JSEARCH_API_KEY in backend/.env or rexion-backend/.env and restart services.'
            )
          } else if (providerSet.has('arbeitnow')) {
            setRemoteJobsError(
              'Using fallback jobs source. Set JSEARCH_API_KEY to fetch live jobs from your configured provider.'
            )
          } else if (providerErrorLower.includes('429') || providerErrorLower.includes('quota')) {
            setRemoteJobsError(
              'JSearch quota exceeded (429). Upgrade/reset your RapidAPI JSearch plan to fetch live jobs.'
            )
          } else if (providerError) {
            setRemoteJobsError('Live jobs API returned an issue. Showing best available matches.')
          } else if (topIndia.length < REMOTE_SLOT_COUNT || topIntl.length < REMOTE_SLOT_COUNT) {
            setRemoteJobsError('Limited live remote results right now. Showing best available matches.')
          }
        }
      } catch (fetchError) {
        const predictionRemote = sanitizeJobs(prediction.jobs || []).filter((job) => isRemoteJob(job))
        const rankedIndia = sortByInterest(
          predictionRemote.filter((job) => isIndianJob(job)),
          role,
          interestSkills
        )
        const rankedIntl = sortByInterest(
          predictionRemote.filter((job) => !isIndianJob(job)),
          role,
          interestSkills
        )

        if (!cancelled) {
          setRemoteJobs({
            india: rankedIndia.slice(0, REMOTE_SLOT_COUNT),
            international: rankedIntl.slice(0, REMOTE_SLOT_COUNT)
          })
          setRemoteJobsError('Live remote jobs could not be loaded. Showing available remote matches.')
        }
      } finally {
        if (!cancelled) {
          setRemoteJobsLoading(false)
        }
      }
    }

    loadRemoteJobs()

    return () => {
      cancelled = true
    }
  }, [prediction, editedSkills])

  const resumeForMatching = useMemo(() => {
    if (!prediction) {
      return null
    }

    return {
      name: prediction.name || 'Candidate',
      skills: editedSkills,
      education: prediction.education,
      certifications: prediction.certifications,
      projects: prediction.projects,
      experience_years: prediction.experience_years,
      role_target: prediction.predicted_role || 'Software Engineer'
    }
  }, [editedSkills, prediction])

  const prioritizedMissingSkills = useMemo(() => {
    if (!prediction) {
      return []
    }

    if (Array.isArray(atsResults) && atsResults.length > 0) {
      const ranked = [...atsResults].sort((left, right) => Number(right?.ats_score || 0) - Number(left?.ats_score || 0))
      const fromAts = ranked.flatMap((result) => sanitizeList(result?.missing_skills || []))
      const dedupedAts = dedupeTextList(fromAts)
      if (dedupedAts.length > 0) {
        return dedupedAts.slice(0, 8)
      }
    }

    return dedupeTextList(prediction.missing_skills || []).slice(0, 8)
  }, [atsResults, prediction])

  const weaknessInsights = useMemo(
    () => buildWeaknessInsights(prediction, prioritizedMissingSkills),
    [prediction, prioritizedMissingSkills]
  )

  const voiceAssistantMessage = useMemo(
    () => buildVoiceAssistantSummary(prediction, weaknessInsights, prioritizedMissingSkills),
    [prediction, weaknessInsights, prioritizedMissingSkills]
  )

  const validateFile = (selectedFile) => {
    if (!selectedFile) {
      return 'Please choose a resume file.'
    }

    const lowerName = selectedFile.name.toLowerCase()
    const validExtension = ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
    if (!validExtension) {
      return 'Only PDF, DOC, and DOCX files are supported.'
    }

    if (selectedFile.size > MAX_FILE_BYTES) {
      return 'File too large. Maximum supported size is 10MB.'
    }

    return ''
  }

  const onFileSelected = (selectedFile) => {
    const validationError = validateFile(selectedFile)
    if (validationError) {
      setError(validationError)
      setFile(null)
      setAnalysisStarted(false)
      return
    }

    setError('')
    setAnalysisStarted(false)
    setFile(selectedFile)
  }

  const handleAnalyze = async () => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      setAnalysisStarted(false)
      return
    }

    setAnalysisStarted(true)
    setError('')
    setLoading(true)
    setShowMatching(false)

    try {
      const predictionOptions = {
        jobDescription: jobDescriptionInput.trim(),
        location: jobLocation.trim(),
        remote: remoteOnly
      }

      const response = await predictCareerPath(file, predictionOptions)

      const normalized = normalizePrediction(response)

      if (!normalized) {
        throw new Error('Prediction API returned an invalid response.')
      }

      setPrediction(normalized)
      setLastResult(normalized)
      setAtsError('')
      setAtsResults([])
      setAtsExtraFiles([])
      if (!atsJobDescription && normalized.job_description_used) {
        setAtsJobDescription(normalized.job_description_used)
      }
    } catch (requestError) {
      const message =
        requestError?.response?.data?.message ||
        requestError.message ||
        'Unable to analyze this resume right now.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const removeSkill = (skillToRemove) => {
    setEditedSkills((current) => current.filter((skill) => skill !== skillToRemove))
  }

  const addSkill = () => {
    const value = newSkill.trim()
    if (!value) {
      return
    }

    setEditedSkills((current) => {
      const alreadyPresent = current.some((item) => item.toLowerCase() === value.toLowerCase())
      if (alreadyPresent) {
        return current
      }
      return [...current, value]
    })
    setNewSkill('')
  }

  const handleReupload = () => {
    setFile(null)
    setPrediction(null)
    setShowMatching(false)
    setEditedSkills([])
    setNewSkill('')
    setError('')
    setAnalysisStarted(false)
    setJobDescriptionInput('')
    setJobLocation('')
    setRemoteOnly(true)
    setAtsJobDescription('')
    setAtsExtraFiles([])
    setAtsLoading(false)
    setAtsError('')
    setAtsResults([])
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const useLastResult = () => {
    if (!lastResult) {
      return
    }

    setPrediction(lastResult)
    setError('')
    setShowMatching(false)
    setAnalysisStarted(true)
  }

  const handleRunAtsMatch = async () => {
    const manualJd = atsJobDescription.trim()
    const jd = manualJd || buildAutoJobDescription(prediction, editedSkills)

    if (!file && atsExtraFiles.length === 0) {
      setAtsError('Upload at least one resume file before running ATS match.')
      return
    }

    const candidateFiles = [file, ...atsExtraFiles].filter(Boolean)
    const uniqueByNameSize = new Map()
    for (const candidate of candidateFiles) {
      const key = `${candidate.name}-${candidate.size}`
      if (!uniqueByNameSize.has(key)) {
        uniqueByNameSize.set(key, candidate)
      }
    }
    const uniqueFiles = Array.from(uniqueByNameSize.values())

    setAtsLoading(true)
    setAtsError('')
    try {
      const uploadPayload = await uploadResumesToAts(uniqueFiles)
      const resumeIds =
        uploadPayload?.resumes?.map((item) => item.resume_id).filter(Boolean) || []

      if (resumeIds.length === 0) {
        throw new Error('ATS upload succeeded but no resume IDs were returned.')
      }

      const matchPayload = await matchResumesWithJob({
        jobDescription: jd,
        resumeIds
      })

      const results = Array.isArray(matchPayload?.results) ? matchPayload.results : []
      setAtsResults(results)
      if (results.length === 0) {
        setAtsError('No ATS results returned for the uploaded resumes.')
      }
    } catch (atsRequestError) {
      const isNetworkFailure =
        !atsRequestError?.response &&
        /network error|failed to fetch|load failed|ecconnrefused|err_network/i.test(
          String(atsRequestError?.message || '')
        )
      const atsServiceBaseUrl =
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/ml`
      const message =
        isNetworkFailure
          ? `ATS service is unreachable at ${atsServiceBaseUrl}. Start the Python service and retry.`
          : atsRequestError?.response?.data?.message ||
            atsRequestError?.response?.data?.detail ||
            atsRequestError.message ||
            'ATS engine request failed.'
      setAtsError(message)
    } finally {
      setAtsLoading(false)
    }
  }

  return (
    <div className={`${styles.container} ${embedded ? styles.embedded : ''}`}>
      {!embedded && (
        <div className={styles.videoLayer} aria-hidden="true">
          <video
            className={styles.videoBackground}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          >
            <source src="/videos/resume-bg.mp4" type="video/mp4" />
          </video>
          <div className={styles.videoOverlay} />
        </div>
      )}
      <div className={styles.content}>
        <header className={styles.header}>
          <p className={styles.kicker}>RESUME TO JOB PIPELINE</p>
          <h1 className={styles.title}>Analyze Resume and Find Matching Jobs</h1>
          <p className={styles.subtitle}>
            Upload your resume, review extracted profile data, then jump straight into role-based
            job opportunities.
          </p>
          <div className={styles.headerActions}>
            <button type="button" className={styles.secondaryButton} onClick={handleReupload}>
              Re-upload
            </button>
            {lastResult && !prediction && (
              <button type="button" className={styles.secondaryButton} onClick={useLastResult}>
                Restore Last Result
              </button>
            )}
          </div>
        </header>

        <div className={styles.stepper}>
          {STEPS.map((item) => {
            const isComplete = step > item.id
            const isCurrent = step === item.id

            return (
              <div key={item.id} className={styles.stepItem}>
                <div
                  className={`${styles.stepIndex} ${isComplete ? styles.complete : ''} ${
                    isCurrent ? styles.current : ''
                  }`}
                >
                  {item.id}
                </div>
                <span className={styles.stepLabel}>{item.label}</span>
              </div>
            )
          })}
        </div>

        <section className={`${styles.panel} ${styles.fadeSlide}`}>
          <h2 className={styles.panelTitle}>Step 1 - Upload Resume</h2>

          <div
            className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ''}`}
            onDragEnter={(event) => {
              event.preventDefault()
              setDragActive(true)
            }}
            onDragOver={(event) => {
              event.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={(event) => {
              event.preventDefault()
              setDragActive(false)
            }}
            onDrop={(event) => {
              event.preventDefault()
              setDragActive(false)
              onFileSelected(event.dataTransfer.files?.[0])
            }}
          >
            <input
              ref={inputRef}
              id="resume-input"
              type="file"
              accept=".pdf,.doc,.docx"
              className={styles.fileInput}
              onChange={(event) => onFileSelected(event.target.files?.[0])}
            />
            <p className={styles.dropTitle}>Drag and drop your PDF or DOCX here</p>
            <p className={styles.dropHint}>or click below to browse files</p>
            <label htmlFor="resume-input" className={styles.primaryButton}>
              Choose Resume
            </label>
            {file && (
              <p className={styles.fileInfo}>
                {file.name} ({formatBytes(file.size)})
              </p>
            )}
          </div>

          <div className={styles.queryGrid}>
            <textarea
              value={jobDescriptionInput}
              onChange={(event) => setJobDescriptionInput(event.target.value)}
              placeholder="Optional: paste a target job description for ATS score. If empty, auto JD is used."
              className={styles.jobTextarea}
            />
            <div className={styles.skillInputRow}>
              <input
                value={jobLocation}
                onChange={(event) => setJobLocation(event.target.value)}
                placeholder="Optional job location (e.g. San Francisco, CA)"
                className={styles.textInput}
              />
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(event) => setRemoteOnly(event.target.checked)}
                  className={styles.checkboxInput}
                />
                Remote-first jobs
              </label>
            </div>
          </div>

          <button
            type="button"
            className={styles.analyzeButton}
            onClick={handleAnalyze}
            disabled={loading || !file}
          >
            {loading ? 'Analyzing Resume...' : 'Analyze Resume'}
          </button>

          {error && !analysisStarted && <p className={styles.error}>{error}</p>}
        </section>

        {(loading || prediction || (analysisStarted && error)) && (
          <section className={`${styles.panel} ${styles.fadeSlide}`}>
            <h2 className={styles.panelTitle}>Step 2 - Prediction Results</h2>

            {loading && (
              <div className={styles.loadingState}>
                <span className={styles.spinner} />
                <p>Running AI extraction and prediction...</p>
              </div>
            )}

            {!loading && error && <p className={styles.error}>{error}</p>}

            {!loading && prediction && (
              <>
                <div className={styles.resultGrid}>
                  <div className={styles.resultCard}>
                    <p className={styles.resultLabel}>Name</p>
                    <p className={styles.resultValue}>{prediction.name || 'Not detected'}</p>
                  </div>
                  <div className={styles.resultCard}>
                    <p className={styles.resultLabel}>Education</p>
                    <p className={styles.resultValue}>{prediction.education || 'Not detected'}</p>
                  </div>
                  <div className={styles.resultCard}>
                    <p className={styles.resultLabel}>Experience</p>
                    <p className={styles.resultValue}>{prediction.experience_years} years</p>
                  </div>
                  <div className={styles.resultCard}>
                    <p className={styles.resultLabel}>Predicted Role</p>
                    <p className={styles.resultValue}>{prediction.predicted_role || 'Not detected'}</p>
                  </div>
                  <div className={styles.resultCard}>
                    <p className={styles.resultLabel}>ATS Score</p>
                    <p className={styles.resultValue}>{Math.round(prediction.ats_score || 0)}%</p>
                  </div>
                  <div className={styles.resultCard}>
                    <p className={styles.resultLabel}>ATS Category</p>
                    <p className={styles.resultValue}>{prediction.predicted_category || 'Not detected'}</p>
                  </div>
                </div>

                <div className={styles.confidenceWrap}>
                  <div className={styles.confidenceHeader}>
                    <span>Prediction Confidence</span>
                    <strong>{Math.round(prediction.confidence * 100)}%</strong>
                  </div>
                  <div className={styles.confidenceTrack}>
                    <div
                      className={styles.confidenceFill}
                      style={{ width: `${Math.round(prediction.confidence * 100)}%` }}
                    />
                  </div>
                </div>

                <div className={styles.skillsSection}>
                  <p className={styles.resultLabel}>Skills (editable)</p>
                  <div className={styles.chipList}>
                    {editedSkills.length === 0 && <span className={styles.emptyText}>No skills found yet.</span>}
                    {editedSkills.map((skill) => (
                      <span key={skill} className={styles.skillChip}>
                        {skill}
                        <button
                          type="button"
                          className={styles.removeChip}
                          onClick={() => removeSkill(skill)}
                          aria-label={`Remove ${skill}`}
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className={styles.skillInputRow}>
                    <input
                      value={newSkill}
                      onChange={(event) => setNewSkill(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          addSkill()
                        }
                      }}
                      placeholder="Add a skill"
                      className={styles.textInput}
                    />
                    <button type="button" className={styles.secondaryButton} onClick={addSkill}>
                      Add Skill
                    </button>
                  </div>
                </div>

                <div className={styles.listGrid}>
                  <div className={styles.listCard}>
                    <p className={styles.resultLabel}>Certifications</p>
                    {prediction.certifications.length === 0 ? (
                      <p className={styles.emptyText}>No certifications detected.</p>
                    ) : (
                      <ul className={styles.list}>
                        {prediction.certifications.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className={styles.listCard}>
                    <p className={styles.resultLabel}>Projects</p>
                    {prediction.projects.length === 0 ? (
                      <p className={styles.emptyText}>No projects detected.</p>
                    ) : (
                      <ul className={styles.list}>
                        {prediction.projects.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className={styles.listCard}>
                    <p className={styles.resultLabel}>Weakness Insights</p>
                    {weaknessInsights.length === 0 ? (
                      <p className={styles.emptyText}>No major weakness detected.</p>
                    ) : (
                      <ul className={styles.list}>
                        {weaknessInsights.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className={styles.atsSection}>
                  <p className={styles.resultLabel}>ATS Match (Python Model)</p>
                  {prediction.job_description_used && (
                    <p className={styles.jobMeta}>
                      Active JD: {truncateText(prediction.job_description_used, 180)}
                    </p>
                  )}
                  <p className={styles.emptyText}>
                    Job description is optional. ATS will auto-generate it from resume role and skills.
                  </p>
                  {prediction.missing_skills?.length > 0 && (
                    <div className={styles.atsSkillWrap}>
                      <p className={styles.resultLabel}>Missing Skills vs Current JD</p>
                      <div className={styles.chipList}>
                        {prediction.missing_skills.map((skill) => (
                          <span key={`predict-missing-${skill}`} className={styles.missingSkillChip}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <textarea
                    value={atsJobDescription}
                    onChange={(event) => setAtsJobDescription(event.target.value)}
                    placeholder="Optional: paste your own job description. Leave empty for auto mode."
                    className={styles.jobTextarea}
                  />
                  <div className={styles.atsActions}>
                    <label htmlFor="ats-files" className={styles.secondaryButton}>
                      Add More Resumes
                    </label>
                    <input
                      id="ats-files"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      multiple
                      className={styles.fileInput}
                      onChange={(event) => setAtsExtraFiles(Array.from(event.target.files || []))}
                    />
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={handleRunAtsMatch}
                      disabled={atsLoading}
                    >
                      {atsLoading ? 'Running ATS...' : 'Run ATS Match'}
                    </button>
                  </div>
                  {atsExtraFiles.length > 0 && (
                    <p className={styles.fileInfo}>
                      {atsExtraFiles.length} extra resume(s) selected for ranking.
                    </p>
                  )}
                  {atsError && <p className={styles.error}>{atsError}</p>}

                  {atsResults.length > 0 && (
                    <div className={styles.atsResultList}>
                      {atsResults.map((result) => (
                        <article key={result.resume_id} className={styles.atsResultCard}>
                          <div className={styles.atsTopRow}>
                            <strong>{result.filename}</strong>
                            <span className={styles.atsRank}>Rank #{result.rank}</span>
                          </div>
                          <p className={styles.atsMeta}>
                            ATS Score: {result.ats_score}% | Category: {result.predicted_category}
                          </p>
                          <div className={styles.atsSkillWrap}>
                            <p className={styles.resultLabel}>Extracted Skills</p>
                            <div className={styles.chipList}>
                              {result.extracted_skills?.map((skill) => (
                                <span key={`${result.resume_id}-${skill}`} className={styles.skillChip}>
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className={styles.atsSkillWrap}>
                            <p className={styles.resultLabel}>Missing Skills</p>
                            <div className={styles.chipList}>
                              {result.missing_skills?.length ? (
                                result.missing_skills.map((skill) => (
                                  <span key={`${result.resume_id}-miss-${skill}`} className={styles.missingSkillChip}>
                                    {skill}
                                  </span>
                                ))
                              ) : (
                                <span className={styles.emptyText}>No critical missing skills detected.</span>
                              )}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  <div className={styles.voiceSection}>
                    <p className={styles.resultLabel}>Voice ATS Assistant</p>
                    <VoiceAssistant
                      message={voiceAssistantMessage}
                      title="Resume Voice Assistant"
                      description="Speaks ATS score, weakness summary, and missing skills from your current analysis."
                      autoPlay
                    />
                  </div>
                </div>

                <div className={styles.jobsSection}>
                  <div className={styles.remoteJobsHeader}>
                    <div>
                      <p className={styles.resultLabel}>Live Remote Jobs</p>
                      <h3 className={styles.remoteJobsTitle}>Top 10 Curated Remote Openings</h3>
                      <p className={styles.remoteJobsSubtitle}>
                        Based on your role prediction and skill interests:
                        <strong> 5 India remote + 5 international remote</strong>
                      </p>
                    </div>
                    <span className={styles.remoteJobsCount}>
                      {(remoteJobs.india.length || 0) + (remoteJobs.international.length || 0)} live jobs
                    </span>
                  </div>

                  {remoteJobsLoading && (
                    <div className={styles.remoteJobsLoading}>
                      <span className={styles.spinner} />
                      <p>Finding the best remote jobs for your profile...</p>
                    </div>
                  )}
                  {remoteJobsError && <p className={styles.error}>{remoteJobsError}</p>}

                  <div className={styles.remoteColumns}>
                    <div className={styles.remoteColumn}>
                      <div className={styles.remoteColumnHead}>
                        <h4>India Remote Picks</h4>
                        <span className={styles.remoteBadge}>Remote India</span>
                      </div>
                      {remoteJobs.india.length > 0 ? (
                        <div className={styles.jobsGrid}>
                          {remoteJobs.india.map((job) => (
                            <article key={`india-${job.id}`} className={styles.jobCard}>
                              <div className={styles.jobHeader}>
                                <h3 className={styles.jobTitle}>{job.title}</h3>
                                <span className={styles.remotePill}>Remote</span>
                              </div>
                              <p className={styles.jobCompany}>{job.company}</p>
                              <p className={styles.jobMeta}>
                                {job.location}
                                {job.employment_type ? ` | ${job.employment_type}` : ''}
                              </p>
                              {job.description && <p className={styles.jobDescription}>{job.description}</p>}
                              <div className={styles.jobFooter}>
                                <span className={styles.jobSource}>{sourceLabel(job)}</span>
                                {job.apply_link ? (
                                  <a
                                    href={job.apply_link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={styles.jobApplyButton}
                                  >
                                    Apply Remote
                                  </a>
                                ) : (
                                  <span className={styles.emptyText}>Apply link unavailable.</span>
                                )}
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <p className={styles.emptyText}>No India remote jobs found for this role yet.</p>
                      )}
                    </div>

                    <div className={styles.remoteColumn}>
                      <div className={styles.remoteColumnHead}>
                        <h4>International Remote Picks</h4>
                        <span className={styles.remoteBadgeAlt}>Global Remote</span>
                      </div>
                      {remoteJobs.international.length > 0 ? (
                        <div className={styles.jobsGrid}>
                          {remoteJobs.international.map((job) => (
                            <article key={`global-${job.id}`} className={styles.jobCard}>
                              <div className={styles.jobHeader}>
                                <h3 className={styles.jobTitle}>{job.title}</h3>
                                <span className={styles.remotePill}>Remote</span>
                              </div>
                              <p className={styles.jobCompany}>{job.company}</p>
                              <p className={styles.jobMeta}>
                                {job.location}
                                {job.employment_type ? ` | ${job.employment_type}` : ''}
                              </p>
                              {job.description && <p className={styles.jobDescription}>{job.description}</p>}
                              <div className={styles.jobFooter}>
                                <span className={styles.jobSource}>{sourceLabel(job)}</span>
                                {job.apply_link ? (
                                  <a
                                    href={job.apply_link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={styles.jobApplyButton}
                                  >
                                    Apply Remote
                                  </a>
                                ) : (
                                  <span className={styles.emptyText}>Apply link unavailable.</span>
                                )}
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <p className={styles.emptyText}>No international remote jobs found for this role yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.matchingButton}
                  onClick={() => setShowMatching(true)}
                >
                  Find Matching Jobs -&gt;
                </button>
              </>
            )}
          </section>
        )}

        {showMatching && resumeForMatching && (
          <section className={`${styles.panel} ${styles.fadeSlide}`}>
            <h2 className={styles.panelTitle}>Step 3 - Job Matching Engine</h2>
            <JobMatchingEngine resume={resumeForMatching} />
          </section>
        )}
      </div>
    </div>
  )
}

export default ResumePredictor
