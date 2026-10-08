import { extractText } from './resumeParser.js'
import fs from 'node:fs'
import { parseResume } from '../../../agents/apply-flow-agent/services/parseResume.js'
import { analyzeSkills } from '../../../agents/apply-flow-agent/services/analyzeSkills.js'
import { fetchJobs } from '../../../agents/apply-flow-agent/services/fetchJobs.js'
import { calculateMatch } from '../../../agents/apply-flow-agent/services/scoreMatch.js'
import { discoverAndScoreJobs } from './jobDiscoveryService.js'
import { extractResumeProfile } from './resumeProfileExtractor.js'
import { sendDominationLaunchEmail } from './dominationEmailService.js'
import { fetchAtsJobs } from './atsJobSourceService.js'
import logger from '../utils/logger.js'
import {
  createApplicationBatch,
  createApplication,
  findLatestResumePrediction
} from '../../server.js'
import { jobQueueService } from './jobQueueService.js'

// Known ATS URL patterns — used for pre-filter in apply-all
const ATS_URL_RE = /greenhouse\.io|boards\.greenhouse|job-boards\.greenhouse|lever\.co/

const DEFAULT_N8N_REXION_APPLY_URL = 'https://rexer.app.n8n.cloud/webhook/rexion/apply'
const DEFAULT_N8N_REXION_APPLY_ALL_URL = 'https://rexer.app.n8n.cloud/webhook/rexion/apply-all'
const WEBHOOK_TIMEOUT_MS = 20000
const WORKFLOW_PROVIDER = 'n8n'

const WORKFLOW_ERROR_CODES = Object.freeze({
  CONFIG_MISSING: 'N8N_WEBHOOK_CONFIG_MISSING',
  SECRET_MISSING: 'N8N_WEBHOOK_SECRET_MISSING',
  UNAUTHORIZED: 'N8N_WEBHOOK_UNAUTHORIZED',
  NOT_FOUND: 'N8N_WEBHOOK_NOT_FOUND',
  REJECTED_PAYLOAD: 'N8N_WEBHOOK_REJECTED_PAYLOAD',
  NETWORK: 'N8N_WEBHOOK_NETWORK_ERROR',
  TIMEOUT: 'N8N_WEBHOOK_TIMEOUT',
  UPSTREAM_ERROR: 'N8N_WEBHOOK_UPSTREAM_ERROR',
  INVALID_RESPONSE: 'N8N_WEBHOOK_INVALID_RESPONSE'
})

const createWorkflowError = (message, statusCode = 500, details = null) => {
  const error = new Error(message)
  error.statusCode = statusCode
  error.details = details
  return error
}

const normalizeTextField = (value, maxLength = 400) =>
  String(value || '')
    .trim()
    .slice(0, maxLength)

const normalizeEmail = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()

const normalizeResumeText = (value, maxLength = 120000) =>
  String(value || '')
    .trim()
    .slice(0, maxLength)

const normalizeStatusCode = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null
  }

  return Math.round(numeric)
}

const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const toBoolean = (value) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()

  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on'
}

const toPositiveMetric = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric < 0) {
    return null
  }

  return Math.round(numeric)
}

const readUpstreamMessage = (upstream) =>
  normalizeTextField(upstream?.message, 500) ||
  normalizeTextField(upstream?.error, 500) ||
  normalizeTextField(upstream?.detail, 500) ||
  null

const buildWorkflowErrorDetails = ({
  code,
  step,
  endpoint,
  webhookAlias,
  upstreamStatus = null,
  upstreamMessage = null
}) => ({
  code: normalizeTextField(code, 120) || null,
  provider: WORKFLOW_PROVIDER,
  step: normalizeTextField(step, 40) || null,
  webhookAlias: normalizeTextField(webhookAlias, 40) || null,
  endpoint: normalizeTextField(endpoint, 500) || null,
  upstreamStatus: normalizeStatusCode(upstreamStatus),
  upstreamMessage: normalizeTextField(upstreamMessage, 500) || null
})

const createDetailedWorkflowError = ({
  message,
  statusCode = 500,
  code,
  step,
  endpoint,
  webhookAlias,
  upstreamStatus = null,
  upstreamMessage = null
}) =>
  createWorkflowError(
    message,
    statusCode,
    buildWorkflowErrorDetails({
      code,
      step,
      endpoint,
      webhookAlias,
      upstreamStatus,
      upstreamMessage
    })
  )

