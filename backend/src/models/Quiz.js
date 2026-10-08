import mongoose from 'mongoose'

const QuestionSchema = new mongoose.Schema({
  id:           { type: String, required: true },
  question:     { type: String, required: true },
  code:         { type: String, default: '' },        // optional code snippet
  language:     { type: String, default: '' },        // python | javascript | sql | etc.
  options:      [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
  explanation:  { type: String, default: '' },
  tags:         [{ type: String }],                  // e.g. ['loops','functions']
  difficulty:   { type: String, enum: ['Easy','Medium','Hard'], default: 'Medium' }
}, { _id: false })

const QuizSchema = new mongoose.Schema({
  slug:           { type: String, required: true, unique: true, index: true },
  title:          { type: String, required: true },
  description:    { type: String, default: '' },
  topic:          { type: String, required: true, index: true },
  category:       { type: String, required: true, index: true },
  difficulty:     { type: String, enum: ['Easy','Medium','Hard','Easy - Medium','Medium - Hard','Easy - Hard'], default: 'Medium' },
  durationMinutes:{ type: Number, default: 12 },
  questionsCount: { type: Number, default: 5 },       // how many shown per session
  isNewQuiz:      { type: Boolean, default: false },
  isDaily:        { type: Boolean, default: false },
  iconType:       { type: String, default: 'code' },
  accentColor:    { type: String, default: '#D96B43' },
  questionPool:   [QuestionSchema],                   // full bank (30+ questions)
  coverTopics:    [{ type: String }],
  xpReward:       { type: Number, default: 100 },
  lastAIGeneratedAt: { type: Date },
  aiVersion:      { type: Number, default: 1 },
  totalGeneratedCount: { type: Number, default: 0 }
}, { timestamps: true })

const QuizAttemptSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.Mixed, index: true },
  quizId:          { type: mongoose.Schema.Types.Mixed, index: true },
  quizSlug:        { type: String, required: true },
  scorePercentage: { type: Number, required: true },
  totalQuestions:  { type: Number, required: true },
  correctCount:    { type: Number, required: true },
  timeTaken:       { type: Number, default: 0 },      // seconds
  answers:         [{ questionId: String, selectedIndex: Number, isCorrect: Boolean }],
  status:          { type: String, enum: ['completed','in_progress'], default: 'completed' },
  xpEarned:        { type: Number, default: 50 },
  dailyDate:       { type: String, index: true },     // 'YYYY-MM-DD' for daily dedup
  completedAt:     { type: Date, default: Date.now }
}, { timestamps: true })

// Leaderboard: total XP per user (denormalized for speed)
const UserXPSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.Mixed, unique: true, sparse: true },
  userName:  { type: String },
  totalXP:   { type: Number, default: 0 },
  quizzesDone:{ type: Number, default: 0 },
  bestScore: { type: Number, default: 0 },
  streak:    { type: Number, default: 0 },
  lastActive:{ type: Date }
}, { timestamps: true })

export const Quiz      = mongoose.models.Quiz      || mongoose.model('Quiz',      QuizSchema)
export const QuizAttempt = mongoose.models.QuizAttempt || mongoose.model('QuizAttempt', QuizAttemptSchema)
export const UserXP    = mongoose.models.UserXP    || mongoose.model('UserXP',    UserXPSchema)
