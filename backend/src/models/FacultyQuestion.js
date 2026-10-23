import mongoose from 'mongoose'

const FacultyQuestionSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  question: {
    type: String,
    required: [true, 'Question statement is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['multiple_choice', 'true_false', 'multiple_select', 'short_answer', 'code'],
    default: 'multiple_choice'
  },
  code: {
    type: String,
    default: ''
  },
  codeLanguage: {
    type: String,
    default: ''
  },
  options: [{
    type: String,
    trim: true
  }],
  correctIndex: {
    type: Number,
    default: 0
  },
  correctIndices: [{
    type: Number
  }],
  correctAnswer: {
    type: String,
    default: '',
    trim: true
  },
  explanation: {
    type: String,
    default: '',
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Subject/category is required'],
    trim: true,
    index: true
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    trim: true,
    index: true
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Easy', 'Medium', 'Hard'],
    default: 'Medium',
    index: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  marks: {
    type: Number,
    default: 1,
    min: 0
  },
  negativeMarks: {
    type: Number,
    default: 0,
    min: 0
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  strict: true
})

// Search & filter indexes
FacultyQuestionSchema.index({ author: 1, subject: 1, topic: 1 })
FacultyQuestionSchema.index({ author: 1, difficulty: 1 })
FacultyQuestionSchema.index({ author: 1, question: 'text', topic: 'text' }, { default_language: 'english', language_override: 'none' })

export const FacultyQuestion = mongoose.models.FacultyQuestion || mongoose.model('FacultyQuestion', FacultyQuestionSchema)
export default FacultyQuestion
