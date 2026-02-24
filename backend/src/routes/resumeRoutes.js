import express from 'express'
import { protect, optionalProtect } from '../middleware/authMiddleware.js'
import { upload } from '../middleware/uploadMiddleware.js'
import {
  uploadResume,
  predictResume,
  analyzeResume,
  getPrediction
} from '../controllers/resumeController.js'

const router = express.Router()

router.post('/upload', protect, upload.single('resume'), uploadResume)
router.post('/predict', optionalProtect, upload.single('resume'), predictResume)
router.post('/analyze', optionalProtect, upload.single('resume'), analyzeResume)
router.get('/result/:id', getPrediction)
router.get('/predict/:id', protect, getPrediction)

export default router
