import express from 'express'
import {
  connectLinkedIn,
  getConnectLink,
  getLinkedInStatus,
  toggleCampaign,
  handleUnipileWebhook,
  launchSequence,
  discoverLeadsFromResume,
  searchAndQualifyContacts,
  verifyInvitationAction,
  getLastErrors
} from '../controllers/linkedinController.js'

import { protect, restrictTo } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/connect-link', protect, getConnectLink)
router.post('/connect', protect, connectLinkedIn)
router.get('/status', protect, getLinkedInStatus)
router.post('/toggle-campaign', protect, toggleCampaign)
router.post('/webhook', handleUnipileWebhook)
router.post('/launch-sequence', protect, launchSequence)
router.post('/discover-leads', protect, discoverLeadsFromResume)
router.post('/search-contacts', protect, searchAndQualifyContacts)
router.get('/verify/:actionId', protect, verifyInvitationAction)
router.get('/debug/last-errors', protect, restrictTo('admin'), getLastErrors)

export default router
