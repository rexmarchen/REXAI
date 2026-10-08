import fs from 'node:fs'
import path from 'node:path'
import mongoose from 'mongoose'
import { catchAsync } from '../utils/catchAsync.js'
import AppError from '../utils/AppError.js'
import logger from '../utils/logger.js'
import atsAdapter from '../services/ats/atsAdapter.js'
import greenhouseProvider from '../services/ats/greenhouseProvider.js'
import Application from '../models/Application.js'
import Resume from '../models/Resume.js'
import {
  createApplicationBatch,
  createApplication,
  findLatestResumePrediction
} from '../../server.js'

/**
 * Checks if the backend is actively running in MongoDB mode.
 */
const isMongoMode = () => mongoose.connection.readyState === 1

/**
 * Loads the user's latest resume file details.
 * Supports both MongoDB mode and SQLite mode folder references.
 */
const getLatestUserResume = async (userId) => {
  if (isMongoMode()) {
    const resume = await Resume.findOne({ user: userId }).sort({ uploadedAt: -1 })
    if (!resume) return null
    return {
      path: resume.path,
      originalname: resume.filename,
      mimetype: resume.mimetype,
      size: resume.size
    }
  } else {
    const prediction = await findLatestResumePrediction(Number(userId))
    if (!prediction || !prediction.filePath || !fs.existsSync(prediction.filePath)) {
      return null
    }
    const stat = fs.statSync(prediction.filePath)
    return {
      path: prediction.filePath,
      originalname: path.basename(prediction.filePath),
      mimetype: 'application/pdf',
      size: stat.size
    }
  }
}

/**
 * GET /api/jobs/greenhouse?url=...
 * Resolves the raw Greenhouse job specs and normalizes the required questions.
 */
export const getJobDetailsHandler = catchAsync(async (req, res, next) => {
  const url = String(req.query.url || '').trim()

  if (!url) {
    throw new AppError('Job posting URL is required.', 400, 'GREENHOUSE_CONFIGURATION_MISSING')
  }

  try {
    const details = await atsAdapter.getJobDetails(url)
    res.status(200).json({
      success: true,
      data: details
    })
  } catch (error) {
    logger.error(`[Greenhouse Controller] getJobDetails failed: ${error.message}`)
    throw new AppError(error.message, error.statusCode || 500, error.code || 'GREENHOUSE_FORM_FETCH_FAILED')
  }
})

/**
 * POST /api/jobs/greenhouse/validate
 * Body: { url }
 * Validates the user's profile and resume attachment against the application questions.
 */
export const validateHandler = catchAsync(async (req, res, next) => {
  const url = String(req.body.url || '').trim()

  if (!url) {
    throw new AppError('Job posting URL is required for validation.', 400, 'GREENHOUSE_CONFIGURATION_MISSING')
  }

  try {
    const resumeFile = await getLatestUserResume(req.user.id)
    const profile = req.user.profile || {}
    
    // Ensure basic contact details map from user top-level model if not in nested profile
    if (!profile.name && req.user.name) profile.name = req.user.name
    if (!profile.email && req.user.email) profile.email = req.user.email

    const validation = await atsAdapter.validate(url, profile, resumeFile)

    res.status(200).json({
      success: true,
      valid: validation.valid,
      mappedFields: Object.keys(validation.mappedFields),
      missingFields: validation.missingFields
    })
  } catch (error) {
    logger.error(`[Greenhouse Controller] validate failed: ${error.message}`)
    throw new AppError(error.message, error.statusCode || 500, error.code || 'GREENHOUSE_VALIDATION_FAILED')
  }
})

/**
 * POST /api/jobs/greenhouse/apply
 * Body: { url, answers, dryRun }
 * Submits the mapped application to Greenhouse. Saves outcomes to the database tracker.
 */
export const applyHandler = catchAsync(async (req, res, next) => {
  const url = String(req.body.url || '').trim()
  const dryRunInput = req.body.dryRun
  const answers = req.body.answers || {}

  if (!url) {
    throw new AppError('Job posting URL is required.', 400, 'GREENHOUSE_CONFIGURATION_MISSING')
  }

  const { boardToken, jobId } = greenhouseProvider.parseUrl(url)
  const jobDetails = await atsAdapter.getJobDetails(url)
  const externalJobId = jobDetails.externalJobId

  // Idempotency: prevent multiple applications to the same Greenhouse Job
  if (isMongoMode()) {
    const existing = await Application.findOne({
      user: req.user.id,
      platform: 'greenhouse',
      externalJobId
    })
    if (existing) {
      throw new AppError('You have already successfully applied to this job listing.', 400, 'DUPLICATE_APPLICATION')
    }
  }

  const resumeFile = await getLatestUserResume(req.user.id)
  const profile = req.user.profile || {}
  
  if (!profile.name && req.user.name) profile.name = req.user.name
  if (!profile.email && req.user.email) profile.email = req.user.email

  try {
    const submitResult = await atsAdapter.submit(url, profile, resumeFile, {
      answers,
      dryRun: dryRunInput
    })

    const isDryRun = Boolean(submitResult.dryRun)

    // Save actual application result to the active DB context
    if (isMongoMode()) {
      await Application.create({
        user: req.user.id,
        jobId: externalJobId,
        platform: 'greenhouse',
        externalJobId,
        company: jobDetails.company,
        jobTitle: jobDetails.title,
        applicationUrl: url,
        status: isDryRun ? 'ready_to_submit' : 'submitted',
        submittedAt: isDryRun ? null : new Date(),
        providerMetadata: isDryRun ? submitResult.payloadSummary : submitResult.response,
        externalApplicationId: submitResult.submissionId ? String(submitResult.submissionId) : null
      })
    } else {
      // SQLite/PostgreSQL Mode
      const batch = await createApplicationBatch(req.user.id, isDryRun ? 'pending' : 'completed')
      await createApplication({
        batchId: batch.id,
        jobTitle: jobDetails.title,
        company: jobDetails.company,
        location: jobDetails.location,
        description: jobDetails.description,
        tier: 1, // Greenhouse API is Tier 1
        postingUrl: url,
        status: isDryRun ? 'queued' : 'applied',
        channelUsed: 'greenhouse_api'
      })
    }

    res.status(200).json({
      success: true,
      data: submitResult
    })
  } catch (error) {
    logger.error(`[Greenhouse Controller] apply failed: ${error.message}`)

    // Record failure in tracker
    if (isMongoMode() && error.code !== 'GREENHOUSE_VALIDATION_FAILED') {
      try {
        await Application.create({
          user: req.user.id,
          jobId: externalJobId,
          platform: 'greenhouse',
          externalJobId,
          company: jobDetails.company,
          jobTitle: jobDetails.title,
          applicationUrl: url,
          status: 'failed',
          failureCode: error.code || 'UNKNOWN_ERROR',
          failureReason: error.message
        })
      } catch (dbErr) {
        logger.error(`[Greenhouse Controller] Failed to log failure to DB: ${dbErr.message}`)
      }
    }

    throw new AppError(error.message, error.statusCode || 500, error.code || 'GREENHOUSE_SUBMISSION_FAILED', error.details || null)
  }
})
