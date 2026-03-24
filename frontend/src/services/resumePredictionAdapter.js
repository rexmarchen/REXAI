const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const cleanReadableText = (value, maxLength = 240) => {
  const normalized = String(value || '')
    .replace(/\u0000/g, ' ')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) {
    return ''
  }

  const alphaNumericCount = (normalized.match(/[A-Za-z0-9]/g) || []).length
  if (alphaNumericCount === 0) {
    return ''
  }

  if (maxLength > 0 && normalized.length > maxLength) {
    return `${normalized.slice(0, maxLength).trim()}...`
  }

  return normalized
}

const cleanDescription = (value) => {
  const raw = String(value || '')
  const withoutTags = raw.replace(/<[^>]*>/g, ' ')
  const decoded = withoutTags
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/')

  return cleanReadableText(decoded, 260)
}

const sanitizeList = (value) => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => cleanReadableText(item, 120))
    .filter(Boolean)
}

const parseExperienceYears = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value))
  }

  const text = String(value || '').toLowerCase()
  if (!text) {
    return 0
  }

  const rangeMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)/)
  if (rangeMatch) {
    const high = Number.parseFloat(rangeMatch[2])
    if (Number.isFinite(high)) {
      return Math.max(0, Math.round(high))
    }
  }

  const singleMatch = text.match(/(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)/)
  if (singleMatch) {
    const years = Number.parseFloat(singleMatch[1])
    if (Number.isFinite(years)) {
      return Math.max(0, Math.round(years))
    }
  }

  const plainNumber = Number.parseFloat(text)
  if (Number.isFinite(plainNumber)) {
    return Math.max(0, Math.round(plainNumber))
  }

  return 0
}

const sanitizeJobs = (value) => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((job, index) => {
      const rawPostedHoursAgo = Number(job?.posted_hours_ago)

      return {
        id: String(job?.id || job?.apply_link || `${index}`),
        title: String(job?.title || 'Untitled role').trim(),
        company: String(job?.company || 'Unknown company').trim(),
        location: String(job?.location || 'Location not specified').trim(),
        description: cleanDescription(job?.description || ''),
        apply_link: String(job?.apply_link || '').trim(),
        posted_date: String(job?.posted_date || '').trim(),
        posted_hours_ago: Number.isFinite(rawPostedHoursAgo) ? rawPostedHoursAgo : null,
        is_remote: Boolean(job?.is_remote),
        employment_type: String(job?.employment_type || '').trim(),
        source: String(job?.source || '').trim(),
        salary: String(job?.salary || '').trim()
      }
    })
    .filter((job) => job.title)
}

export const normalizeResumePrediction = (data) => {
  if (!data || typeof data !== 'object') {
    return null
  }

  if (data.career_path) {
    const rawConfidence = Number(data.confidence)
    const confidence =
      Number.isFinite(rawConfidence) && rawConfidence > 1
        ? clamp(rawConfidence / 100, 0, 1)
        : clamp(rawConfidence || 0, 0, 1)
    const experienceYears = parseExperienceYears(data.experience_years || data.required_experience)

    return {
      name: cleanReadableText(data.name, 80),
      skills: sanitizeList(data.extracted_skills || data.skills || data.required_skills || []),
      education: cleanReadableText(data.education || data.required_education, 180),
      certifications: sanitizeList(data.certifications || []),
      projects: sanitizeList(data.projects || []),
      experience_years: Number.isFinite(experienceYears) ? Math.max(0, experienceYears) : 0,
      predicted_role: cleanReadableText(data.career_path || data.predicted_role, 80),
      confidence,
      ats_score: Number(data.ats_score || 0),
      predicted_category: cleanReadableText(data.predicted_category, 80),
      job_description_used: cleanReadableText(data.job_description_used, 320),
      missing_skills: sanitizeList(data.missing_skills || []),
      weaknesses: sanitizeList(data.weaknesses || data.resume_weaknesses || []),
      jobs: sanitizeJobs(data.jobs)
    }
  }

  const rawConfidence = Number(data.confidence)
  const confidence =
    Number.isFinite(rawConfidence) && rawConfidence > 1
      ? clamp(rawConfidence / 100, 0, 1)
      : clamp(rawConfidence || 0, 0, 1)

  const experienceYears = parseExperienceYears(data.experience_years || data.required_experience)

  return {
    name: cleanReadableText(data.name, 80),
    skills: sanitizeList(data.skills),
    education: cleanReadableText(data.education, 180),
    certifications: sanitizeList(data.certifications),
    projects: sanitizeList(data.projects),
    experience_years: Number.isFinite(experienceYears) ? Math.max(0, experienceYears) : 0,
    predicted_role: cleanReadableText(data.predicted_role, 80),
    confidence,
    ats_score: Number(data.ats_score || 0),
    predicted_category: cleanReadableText(data.predicted_category, 80),
    job_description_used: cleanReadableText(data.job_description_used, 320),
    missing_skills: sanitizeList(data.missing_skills),
    weaknesses: sanitizeList(data.weaknesses),
    jobs: sanitizeJobs(data.jobs)
  }
}

export default normalizeResumePrediction
