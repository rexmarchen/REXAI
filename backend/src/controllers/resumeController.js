import { readFileSync } from 'node:fs'
import Resume from '../models/Resume.js'
import Prediction from '../models/Prediction.js'
import { analyzeResumeContent } from '../services/resumeAnalysisService.js'
import { predictCareerPathViaMlService, getPredictionFromMlService } from '../services/mlServiceClient.js'
import { catchAsync } from '../utils/catchAsync.js'
import AppError from '../utils/AppError.js'
import { logger } from '../utils/logger.js'

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

  const userId = getUserId(req)
  
  // Get file buffer and validate
  const resumeBuffer = readFileSync(req.file.path)
  const fileName = req.file.originalname || req.file.filename

  try {
    // Call ML Service for prediction
    const mlPrediction = await predictCareerPathViaMlService(
      resumeBuffer,
      fileName,
      userId
    )

    logger.info(`ML Service prediction received for ${fileName}`)

    // Save resume to database
    let savedResume = null
    let predictionId = null

    if (userId) {
      savedResume = await Resume.create({
        user: userId,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      })

      // Store prediction reference in DB
      const prediction = await Prediction.create({
        user: userId,
        resume: savedResume._id,
        mlServicePredictionId: mlPrediction.prediction_id, // Reference to ML service
        prediction: mlPrediction.career_path,
        confidence: mlPrediction.confidence,
        details: {
          atsScore: mlPrediction.ats_score,
          careerPath: mlPrediction.career_path,
          confidence: mlPrediction.confidence,
          jobsCount: mlPrediction.jobs?.length || 0,
          mlServiceSource: true
        }
      })

      predictionId = String(prediction._id)
    }

    // Return response with ML service data
    res.status(201).json({
      success: true,
      fileName: fileName,
      sizeBytes: req.file.size,
      prediction_id: mlPrediction.prediction_id,
      db_prediction_id: predictionId,
      id: predictionId,
      career_path: mlPrediction.career_path,
      prediction: mlPrediction.career_path,
      confidence: mlPrediction.confidence,
      ats_score: mlPrediction.ats_score,
      jobs: mlPrediction.jobs,
      analysisMethod: 'ml-service',
      source: 'ml-service'
    })
  } catch (error) {
    logger.error(`Resume prediction failed: ${error.message}`)

    // Fallback to local analysis if ML service fails
    if (process.env.USE_FALLBACK_ANALYSIS === 'true') {
      logger.info('Falling back to local analysis...')
      
      try {
        const analysis = await analyzeResumeContent(resumeBuffer, fileName)
        
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
              voiceSummary: analysis.voiceSummary,
              mlServiceSource: false
            }
          })

          predictionId = String(prediction._id)
        }

        res.status(201).json({
          fileName: fileName,
          sizeBytes: req.file.size,
          ...buildPredictionPayload(analysis, predictionId),
          analysisMethod: 'local-fallback',
          source: 'local-analysis'
        })
      } catch (fallbackError) {
        return next(new AppError(`Analysis failed: ${fallbackError.message}`, 500))
      }
    } else {
      return next(new AppError(`ML Service analysis failed: ${error.message}`, error.response?.status || 500))
    }
  }
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
