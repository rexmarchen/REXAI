export type CareerLevel =
  | 'Student / Intern'
  | 'Entry Level'
  | 'Mid Level'
  | 'Senior'
  | 'Lead / Principal'
  | 'Executive'

export type CurrentStatus =
  | 'Actively Looking'
  | 'Open to Offers'
  | 'Interviewing'
  | 'Employed & Not Looking'

export type EmploymentType =
  | 'Internship'
  | 'Full-time'
  | 'Part-time'
  | 'Contract'
  | 'Freelance'
  | 'Volunteer'
  | 'Open source'
  | 'Hackathon'

export type WorkMode = 'remote' | 'hybrid' | 'onsite'

export type ProfileVisibility = 'private' | 'recruiters' | 'public'

export interface ProfileExperience {
  id?: string
  _id?: string
  company: string
  role: string
  location?: string
  employmentType?: EmploymentType
  startDate: string
  endDate?: string
  isCurrent?: boolean
  description: string
  skills?: string[]
  companyUrl?: string
}

export interface ProfileEducation {
  id?: string
  _id?: string
  institution: string
  degree: string
  fieldOfStudy: string
  startYear: string
  endYear?: string
  isCurrent?: boolean
  cgpa?: string
  description?: string
}

export interface ProfileProject {
  id?: string
  _id?: string
  title: string
  projectName?: string
  description: string
  role?: string
  technologies: string[]
  githubUrl?: string
  liveUrl?: string
  startDate?: string
  endDate?: string
  isCurrent?: boolean
  imageUrl?: string
}

export interface ProfileCertification {
  id?: string
  _id?: string
  name: string
  issuingOrganization: string
  issueDate?: string
  credentialId?: string
  credentialUrl?: string
}

export interface ProfileAchievement {
  id?: string
  _id?: string
  title: string
  organization?: string
  date?: string
  description?: string
  verificationUrl?: string
}

export interface ProfileSocialLinks {
  github?: string
  linkedin?: string
  portfolio?: string
  leetcode?: string
  hackerrank?: string
  kaggle?: string
  twitter?: string
  other?: string
}

export interface ProfileResume {
  fileName?: string
  fileUrl?: string
  fileType?: string
  uploadedAt?: string | Date
  parsedStatus?: 'pending' | 'parsed' | 'failed' | 'none'
  atsScore?: number
  analysisStatus?: string
  extractedText?: string
  parsedData?: Record<string, unknown>
}

export interface ProfileJobPreferences {
  targetRoles: string[]
  desiredTitles?: string[]
  employmentTypes: string[]
  workModes: string[]
  preferredLocations: string[]
  relocationPreference: 'yes' | 'no' | 'open'
  companySize?: string[]
  industryPreferences: string[]
  salaryMin?: number
  salaryMax?: number
  currency: string
}

export interface ProfileWorkAuthorization {
  countryOfResidence: string
  authorizedCountries: string[]
  requiresSponsorship: boolean
  openToInternationalRemote: boolean
  openToRelocation: boolean
}

export interface ProfileApplicationPreferences {
  yearsOfExperience: number
  currentEducation: string
  graduationYear: string
  noticePeriod: string
  workAuthorization: string
  sponsorshipRequirement: boolean
  relocationPreference: string
  preferredEmploymentTypes: string[]
  additionalAnswers?: Record<string, string>
}

export interface ProfilePrivacySettings {
  profileVisibility: ProfileVisibility
  showEmail: boolean
  showPhone: boolean
  showLocation: boolean
  allowAiUseProfileData: boolean
  allowAutomatedApplications: boolean
}

export interface CategorizedSkills {
  languages: string[]
  aiMl: string[]
  frameworks: string[]
  databases: string[]
  tools: string[]
  other: string[]
}

export interface CareerProfileShape {
  id?: string
  _id?: string
  userId: string
  firstName?: string
  lastName?: string
  email?: string
  headline?: string
  professionalSummary?: string
  location?: {
    city?: string
    state?: string
    country?: string
    timezone?: string
  }
  country?: string
  city?: string
  timezone?: string
  phone?: string
  careerLevel?: CareerLevel
  currentStatus?: CurrentStatus
  targetRoles: string[]
  secondaryRoles: string[]
  industries: string[]
  skills: string[]
  categorizedSkills?: CategorizedSkills
  languages: string[]
  frameworks: string[]
  databases: string[]
  tools: string[]
  experience: ProfileExperience[]
  education: ProfileEducation[]
  projects: ProfileProject[]
  certifications: ProfileCertification[]
  achievements: ProfileAchievement[]
  socialLinks: ProfileSocialLinks
  resume: ProfileResume
  resumeUrl?: string
  resumeFileName?: string
  parsedResumeData?: Record<string, unknown>
  linkedin?: string
  portfolio?: string
  jobPreferences: ProfileJobPreferences
  workAuthorization: ProfileWorkAuthorization
  applicationPreferences: ProfileApplicationPreferences
  privacySettings: ProfilePrivacySettings
  profileCompletion: number
  createdAt?: string | Date
  updatedAt?: string | Date
}

export interface CompletionItem {
  key: string
  label: string
  completed: boolean
  weight: number
  href?: string
}

export interface ProfileCompletionResult {
  percentage: number
  items: CompletionItem[]
  completedCount: number
  totalCount: number
}
