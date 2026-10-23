import express from 'express'
import {
  getQuizzes,
  getQuizById,
  submitQuiz,
  getMyAttempts,
  getLeaderboard,
  generateFreshQuestions,
  generateTopicQuiz
} from '../controllers/quizController.js'
import { optionalProtect, protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public / optional-auth routes
router.get('/',             optionalProtect, getQuizzes)
router.get('/leaderboard',  optionalProtect, getLeaderboard)
router.post('/generate-topic', protect, generateTopicQuiz)

// User attempt history
router.get('/me/attempts',  protect, getMyAttempts)

// Quiz by ID/slug — keep after static routes to avoid shadowing
router.get('/:id',                 optionalProtect, getQuizById)
router.post('/:id/submit',         protect, submitQuiz)
router.post('/:id/generate-fresh', protect, generateFreshQuestions)

export default router
