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
router.post('/generate-topic', optionalProtect, generateTopicQuiz)

// User attempt history
router.get('/me/attempts',  optionalProtect, getMyAttempts)

// Quiz by ID/slug — keep after static routes to avoid shadowing
router.get('/:id',                 optionalProtect, getQuizById)
router.post('/:id/submit',         optionalProtect, submitQuiz)
router.post('/:id/generate-fresh', optionalProtect, generateFreshQuestions)

export default router
