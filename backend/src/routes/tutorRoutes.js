import express from 'express'
import {
  chatWithTutor,
  getSessions,
  getSession,
  createQuiz,
  submitQuiz,
  rateMessage
} from '../controllers/tutorController.js'

import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/chat', protect, chatWithTutor)
router.get('/sessions', protect, getSessions)
router.get('/sessions/:sessionId', protect, getSession)
router.post('/quiz', protect, createQuiz)
router.post('/quiz/:id/submit', protect, submitQuiz)
router.post('/messages/:id/rate', protect, rateMessage)

export default router
