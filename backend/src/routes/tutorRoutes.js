import express from 'express'
import {
  chatWithTutor,
  getSessions,
  getSession,
  createQuiz,
  submitQuiz,
  rateMessage
} from '../controllers/tutorController.js'

const router = express.Router()

router.post('/chat', chatWithTutor)
router.get('/sessions', getSessions)
router.get('/sessions/:sessionId', getSession)
router.post('/quiz', createQuiz)
router.post('/quiz/:id/submit', submitQuiz)
router.post('/messages/:id/rate', rateMessage)

export default router
