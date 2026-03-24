import { readFileSync } from 'node:fs'
import Resume from '../models/Resume.js'
import Prediction from '../models/Prediction.js'
import { analyzeResumeContent } from '../services/resumeAnalysisService.js'
import {
  predictCareerPathViaMlService,
  searchJobsViaMlService
} from '../services/mlServiceClient.js'
import { catchAsync } from '../utils/catchAsync.js'
import AppError from '../utils/AppError.js'
import { logger } from '../utils/logger.js'

const getUserId = (req) => req.user?.id || req.user?._id || null

/**
 * POST /api/ml/predict
 * Upload resume and predict career path with job matches
 */
export const predictCareerPath = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a file', 400))
  }

  const userId = getUserId(req)
  const resumeBuffer = readFileSync(req.file.path)
  const fileName = req.file.originalname || req.file.filename

  try {
    logger.info(`ML prediction requested for ${fileName}`)

    // Call ML Service for prediction
    const mlPrediction = await predictCareerPathViaMlService(
      resumeBuffer,
      fileName,
      userId
    )

    logger.info(`ML Service prediction received for ${fileName}`)

    // Save resume to database
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
        mlServicePredictionId: mlPrediction.prediction_id,
        prediction: mlPrediction.career_path,
        confidence: mlPrediction.confidence,
        details: {
          atsScore: mlPrediction.ats_score,
          careerPath: mlPrediction.career_path,
          confidence: mlPrediction.confidence,
          name: mlPrediction.name || '',
          education: mlPrediction.education || '',
          experienceYears: mlPrediction.experience_years || 0,
          certifications: mlPrediction.certifications || [],
          projects: mlPrediction.projects || [],
          predictedCategory: mlPrediction.predicted_category || '',
          extractedSkills: mlPrediction.extracted_skills || [],
          missingSkills: mlPrediction.missing_skills || [],
          jobDescriptionUsed: mlPrediction.job_description_used || '',
          jobsCount: mlPrediction.jobs?.length || 0,
          mlServiceSource: true
        }
      })

      predictionId = String(prediction._id)
    }

    // Return response
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
      name: mlPrediction.name || '',
      education: mlPrediction.education || '',
      experience_years: mlPrediction.experience_years || 0,
      certifications: mlPrediction.certifications || [],
      projects: mlPrediction.projects || [],
      predicted_category: mlPrediction.predicted_category || '',
      extracted_skills: mlPrediction.extracted_skills || [],
      missing_skills: mlPrediction.missing_skills || [],
      job_description_used: mlPrediction.job_description_used || '',
      jobs: mlPrediction.jobs || [],
      analysisMethod: 'ml-service',
      source: 'ml-service'
    })
  } catch (error) {
    logger.error(`ML prediction failed: ${error.message}`)

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
          id: predictionId,
          prediction: analysis.prediction,
          confidence: analysis.confidence,
          confidenceLevel: analysis.confidenceLevel,
          weaknesses: analysis.weaknesses,
          precautions: analysis.precautions,
          technologyRecommendations: analysis.technologyRecommendations,
          improvementPlan: analysis.improvementPlan,
          llmModel: analysis.llmModel,
          analysisMethod: analysis.analysisMethod,
          voiceSummary: analysis.voiceSummary,
          jobs: [],
          analysisMethod: 'local-fallback',
          source: 'local-analysis'
        })
      } catch (fallbackError) {
        return next(new AppError(`Analysis failed: ${fallbackError.message}`, 500))
      }
    } else {
      return next(new AppError(`ML prediction failed: ${error.message}`, 500))
    }
  }
})

/**
 * GET /api/ml/jobs/search
 * Search for jobs based on query and filters
 */
export const searchJobs = catchAsync(async (req, res, next) => {
  const { query, location, remote, page, num_pages, limit, posted_within_hours, refresh } = req.query

  if (!query) {
    return next(new AppError('Query parameter required', 400))
  }

  try {
    const jobsData = await searchJobsViaMlService(query, {
      location,
      remote: remote === 'true' ? true : remote === 'false' ? false : undefined,
      page: Number(page) || 1,
      numPages: Number(num_pages) || 1,
      limit: Number(limit) || 50,
      postedWithinHours: Number(posted_within_hours) || 0,
      refresh: refresh === 'true'
    })

    res.status(200).json({
      success: true,
      jobs: jobsData.jobs || [],
      meta: jobsData.meta || {}
    })
  } catch (error) {
    logger.error(`Job search failed: ${error.message}`)
    return next(new AppError(`Job search failed: ${error.message}`, 500))
  }
})

/**
 * POST /api/ml/upload-resumes
 * Upload multiple resumes for ATS processing
 */
export const uploadResumes = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError('Please upload at least one file', 400))
  }

  const userId = getUserId(req)
  const uploadedResumes = []

  try {
    for (const file of req.files) {
      const resume = await Resume.create({
        user: userId || null,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype
      })

      uploadedResumes.push({
        id: String(resume._id),
        filename: resume.filename,
        fileSize: resume.size
      })
    }

    res.status(201).json({
      success: true,
      data: uploadedResumes
    })
  } catch (error) {
    logger.error(`Resume upload failed: ${error.message}`)
    return next(new AppError(`Resume upload failed: ${error.message}`, 500))
  }
})

/**
 * POST /api/ml/match
 * Match resumes with job description
 */
export const matchResumes = catchAsync(async (req, res, next) => {
  const { job_description, resume_ids } = req.body

  if (!job_description) {
    return next(new AppError('Job description required', 400))
  }

  if (!Array.isArray(resume_ids) || resume_ids.length === 0) {
    return next(new AppError('Resume IDs required', 400))
  }

  try {
    // TODO: Implement resume matching logic with ML service
    res.status(200).json({
      success: true,
      matches: [],
      message: 'Resume matching feature coming soon'
    })
  } catch (error) {
    logger.error(`Resume matching failed: ${error.message}`)
    return next(new AppError(`Resume matching failed: ${error.message}`, 500))
  }
})

/**
 * GET /api/ml/rank
 * Rank resumes against job description
 */
export const rankResumes = catchAsync(async (req, res, next) => {
  const { job_description, top_k } = req.query

  if (!job_description) {
    return next(new AppError('Job description required', 400))
  }

  try {
    // TODO: Implement resume ranking logic with ML service
    res.status(200).json({
      success: true,
      rankings: [],
      message: 'Resume ranking feature coming soon'
    })
  } catch (error) {
    logger.error(`Resume ranking failed: ${error.message}`)
    return next(new AppError(`Resume ranking failed: ${error.message}`, 500))
  }
})
