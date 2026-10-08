import mongoose from 'mongoose'
import { APPLICATION_STATES } from '../config/constants.js'

const auditEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true
    },
    message: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { _id: false }
)

const screeningAnswerSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true
    },
    confidence: {
      type: Number,
      default: 1.0
    },
    evidenceChunkIds: [String],
    source: {
      type: String,
      default: 'rag_grounded'
    }
  },
  { _id: false }
)

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.Mixed, // supports ObjectId or User numeric ID
      required: true,
      index: true
    },
    batchId: {
      type: String,
      index: true
    },
    jobId: {
      type: String,
      required: true,
      index: true
    },
    canonicalJobIdentity: {
      type: String,
      index: true
    },
    platform: {
      type: String,
      enum: ['greenhouse', 'lever', 'ashby', 'workday', 'playwright', 'custom', 'manual'],
      default: 'playwright',
      required: true
    },
    externalJobId: {
      type: String
    },
    company: {
      type: String,
      required: true
    },
    jobTitle: {
      type: String,
      required: true
    },
    location: {
      type: String
    },
    description: {
      type: String
    },
    applicationUrl: {
      type: String,
      required: true
    },
    tier: {
      type: Number,
      default: 1
    },
    channelUsed: {
      type: String,
      default: 'playwright'
    },
    status: {
      type: String,
      enum: Object.values(APPLICATION_STATES),
      default: APPLICATION_STATES.QUEUED,
      required: true,
      index: true
    },
    state: {
      type: String,
      enum: Object.values(APPLICATION_STATES),
      default: APPLICATION_STATES.QUEUED,
      index: true
    },
    matchScore: {
      type: Number,
      default: 0
    },
    matchExplanation: {
      matchedSkills: [String],
      missingSkills: [String],
      reasons: [String],
      concerns: [String]
    },
    sourcePostedAt: {
      type: Date
    },
    sourceUpdatedAt: {
      type: Date
    },
    freshnessTimestamp: {
      type: Date
    },
    ageAtDiscoveryHours: {
      type: Number
    },
    ageAtApplyHours: {
      type: Number
    },
    resumeFileId: {
      type: String
    },
    resumeFilePath: {
      type: String
    },
    generatedAnswers: [screeningAnswerSchema],
    missingFields: {
      type: [String],
      default: []
    },
    needsUserAction: {
      type: Boolean,
      default: false
    },
    failureCode: {
      type: String
    },
    failureReason: {
      type: String
    },
    blockedReason: {
      type: String
    },
    evidenceScreenshot: {
      type: String
    },
    externalApplicationId: {
      type: String
    },
    startedAt: {
      type: Date
    },
    submittedAt: {
      type: Date
    },
    auditEvents: [auditEventSchema],
    providerMetadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  { timestamps: true }
)

// Prevent duplicate applications for the same canonical job identity per user
applicationSchema.index({ user: 1, canonicalJobIdentity: 1 }, { unique: true, sparse: true })
applicationSchema.index({ user: 1, platform: 1, externalJobId: 1 }, { sparse: true })

const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema)
export default Application
