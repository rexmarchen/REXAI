import mongoose from 'mongoose'

const outreachMailboxSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  provider: { type: String, enum: ['google', 'microsoft'], required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  status: { type: String, enum: ['active', 'disconnected'], default: 'active' },
  accessTokenEncrypted: { type: String, required: true },
  refreshTokenEncrypted: { type: String, required: true },
  tokenExpiresAt: { type: Date, required: true },
  connectedAt: { type: Date, default: Date.now }
}, { timestamps: true })

outreachMailboxSchema.index({ userId: 1, email: 1 }, { unique: true })

export default mongoose.models.OutreachMailbox || mongoose.model('OutreachMailbox', outreachMailboxSchema)
