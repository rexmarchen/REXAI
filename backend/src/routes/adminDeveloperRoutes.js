import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { requireAdmin } from '../middleware/developerMiddleware.js'
import {
  getDevelopersList,
  updateDeveloperStatus,
  inviteOrGrantDeveloper
} from '../controllers/adminDeveloperController.js'

const router = express.Router()

router.use(protect, requireAdmin)

router.get('/', getDevelopersList)
router.patch('/:id/status', updateDeveloperStatus)
router.post('/grant', inviteOrGrantDeveloper)

export default router
