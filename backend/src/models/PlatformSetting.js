import mongoose from 'mongoose'

const platformSettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  category: {
    type: String,
    enum: ['features', 'ai', 'security', 'general'],
    default: 'features'
  },
  label: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  updatedBy: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: true
})

const PlatformSetting = mongoose.model('PlatformSetting', platformSettingSchema)
export default PlatformSetting
