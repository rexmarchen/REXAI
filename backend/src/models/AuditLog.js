import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['security', 'user_management', 'system', 'billing', 'developer', 'faculty', 'ai'],
    default: 'system'
  },
  severity: {
    type: String,
    enum: ['info', 'success', 'warning', 'critical'],
    default: 'info'
  },
  actor: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, default: 'System' },
    email: { type: String, default: 'system@rexion.ai' },
    role: { type: String, default: 'admin' }
  },
  target: {
    id: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String },
    email: { type: String },
    type: { type: String, default: 'user' }
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['Success', 'Blocked', 'Alert', 'Info', 'Approved', 'Suspended', 'New', 'Paid'],
    default: 'Info'
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  },
  userAgent: {
    type: String,
    default: 'Internal Agent'
  }
}, {
  timestamps: true
})

auditLogSchema.index({ createdAt: -1 })
auditLogSchema.index({ category: 1, createdAt: -1 })

const AuditLog = mongoose.model('AuditLog', auditLogSchema)
export default AuditLog
