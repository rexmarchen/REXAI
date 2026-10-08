import mongoose from 'mongoose'

const TutorQuizQuestionSchema = new mongoose.Schema({
  id:           { type: String, required: true },
  type:         { type: String, enum: ['mcq', 'short'], required: true },
  prompt:       { type: String, required: true },
  options:      [{ type: String }],
  correctIndex: { type: Number },
  explanation:  { type: String, default: '' },
  rubric:       { type: String, default: '' }
}, { _id: false })

const TutorQuizSchema = new mongoose.Schema({
  userId:     { type: String, required: true, index: true },
  topic:      { type: String, required: true, index: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  questions:  [TutorQuizQuestionSchema]
}, { timestamps: true })

const TutorQuizAttemptSchema = new mongoose.Schema({
  quizId:    { type: mongoose.Schema.Types.ObjectId, ref: 'TutorQuiz', required: true },
  userId:    { type: String, required: true, index: true },
  score:     { type: Number, required: true }, // 0 to 100
  results:   [mongoose.Schema.Types.Mixed]
}, { timestamps: true })

TutorQuizAttemptSchema.index({ quizId: 1, userId: 1 }, { unique: true })

const TopicMasterySchema = new mongoose.Schema({
  userId:    { type: String, required: true },
  topic:     { type: String, required: true },
  mastery:   { type: Number, default: 0 }, // 0 to 1
  updatedAt: { type: Date, default: Date.now }
})

TopicMasterySchema.index({ userId: 1, topic: 1 }, { unique: true })

export const TutorQuiz = mongoose.models.TutorQuiz || mongoose.model('TutorQuiz', TutorQuizSchema)
export const TutorQuizAttempt = mongoose.models.TutorQuizAttempt || mongoose.model('TutorQuizAttempt', TutorQuizAttemptSchema)
export const TopicMastery = mongoose.models.TopicMastery || mongoose.model('TopicMastery', TopicMasterySchema)
