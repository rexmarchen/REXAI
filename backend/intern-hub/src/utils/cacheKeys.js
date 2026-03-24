const ORDERED_KEYS = [
  'query',
  'location',
  'remote',
  'page',
  'numPages',
  'limit',
  'postedWithinHours',
  'adzunaOnly',
  'refresh'
]

export const buildInternshipCacheKey = (params) =>
  ORDERED_KEYS.map((key) => `${key}:${String(params?.[key] ?? '')}`).join('|')
