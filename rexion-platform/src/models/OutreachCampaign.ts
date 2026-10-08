import { Schema, model, models } from 'mongoose'

const outreachCampaignSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    companyName: String,
    companyDomain: String,
    companyLogo: String,
    targetRole: String,
    company: {
      name: String,
      domain: String,
      logo: String,
    },
    subject: String,
    emailBody: String,
    body: String,
    tone: {
      type: String,
      enum: ['professional', 'bold', 'friendly'],
      default: 'professional',
    },
    totalContacts: Number,
    sentCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    openCount: {
      type: Number,
      default: 0,
    },
    replyCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'queued', 'sending', 'sent', 'partial_failed', 'failed'],
      default: 'draft',
    },
    followUp: {
      enabled: {
        type: Boolean,
        default: false,
      },
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
