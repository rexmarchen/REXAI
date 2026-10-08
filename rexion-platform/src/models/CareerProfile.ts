import mongoose, { Schema, model, models } from 'mongoose'

const ExperienceSchema = new Schema({
  company: { type: String, required: true },
  role: { type: String, required: true },
  location: { type: String, default: '' },
  employmentType: {
    type: String,
    enum: [
      'Internship',
      'Full-time',
      'Part-time',
      'Contract',
      'Freelance',
      'Volunteer',
      'Open source',
      'Hackathon',
    ],
    default: 'Full-time',
  },
  startDate: { type: String, required: true },
  endDate: { type: String, default: '' },
  isCurrent: { type: Boolean, default: false },
  description: { type: String, default: '' },
  skills: { type: [String], default: [] },
  companyUrl: { type: String, default: '' },
})

const EducationSchema = new Schema({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  fieldOfStudy: { type: String, default: '' },
  startYear: { type: String, default: '' },
  endYear: { type: String, default: '' },
  isCurrent: { type: Boolean, default: false },
  cgpa: { type: String, default: '' },
  description: { type: String, default: '' },
})

const ProjectSchema = new Schema({
  title: { type: String, required: true },
  projectName: { type: String, default: '' },
  description: { type: String, default: '' },
  role: { type: String, default: '' },
  technologies: { type: [String], default: [] },
  githubUrl: { type: String, default: '' },
  liveUrl: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  isCurrent: { type: Boolean, default: false },
  imageUrl: { type: String, default: '' },
})

const CertificationSchema = new Schema({
  name: { type: String, required: true },
  issuingOrganization: { type: String, required: true },
  issueDate: { type: String, default: '' },
  credentialId: { type: String, default: '' },
  credentialUrl: { type: String, default: '' },
})

const AchievementSchema = new Schema({
  title: { type: String, required: true },
  organization: { type: String, default: '' },
  date: { type: String, default: '' },
  description: { type: String, default: '' },
  verificationUrl: { type: String, default: '' },
})

const CareerProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    headline: { type: String, default: '' },
    professionalSummary: { type: String, default: '' },
    location: {
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      timezone: { type: String, default: '' },
    },
    country: { type: String, default: '' },
    city: { type: String, default: '' },
    timezone: { type: String, default: '' },
    phone: { type: String, default: '' },
    careerLevel: {
      type: String,
      enum: [
        'Student / Intern',
        'Entry Level',
        'Mid Level',
        'Senior',
        'Lead / Principal',
        'Executive',
      ],
      default: 'Student / Intern',
    },
    currentStatus: {
      type: String,
      enum: [
        'Actively Looking',
        'Open to Offers',
        'Interviewing',
        'Employed & Not Looking',
      ],
      default: 'Actively Looking',
    },
    targetRoles: { type: [String], default: [] },
    secondaryRoles: { type: [String], default: [] },
    industries: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    categorizedSkills: {
      languages: { type: [String], default: [] },
      aiMl: { type: [String], default: [] },
      frameworks: { type: [String], default: [] },
      databases: { type: [String], default: [] },
      tools: { type: [String], default: [] },
      other: { type: [String], default: [] },
    },
    languages: { type: [String], default: [] },
    frameworks: { type: [String], default: [] },
    databases: { type: [String], default: [] },
    tools: { type: [String], default: [] },
    experience: { type: [ExperienceSchema], default: [] },
    education: { type: [EducationSchema], default: [] },
    projects: { type: [ProjectSchema], default: [] },
    certifications: { type: [CertificationSchema], default: [] },
    achievements: { type: [AchievementSchema], default: [] },
    socialLinks: {
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      portfolio: { type: String, default: '' },
      leetcode: { type: String, default: '' },
      hackerrank: { type: String, default: '' },
      kaggle: { type: String, default: '' },
      twitter: { type: String, default: '' },
      other: { type: String, default: '' },
    },
    resume: {
      fileName: { type: String, default: '' },
      fileUrl: { type: String, default: '' },
      fileType: { type: String, default: '' },
      uploadedAt: { type: Date },
      parsedStatus: {
        type: String,
        enum: ['pending', 'parsed', 'failed', 'none'],
        default: 'none',
      },
      atsScore: { type: Number, default: 0 },
      analysisStatus: { type: String, default: '' },
      extractedText: { type: String, default: '' },
      parsedData: { type: Schema.Types.Mixed, default: {} },
    },
    // Compatibility fields with legacy Profile
    resumeUrl: { type: String, default: '' },
    resumeFileName: { type: String, default: '' },
    parsedResumeData: { type: Schema.Types.Mixed, default: {} },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    email: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    jobPreferences: {
      targetRoles: { type: [String], default: [] },
      desiredTitles: { type: [String], default: [] },
      employmentTypes: { type: [String], default: ['Full-time', 'Internship'] },
      workModes: { type: [String], default: ['remote', 'hybrid'] },
      workMode: { type: String, default: 'remote' },
      preferredLocations: { type: [String], default: [] },
      relocationPreference: {
        type: String,
        enum: ['yes', 'no', 'open'],
        default: 'open',
      },
      relocate: { type: String, default: 'no' },
      workAuth: { type: String, default: 'Citizen' },
      companySize: { type: [String], default: [] },
      industryPreferences: { type: [String], default: [] },
      industries: { type: [String], default: [] },
      salaryMin: { type: Number },
      salaryMax: { type: Number },
      currency: { type: String, default: 'USD' },
      noticePeriod: { type: String, default: 'Immediate' },
      yearsExperience: { type: Number, default: 0 },
      educationLevel: { type: String, default: '' },
      fieldOfStudy: { type: String, default: '' },
    },
    workAuthorization: {
      countryOfResidence: { type: String, default: 'India' },
      authorizedCountries: { type: [String], default: ['India'] },
      requiresSponsorship: { type: Boolean, default: false },
      openToInternationalRemote: { type: Boolean, default: true },
      openToRelocation: { type: Boolean, default: true },
    },
    applicationPreferences: {
      yearsOfExperience: { type: Number, default: 0 },
      currentEducation: { type: String, default: '' },
      graduationYear: { type: String, default: '' },
      noticePeriod: { type: String, default: 'Immediate' },
      workAuthorization: { type: String, default: 'Authorized' },
      sponsorshipRequirement: { type: Boolean, default: false },
      relocationPreference: { type: String, default: 'Open' },
      preferredEmploymentTypes: { type: [String], default: ['Full-time', 'Internship'] },
      additionalAnswers: { type: Schema.Types.Mixed, default: {} },
    },
    privacySettings: {
      profileVisibility: {
        type: String,
        enum: ['private', 'recruiters', 'public'],
        default: 'recruiters',
      },
      showEmail: { type: Boolean, default: true },
      showPhone: { type: Boolean, default: false },
      showLocation: { type: Boolean, default: true },
      allowAiUseProfileData: { type: Boolean, default: true },
      allowAutomatedApplications: { type: Boolean, default: true },
    },
    profileCompletion: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
)

const CareerProfile =
  models.CareerProfile ||
  models.Profile ||
  model('CareerProfile', CareerProfileSchema, 'career_profiles')

export default CareerProfile
export { CareerProfile, CareerProfileSchema }
