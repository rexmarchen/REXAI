const createValidationError = (message) => {
  const error = new Error(message)
  error.statusCode = 400
  return error
}

const DEFAULT_POSTED_WITHIN_HOURS = 24

const parseBoolean = (value, fieldName) => {
  if (value == null || String(value).trim() === '') {
    return undefined
  }

  const normalized = String(value).trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false
  }

  throw createValidationError(`${fieldName} must be true or false.`)
}

const parseBoundedInt = (value, fieldName, { fallback, min, max }) => {
  if (value == null || String(value).trim() === '') {
    return fallback
  }

  const parsed = Number.parseInt(String(value).trim(), 10)
  if (!Number.isFinite(parsed)) {
    throw createValidationError(`${fieldName} must be a valid integer.`)
  }
  if (parsed < min || parsed > max) {
    throw createValidationError(`${fieldName} must be between ${min} and ${max}.`)
  }

  return parsed
}

export const validateInternshipSearch = (searchParams) => {
  const query = String(searchParams.get('query') || '').trim()
  if (query.length < 2) {
    throw createValidationError('query is required (minimum 2 characters).')
  }

  const location = String(searchParams.get('location') || '').trim() || undefined
  const remote = parseBoolean(searchParams.get('remote'), 'remote')
  const page = parseBoundedInt(searchParams.get('page'), 'page', {
    fallback: 1,
    min: 1,
    max: 10
  })
  const numPages = parseBoundedInt(
    searchParams.get('num_pages') ?? searchParams.get('numPages'),
    'num_pages',
    {
      fallback: 1,
      min: 1,
      max: 5
    }
  )
  const limit = parseBoundedInt(searchParams.get('limit'), 'limit', {
    fallback: 30,
    min: 1,
    max: 50
  })
  const postedWithinHours = parseBoundedInt(
    searchParams.get('posted_within_hours') ?? searchParams.get('postedWithinHours'),
    'posted_within_hours',
    {
      fallback: DEFAULT_POSTED_WITHIN_HOURS,
      min: 1,
      max: 720
    }
  )
  const adzunaOnly = parseBoolean(
    searchParams.get('adzuna_only') ?? searchParams.get('adzunaOnly'),
    'adzuna_only'
  )
  const refresh = parseBoolean(searchParams.get('refresh'), 'refresh') ?? false

  return {
    query,
    location,
    remote,
    page,
    numPages,
    limit,
    postedWithinHours,
    adzunaOnly: adzunaOnly ?? false,
    refresh
  }
}

const parseLinkedInUrl = (value, fieldName) => {
  if (value == null || String(value).trim() === '') {
    return undefined
  }

  let parsed
  try {
    parsed = new URL(String(value).trim())
  } catch {
    throw createValidationError(`${fieldName} must be a valid URL.`)
  }

  const protocol = parsed.protocol.toLowerCase()
  const hostname = parsed.hostname.toLowerCase()
  const isLinkedInHost = hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com')

  if (protocol !== 'https:' || !isLinkedInHost) {
    throw createValidationError(`${fieldName} must be a valid LinkedIn https URL.`)
  }

  return parsed.toString()
}

export const validateLinkedInRedirect = (searchParams) => {
  const title = String(searchParams.get('title') || '').trim()
  if (title.length < 2) {
    throw createValidationError('title is required (minimum 2 characters).')
  }

  const company = String(searchParams.get('company') || '').trim() || undefined
  const location = String(searchParams.get('location') || '').trim() || undefined
  const fallbackUrl = parseLinkedInUrl(
    searchParams.get('fallback_url') ?? searchParams.get('fallbackUrl'),
    'fallback_url'
  )

  return {
    title,
    company,
    location,
    fallbackUrl
  }
}
