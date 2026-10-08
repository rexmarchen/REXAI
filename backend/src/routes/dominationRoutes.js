import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { upload } from '../middleware/uploadMiddleware.js'
import {
  launchDominationWorkflow,
  findDominationJobs,
  applyAllDominationJobs,
  getDominationBatchStatus,
  getDominationEvidence,
  getDominationEmail
} from '../controllers/dominationController.js'

const router = express.Router()

router.post('/find-jobs', protect, upload.single('resume'), findDominationJobs)
router.post('/apply-all', protect, applyAllDominationJobs)
router.post('/apply', protect, upload.single('resume'), launchDominationWorkflow)
router.get('/batch/:batchId', protect, getDominationBatchStatus)
router.get('/evidence/:filename', protect, getDominationEvidence)
router.get('/email/:filename', protect, getDominationEmail)

export default router
