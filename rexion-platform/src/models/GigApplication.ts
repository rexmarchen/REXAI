import { Schema, model, models } from 'mongoose'

const gigApplicationSchema = new Schema(
  {
    gigId: { type: Schema.Types.ObjectId, ref: 'MicroGig', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    resumeUrl: String,
    pitch: String,
    startDate: Date,
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'accepted', 'rejected'],
      default: 'pending',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

const GigApplication = models.GigApplication || model('GigApplication', gigApplicationSchema)
export default GigApplication
