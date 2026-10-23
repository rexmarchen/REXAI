import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { requireAdmin } from '../middleware/facultyMiddleware.js'
import {
  getFacultyList,
  getFacultyDetail,
  updateFacultyStatus
} from '../controllers/adminFacultyController.js'

const router = express.Router()

router.use(protect, requireAdmin)

router.get('/', getFacultyList)
router.get('/:id', getFacultyDetail)
router.patch('/:id/status', updateFacultyStatus)
router.patch('/:id/verification', updateFacultyStatus)

export default router
