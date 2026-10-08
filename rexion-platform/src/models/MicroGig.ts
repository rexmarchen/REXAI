import { Schema, model, models } from 'mongoose'

const microGigSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'User' },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    company: {
      name: String,
      logo: String,
      rating: Number,
      linkedinUrl: String,
      location: String,
    },
    title: { type: String, required: true },
    description: String,
    category: {
      type: String,
      enum: ['frontend', 'backend', 'design', 'marketing', 'data', 'mobile', 'content'],
    },
    skills: [String],
    domain: String,
    timeRequired: String,
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
    },
    pay: Number,
    duration: Number,
    location: {
      type: String,
      enum: ['remote', 'hybrid', 'onsite'],
    },
    spotsTotal: Number,
    spotsFilled: Number,
    isPreHiring: Boolean,
    closingDate: Date,
    status: {
      type: String,
      enum: ['pending', 'active', 'closed', 'rejected'],
      default: 'pending',
    },
    activeRoles: Number,
  },
  { timestamps: true }
)

const MicroGig = models.MicroGig || model('MicroGig', microGigSchema)
export default MicroGig
