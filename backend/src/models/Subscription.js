import mongoose from 'mongoose'

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'User ID is required'],
      index: true
    },
    billingProvider: {
      type: String,
      enum: ['stripe', 'manual', 'mock'],
      default: 'stripe',
      required: true
    },
    providerCustomerId: {
      type: String,
      trim: true,
      index: true,
      default: null
    },
    providerSubscriptionId: {
      type: String,
      trim: true,
      default: null
    },
    providerPriceId: {
      type: String,
      trim: true,
      default: null
    },
    planId: {
      type: String,
      enum: ['free', 'pro', 'elite'],
      default: 'free',
      required: true
    },
    subscriptionStatus: {
      type: String,
      enum: [
        'active',
        'trialing',
        'past_due',
        'canceled',
        'unpaid',
        'incomplete',
        'incomplete_expired',
        'paused',
        'inactive'
      ],
      default: 'inactive',
      required: true,
      index: true
    },
    currentPeriodStart: {
      type: Date,
      default: null
    },
    currentPeriodEnd: {
      type: Date,
      default: null,
      index: true
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    },
    canceledAt: {
      type: Date,
      default: null
    },
    lastSuccessfulPaymentAt: {
      type: Date,
      default: null
    },
    entitlementStatus: {
      type: String,
      enum: ['active', 'grace_period', 'suspended', 'revoked', 'expired', 'inactive'],
      default: 'inactive',
      required: true,
      index: true
    },
    dailyPostLimit: {
      type: Number,
      default: 0
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    strict: true
  }
)

// Compound and unique indexes for fast lookups and to prevent duplicate active subscriptions
subscriptionSchema.index({ userId: 1, subscriptionStatus: 1 })
subscriptionSchema.index({ providerSubscriptionId: 1 }, { unique: true, sparse: true })

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema)
export default Subscription
