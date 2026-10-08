import mongoose from 'mongoose'

const ProblemSubmissionSchema = new mongoose.Schema({
  userId:      { type: String, required: true, index: true },
  problemSlug: { type: String, required: true, index: true },
  language:    { type: String, enum: ['python', 'javascript'], required: true },
  code:        { type: String, required: true },
  verdict:     {
    type: String,
    enum: ['ACCEPTED', 'WRONG_ANSWER', 'RUNTIME_ERROR', 'TIME_LIMIT', 'COMPILE_ERROR'],
    required: true
  },
  passed:      { type: Number, required: true },
  total:       { type: Number, required: true },
  runtimeMs:   { type: Number, default: 0 },
  xpAwarded:   { type: Number, default: 0 }
}, { timestamps: true })

ProblemSubmissionSchema.index({ userId: 1, problemSlug: 1 })
ProblemSubmissionSchema.index({ problemSlug: 1, verdict: 1 })

export const ProblemSubmission = mongoose.models.ProblemSubmission || mongoose.model('ProblemSubmission', ProblemSubmissionSchema)
