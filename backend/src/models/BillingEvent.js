import mongoose from 'mongoose'

const billingEventSchema = new mongoose.Schema(
  {
    providerEventId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    provider: {
      type: String,
      enum: ['stripe', 'manual', 'mock'],
      default: 'stripe',
      required: true
    },
    eventType: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['processed', 'ignored', 'failed'],
      default: 'processed'
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    error: {
      type: String,
      default: null
    },
    processedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
)

billingEventSchema.index({ provider: 1, providerEventId: 1 }, { unique: true })

const BillingEvent = mongoose.models.BillingEvent || mongoose.model('BillingEvent', billingEventSchema)
export default BillingEvent
