/**
 * REXION AI Core Engine Constants & Configurations
 */

export const MAX_JOB_AGE_HOURS = 48
export const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000 // 5 minutes clock skew tolerance
export const MAX_CONCURRENT_APPLICATIONS = 2

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const APPLICATION_STATES = Object.freeze({
  DISCOVERED: 'DISCOVERED',
  MATCHED: 'MATCHED',
  QUEUED: 'QUEUED',
  PRE_APPLY_FRESHNESS_CHECK: 'PRE_APPLY_FRESHNESS_CHECK',
  BROWSER_SPAWNED: 'BROWSER_SPAWNED',
  NAVIGATING: 'NAVIGATING',
  OPENED: 'OPENED',
  FORM_DETECTED: 'FORM_DETECTED',
  FORM_ANALYZED: 'FORM_ANALYZED',
  AUTOFILLING: 'AUTOFILLING',
  FILLING: 'FILLING',
  SCREENING_ANSWERED: 'SCREENING_ANSWERED',
  ATTACHMENTS_UPLOADED: 'ATTACHMENTS_UPLOADED',
  VALIDATION_READY: 'VALIDATION_READY',
  READY_TO_SUBMIT: 'READY_TO_SUBMIT',
  AWAITING_REVIEW: 'AWAITING_REVIEW',
  SUBMITTING: 'SUBMITTING',
  SUBMITTED: 'SUBMITTED',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  BLOCKED: 'BLOCKED',
  NEEDS_USER_INPUT: 'NEEDS_USER_INPUT',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED'
})

export const FIELD_SAFETY = Object.freeze({
  SAFE_AUTOFILL: 'SAFE_AUTOFILL',
  REQUIRES_VALIDATION: 'REQUIRES_VALIDATION',
  SENSITIVE_NEVER_GUESS: 'SENSITIVE_NEVER_GUESS'
})

export const SAFE_FIELDS = Object.freeze([
  'firstName',
  'lastName',
  'fullName',
  'email',
  'phone',
  'location',
  'city',
  'state',
  'country',
  'zipCode',
  'linkedinUrl',
  'githubUrl',
  'portfolioUrl',
  'education',
  'skills',
  'experienceSummary'
])

export const SENSITIVE_FIELDS = Object.freeze([
  'workAuthorization',
  'visaStatus',
  'requireSponsorship',
  'disabilityStatus',
  'veteranStatus',
  'gender',
  'raceEthnicity',
  'securityClearance',
  'criminalHistory',
  'legalDeclaration'
])

export const VALIDATION_REQUIRED_FIELDS = Object.freeze([
  'yearsOfExperience',
  'expectedSalary',
  'noticePeriodDays',
  'willingToRelocate',
  'preferredWorkMode',
  'employmentType'
])

export const CAREER_DOMAINS = Object.freeze({
  AI_ML: 'AI/ML',
  SOFTWARE_ENGINEERING: 'Software Engineering',
  FULLSTACK: 'Full Stack',
  BACKEND: 'Backend',
  FRONTEND: 'Frontend',
  CYBERSECURITY: 'Cybersecurity',
  DATA_SCIENCE: 'Data Science',
  DEVOPS_CLOUD: 'DevOps & Cloud',
  DATA_ENGINEERING: 'Data Engineering',
  MOBILE: 'Mobile Development',
  BLOCKCHAIN: 'Blockchain & Web3',
  EMBEDDED_SYSTEMS: 'Embedded Systems'
})

export const CAREER_DOMAINS_LIST = Object.freeze(Object.values(CAREER_DOMAINS))

export const CONCURRENCY_LIMITS = Object.freeze({
  MAX_APPLICATION_WORKERS: 5,
  MAX_BROWSER_CONTEXTS: 3,
  MAX_APPLICATIONS_PER_BATCH: 25,
  MAX_PROVIDER_REQUESTS_PER_MINUTE: 60,
  PAGE_TIMEOUT_MS: 30000,
  FORM_FILL_TIMEOUT_MS: 45000
})
