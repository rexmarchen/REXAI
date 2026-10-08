import mongoose from 'mongoose'

const contactSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  jobTitle: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  location: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  linkedinUrl: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Index by email and userId to ensure quick lookups
contactSchema.index({ email: 1, userId: 1 }, { unique: true })

const Contact = mongoose.model('Contact', contactSchema)
export default Contact
