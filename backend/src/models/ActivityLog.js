import mongoose from 'mongoose'

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true
    },
    type: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: ['ai', 'resume', 'jobs', 'applications', 'learning', 'account'],
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['completed', 'success', 'pending', 'failed'],
      default: 'completed'
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    idempotencyKey: {
      type: String,
      index: true,
      sparse: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
)

// Efficient composite indexes for user querying, category filtering, and time-range filtering
activityLogSchema.index({ userId: 1, createdAt: -1 })
activityLogSchema.index({ userId: 1, category: 1, createdAt: -1 })
activityLogSchema.index({ userId: 1, type: 1, createdAt: -1 })
activityLogSchema.index({ userId: 1, idempotencyKey: 1 }, { sparse: true })

const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema)

export default ActivityLog
