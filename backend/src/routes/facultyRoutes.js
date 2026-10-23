import express from 'express'
import { protect, optionalProtect } from '../middleware/authMiddleware.js'
import { requireFaculty, requireVerifiedFaculty } from '../middleware/facultyMiddleware.js'
import { validate } from '../middleware/validationMiddleware.js'
import {
  facultyProfileSchema,
  facultyVerificationSubmissionSchema,
  facultyQuestionSchema
} from '../utils/validators.js'
import {
  getProfile,
  updateProfile,
  submitVerificationRequest,
  getPublicProfile,
  getDashboardOverview,
  getQuizzes,
  createQuiz,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  publishQuiz,
  unpublishQuiz,
  archiveQuiz,
  restoreQuiz,
  duplicateQuiz,
  getQuizAnalytics,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  getQuestionBank,
  createQuestionBankItem,
  updateQuestionBankItem,
  deleteQuestionBankItem,
  importQuestionsFromBank
} from '../controllers/facultyController.js'

const router = express.Router()

// Public sanitized profile for student attribution
router.get('/public/:id', optionalProtect, getPublicProfile)

// Faculty onboarding & profile management
router.get('/profile', protect, getProfile)
router.put('/profile', protect, validate(facultyProfileSchema), updateProfile)
router.post('/verify', protect, validate(facultyVerificationSubmissionSchema), submitVerificationRequest)

// Dashboard & Analytics
router.get('/dashboard', protect, requireFaculty, getDashboardOverview)
router.get('/quizzes', protect, requireFaculty, getQuizzes)
router.post('/quizzes', protect, requireFaculty, createQuiz)

// Question Bank across faculty's subjects
router.get('/questions', protect, requireFaculty, getQuestionBank)
router.post('/questions', protect, requireFaculty, validate(facultyQuestionSchema), createQuestionBankItem)
router.put('/questions/:id', protect, requireFaculty, updateQuestionBankItem)
router.delete('/questions/:id', protect, requireFaculty, deleteQuestionBankItem)

// Single Quiz actions
router.get('/quizzes/:id', protect, requireFaculty, getQuizById)
router.put('/quizzes/:id', protect, requireFaculty, updateQuiz)
router.delete('/quizzes/:id', protect, requireFaculty, deleteQuiz)
router.post('/quizzes/:id/publish', protect, requireFaculty, requireVerifiedFaculty, publishQuiz)
router.post('/quizzes/:id/unpublish', protect, requireFaculty, unpublishQuiz)
router.post('/quizzes/:id/archive', protect, requireFaculty, archiveQuiz)
router.post('/quizzes/:id/restore', protect, requireFaculty, restoreQuiz)
router.post('/quizzes/:id/duplicate', protect, requireFaculty, duplicateQuiz)
router.get('/quizzes/:id/analytics', protect, requireFaculty, getQuizAnalytics)

// Question Authoring within a quiz
router.post('/quizzes/:id/questions', protect, requireFaculty, addQuestion)
router.put('/quizzes/:id/questions/:questionId', protect, requireFaculty, updateQuestion)
router.delete('/quizzes/:id/questions/:questionId', protect, requireFaculty, deleteQuestion)
router.post('/quizzes/:id/questions/reorder', protect, requireFaculty, reorderQuestions)
router.post('/quizzes/:id/questions/from-bank', protect, requireFaculty, importQuestionsFromBank)

export default router