export const buildDominationWorkflowErrorLogContext = (error, context = {}) => {
  const details = isRecord(error?.details) ? error.details : {}

  return {
    route: normalizeTextField(context.route, 120) || null,
    step: normalizeTextField(details.step || context.step, 40) || null,
    webhookAlias: normalizeTextField(details.webhookAlias || context.webhookAlias, 40) || null,
    statusCode: normalizeStatusCode(error?.statusCode),
    code: normalizeTextField(details.code, 120) || null,
    provider: normalizeTextField(details.provider, 40) || null,
    endpoint: normalizeTextField(details.endpoint, 500) || null,
    upstreamStatus: normalizeStatusCode(details.upstreamStatus),
    upstreamMessage: normalizeTextField(details.upstreamMessage, 500) || null,
    message: normalizeTextField(error?.message, 500) || null
  }
}

const parseWebhookResponse = async (response) => {
  const rawText = await response.text()

  if (!rawText) {
    return {}
  }

  try {
    return JSON.parse(rawText)
  } catch {
    return { message: rawText }
  }
}

const fetchWithTimeout = async (url, options = {}, { step, webhookAlias } = {}) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    })
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw createDetailedWorkflowError({
        message: 'Automation webhook timed out before responding.',
        statusCode: 504,
        code: WORKFLOW_ERROR_CODES.TIMEOUT,
        step,
        endpoint: url,
        webhookAlias,
        upstreamMessage: error?.message || 'Request timed out'
      })
    }

    throw createDetailedWorkflowError({
      message: 'Unable to reach the configured n8n workflow endpoint right now.',
      statusCode: 502,
      code: WORKFLOW_ERROR_CODES.NETWORK,
      step,
      endpoint: url,
      webhookAlias,
      upstreamMessage: error?.message || 'Network request failed'
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

const buildApplyAllWebhookUrl = (launchWebhookUrl) => {
  const normalizedLaunchWebhookUrl = normalizeTextField(launchWebhookUrl, 500)
  if (!normalizedLaunchWebhookUrl) {
    return DEFAULT_N8N_REXION_APPLY_ALL_URL
  }

  const derivedWebhookUrl = normalizedLaunchWebhookUrl.replace(/\/apply\/?$/i, '/apply-all')
  return derivedWebhookUrl !== normalizedLaunchWebhookUrl
    ? derivedWebhookUrl
    : DEFAULT_N8N_REXION_APPLY_ALL_URL
}

const readWorkflowConfig = () => {
  const launchWebhookUrl =
    normalizeTextField(process.env.N8N_REXION_APPLY_URL, 500) || DEFAULT_N8N_REXION_APPLY_URL
  const findWebhookUrl = launchWebhookUrl
  const applyAllWebhookUrl =
    normalizeTextField(process.env.N8N_REXION_APPLY_ALL_URL, 500) ||
    buildApplyAllWebhookUrl(launchWebhookUrl)
  const webhookSecret = normalizeTextField(process.env.N8N_REXION_WEBHOOK_SECRET, 500)

  return {
    launchWebhookUrl,
    findWebhookUrl,
    applyAllWebhookUrl,
    webhookSecret
  }
}

const buildRexionContext = (user) => ({
  user_id: String(user?.id || user?._id || '').trim() || null,
  authenticated_email: normalizeEmail(user?.email) || null,
  role: normalizeTextField(user?.role, 40) || 'candidate',
  plan: normalizeTextField(user?.plan, 40) || 'free'
})

const buildWorkflowPayload = async ({ user, body, file, callbackUrl, callbackSecret }) => {
  if (!file?.path) {
    throw createWorkflowError('Resume file is missing from the request.', 400)
  }

  const notificationEmail = normalizeEmail(body?.userEmail || user?.email)
  const fullName = normalizeTextField(body?.userName || user?.fullName || user?.name, 120)
  const targetRole = normalizeTextField(body?.targetRole, 120)
  const confirmed = toBoolean(body?.confirmAutomation)

  if (!fullName) {
    throw createWorkflowError('Name is required to launch 1-Click Mode.', 400)
  }

  if (!notificationEmail || !notificationEmail.includes('@')) {
    throw createWorkflowError('A valid notification email is required to launch 1-Click Mode.', 400)
  }

  if (!targetRole) {
    throw createWorkflowError('Target role is required to launch 1-Click Mode.', 400)
  }

  if (!confirmed) {
    throw createWorkflowError('Automation launch confirmation is required.', 400)
  }

  if (!callbackUrl) {
    throw createWorkflowError('Domination callback URL is not configured on the server.', 500)
  }

  if (!callbackSecret) {
    throw createWorkflowError('Domination callback secret is not configured on the server.', 500)
  }

  const resumeText = await extractText(file.path, file.mimetype)

  if (!resumeText) {
    throw createWorkflowError('Unable to extract text from the uploaded resume.', 400)
  }

  return {
    source: 'rexion-dashboard-one-click-mode',
    submitted_at: new Date().toISOString(),
    user_name: fullName,
    user_email: notificationEmail,
    notification_email: notificationEmail,
    user_phone: normalizeTextField(body?.userPhone, 48) || null,
    target_role: targetRole,
    resume_text: resumeText,
    resume_filename: normalizeTextField(file.originalname || file.filename, 180) || 'resume',
    resume_mime_type: normalizeTextField(file.mimetype, 120) || 'application/octet-stream',
    callback_url: callbackUrl,
    callback_secret: callbackSecret,
    preferences: {
      job_type: normalizeTextField(body?.jobType, 60) || null,
      location: normalizeTextField(body?.location, 80) || null,
      experience_level: normalizeTextField(body?.experienceLevel, 60) || null,
      priority_notes: normalizeTextField(body?.priorityNotes, 700) || null
    },
    rexion: buildRexionContext(user)
  }
}

const buildFindJobsPayload = async ({ user, body, file }) => {
  const notificationEmail = normalizeEmail(body?.userEmail || body?.user_email || user?.email)
  let resumeText = normalizeResumeText(body?.resumeText || body?.resume_text)

  if (!notificationEmail || !notificationEmail.includes('@')) {
    throw createWorkflowError('A valid email is required before REXION can score jobs.', 400)
  }

  if (!resumeText && file?.path) {
    resumeText = normalizeResumeText(await extractText(file.path, file.mimetype))
  }

  if (!resumeText) {
    throw createWorkflowError('Upload a resume file before searching for matches.', 400)
  }

  return {
    source: 'rexion-dashboard-one-click-auto-apply',
    submitted_at: new Date().toISOString(),
    user_email: notificationEmail,
    notification_email: notificationEmail,
    resume_text: resumeText,
    resume_filename: normalizeTextField(file?.originalname || file?.filename, 180) || null,
    resume_mime_type: normalizeTextField(file?.mimetype, 120) || null,
    rexion: buildRexionContext(user)
  }
}

const buildApplyAllPayload = ({ user, body }) => {
  const notificationEmail = normalizeEmail(body?.userEmail || body?.user_email || user?.email)
  const jobs = Array.isArray(body?.jobs) ? body.jobs.filter((job) => isRecord(job)) : []
  const resumeData = isRecord(body?.resumeData)
    ? body.resumeData
    : isRecord(body?.resume_data)
      ? body.resume_data
      : {}

  if (!notificationEmail || !notificationEmail.includes('@')) {
    throw createWorkflowError('A valid email is required before applying to matched jobs.', 400)
  }

  if (jobs.length === 0) {
    throw createWorkflowError('No matched jobs were provided for the apply-all step.', 400)
  }

  return {
    source: 'rexion-dashboard-one-click-auto-apply',
    submitted_at: new Date().toISOString(),
    user_email: notificationEmail,
    notification_email: notificationEmail,
    jobs,
    job_count: jobs.length,
    resume_data: resumeData,
    rexion: buildRexionContext(user)
  }
}

const buildUpstreamSnapshot = (upstream, webhookUrl) => ({
  provider: WORKFLOW_PROVIDER,
  endpoint: webhookUrl,
  status: normalizeTextField(upstream?.status, 40) || null,
  runId: normalizeTextField(upstream?.runId || upstream?.executionId || upstream?.id, 180) || null,
  message: readUpstreamMessage(upstream)
})

const classifyUpstreamWorkflowFailure = ({
  responseStatus,
  upstream,
  step,
  endpoint,
  webhookAlias,
  fallbackMessage
}) => {
  const upstreamStatus = normalizeStatusCode(responseStatus)
  const upstreamMessage = readUpstreamMessage(upstream)

  if (upstreamStatus === 401 || upstreamStatus === 403) {
    return createDetailedWorkflowError({
      message: 'Configured n8n webhook secret was rejected by the live workflow.',
      statusCode: 424,
      code: WORKFLOW_ERROR_CODES.UNAUTHORIZED,
      step,
      endpoint,
      webhookAlias,
      upstreamStatus,
      upstreamMessage
    })
  }

  if (upstreamStatus === 404) {
    return createDetailedWorkflowError({
      message: 'Configured workflow endpoint is not registered in n8n.',
      statusCode: 424,
      code: WORKFLOW_ERROR_CODES.NOT_FOUND,
      step,
      endpoint,
      webhookAlias,
      upstreamStatus,
      upstreamMessage
    })
  }

  if (upstreamStatus === 400 || upstreamStatus === 422) {
    return createDetailedWorkflowError({
      message: 'The live n8n workflow rejected the payload sent by REXION.',
      statusCode: 424,
      code: WORKFLOW_ERROR_CODES.REJECTED_PAYLOAD,
      step,
      endpoint,
      webhookAlias,
      upstreamStatus,
      upstreamMessage
    })
  }

  return createDetailedWorkflowError({
    message: upstreamMessage || fallbackMessage,
    statusCode: 502,
    code: WORKFLOW_ERROR_CODES.UPSTREAM_ERROR,
    step,
    endpoint,
    webhookAlias,
    upstreamStatus,
    upstreamMessage
  })
}

const resolveFindJobsResponse = (upstream) => {
  const jobs = Array.isArray(upstream?.jobs)
    ? upstream.jobs
    : Array.isArray(upstream?.data?.jobs)
      ? upstream.data.jobs
      : []

  const resumeData = isRecord(upstream?.resume_data)
    ? upstream.resume_data
    : isRecord(upstream?.resumeData)
      ? upstream.resumeData
      : isRecord(upstream?.data?.resume_data)
        ? upstream.data.resume_data
        : isRecord(upstream?.data?.resumeData)
          ? upstream.data.resumeData
          : {}

  return {
    jobs,
    resumeData
  }
}

export const canUseDominationWorkflow = (user) => {
  const role = normalizeTextField(user?.role, 40).toLowerCase()
  const plan = normalizeTextField(user?.plan, 40).toLowerCase()
  return role === 'admin' || plan === 'elite'
}

export const submitDominationWorkflow = async ({ user, body, file, callbackUrl, callbackSecret }) => {
  const { launchWebhookUrl, webhookSecret } = readWorkflowConfig()

  if (!launchWebhookUrl) {
    throw createDetailedWorkflowError({
      message: 'Automation webhook URL is not configured on the server.',
      statusCode: 500,
      code: WORKFLOW_ERROR_CODES.CONFIG_MISSING,
      step: 'launch',
      endpoint: null,
      webhookAlias: 'apply'
    })
  }

  if (!webhookSecret) {
    throw createDetailedWorkflowError({
      message: 'Automation webhook secret is not configured on the server.',
      statusCode: 500,
      code: WORKFLOW_ERROR_CODES.SECRET_MISSING,
      step: 'launch',
      endpoint: launchWebhookUrl,
      webhookAlias: 'apply'
    })
  }

  const payload = await buildWorkflowPayload({
    user,
    body,
    file,
    callbackUrl,
    callbackSecret
  })

  const response = await fetchWithTimeout(
    launchWebhookUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rexion-secret': webhookSecret
      },
      body: JSON.stringify(payload)
    },
    {
      step: 'launch',
      webhookAlias: 'apply'
    }
  )

  const upstream = await parseWebhookResponse(response)

  if (!response.ok) {
    throw classifyUpstreamWorkflowFailure({
      responseStatus: response.status,
      upstream,
      step: 'launch',
      endpoint: launchWebhookUrl,
      webhookAlias: 'apply',
      fallbackMessage: `Automation webhook returned ${response.status}.`
    })
  }

  const upstreamStatus = normalizeTextField(upstream?.status, 40).toLowerCase()
  const runId = normalizeTextField(upstream?.runId || upstream?.executionId || upstream?.id, 180)

  if (upstreamStatus !== 'accepted' || !runId) {
    throw createDetailedWorkflowError({
      message: 'Automation webhook did not return an accepted run.',
      statusCode: 502,
      code: WORKFLOW_ERROR_CODES.INVALID_RESPONSE,
      step: 'launch',
      endpoint: launchWebhookUrl,
      webhookAlias: 'apply',
      upstreamStatus: response.status,
      upstreamMessage: readUpstreamMessage(upstream)
    })
  }

  return {
    payload,
    result: {
      success: true,
      status: 'accepted',
      executionMode: 'live-webhook',
      executionProvider: WORKFLOW_PROVIDER,
      message: normalizeTextField(upstream?.message, 500) || '1-Click Mode launch accepted by n8n.',
      confirmationEmail: payload.notification_email,
      runId,
      summary: null,
      upstream: buildUpstreamSnapshot(upstream, launchWebhookUrl)
    }
  }
}

