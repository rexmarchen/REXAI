import mongoose from 'mongoose'

const QualificationSchema = new mongoose.Schema({
  degree: { type: String, required: true, trim: true },
  specialization: { type: String, default: '', trim: true },
  institution: { type: String, required: true, trim: true },
  graduationYear: { type: Number }
}, { _id: false })

const FacultyProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  // A. Personal & Professional Details
  avatarUrl: {
    type: String,
    default: ''
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  professionalTitle: {
    type: String,
    enum: ['Dr.', 'Professor', 'Prof.', 'Mr.', 'Ms.', 'Mrs.', 'Other'],
    default: 'Professor'
  },
  designation: {
    type: String,
    enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Faculty Member', 'Dean / Department Head', 'Other'],
    default: 'Assistant Professor'
  },
  bio: {
    type: String,
    default: '',
    maxlength: 3000
  },
  contactEmail: {
    type: String,
    required: [true, 'Professional contact email is required'],
    lowercase: true,
    trim: true,
    index: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },

  // B. Institution Information
  institutionName: {
    type: String,
    default: '',
    trim: true,
    index: true
  },
  institutionType: {
    type: String,
    enum: ['University', 'College', 'School', 'Training Institute', 'Other'],
    default: 'College'
  },
  department: {
    type: String,
    default: '',
    trim: true
  },
  city: {
    type: String,
    default: '',
    trim: true
  },
  state: {
    type: String,
    default: '',
    trim: true
  },
  country: {
    type: String,
    default: 'India',
    trim: true
  },
  website: {
    type: String,
    default: '',
    trim: true
  },
  // Private field - never exposed publicly
  employeeId: {
    type: String,
    default: '',
    trim: true
  },
  employmentType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Visiting', 'Other'],
    default: 'Full-time'
  },

  // C. Academic Qualifications & Expertise
  qualifications: [QualificationSchema],
  teachingSubjects: [{
    type: String,
    trim: true
  }],
  yearsOfExperience: {
    type: Number,
    default: 0,
    min: 0
  },
  coursesTaught: [{
    type: String,
    trim: true
  }],
  certifications: [{
    type: String,
    trim: true
  }],
  researchInterests: [{
    type: String,
    trim: true
  }],
  achievements: [{
    type: String,
    trim: true
  }],

  // D. Verification Lifecycle & Trust
  status: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected', 'suspended'],
    default: 'unverified',
    index: true
  },
  verificationRequestedAt: {
    type: Date
  },
  verificationReviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  suspensionReason: {
    type: String,
    default: ''
  },
  // Strictly private evidence payload
  verificationEvidence: {
    idDocumentUrl: { type: String, default: '' },
    idDocumentName: { type: String, default: '' },
    institutionalEmail: { type: String, default: '' },
    notes: { type: String, default: '' }
  },
  profileCompletion: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true,
  strict: true
})

// Composite indexes for admin review queries
FacultyProfileSchema.index({ status: 1, createdAt: -1 })
FacultyProfileSchema.index({ institutionName: 1, department: 1 })

/**
 * Calculates profile completion percentage dynamically
 */
FacultyProfileSchema.methods.calculateCompletion = function() {
  let score = 0
  const maxScore = 100

  // Personal details (25%)
  if (this.fullName) score += 5
  if (this.avatarUrl) score += 5
  if (this.professionalTitle) score += 5
  if (this.designation) score += 5
  if (this.bio && this.bio.length > 20) score += 5

  // Institution details (30%)
  if (this.institutionName) score += 10
  if (this.department) score += 10
  if (this.contactEmail) score += 5
  if (this.city || this.country) score += 5

  // Qualifications (25%)
  if (this.qualifications && this.qualifications.length > 0) score += 15
  if (this.teachingSubjects && this.teachingSubjects.length > 0) score += 10

  // Extended Details (20%)
  if (this.yearsOfExperience > 0) score += 5
  if (this.coursesTaught && this.coursesTaught.length > 0) score += 5
  if (this.certifications && this.certifications.length > 0) score += 5
  if (this.researchInterests && this.researchInterests.length > 0) score += 5

  this.profileCompletion = Math.min(maxScore, score)
  return this.profileCompletion
}

FacultyProfileSchema.pre('save', function() {
  this.calculateCompletion()
})

/**
 * Returns a sanitized public version of the faculty profile
 * strictly omitting private employeeId, verification evidence, phone, rejection reason, etc.
 */
FacultyProfileSchema.methods.toPublicProfile = function() {
  return {
    id: this._id,
    userId: this.userId,
    fullName: this.fullName,
    avatarUrl: this.avatarUrl,
    professionalTitle: this.professionalTitle,
    designation: this.designation,
    bio: this.bio,
    institutionName: this.institutionName,
    institutionType: this.institutionType,
    department: this.department,
    city: this.city,
    country: this.country,
    website: this.website,
    qualifications: this.qualifications,
    teachingSubjects: this.teachingSubjects,
    yearsOfExperience: this.yearsOfExperience,
    coursesTaught: this.coursesTaught,
    researchInterests: this.researchInterests,
    achievements: this.achievements,
    status: this.status,
    isVerified: this.status === 'verified',
    profileCompletion: this.profileCompletion
  }
}

export const FacultyProfile = mongoose.models.FacultyProfile || mongoose.model('FacultyProfile', FacultyProfileSchema)
export default FacultyProfile
