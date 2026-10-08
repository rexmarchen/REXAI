import express from 'express'
import {
  getProblems,
  getProblem,
  runCode,
  submitCode,
  getOverview,
  syncChallenges
} from '../controllers/codeArenaController.js'

const router = express.Router()

router.get('/overview', getOverview)
router.post('/sync-challenges', syncChallenges)
router.get('/problems', getProblems)
router.get('/problems/:slug', getProblem)
router.post('/problems/:slug/run', runCode)
router.post('/problems/:slug/submit', submitCode)

export default router

