import { Schema, model, models } from 'mongoose'

const adminLogSchema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    targetType: String,
    targetId: Schema.Types.Mixed,
    details: String,
    ip: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

const AdminLog = models.AdminLog || model('AdminLog', adminLogSchema)
export default AdminLog
