import { Schema, model, models } from 'mongoose'

const gigCompletionSchema = new Schema(
  {
    gigId: { type: Schema.Types.ObjectId, ref: 'MicroGig', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'User' },
    rating: Number,
    convertedToFullTime: Boolean,
    daysToConversion: Number,
    earnings: Number,
    platformFee: Number,
    stripePayout: String,
    completedAt: Date,
  },
  { timestamps: true }
)

const GigCompletion = models.GigCompletion || model('GigCompletion', gigCompletionSchema)
export default GigCompletion
