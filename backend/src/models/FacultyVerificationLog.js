import mongoose from 'mongoose'

const FacultyVerificationLogSchema = new mongoose.Schema({
  facultyProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FacultyProfile',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['submitted', 'approved', 'rejected', 'suspended', 'reinstated'],
    required: true
  },
  previousStatus: {
    type: String,
    required: true
  },
  newStatus: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performerEmail: {
    type: String,
    default: ''
  },
  reason: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
})

FacultyVerificationLogSchema.index({ facultyProfileId: 1, createdAt: -1 })

export const FacultyVerificationLog = mongoose.models.FacultyVerificationLog || mongoose.model('FacultyVerificationLog', FacultyVerificationLogSchema)
export default FacultyVerificationLog
