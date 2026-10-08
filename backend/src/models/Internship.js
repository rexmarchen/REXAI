import mongoose from 'mongoose'

const internshipSchema = new mongoose.Schema(
  {
    externalId: {
      type: String,
      required: true,
      index: true
    },
    source: {
      type: String,
      required: true,
      enum: ['adzuna', 'greenhouse', 'lever', 'company_career', 'linkedin_authorized', 'linkedin', 'indeed', 'naukri', 'wellfound', 'summer2027', 'other'],
      index: true
    },
    trustScore: {
      type: Number,
      default: 88,
      min: 0,
      max: 100
    },
    trustFlags: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    sourceJobId: {
      type: String,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    companyLogo: {
      type: String,
      default: null
    },
    companyStage: {
      type: String,
      default: 'Tech Employer'
    },
    description: {
      type: String,
      default: ''
    },
    employmentType: {
      type: String,
      default: 'Internship'
    },
    experienceLevel: {
      type: String,
      default: 'Entry Level / Student'
    },
    location: {
      type: String,
      default: 'Remote'
    },
    country: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    isRemote: {
      type: Boolean,
      default: false,
      index: true
    },
    isHybrid: {
      type: Boolean,
      default: false
    },
    domain: {
      type: String,
      default: 'engineering',
      index: true
    },
    skills: {
      type: [String],
      default: [],
      index: true
    },
    technologies: {
      type: [String],
      default: []
    },
    salaryMin: {
      type: Number,
      default: null
    },
    salaryMax: {
      type: Number,
      default: null
    },
    salaryText: {
      type: String,
      default: 'Competitive Stipend'
    },
    salaryCurrency: {
      type: String,
      default: 'USD'
    },
    salaryPeriod: {
      type: String,
      default: 'month'
    },
    duration: {
      type: String,
      default: '3 - 6 Months'
    },
    postedAt: {
      type: Date,
      required: true,
      index: true
    },
    firstSeenAt: {
      type: Date,
      default: Date.now
    },
    lastSeenAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: null
    },
    freshnessStatus: {
      type: String,
      enum: ['fresh_48h', 'standard', 'unknown'],
      default: 'standard',
      index: true
    },
    applyUrl: {
      type: String,
      required: true
    },
    sourceUrl: {
      type: String,
      default: ''
    },
    isInternship: {
      type: Boolean,
      default: true,
      index: true
    },
    internshipClassification: {
      type: String,
      enum: ['confirmed', 'probable', 'rejected'],
      default: 'confirmed',
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    contentHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    applyClickCount: {
      type: Number,
      default: 0
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
)

// Composite indexes for high-velocity query performance
internshipSchema.index({ isInternship: 1, isActive: 1, postedAt: -1 })
internshipSchema.index({ source: 1, externalId: 1 })
internshipSchema.index({ domain: 1, isRemote: 1, postedAt: -1 })
internshipSchema.index({ skills: 1, postedAt: -1 })

const Internship = mongoose.models.Internship || mongoose.model('Internship', internshipSchema)
export default Internship
