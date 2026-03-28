import { Schema, model, models } from 'mongoose'

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    image: { type: String, trim: true },
    password: { type: String, minlength: 8, select: false },
    role: {
      type: String,
      enum: ['candidate', 'company', 'admin'],
      default: 'candidate',
    },
    authProviders: {
      google: {
        sub: String,
        email: String,
      },
    },
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'pro', 'elite'],
        default: 'free',
      },
      status: {
        type: String,
        enum: ['active', 'past_due', 'inactive'],
        default: 'inactive',
      },
      stripeCustomerId: String,
      stripeSubscriptionId: String,
      currentPeriodEnd: Date,
    },
    profile: {
      headline: String,
      resumeText: String,
      skills: {
        type: [String],
        default: [],
      },
      targetRole: String,
      preferredDomain: String,
      location: String,
      companyRole: String,
    },
  },
  {
    timestamps: true,
  }
)

const User = models.User || model('User', userSchema)

export default User
