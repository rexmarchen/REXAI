import mongoose from 'mongoose'

const campaignSendSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['queued', 'sending', 'sent', 'opened', 'replied', 'bounced', 'skipped', 'failed'],
    default: 'queued'
  },
  queuedAt: {
    type: Date,
    default: Date.now
  },
  sentAt: {
    type: Date
  },
  openedAt: {
    type: Date
  },
  bouncedAt: {
    type: Date
  },
  repliedAt: {
    type: Date
  }
})

const CampaignSend = mongoose.model('CampaignSend', campaignSendSchema)
export default CampaignSend
