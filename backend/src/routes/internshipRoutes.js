import express from 'express'
import {
  getInternships,
  getInternshipById,
  trackApplyClick,
  triggerAdminRefresh,
  getAdminHealth,
  triggerLiveSync
} from '../controllers/internshipController.js'
import { optionalProtect, protect, restrictTo } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public / Candidate query endpoints
router.get('/', optionalProtect, getInternships)
router.get('/search', optionalProtect, getInternships)
router.get('/sync', triggerLiveSync)
router.post('/sync', triggerLiveSync)
router.get('/:id', optionalProtect, getInternshipById)
router.post('/:id/click', trackApplyClick)

// Admin Management Endpoints
router.post('/admin/refresh', protect, restrictTo('admin'), triggerAdminRefresh)
router.get('/admin/health', protect, restrictTo('admin'), getAdminHealth)

// Compatibility alias for admin endpoints
export const adminInternshipRouter = express.Router()
adminInternshipRouter.post('/refresh', protect, restrictTo('admin'), triggerAdminRefresh)
adminInternshipRouter.get('/health', protect, restrictTo('admin'), getAdminHealth)

export default router
