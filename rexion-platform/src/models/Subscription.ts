import { Schema, model, models } from 'mongoose'

const subscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    plan: {
      type: String,
      enum: ['free', 'pro', 'elite'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'past_due', 'inactive'],
      required: true,
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodEnd: Date,
  },
  { timestamps: true }
)

const Subscription = models.Subscription || model('Subscription', subscriptionSchema)
export default Subscription
