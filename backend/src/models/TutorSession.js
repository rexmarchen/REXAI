import mongoose from 'mongoose'

const TutorMessageSchema = new mongoose.Schema({
  role:      { type: String, enum: ['user', 'assistant'], required: true },
  content:   { type: String, required: true },
  followups: [{ type: String }],
  rating:    { type: Number, enum: [1, -1, null], default: null },
  createdAt: { type: Date, default: Date.now }
})

const TutorSessionSchema = new mongoose.Schema({
  userId:     { type: String, required: true, index: true },
  title:      { type: String, default: 'New Conversation' },
  mode:       { type: String, enum: ['ask', 'explain', 'solve_code', 'study_plan', 'practice'], default: 'ask' },
  level:      { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  careerPath: { type: String, default: 'AI Engineer' },
  messages:   [TutorMessageSchema]
}, { timestamps: true })

TutorSessionSchema.index({ userId: 1, updatedAt: -1 })

export const TutorSession = mongoose.models.TutorSession || mongoose.model('TutorSession', TutorSessionSchema)
