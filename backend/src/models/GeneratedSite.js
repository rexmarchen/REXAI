import mongoose from 'mongoose'

const generatedSiteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prompt: String,
  htmlCode: String,
  cssCode: String,
  jsCode: String,
  previewUrl: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

const GeneratedSite = mongoose.model('GeneratedSite', generatedSiteSchema)
export default GeneratedSite