export const findDominationMatches = async ({ user, body, file }) => {
  let resumeText = ''

  if (file && file.path) {
    // 1. Extract text from the uploaded resume file
    const resumeBuffer = fs.readFileSync(file.path)
    resumeText = await parseResume(resumeBuffer, file.mimetype)
  } else if (body?.resumeText || body?.resume_text) {
    resumeText = String(body.resumeText || body.resume_text).trim()
  } else {
    throw new Error('Please upload a resume file or provide resume text to find matching jobs.')
  }

  // 2. Call Groq API to extract skills, experience, and target role
  const profile = await analyzeSkills(resumeText)

  // 3. Fetch jobs from the Adzuna API using the extracted target role
  let targetRole = profile.targetRole || 'Software Engineer'
  if (typeof targetRole !== 'string' || targetRole.trim() === '') {
    targetRole = 'Software Engineer'
  }

  // 4. Fetch from Adzuna AND direct ATS APIs in parallel
  const [rawAdzunaJobs, rawAtsJobs] = await Promise.all([
    fetchJobs(targetRole).catch(err => {
      logger.warn(`Adzuna fetch failed: ${err.message}`)
      return []
    }),
    fetchAtsJobs().catch(err => {
      logger.warn(`ATS fetch failed: ${err.message}`)
      return []
    })
  ])

  logger.info(`[Match] Adzuna: ${rawAdzunaJobs.length} jobs | ATS direct: ${rawAtsJobs.length} jobs`)

  // 5. Normalise Adzuna jobs into same schema
  const adzunaJobs = rawAdzunaJobs.map(job => {
    const jobUrl = job.redirect_url || job.url || ''
    const isAts = ATS_URL_RE.test(jobUrl) || /gh_jid/i.test(jobUrl)
    return {
      id:          job.id || `adzuna-${Math.random().toString(36).substr(2, 9)}`,
      title:       job.title,
      job_title:   job.title,
      company:     job.company?.display_name || job.company || 'Unknown Company',
      location:    job.location?.display_name || job.location || 'Location flexible',
      description: job.description || '',
      posting_url: jobUrl,
      url:         jobUrl,
      score:       0,
      matchScores: { totalScore: 0 },
      tier:        isAts ? 1 : 3,
      source:      'Adzuna'
    }
  })

  // 6. Score all jobs (ATS jobs are Tier-1 1-Click ready; external portals are Tier-3 manual)
  const allJobs = [...rawAtsJobs, ...adzunaJobs]
  const scoredJobs = allJobs
    .map(job => {
      const matchResult = calculateMatch(profile, { title: job.title, description: job.description, company: job.company })
      const score = typeof matchResult?.matchScore === 'number'
        ? matchResult.matchScore
        : (matchResult?.matchScores?.totalScore || 0)
      const isDirectAts = job.source === 'greenhouse' || job.source === 'lever' || ATS_URL_RE.test(job.posting_url || job.url)
      return {
        ...job,
        tier: isDirectAts ? 1 : 3,
        score,
        matchScores: matchResult?.matchScores || { totalScore: score }
      }
    })
    .sort((a, b) => {
      const aWeight = a.score + (a.tier === 1 ? 3 : 0)
      const bWeight = b.score + (b.tier === 1 ? 3 : 0)
      return bWeight - aWeight
    })
    .slice(0, 10)

  const atsCount = scoredJobs.filter(j => j.source === 'greenhouse' || j.source === 'lever').length
  logger.info(`[Match] Top 10 after scoring — ATS: ${atsCount}, Adzuna: ${scoredJobs.length - atsCount}`)

  return {
    success: true,
    status: 'ok',
    message: scoredJobs.length > 0 ? `Found ${scoredJobs.length} matching jobs (${atsCount} direct ATS + ${scoredJobs.length - atsCount} Adzuna).` : 'No matching jobs found.',
    jobs: scoredJobs,
    resume_data: {
      parsedName:      profile.name || user?.fullName || 'REXION Candidate',
      skillsDetected:  profile.skills || [],
      experienceYears: profile.yearsExperience ? `${profile.yearsExperience}+` : '0+'
    }
  }
}

