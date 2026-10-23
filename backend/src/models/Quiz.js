import mongoose from 'mongoose'

export const QuestionSchema = new mongoose.Schema({
  id:           { type: String, required: true },
  question:     { type: String, required: true },
  type:         {
    type: String,
    enum: ['multiple_choice', 'multiple_select', 'true_false', 'short_answer', 'code'],
    default: 'multiple_choice'
  },
  code:         { type: String, default: '' },        // optional code snippet
  language:     { type: String, default: '' },        // python | javascript | sql | etc.
  options:      [{ type: String }],
  correctIndex: { type: Number, default: 0 },         // for single-choice / true-false
  correctIndices: [{ type: Number }],                 // for multi-select
  correctAnswer:{ type: String, default: '' },        // for short-answer
  explanation:  { type: String, default: '' },
  tags:         [{ type: String }],                  // e.g. ['loops','functions']
  difficulty:   {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  marks:        { type: Number, default: 1, min: 0 },
  negativeMarks:{ type: Number, default: 0, min: 0 },
  order:        { type: Number, default: 0 }
}, { _id: false })

export const QuizSchema = new mongoose.Schema({
  slug:           { type: String, required: true, unique: true, index: true },
  title:          { type: String, required: true },
  description:    { type: String, default: '' },
  instructions:   { type: String, default: '' },
  topic:          { type: String, required: true, index: true },
  category:       { type: String, required: true, index: true },
  technicalDomain:{ type: String, default: 'Software Engineering' },
  technologies:   [{ type: String }],
  difficulty:     {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Easy', 'Medium', 'Hard', 'Easy - Medium', 'Medium - Hard', 'Easy - Hard'],
    default: 'Medium'
  },
  durationMinutes:{ type: Number, default: 12 },
  questionsCount: { type: Number, default: 5 },       // how many shown per session
  passingScore:   { type: Number, default: 60, min: 0, max: 100 }, // passing percentage
  isNewQuiz:      { type: Boolean, default: false },
  isDaily:        { type: Boolean, default: false },
  iconType:       { type: String, default: 'code' },
  accentColor:    { type: String, default: '#D96B43' },
  questionPool:   [QuestionSchema],                   // full bank
  coverTopics:    [{ type: String }],
  xpReward:       { type: Number, default: 100 },
  lastAIGeneratedAt: { type: Date },
  aiVersion:      { type: Number, default: 1 },
  totalGeneratedCount: { type: Number, default: 0 },
  // Author Lifecycle & Ownership
  author:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  authorName:     { type: String, default: 'REXION Team' },
  authorRole:     { type: String, enum: ['faculty', 'developer', 'admin', 'system'], default: 'system', index: true },
  facultyProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'FacultyProfile', index: true },
  institutionName:{ type: String, default: '' },
  isVerifiedFaculty:{ type: Boolean, default: false, index: true },
  targetAudience: { type: String, default: 'All Students' },
  availabilityStart: { type: Date },
  availabilityEnd:   { type: Date },
  maxAttempts:       { type: Number, default: 0 }, // 0 = unlimited
  status:         {
    type: String,
    enum: ['draft', 'in_review', 'published', 'archived'],
    default: 'published',
    index: true
  },
  visibility:     {
    type: String,
    enum: ['public', 'unlisted', 'private'],
    default: 'public',
    index: true
  },
  version:        { type: Number, default: 1 },
  randomizeQuestions: { type: Boolean, default: false },
  randomizeOptions:   { type: Boolean, default: false },
  negativeMarking:    { type: Boolean, default: false },
  showExplanations:   { type: Boolean, default: true },
  publishedAt:    { type: Date },
  archivedAt:     { type: Date }
}, { timestamps: true })

// Composite indexes for public catalog filtering & developer queries
QuizSchema.index({ status: 1, visibility: 1, publishedAt: -1 })
QuizSchema.index({ status: 1, visibility: 1, category: 1, publishedAt: -1 })
QuizSchema.index({ author: 1, status: 1, updatedAt: -1 })

export const QuizAttemptSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.Mixed, index: true },
  quizId:          { type: mongoose.Schema.Types.Mixed, index: true },
  quizSlug:        { type: String, required: true },
  quizVersion:     { type: Number, default: 1 },
  scorePercentage: { type: Number, required: true },
  totalQuestions:  { type: Number, required: true },
  correctCount:    { type: Number, required: true },
  totalMarks:      { type: Number, default: 0 },
  earnedMarks:     { type: Number, default: 0 },
  passed:          { type: Boolean, default: false },
  timeTaken:       { type: Number, default: 0 },      // seconds
  answers:         [{
    questionId: String,
    questionType: String,
    selectedIndex: Number,
    selectedIndices: [Number],
    textAnswer: String,
    isCorrect: Boolean,
    marksEarned: Number
  }],
  status:          { type: String, enum: ['completed','in_progress'], default: 'completed' },
  xpEarned:        { type: Number, default: 50 },
  dailyDate:       { type: String, index: true },     // 'YYYY-MM-DD' for daily dedup
  isRealAttempt:   { type: Boolean, default: true, index: true },
  completedAt:     { type: Date, default: Date.now }
}, { timestamps: true })

// Composite indexes for user attempt history, daily dedup, and developer attempt analytics
QuizAttemptSchema.index({ userId: 1, isRealAttempt: 1, completedAt: -1 })
QuizAttemptSchema.index({ quizSlug: 1, isRealAttempt: 1 })
QuizAttemptSchema.index({ userId: 1, quizSlug: 1, completedAt: -1 })
QuizAttemptSchema.index({ userId: 1, dailyDate: 1 })

// Leaderboard: total XP per user (denormalized for speed)
export const UserXPSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.Mixed, unique: true, sparse: true },
  userName:  { type: String },
  totalXP:   { type: Number, default: 0, index: true },
  quizzesDone:{ type: Number, default: 0 },
  bestScore: { type: Number, default: 0 },
  streak:    { type: Number, default: 0 },
  lastActive:{ type: Date }
}, { timestamps: true })

// Index for top XP leaderboard queries and rank calculations
UserXPSchema.index({ totalXP: -1 })

// Immutable version history for published quizzes
export const QuizVersionSchema = new mongoose.Schema({
  quizId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
  quizSlug:     { type: String, required: true, index: true },
  version:      { type: Number, required: true },
  title:        { type: String, required: true },
  description:  { type: String, default: '' },
  instructions: { type: String, default: '' },
  category:     { type: String, required: true },
  topic:        { type: String, required: true },
  difficulty:   { type: String, default: 'Medium' },
  durationMinutes: { type: Number, default: 12 },
  passingScore: { type: Number, default: 60 },
  questionPool: [QuestionSchema],
  publishedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  publishedAt:  { type: Date, default: Date.now }
}, { timestamps: true })

QuizVersionSchema.index({ quizId: 1, version: 1 }, { unique: true })

export const Quiz        = mongoose.models.Quiz        || mongoose.model('Quiz',        QuizSchema)
export const QuizAttempt = mongoose.models.QuizAttempt || mongoose.model('QuizAttempt', QuizAttemptSchema)
export const UserXP      = mongoose.models.UserXP      || mongoose.model('UserXP',      UserXPSchema)
export const QuizVersion = mongoose.models.QuizVersion || mongoose.model('QuizVersion', QuizVersionSchema)
