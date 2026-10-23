import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'faculty', 'developer', 'admin'],
    default: 'user'
  },
  facultyStatus: {
    type: String,
    enum: ['none', 'unverified', 'pending', 'verified', 'rejected', 'suspended'],
    default: 'none'
  },
  developerStatus: {
    type: String,
    enum: ['none', 'pending', 'active', 'suspended', 'revoked'],
    default: 'none'
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'elite'],
    default: 'free'
  },
  profile: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  authProviders: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  strict: true
})

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password || !candidatePassword) return false
  return await bcrypt.compare(candidatePassword, this.password)
}

const User = mongoose.model('User', userSchema)
export default User