export const findJobs = findDominationMatches

export const applyAllDominationMatches = async ({ user, body }) => {
  const jobs = Array.isArray(body?.jobs) ? body.jobs : []
  
  // Strictly resolve recipient from authenticated session
  const userEmail = String(user?.email || '').trim().toLowerCase()

  if (!userEmail || !userEmail.includes('@')) {
    throw new Error('Authenticated user email could not be resolved from session.')
  }

  // If client provided a body.userEmail that conflicts with session, log and enforce authenticated email
  if (body?.userEmail && String(body.userEmail).trim().toLowerCase() !== userEmail) {
    logger.warn(`[Apply All] Client userEmail "${body.userEmail}" did not match authenticated user "${userEmail}". Enforcing authenticated user session email.`)
  }

  if (jobs.length === 0) {
    throw new Error('No jobs selected for application.')
  }

  // Find user latest resume path
  const latestPrediction = await findLatestResumePrediction(user?.id || user?._id || 0)
  const resumeFilePath = latestPrediction ? latestPrediction.filePath : null

  // Create batch
  const batch = await createApplicationBatch(user?.id || user?._id || 0, 'pending')

  // Create applications — pre-filter non-ATS URLs to manual_required immediately
  for (const job of jobs) {
    const jobUrl = job.posting_url || job.url || job.apply_link || ''
    const isWorkday  = /myworkdayjobs\.com|\.workday\.com/i.test(jobUrl)
    const isKnownAts = ATS_URL_RE.test(jobUrl) || 
                       /gh_jid/i.test(jobUrl) ||
                       String(job.source).toLowerCase() === 'greenhouse' ||
                       String(job.source).toLowerCase() === 'lever' ||
                       String(job.platform).toLowerCase() === 'greenhouse' ||
                       String(job.platform).toLowerCase() === 'lever'
    const isManualDomain = /mygwork|adzuna|indeed|linkedin|monster|careerbuilder|glassdoor|ziprecruiter|simplyhired|taleo|icims/i.test(jobUrl)

    let tier        = Number(job.tier || (isKnownAts ? 1 : 3))
    let channelUsed = isKnownAts ? 'playwright' : 'manual'
    let initialStatus = isKnownAts ? 'queued' : 'manual_required'

    if (isWorkday || isManualDomain || (!isKnownAts && tier === 3)) {
      tier          = 3
      channelUsed   = 'manual'
      initialStatus = 'manual_required'
    }

    await createApplication({
      batchId:     batch.id,
      jobTitle:    job.job_title || job.title || 'Untitled Role',
      company:     job.company || 'Unknown Company',
      location:    job.location || null,
      description: job.description || null,
      tier,
      postingUrl:  jobUrl,
      status:      initialStatus,
      channelUsed
    })
  }

  // Trigger background queue processing
  const candidateProfile = {
    fullName: body.resumeData?.parsedName || body.resume_data?.parsedName || user?.fullName || 'Candidate',
    email: userEmail,
    phone: body.resumeData?.phone || body.resume_data?.phone || '+15555550100',
    targetRole: body.resumeData?.targetRole || body.resume_data?.targetRole || 'Software Engineer'
  }

  // Enqueue in jobQueueService
  jobQueueService.enqueueBatch(batch.id, candidateProfile, resumeFilePath)

  // Send launch email strictly to the single authenticated user
  sendDominationLaunchEmail({
    to: userEmail,
    fullName: candidateProfile.fullName,
    targetRole: candidateProfile.targetRole,
    runId: String(batch.id),
    expectedUserEmail: userEmail
  }).catch(err => {
    logger.error(`Failed to send launch email for batch #${batch.id}: ${err.message}`)
  })

  return {
    success: true,
    status: 'ok',
    message: `Application batch #${batch.id} with ${jobs.length} jobs successfully queued for execution.`,
    batchId: batch.id,
    queuedCount: jobs.length,
    totalJobs: jobs.length,
    confirmationEmail: userEmail
  }
}
