import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { requireDeveloper } from '../middleware/developerMiddleware.js'
import {
  getDeveloperProfile,
  applyForDeveloper,
  getDashboardOverview,
  getDeveloperQuizzes,
  createQuiz,
  getQuizById,
  updateQuiz,
  publishQuiz,
  archiveQuiz,
  restoreQuiz,
  duplicateQuiz,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  duplicateQuestion,
  importQuestions,
  getQuestionsBank,
  getQuizAnalytics
} from '../controllers/developerController.js'

const router = express.Router()

// Developer onboarding & account status (accessible to any authenticated user)
router.get('/profile', protect, getDeveloperProfile)
router.post('/apply', protect, applyForDeveloper)

// Protected Developer Portal operations (require role developer/admin + active status)
router.get('/dashboard', protect, requireDeveloper, getDashboardOverview)
router.get('/quizzes', protect, requireDeveloper, getDeveloperQuizzes)
router.post('/quizzes', protect, requireDeveloper, createQuiz)

// Question Bank across developer's quizzes
router.get('/questions', protect, requireDeveloper, getQuestionsBank)

// Single Quiz actions
router.get('/quizzes/:id', protect, requireDeveloper, getQuizById)
router.patch('/quizzes/:id', protect, requireDeveloper, updateQuiz)
router.delete('/quizzes/:id', protect, requireDeveloper, deleteQuiz)
router.post('/quizzes/:id/publish', protect, requireDeveloper, publishQuiz)
router.post('/quizzes/:id/archive', protect, requireDeveloper, archiveQuiz)
router.post('/quizzes/:id/restore', protect, requireDeveloper, restoreQuiz)
router.post('/quizzes/:id/duplicate', protect, requireDeveloper, duplicateQuiz)
router.get('/quizzes/:id/analytics', protect, requireDeveloper, getQuizAnalytics)

// Question Builder endpoints within a quiz
router.post('/quizzes/:id/questions', protect, requireDeveloper, addQuestion)
router.patch('/quizzes/:id/questions/:questionId', protect, requireDeveloper, updateQuestion)
router.delete('/quizzes/:id/questions/:questionId', protect, requireDeveloper, deleteQuestion)
router.post('/quizzes/:id/questions/reorder', protect, requireDeveloper, reorderQuestions)
router.post('/quizzes/:id/questions/duplicate', protect, requireDeveloper, duplicateQuestion)
router.post('/quizzes/:id/questions/import', protect, requireDeveloper, importQuestions)

export default router
