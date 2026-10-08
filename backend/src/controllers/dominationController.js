import fs from 'node:fs'
import path from 'node:path'
import { catchAsync } from '../utils/catchAsync.js'
import AppError from '../utils/AppError.js'
import { logger } from '../utils/logger.js'
import {
  buildDominationWorkflowErrorLogContext,
  canUseDominationWorkflow,
  submitDominationWorkflow,
  findDominationMatches,
  applyAllDominationMatches
} from '../services/dominationWorkflowService.js'
import {
  findApplicationBatchById,
  findApplicationsByBatchId
} from '../../server.js'

const logDominationWorkflowFailure = (route, step, webhookAlias, error) => {
  const logContext = buildDominationWorkflowErrorLogContext(error, {
    route,
    step,
    webhookAlias
  })

  logger.error(`Domination workflow failure ${JSON.stringify(logContext)}`)
}

export const launchDominationWorkflow = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError('You must be logged in to launch 1-Click Mode.', 401)
  }

  if (!canUseDominationWorkflow(req.user)) {
    throw new AppError('Upgrade to Elite to launch this automation lane.', 403)
  }

  if (!req.file) {
    throw new AppError('Please upload a resume file before launching 1-Click Mode.', 400)
  }

  try {
    const callbackBaseUrl = String(
      process.env.BACKEND_PUBLIC_URL || process.env.API_BASE_URL || process.env.APP_URL || 'http://127.0.0.1:5000'
    )
      .trim()
      .replace(/\/+$/, '')
    const callbackSecret = String(process.env.DOMINATION_CALLBACK_SECRET || '').trim()
    const { result } = await submitDominationWorkflow({
      user: req.user,
      body: req.body,
      file: req.file,
      callbackUrl: `${callbackBaseUrl}/api/domination/callback`,
      callbackSecret
    })

    res.status(202).json(result)
  } catch (error) {
    logDominationWorkflowFailure('/api/domination/apply', 'launch', 'apply', error)
    throw new AppError(error.message, error.statusCode || 500, error.details || null)
  }
})

export const findDominationJobs = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError('You must be logged in to use 1-Click Auto Apply.', 401)
  }

  if (!canUseDominationWorkflow(req.user)) {
    throw new AppError('Upgrade to Elite to unlock 1-Click Auto Apply.', 403)
  }

  if (!req.file && !String(req.body?.resumeText || req.body?.resume_text || '').trim()) {
    throw new AppError('Please upload a resume file before searching for matching jobs.', 400)
  }

  try {
    const result = await findDominationMatches({
      user: req.user,
      body: req.body,
      file: req.file || null
    })

    res.status(200).json(result)
  } catch (error) {
    logDominationWorkflowFailure('/api/domination/find-jobs', 'find', 'apply', error)
    throw new AppError(error.message, error.statusCode || 500, error.details || null)
  }
})

export const applyAllDominationJobs = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError('You must be logged in to use 1-Click Auto Apply.', 401)
  }

  if (!canUseDominationWorkflow(req.user)) {
    throw new AppError('Upgrade to Elite to unlock 1-Click Auto Apply.', 403)
  }

  try {
    const result = await applyAllDominationMatches({
      user: req.user,
      body: req.body
    })

    res.status(200).json(result)
  } catch (error) {
    logDominationWorkflowFailure('/api/domination/apply-all', 'apply-all', 'apply-all', error)
    throw new AppError(error.message, error.statusCode || 500, error.details || null)
  }
})

export const getDominationBatchStatus = catchAsync(async (req, res) => {
  const { batchId } = req.params

  const batch = await findApplicationBatchById(Number(batchId))
  if (!batch) {
    throw new AppError('Batch not found.', 404)
  }

  if (String(batch.userId) !== String(req.user.id)) {
    throw new AppError('Access denied.', 403)
  }

  const applications = await findApplicationsByBatchId(Number(batchId))
  res.status(200).json({
    success: true,
    batchId: batch.id,
    status: batch.status,
    emailPreview: batch.emailPreview,
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt,
    applications
  })
})

export const getDominationEvidence = catchAsync(async (req, res) => {
  const { filename } = req.params
  const safeFilename = path.basename(filename)
  const evidencePath = path.resolve(process.cwd(), 'uploads', 'evidence', safeFilename)

  if (!fs.existsSync(evidencePath)) {
    throw new AppError('Evidence file not found.', 404)
  }

  if (req.query.download === 'true') {
    return res.download(evidencePath, safeFilename)
  }

  res.sendFile(evidencePath)
})

export const getDominationEmail = catchAsync(async (req, res) => {
  const { filename } = req.params
  const safeFilename = path.basename(filename)
  const emailPath = path.resolve(process.cwd(), 'uploads', 'emails', safeFilename)

  if (!fs.existsSync(emailPath)) {
    throw new AppError('Email file not found.', 404)
  }

  res.sendFile(emailPath)
})

