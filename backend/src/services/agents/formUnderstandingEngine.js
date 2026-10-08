import { FIELD_SAFETY } from '../../config/constants.js'

/**
 * Standard field safety matching regex patterns
 */
const SENSITIVE_PATTERNS = [
  /visa/i,
  /sponsorship/i,
  /authorized\s+to\s+work/i,
  /legal\s+right\s+to\s+work/i,
  /immigration/i,
  /disability/i,
  /veteran/i,
  /race/i,
  /ethnicity/i,
  /gender/i,
  /social\s+security/i,
  /ssn/i,
  /background\s+check/i,
  /criminal/i
]

const SAFE_AUTOFILL_PATTERNS = [
  { field: 'firstName', pattern: /first\s*name|given\s*name/i },
  { field: 'lastName', pattern: /last\s*name|family\s*name|surname/i },
  { field: 'fullName', pattern: /full\s*name|name/i },
  { field: 'email', pattern: /email|e-mail/i },
  { field: 'phone', pattern: /phone|mobile|cell|telephone/i },
  { field: 'linkedinUrl', pattern: /linkedin/i },
  { field: 'githubUrl', pattern: /github/i },
  { field: 'portfolioUrl', pattern: /portfolio|website|personal\s*url|link/i },
  { field: 'resumeFile', pattern: /resume|cv|curriculum\s*vitae|upload\s*resume/i }
]

const VALIDATION_PATTERNS = [
  { field: 'salary', pattern: /salary|compensation|expected\s*pay|desired\s*salary/i },
  { field: 'experienceYears', pattern: /years\s+of\s+experience|total\s+experience/i },
  { field: 'startDate', pattern: /start\s*date|availability|notice\s*period/i },
  { field: 'coverLetter', pattern: /cover\s*letter|additional\s*information|why\s*do\s*you\s*want/i }
]

/**
 * Categorize a form field based on label, name, id, and placeholder
 *
 * @param {Object} fieldInfo - { label, name, id, placeholder, type, options }
 * @returns {{ safetyCategory: string, canonicalField: string|null, isSensitive: boolean }}
 */
export function categorizeFormField(fieldInfo = {}) {
  const combinedText = `${fieldInfo.label || ''} ${fieldInfo.name || ''} ${fieldInfo.id || ''} ${fieldInfo.placeholder || ''}`.trim()

  // 1. Check Sensitive / Never Guess
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(combinedText)) {
      return {
        safetyCategory: FIELD_SAFETY.SENSITIVE_NEVER_GUESS,
        canonicalField: null,
        isSensitive: true,
        reason: 'Sensitive legal/demographic/work-auth field requires explicit verified candidate input'
      }
    }
  }

  // 2. Check Safe Autofill
  for (const item of SAFE_AUTOFILL_PATTERNS) {
    if (item.pattern.test(combinedText)) {
      return {
        safetyCategory: FIELD_SAFETY.SAFE_AUTOFILL,
        canonicalField: item.field,
        isSensitive: false
      }
    }
  }

  // 3. Check Requires Validation
  for (const item of VALIDATION_PATTERNS) {
    if (item.pattern.test(combinedText)) {
      return {
        safetyCategory: FIELD_SAFETY.REQUIRES_VALIDATION,
        canonicalField: item.field,
        isSensitive: false
      }
    }
  }

  // Default to REQUIRES_VALIDATION for custom screening questions
  return {
    safetyCategory: FIELD_SAFETY.REQUIRES_VALIDATION,
    canonicalField: 'custom_screening_question',
    isSensitive: false
  }
}

/**
 * Maps a list of detected DOM inputs into categorized form schema
 */
export function analyzeFormFields(rawFields = []) {
  const analyzed = rawFields.map((field) => {
    const categorization = categorizeFormField(field)
    return {
      ...field,
      ...categorization
    }
  })

  const sensitiveFields = analyzed.filter((f) => f.safetyCategory === FIELD_SAFETY.SENSITIVE_NEVER_GUESS)
  const safeFields = analyzed.filter((f) => f.safetyCategory === FIELD_SAFETY.SAFE_AUTOFILL)
  const validationFields = analyzed.filter((f) => f.safetyCategory === FIELD_SAFETY.REQUIRES_VALIDATION)

  return {
    fields: analyzed,
    counts: {
      total: analyzed.length,
      safe: safeFields.length,
      validation: validationFields.length,
      sensitive: sensitiveFields.length
    },
    requiresUserInput: sensitiveFields.length > 0
  }
}
