import express from 'express'
import {
  uploadResume,
  predictResume,
  analyzeResume,
  auditResume,
  getPrediction,
  searchJobs
} from '../controllers/resumeController.js'
import { protect, optionalProtect } from '../middleware/authMiddleware.js'
import { upload } from '../middleware/uploadMiddleware.js'

const router = express.Router()

// Resume upload & prediction endpoints (protected)
router.post('/upload', protect, upload.single('resume'), uploadResume)
router.post('/predict', protect, upload.single('resume'), predictResume)
router.post('/:resumeId/predict', protect, predictResume)
router.post('/analyze', protect, upload.single('resume'), analyzeResume)
router.post('/audit', protect, auditResume)

// Job search (supports authenticated queries)
router.get('/jobs/search', optionalProtect, searchJobs)

// Prediction retrieval (protected with IDOR check)
router.get('/result/:id', protect, getPrediction)
router.get('/predict/:id', protect, getPrediction)
router.get('/prediction/:predictionId', protect, getPrediction)

export default router