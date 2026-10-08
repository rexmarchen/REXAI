import fs from 'node:fs'
import path from 'node:path'
import AppError from '../../utils/AppError.js'
import logger from '../../utils/logger.js'
import greenhouseService from './greenhouseService.js'
import { GREENHOUSE_DRY_RUN } from '../../config/env.js'

class GreenhouseProvider {
  constructor() {
    this.name = 'greenhouse'
  }

  /**
   * Returns true if this provider handles the given job URL.
   */
  canHandle(url) {
    const target = String(url || '').toLowerCase()
    return target.includes('greenhouse.io')
  }

  /**
   * Parses the board token and job ID from the job URL.
   */
  parseUrl(url) {
    const target = String(url || '').trim()
    
    // Pattern 1: boards.greenhouse.io/{boardToken}/jobs/{jobId}
    // Pattern 2: job-boards.greenhouse.io/{boardToken}/jobs/{jobId}
    const pathRegex = /(?:boards|job-boards)(?:-api)?\.greenhouse\.io\/([^/]+)\/jobs\/(\d+)/i
    let match = pathRegex.exec(target)

    if (match) {
      return {
        boardToken: match[1],
        jobId: match[2]
      }
    }

    // Pattern 3: boards.greenhouse.io/embed/job_board?board_token={boardToken}&job_id={jobId}
    try {
      const parsedUrl = new URL(target)
      const boardToken = parsedUrl.searchParams.get('board_token') || parsedUrl.searchParams.get('boardToken')
      const jobId = parsedUrl.searchParams.get('job_id') || parsedUrl.searchParams.get('jobId')

      if (boardToken && jobId) {
        return { boardToken, jobId }
      }
    } catch {
      // Ignore URL parsing exceptions
    }

    throw new AppError(
      'Could not extract Greenhouse board token and job ID from the URL. Please verify the link format.',
      400,
      'GREENHOUSE_JOB_NOT_FOUND'
    )
  }

  /**
   * Fetches job specifications and normalizes them into REXION's representation.
   */
  async getJobDetails(url) {
    const { boardToken, jobId } = this.parseUrl(url)
    const rawJob = await greenhouseService.getJob(jobId, { boardToken })

    // Normalize questions list
    const questions = []
    const rawQuestions = rawJob.questions || []

    for (const q of rawQuestions) {
      const required = Boolean(q.required)
      const rawFields = q.fields || []

      for (const field of rawFields) {
        const typeMap = {
          input_text: 'text',
          textarea: 'textarea',
          select: 'select',
          multi_select: 'multiselect',
          boolean: 'boolean',
          file: 'file'
        }

        const options = (field.options || []).map((opt) => ({
          label: opt.label,
          id: String(opt.id)
        }))

        questions.push({
          fieldId: field.name, // e.g. first_name, email, or custom parameter name
          name: field.name,
          label: q.label || field.label || 'Question',
          type: typeMap[field.type] || 'text',
          required,
          options,
          section: this._getQuestionSection(field.name)
        })
      }
    }

    return {
      externalJobId: String(rawJob.id),
      platform: 'greenhouse',
      boardToken,
      title: rawJob.title,
      company: rawJob.company_name || 'Greenhouse Company',
      location: rawJob.location?.name || 'Remote / Flexible',
      description: rawJob.content || '',
      applicationUrl: url,
      questions
    }
  }

  /**
   * Categorizes questions into logical sections
   */
  _getQuestionSection(fieldName) {
    const personalFields = ['first_name', 'last_name', 'email', 'phone', 'location']
    if (personalFields.includes(fieldName)) return 'personal'
    if (fieldName === 'resume' || fieldName === 'cover_letter') return 'attachments'
    return 'custom'
  }

