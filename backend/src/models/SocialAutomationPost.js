import mongoose from 'mongoose'

const socialAutomationPostSchema = new mongoose.Schema(
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
    kind: {
      type: String,
      enum: ['REEL', 'IMAGE', 'TEXT', 'CAROUSEL'],
      default: 'REEL'
    },
    status: {
      type: String,
      enum: ['draft', 'new', 'approved', 'publishing', 'published', 'failed'],
      default: 'approved',
      index: true
    },
    topic: {
      type: String,
      trim: true,
      default: ''
    },
    brief: {
      type: String,
      default: ''
    },
    caption: {
      type: String,
      default: ''
    },
    hook: {
      type: String,
      default: ''
    },
    onScreenText: {
      type: String,
      default: ''
    },
    keywords: {
      type: [String],
      default: []
    },
    mediaUrl: {
      type: String,
      default: ''
    },
    thumbnailUrl: {
      type: String,
      default: ''
    },
    srcPath: {
      type: String,
      default: ''
    },
    frames: {
      type: [String],
      default: []
    },
    scheduledAt: {
      type: Date,
      default: null,
      index: true
    },
    publishedAt: {
      type: Date,
      default: null
    },
    platformPostId: {
      type: String,
      default: null
    },
    permalink: {
      type: String,
      default: null
    },
    metrics: {
      reach: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      saved: { type: Number, default: 0 },
      score: { type: Number, default: 0 }
    },
    aiGenerated: {
      type: Boolean,
      default: true
    },
    contentPillar: {
      type: String,
      default: 'Growth'
    },
    retryCount: {
      type: Number,
      default: 0
    },
    error: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
)

socialAutomationPostSchema.index({ userId: 1, platform: 1, status: 1, scheduledAt: 1 })

const SocialAutomationPost = mongoose.model('SocialAutomationPost', socialAutomationPostSchema)
export default SocialAutomationPost
