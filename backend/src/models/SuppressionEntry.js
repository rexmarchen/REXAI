import mongoose from 'mongoose'

const suppressionEntrySchema = new mongoose.Schema({
  userId: {
    type: String, // Can be ObjectId ref User or 'system'
    required: true
  },
  email: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    enum: ['unsubscribed', 'bounced', 'complained'],
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
})

// Index by email to ensure unique records and quick lookup
suppressionEntrySchema.index({ email: 1 }, { unique: true })

const SuppressionEntry = mongoose.model('SuppressionEntry', suppressionEntrySchema)
export default SuppressionEntry
