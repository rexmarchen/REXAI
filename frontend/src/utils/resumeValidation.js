import { RESUME_STEPS, createInitialFormData, normalizeFormData } from './resumeBuilder'

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())

const buildEntryMap = (items, fieldResolver) =>
  items.reduce((accumulator, item) => {
    const itemErrors = fieldResolver(item)

    if (Object.keys(itemErrors).length > 0) {
      accumulator[item.id] = itemErrors
    }

    return accumulator
  }, {})

export const validateResumeStep = (resume, stepId) => {
  const formData = normalizeFormData(resume?.formData || createInitialFormData())
  const errors = {}

  if (stepId === 'personal') {
    if (!formData.personal.name.trim()) {
      errors.name = 'Full name is required.'
    }

    if (!formData.personal.email.trim()) {
      errors.email = 'Email is required.'
    } else if (!isValidEmail(formData.personal.email)) {
      errors.email = 'Enter a valid email address.'
    }

    if (!formData.personal.role.trim()) {
      errors.role = 'Target role is required.'
    }

    if (!formData.personal.phone.trim()) {
      errors.phone = 'Phone number is required.'
    }
  }

  if (stepId === 'summary') {
    if (formData.summary.trim().length < 40) {
      errors.summary = 'Write at least 40 characters or generate one with AI.'
    }
  }

  if (stepId === 'skills') {
    if (formData.skills.length < 3) {
      errors.skills = 'Add at least 3 skills for a strong ATS baseline.'
    }
  }

  if (stepId === 'experience') {
    const entryErrors = buildEntryMap(formData.experience, (entry) => {
      const fieldErrors = {}

      if (!entry.role.trim()) {
        fieldErrors.role = 'Role is required.'
      }

      if (!entry.company.trim()) {
        fieldErrors.company = 'Company is required.'
      }

      if (!entry.startDate.trim()) {
        fieldErrors.startDate = 'Start date is required.'
      }

      if (!entry.current && !entry.endDate.trim()) {
        fieldErrors.endDate = 'End date is required unless this is your current role.'
      }

      if (!(entry.bullets || []).some((bullet) => String(bullet || '').trim())) {
        fieldErrors.bullets = 'Add at least one achievement bullet.'
      }

      return fieldErrors
    })

    if (Object.keys(entryErrors).length > 0) {
      errors.entries = entryErrors
    }
  }

  if (stepId === 'education') {
    if (formData.education.length === 0) {
      errors.education = 'Add at least one education record.'
    }

    const entryErrors = buildEntryMap(formData.education, (entry) => {
      const fieldErrors = {}

      if (!entry.institution.trim()) {
        fieldErrors.institution = 'Institution is required.'
      }

      if (!entry.degree.trim()) {
        fieldErrors.degree = 'Degree is required.'
      }

      return fieldErrors
    })

    if (Object.keys(entryErrors).length > 0) {
      errors.entries = entryErrors
    }
  }

  if (stepId === 'projects') {
    const entryErrors = buildEntryMap(formData.projects, (entry) => {
      const fieldErrors = {}

      if (!entry.name.trim()) {
        fieldErrors.name = 'Project name is required.'
      }

      if (!entry.description.trim()) {
        fieldErrors.description = 'Add a short project summary.'
      }

      return fieldErrors
    })

    if (Object.keys(entryErrors).length > 0) {
      errors.entries = entryErrors
    }
  }

  if (stepId === 'certifications') {
    const entryErrors = buildEntryMap(formData.certifications, (entry) => {
      const fieldErrors = {}

      if (!entry.name.trim()) {
        fieldErrors.name = 'Certification name is required.'
      }

      return fieldErrors
    })

    if (Object.keys(entryErrors).length > 0) {
      errors.entries = entryErrors
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export const getCompletedStepCount = (resume) =>
  RESUME_STEPS.reduce((count, step) => count + (validateResumeStep(resume, step.id).isValid ? 1 : 0), 0)

export const validateResumeForExport = (resume) => {
  const stepResults = RESUME_STEPS.map((step) => ({
    stepId: step.id,
    title: step.title,
    ...validateResumeStep(resume, step.id),
  }))

  return {
    isValid: stepResults.every((result) => result.isValid),
    stepResults,
  }
}
