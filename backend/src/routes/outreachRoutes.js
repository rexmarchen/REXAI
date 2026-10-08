import express from 'express'
import { protect, optionalProtect } from '../middleware/authMiddleware.js'
import {
  searchContacts,
  generateDrafts,
  sendCampaign,
  getStats,
  getMailboxes,
  startGoogleMailboxConnection,
  startMicrosoftMailboxConnection,
  googleMailboxCallback,
  microsoftMailboxCallback,
  trackOpen,
  trackUnsubscribe,
  webhookResend
} from '../controllers/outreachController.js'

const router = express.Router()

// Contact Search & Outreach Routes
router.get('/search', optionalProtect, searchContacts)
router.post('/draft', optionalProtect, generateDrafts)
router.post('/send', optionalProtect, sendCampaign)
router.get('/stats', optionalProtect, getStats)
router.get('/mailboxes', optionalProtect, getMailboxes)
router.get('/mailboxes/google/connect', optionalProtect, startGoogleMailboxConnection)
router.get('/mailboxes/microsoft/connect', optionalProtect, startMicrosoftMailboxConnection)
router.get('/mailboxes/google/callback', googleMailboxCallback)
router.get('/mailboxes/microsoft/callback', microsoftMailboxCallback)

// Public Webhooks & Tracking Routes
router.get('/track/open', trackOpen)
router.get('/track/unsubscribe', trackUnsubscribe)
router.post('/webhook/resend', webhookResend)

export default router
