import { readFileSync } from 'node:fs'
import Resume from '../models/Resume.js'
import Prediction from '../models/Prediction.js'
import { analyzeResumeContent } from '../services/resumeAnalysisService.js'
import { catchAsync } from '../utils/catchAsync.js'
import AppError from '../utils/AppError.js'

const getUserId = (req) => req.user?.id || req.user?._id || null

const buildPredictionPayload = (analysis, predictionId) => ({
  id: predictionId || null,
  prediction: analysis.prediction,
  confidence: analysis.confidence,
  confidenceLevel: analysis.confidenceLevel,
  weaknesses: analysis.weaknesses,
  precautions: analysis.precautions,
  technologyRecommendations: analysis.technologyRecommendations,
  improvementPlan: analysis.improvementPlan,
  llmModel: analysis.llmModel,
  analysisMethod: analysis.analysisMethod,
  voiceSummary: analysis.voiceSummary
})

export const uploadResume = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a file', 400))
  }

  const userId = getUserId(req)
  if (!userId) {
    return next(new AppError('You must be logged in to save resume history.', 401))
  }

  const { filename, path, size, mimetype } = req.file
  const resume = await Resume.create({
    user: userId,
    filename,
    path,
    size,
    mimetype
  })

  res.status(201).json({
    success: true,
    data: {
      resumeId: resume._id,
      filename: resume.filename
    }
  })
})

export const predictResume = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a file', 400))
  }

  const resumeBuffer = readFileSync(req.file.path)
  const analysis = await analyzeResumeContent(resumeBuffer, req.file.originalname || req.file.filename)
  const userId = getUserId(req)

  let predictionId = null
  if (userId) {
    const savedResume = await Resume.create({
      user: userId,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    })

    const prediction = await Prediction.create({
      user: userId,
      resume: savedResume._id,
      prediction: analysis.prediction,
      confidence: analysis.confidence,
      details: {
        confidenceLevel: analysis.confidenceLevel,
        weaknesses: analysis.weaknesses,
        precautions: analysis.precautions,
        technologyRecommendations: analysis.technologyRecommendations,
        improvementPlan: analysis.improvementPlan,
        llmModel: analysis.llmModel,
        analysisMethod: analysis.analysisMethod,
        voiceSummary: analysis.voiceSummary
      }
    })

    predictionId = String(prediction._id)
  }

  res.status(201).json({
    fileName: req.file.originalname || req.file.filename,
    sizeBytes: req.file.size,
    ...buildPredictionPayload(analysis, predictionId)
  })
})

export const analyzeResume = predictResume

export const getPrediction = catchAsync(async (req, res, next) => {
  const predictionId = req.params.id || req.params.predictionId
  if (!predictionId) {
    return next(new AppError('Prediction id is required', 400))
  }

  const prediction = await Prediction.findById(predictionId)
    .populate('user', 'name email')
    .populate('resume', 'filename')

  if (!prediction) {
    return next(new AppError('Prediction not found', 404))
  }

  const details = prediction.details && typeof prediction.details === 'object'
    ? prediction.details
    : {}

  res.status(200).json({
    id: prediction._id,
    prediction: prediction.prediction,
    confidence: prediction.confidence,
    ...details,
    fileName: prediction.resume?.filename || null,
    createdAt: prediction.createdAt
  })
})