  /**
   * Deterministically maps profile variables and validates required fields.
   */
  validate(profile = {}, resumeFile = null, questions = []) {
    const mappedFields = {}
    const missingFields = []

    // Helper: Normalize name splitting
    const fullName = String(profile.fullName || profile.name || '').trim()
    const nameParts = fullName.split(/\s+/)
    const firstName = profile.firstName || nameParts[0] || ''
    const lastName = profile.lastName || nameParts.slice(1).join(' ') || ''

    for (const q of questions) {
      let value = null

      // 1. Deterministic profile mapping
      if (q.name === 'first_name') {
        value = firstName
      } else if (q.name === 'last_name') {
        value = lastName
      } else if (q.name === 'email') {
        value = profile.email || ''
      } else if (q.name === 'phone') {
        value = profile.phone || ''
      } else if (q.name === 'location') {
        value = profile.location || ''
      } else if (q.name === 'resume') {
        // Resume handled separately via file validation
        if (q.required && !resumeFile) {
          missingFields.push({
            name: q.name,
            label: q.label,
            type: q.type,
            reasonCode: 'MISSING_RESUME',
            message: 'A resume file attachment is required for this application.'
          })
        }
        continue
      } else if (q.name === 'cover_letter') {
        // Optional cover letter fallback
        continue
      } else {
        // 2. Custom Questions - check links and common mappings
        const labelLower = q.label.toLowerCase()
        if (labelLower.includes('linkedin')) {
          value = profile.linkedinUrl || ''
        } else if (labelLower.includes('github')) {
          value = profile.githubUrl || ''
        } else if (labelLower.includes('portfolio') || labelLower.includes('website')) {
          value = profile.portfolioUrl || ''
        } else if (labelLower.includes('sponsorship') || labelLower.includes('sponsor')) {
          // Do NOT guess sponsorship or authorization status
          value = null
        }
      }

      // Check required validation
      if (q.required && (!value || String(value).trim() === '')) {
        missingFields.push({
          name: q.name,
          label: q.label,
          type: q.type,
          reasonCode: 'MISSING_PROFILE_DATA',
          message: `"${q.label}" is required but not present in your profile.`
        })
      } else if (value) {
        mappedFields[q.name] = value
      }
    }

    // Validate Resume file properties if provided
    if (resumeFile) {
      const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ]
      
      if (!allowedMimeTypes.includes(resumeFile.mimetype)) {
        missingFields.push({
          name: 'resume',
          label: 'Resume Attachment',
          type: 'file',
          reasonCode: 'UNSUPPORTED_ATTACHMENT',
          message: 'The uploaded file type is not supported. Please upload a PDF, DOC, or DOCX resume.'
        })
      }

      const maxBytes = 10 * 1024 * 1024 // 10 MB limit
      if (resumeFile.size > maxBytes) {
        missingFields.push({
          name: 'resume',
          label: 'Resume Attachment',
          type: 'file',
          reasonCode: 'UNSUPPORTED_ATTACHMENT',
          message: 'The uploaded resume file exceeds the maximum allowed size of 10MB.'
        })
      }
    }

    return {
      valid: missingFields.length === 0,
      mappedFields,
      missingFields
    }
  }

  /**
   * Maps profile, validates form, and submits application (supporting dry-run).
   */
  async submit(url, profile = {}, resumeFile = null, options = {}) {
    const { boardToken, jobId } = this.parseUrl(url)
    const jobDetails = await this.getJobDetails(url)
    const dryRun = options.dryRun !== undefined ? Boolean(options.dryRun) : GREENHOUSE_DRY_RUN

    // 1. Run validation
    const validation = this.validate(profile, resumeFile, jobDetails.questions)

    if (!validation.valid) {
      throw new AppError(
        'Validation failed: required candidate profile data is missing.',
        400,
        'GREENHOUSE_VALIDATION_FAILED',
        { missingFields: validation.missingFields }
      )
    }

    // 2. Build multipart/form-data payload
    const formData = new FormData()
    
    // Add mapped text inputs
    for (const [key, val] of Object.entries(validation.mappedFields)) {
      formData.append(key, val)
    }

    // Add resume file
    if (resumeFile && fs.existsSync(resumeFile.path)) {
      const buffer = fs.readFileSync(resumeFile.path)
      const blob = new Blob([buffer], { type: resumeFile.mimetype })
      formData.append('resume', blob, resumeFile.originalname || 'resume.pdf')
    }

    // Add custom answers from request body if they are passed explicitly
    if (options.answers && typeof options.answers === 'object') {
      for (const [key, val] of Object.entries(options.answers)) {
        if (val !== undefined && val !== null) {
          formData.append(key, String(val))
        }
      }
    }

    // 3. Dry Run Check
    if (dryRun) {
      logger.info(`[Greenhouse] DRY RUN enabled for Job ID "${jobId}" (Board: "${boardToken}"). Submission bypassed.`)
      
      const payloadSummary = {}
      for (const [key, value] of formData.entries()) {
        if (value instanceof Blob) {
          payloadSummary[key] = `[Blob: size=${value.size} bytes]`
        } else {
          payloadSummary[key] = value
        }
      }

      return {
        dryRun: true,
        valid: true,
        mappedFields: Object.keys(validation.mappedFields),
        missingFields: [],
        warnings: [],
        payloadSummary
      }
    }

    // 4. Live Submission
    const submitResult = await greenhouseService.submitApplication(jobId, formData, {
      boardToken,
      apiKey: options.apiKey
    })

    return {
      dryRun: false,
      valid: true,
      submissionId: submitResult.response?.id || null,
      message: 'Application successfully submitted to Greenhouse.'
    }
  }
}

export default new GreenhouseProvider()
