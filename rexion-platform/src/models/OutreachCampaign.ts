import { Schema, model, models } from 'mongoose'

const outreachCampaignSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    company: {
      name: String,
      domain: String,
      logo: String,
    },
    subject: String,
    body: String,
    tone: String,
    totalContacts: Number,
    sentCount: Number,
    failedCount: Number,
    openCount: Number,
    status: {
      type: String,
      enum: ['queued', 'sending', 'sent', 'partial_failed', 'failed'],
      default: 'queued',
    },
    followUp: {
      enabled: Boolean,
      days: Number,
      message: String,
      scheduledAt: Date,
    },
  },
  {
    timestamps: true,
  }
)

const OutreachCampaign = models.OutreachCampaign || model('OutreachCampaign', outreachCampaignSchema)
export default OutreachCampaign
