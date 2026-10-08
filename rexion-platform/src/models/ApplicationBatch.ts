import { Schema, model, models } from 'mongoose'

const applicationBatchResultSchema = new Schema(
  {
    targetId: { type: String, required: true },
    title: { type: String, required: true },
    companyName: { type: String, required: true },
    status: {
      type: String,
      enum: ['applied', 'skipped', 'failed'],
      required: true,
    },
    note: String,
  },
  { _id: false }
)

const applicationBatchSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    source: {
      type: String,
      enum: ['micro-gigs'],
      default: 'micro-gigs',
    },
    totalJobsProcessed: { type: Number, default: 0 },
    successfulApplications: { type: Number, default: 0 },
    skippedApplications: { type: Number, default: 0 },
    failedApplications: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['completed', 'failed'],
      default: 'completed',
    },
    results: {
      type: [applicationBatchResultSchema],
      default: [],
    },
    completedAt: Date,
  },
  { timestamps: true }
)

const ApplicationBatch =
  models.ApplicationBatch || model('ApplicationBatch', applicationBatchSchema)

export default ApplicationBatch
