import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
  predictCareerPath,
  searchJobs,
  uploadResumes,
  matchResumes,
  rankResumes
} from '../controllers/mlController.js'
import { upload } from '../middleware/uploadMiddleware.js'
import { validate } from '../middleware/validationMiddleware.js'
import { resumeUploadSchema } from '../utils/validators.js'

const router = express.Router()

// All routes require authentication
router.use(protect)

/**
 * POST /api/ml/predict
 * Upload resume and predict career path with job matches
 */
router.post(
  '/predict',
  upload.single('file'),
  validate(resumeUploadSchema),
  predictCareerPath
)

/**
 * GET /api/ml/jobs/search
 * Search for jobs based on query and filters
 */
router.get('/jobs/search', searchJobs)

/**
 * POST /api/ml/upload-resumes
 * Upload multiple resumes for ATS processing
 */
router.post(
  '/upload-resumes',
  upload.array('resumes', 10),
  uploadResumes
)

/**
 * POST /api/ml/match
 * Match resumes with job description
 */
router.post('/match', matchResumes)

/**
 * GET /api/ml/rank
 * Rank resumes against job description
 */
router.get('/rank', rankResumes)

export default router
