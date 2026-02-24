import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { generateCode, getGeneratedSites } from '../controllers/rexcodeController.js'

const router = express.Router()

router.post('/generate', protect, generateCode)
router.get('/sites', protect, getGeneratedSites)

export default router
