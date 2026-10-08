import { Schema, model, models } from 'mongoose'

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    image: { type: String, trim: true },
    avatar: { type: String, trim: true },
    password: { type: String, minlength: 8, select: false },
    role: {
      type: String,
      enum: ['user', 'candidate', 'company', 'admin'],
      default: 'user',
    },
    plan: {
      type: String,
      enum: ['free', 'pro', 'elite'],
      default: 'free',
    },
    authProviders: {
      google: {
        sub: String,
        email: String,
        picture: String,
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
      phone: String,
      college: String,
      degree: String,
      graduationYear: Number,
      headline: String,
      resumeText: String,
      skills: {
        type: [String],
        default: [],
      },
      targetRole: String,
      preferredDomain: String,
      location: String,
      linkedinUrl: String,
      githubUrl: String,
      portfolioUrl: String,
      resumeUrl: String,
      companyRole: String,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    loginCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

const User = models.User || model('User', userSchema)

export default User
