import express from 'express'
import {
  getActivities,
  getActivitySummary,
  exportActivities,
  deleteActivity
} from '../controllers/activityController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// All activity routes require authentication for strict user isolation
router.use(protect)

router.get('/', getActivities)
router.get('/summary', getActivitySummary)
router.get('/export', exportActivities)
router.delete('/:id', deleteActivity)

export default router
