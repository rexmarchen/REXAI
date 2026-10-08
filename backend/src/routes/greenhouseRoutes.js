import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
  getJobDetailsHandler,
  validateHandler,
  applyHandler
} from '../controllers/greenhouseController.js'

const router = express.Router()

router.get('/greenhouse', protect, getJobDetailsHandler)
router.post('/greenhouse/validate', protect, validateHandler)
router.post('/greenhouse/apply', protect, applyHandler)

export default router
