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

// Contact Search & Outreach Routes (Protected)
router.get('/search', protect, searchContacts)
router.post('/draft', protect, generateDrafts)
router.post('/send', protect, sendCampaign)
router.get('/stats', protect, getStats)
router.get('/mailboxes', protect, getMailboxes)
router.get('/mailboxes/google/connect', protect, startGoogleMailboxConnection)
router.get('/mailboxes/microsoft/connect', protect, startMicrosoftMailboxConnection)
router.get('/mailboxes/google/callback', googleMailboxCallback)
router.get('/mailboxes/microsoft/callback', microsoftMailboxCallback)

// Public Webhooks & Tracking Routes
router.get('/track/open', trackOpen)
router.get('/track/unsubscribe', trackUnsubscribe)
router.post('/webhook/resend', webhookResend)

export default router
