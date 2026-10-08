import mongoose from 'mongoose'

const applicationBatchSchema = new mongoose.Schema(
  {
    batchId: {
      type: Number,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true
    },
    status: {
      type: String,
      default: 'pending',
      index: true
    },
    emailPreview: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
)

const ApplicationBatch = mongoose.models.ApplicationBatch || mongoose.model('ApplicationBatch', applicationBatchSchema)
export default ApplicationBatch
