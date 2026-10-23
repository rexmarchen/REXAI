import express from 'express'
import {
  getProblems,
  getProblem,
  runCode,
  submitCode,
  getOverview,
  syncChallenges
} from '../controllers/codeArenaController.js'

import { protect, optionalProtect, restrictTo } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/overview', optionalProtect, getOverview)
router.post('/sync-challenges', protect, restrictTo('admin'), syncChallenges)
router.get('/problems', optionalProtect, getProblems)
router.get('/problems/:slug', optionalProtect, getProblem)
router.post('/problems/:slug/run', protect, runCode)
router.post('/problems/:slug/submit', protect, submitCode)

export default router

