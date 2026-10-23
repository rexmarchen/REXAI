import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
  getChallengesList,
  getChallengeById,
  runChallenge,
  submitChallenge
} from '../controllers/challengesController.js'

const router = express.Router()

router.get('/', getChallengesList)
router.get('/:id', getChallengeById)
router.post('/:id/run', protect, runChallenge)
router.post('/:id/submit', protect, submitChallenge)

export default router
