import mongoose from 'mongoose'

const campaignSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  bodyTemplate: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'sending', 'complete', 'failed'],
    default: 'draft'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const Campaign = mongoose.model('Campaign', campaignSchema)
export default Campaign
