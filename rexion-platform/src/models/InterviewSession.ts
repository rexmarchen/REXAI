import { Schema, model, models } from 'mongoose'

const interviewQuestionSchema = new Schema(
  {
    question: String,
    category: String,
    userAnswer: String,
    aiFeedback: String,
    aiScore: Number,
    timeTaken: Number,
  },
  { _id: false }
)

const interviewSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetRole: String,
    targetCompany: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    questions: {
      type: [interviewQuestionSchema],
      default: [],
    },
    overallScore: Number,
    overallFeedback: String,
    duration: Number,
    completedAt: Date,
  },
  { timestamps: true }
)

const InterviewSession =
  models.InterviewSession || model('InterviewSession', interviewSessionSchema)

export default InterviewSession
