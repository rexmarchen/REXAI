import { Schema, model, models } from 'mongoose'

const outreachContactSchema = new Schema(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'OutreachCampaign', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: String,
    role: String,
    email: String,
    confidence: String,
    linkedinUrl: String,
    status: {
      type: String,
      enum: ['queued', 'sent', 'failed', 'opened'],
      default: 'queued',
    },
    sentAt: Date,
    openedAt: Date,
    error: String,
  },
  {
    timestamps: true,
  }
)

const OutreachContact = models.OutreachContact || model('OutreachContact', outreachContactSchema)
export default OutreachContact
