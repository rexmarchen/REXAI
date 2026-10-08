import { Schema, model, models } from 'mongoose'

const outreachMailboxSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, enum: ['google', 'microsoft'], required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    status: { type: String, enum: ['active', 'disconnected'], default: 'active' },
    accessTokenEncrypted: { type: String, required: true },
    refreshTokenEncrypted: { type: String, required: true },
    tokenExpiresAt: { type: Date, required: true },
    connectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

outreachMailboxSchema.index({ userId: 1, email: 1 }, { unique: true })

const OutreachMailbox = models.OutreachMailbox || model('OutreachMailbox', outreachMailboxSchema)
export default OutreachMailbox
