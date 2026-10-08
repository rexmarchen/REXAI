import mongoose from 'mongoose'

const generatedSiteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prompt: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  previewUrl: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const GeneratedSite = mongoose.model('GeneratedSite', generatedSiteSchema)
export default GeneratedSite