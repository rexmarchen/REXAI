import mongoose from 'mongoose'

const DeveloperProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    index: true
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: '',
    maxlength: 1000
  },
  title: {
    type: String,
    default: 'Software Engineer',
    trim: true
  },
  technicalExpertise: [{
    type: String,
    trim: true
  }],
  githubUrl: {
    type: String,
    default: '',
    trim: true
  },
  linkedinUrl: {
    type: String,
    default: '',
    trim: true
  },
  portfolioUrl: {
    type: String,
    default: '',
    trim: true
  },
  applicationReason: {
    type: String,
    default: '',
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'revoked'],
    default: 'pending',
    index: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  revokedReason: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  strict: true
})

export const DeveloperProfile = mongoose.models.DeveloperProfile || mongoose.model('DeveloperProfile', DeveloperProfileSchema)
export default DeveloperProfile
