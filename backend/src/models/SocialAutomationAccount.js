import mongoose from 'mongoose'

const socialAutomationAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true
    },
    platform: {
      type: String,
      enum: ['linkedin', 'instagram'],
      required: true,
      index: true
    },
    accountName: {
      type: String,
      trim: true,
      default: ''
    },
    accountUsername: {
      type: String,
      trim: true,
      default: ''
    },
    accountAvatar: {
      type: String,
      default: ''
    },
    platformUserId: {
      type: String,
      trim: true,
      default: ''
    },
    accessToken: {
      type: String,
      trim: true,
      default: ''
    },
    refreshToken: {
      type: String,
      trim: true,
      default: ''
    },
    tokenExpiresAt: {
      type: Date,
      default: null
    },
    tokenRefreshedAt: {
      type: Date,
      default: null
    },
    connected: {
      type: Boolean,
      default: false
    },
    autopilotEnabled: {
      type: Boolean,
      default: true
    },
    dailyPostLimit: {
      type: Number,
      default: 2,
      min: 1,
      max: 10
    },
    cronTime: {
      type: String,
      default: '19:00'
    },
    cronTimezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    defaultTone: {
      type: String,
      default: 'creator'
    },
    safeJitter: {
      type: Boolean,
      default: true
    },
    customPromptDirective: {
      type: String,
      default: ''
    },
    memories: {
      type: [String],
      default: []
    },
    lastRunAt: {
      type: Date,
      default: null
    },
    nextRunAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'error'],
      default: 'active'
    },
    lastError: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
)

socialAutomationAccountSchema.index({ userId: 1, platform: 1 }, { unique: true })

const SocialAutomationAccount = mongoose.model('SocialAutomationAccount', socialAutomationAccountSchema)
export default SocialAutomationAccount
