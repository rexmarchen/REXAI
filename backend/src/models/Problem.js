import mongoose from 'mongoose'

const TestCaseSchema = new mongoose.Schema({
  input:    { type: mongoose.Schema.Types.Mixed, required: true },
  expected: { type: mongoose.Schema.Types.Mixed, required: true },
  isSample: { type: Boolean, default: false }
}, { _id: false })

const ProblemSchema = new mongoose.Schema({
  slug:             { type: String, required: true, unique: true, index: true },
  number:           { type: Number, index: true },
  title:            { type: String, required: true },
  difficulty:       { type: String, enum: ['Easy', 'Medium', 'Hard', 'EASY', 'MEDIUM', 'HARD'], default: 'Medium' },
  statement:        { type: String, default: '' },
  constraints:      { type: String, default: '' },
  topics:           [{ type: String }],
  hint:             { type: String, default: '' },
  starterCode:      {
    python:     { type: String, default: '' },
    javascript: { type: String, default: '' }
  },
  referenceSolution:{
    python:     { type: String, default: '' }
  },
  functionName:     { type: String, required: true },
  checker:          { type: String, enum: ['EXACT', 'UNORDERED', 'UNORDERED_DEEP'], default: 'EXACT' },
  timeLimitSec:     { type: Number, default: 2 },
  memoryLimitKb:    { type: Number, default: 128000 },
  xp:               { type: Number, default: 50 },
  published:        { type: Boolean, default: true },
  tests:            [TestCaseSchema],
  companies:        [{
    name:    { type: String },
    slug:    { type: String },
    reports: { type: Number, default: 1 }
  }],
  submissionsCount: { type: Number, default: 0 },
  acceptedCount:    { type: Number, default: 0 }
}, { timestamps: true })

export const Problem = mongoose.models.Problem || mongoose.model('Problem', ProblemSchema)
