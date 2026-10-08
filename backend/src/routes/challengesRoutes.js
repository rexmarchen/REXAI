import express from 'express'
import {
  getChallengesList,
  getChallengeById,
  runChallenge,
  submitChallenge
} from '../controllers/challengesController.js'

const router = express.Router()

router.get('/', getChallengesList)
router.get('/:id', getChallengeById)
router.post('/:id/run', runChallenge)
router.post('/:id/submit', submitChallenge)

export default router
