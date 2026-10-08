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

const router = express.Router()

router.get('/connect-link', getConnectLink)
router.post('/connect', connectLinkedIn)
router.get('/status', getLinkedInStatus)
router.post('/toggle-campaign', toggleCampaign)
router.post('/webhook', handleUnipileWebhook)
router.post('/launch-sequence', launchSequence)
router.post('/discover-leads', discoverLeadsFromResume)
router.post('/search-contacts', searchAndQualifyContacts)
router.get('/verify/:actionId', verifyInvitationAction)
router.get('/debug/last-errors', getLastErrors)

export default router
