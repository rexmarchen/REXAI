import mongoose from 'mongoose'

const candidateProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.Mixed, // supports Mongo ObjectId, String, or Integer ID
      required: true,
      index: true
    },
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    fullName: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    phone: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'United States'
    },
    zipCode: {
      type: String,
      trim: true
    },
    linkedinUrl: {
      type: String,
      trim: true
    },
    githubUrl: {
      type: String,
      trim: true
    },
    portfolioUrl: {
      type: String,
      trim: true
    },
    primaryDomain: {
      type: String,
      default: 'Software Engineering'
    },
    domainConfidences: [
      {
        name: { type: String, required: true },
        confidence: { type: Number, required: true }
      }
    ],
    skills: {
      type: [String],
      default: []
    },
    yearsOfExperience: {
      type: Number,
      default: 0
    },
    experience: [
      {
        title: String,
        company: String,
        location: String,
        startDate: String,
        endDate: String,
        isCurrent: Boolean,
        description: String,
        skillsUsed: [String]
      }
    ],
    education: [
      {
        institution: String,
        degree: String,
        fieldOfStudy: String,
        graduationYear: String,
        gpa: String
      }
    ],
    certifications: [
      {
        name: String,
        issuer: String,
        issueDate: String
      }
    ],
    workAuthorization: {
      type: String,
      enum: ['US Citizen', 'Green Card', 'H1B', 'F1 OPT/CPT', 'Authorized', 'Not Authorized', 'Unknown'],
      default: 'Unknown'
    },
    requireSponsorship: {
      type: Boolean,
      default: null // null indicates unconfirmed/requires user input
    },
    willingToRelocate: {
      type: Boolean,
      default: false
    },
    preferredWorkMode: {
      type: String,
      enum: ['remote', 'hybrid', 'onsite', 'any'],
      default: 'any'
    },
    preferredEmploymentType: {
      type: String,
      enum: ['full-time', 'contract', 'internship', 'part-time', 'any'],
      default: 'full-time'
    },
    salaryPreference: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'USD' }
    },
    resumeFileId: {
      type: String
    },
    resumeFilePath: {
      type: String
    },
    resumeChunks: [
      {
        chunkId: String,
        text: String,
        section: String,
        tokenCount: Number,
        metadata: mongoose.Schema.Types.Mixed
      }
    ],
    contactInfo: {
      fullName: String,
      email: String,
      phone: String,
      linkedinUrl: String,
      githubUrl: String,
      portfolioUrl: String,
      location: mongoose.Schema.Types.Mixed
    },
    applicationPreferences: mongoose.Schema.Types.Mixed,
    secondaryDomains: [String],
    lastIngestedAt: Date,
    isComplete: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    strict: false
  }
)

const CandidateProfile =
  mongoose.models.CandidateProfile ||
  mongoose.model('CandidateProfile', candidateProfileSchema)

export default CandidateProfile
