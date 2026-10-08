import type { OutreachContact } from '@/types/outreach'

export interface ContactSearchFilters {
  // Group 1 — Person Filters
  titles: string[]
  seniorities: string[]
  departments: string[]
  excludedTitleKeywords: string[]
  yearsInRole: string
  personLocations: string[]
  personLocationRadius?: number

  // Group 2 — Company Filters
  companyNames: string[]
  companyMode: 'include' | 'exclude'
  industries: string[]
  headcountRanges: string[]
  revenueRanges: string[]
  fundingStages: string[]
  companyLocations: string[]
  technologies: string[]

  // Group 3 — Contact Data Quality
  verifiedEmailOnly: boolean
  hasLinkedIn: boolean
  hasPhone: boolean

  // Group 4 — List Management / Exclusions
  excludeExistingContacts: boolean
  excludeContactedDays: number

  // Pagination / Telemetry
  page?: number
  limit?: number
}

export const DEFAULT_SEARCH_FILTERS: ContactSearchFilters = {
  titles: [],
  seniorities: [],
  departments: [],
  excludedTitleKeywords: [],
  yearsInRole: '',
  personLocations: [],
  personLocationRadius: 25,
  companyNames: [],
  companyMode: 'include',
  industries: [],
  headcountRanges: [],
  revenueRanges: [],
  fundingStages: [],
  companyLocations: [],
  technologies: [],
  verifiedEmailOnly: true,
  hasLinkedIn: false,
  hasPhone: false,
  excludeExistingContacts: true,
  excludeContactedDays: 30,
  page: 1,
  limit: 50,
}

// ── Filter Options & Categorizations ───────────────────────────────────────

export const SENIORITY_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'founder', label: 'Founder / Co-Founder' },
  { value: 'c_suite', label: 'C-Suite (CEO, CTO, COO, CFO)' },
  { value: 'vp', label: 'VP / Vice President' },
  { value: 'director', label: 'Director / Head of' },
  { value: 'manager', label: 'Manager / Lead' },
  { value: 'senior', label: 'Senior / Staff' },
  { value: 'entry', label: 'Entry-Level / Associate' },
]

export const DEPARTMENT_OPTIONS = [
  { value: 'engineering', label: 'Engineering & Technology' },
  { value: 'human_resources', label: 'Human Resources & Talent' },
  { value: 'product', label: 'Product Management' },
  { value: 'design', label: 'UI/UX & Design' },
  { value: 'sales', label: 'Sales & Business Development' },
  { value: 'marketing', label: 'Marketing & Growth' },
  { value: 'operations', label: 'Operations & Project Management' },
  { value: 'finance', label: 'Finance & Legal' },
]

export const INDUSTRY_OPTIONS = [
  'Technology & Software',
  'Financial Services & Fintech',
  'Healthcare & Biotech',
  'E-Commerce & Retail',
  'Artificial Intelligence & ML',
  'Marketing & Advertising',
  'Consulting & Professional Services',
  'Education & EdTech',
  'CleanTech & Energy',
  'Media & Entertainment',
]

export const HEADCOUNT_OPTIONS = [
  { value: '1-10', label: '1 - 10 employees (Startup)' },
  { value: '11-50', label: '11 - 50 employees (Early Stage)' },
  { value: '51-200', label: '51 - 200 employees (Growth)' },
  { value: '201-500', label: '201 - 500 employees (Mid-Market)' },
  { value: '501-1000', label: '501 - 1,000 employees (Scale-up)' },
  { value: '1000+', label: '1,000+ employees (Enterprise)' },
]

export const REVENUE_OPTIONS = [
  { value: 'under_1m', label: '< $1 Million' },
  { value: '1m_10m', label: '$1M - $10M' },
  { value: '10m_50m', label: '$10M - $50M' },
  { value: '50m_100m', label: '$50M - $100M' },
  { value: 'over_100m', label: '$100M+' },
]

export const FUNDING_STAGE_OPTIONS = [
  { value: 'seed', label: 'Seed / Pre-Seed' },
  { value: 'series_a', label: 'Series A' },
  { value: 'series_b', label: 'Series B' },
  { value: 'series_c_plus', label: 'Series C+' },
  { value: 'public', label: 'Publicly Traded' },
  { value: 'bootstrapped', label: 'Bootstrapped / Self-Funded' },
]

export const YEARS_IN_ROLE_OPTIONS = [
  { value: '', label: 'Any tenure' },
  { value: '0-1', label: 'Less than 1 year (New in role)' },
  { value: '1-3', label: '1 to 3 years' },
  { value: '3-5', label: '3 to 5 years' },
  { value: '5+', label: '5+ years (Seasoned)' },
]

// ── Validation ─────────────────────────────────────────────────────────────

export function validateSearchFilters(filters: Partial<ContactSearchFilters>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (filters.excludeContactedDays !== undefined && filters.excludeContactedDays < 0) {
    errors.push('Exclusion timeframe cannot be negative.')
  }

  if (filters.page !== undefined && filters.page < 1) {
    errors.push('Page number must be 1 or higher.')
  }

  if (filters.limit !== undefined && (filters.limit < 1 || filters.limit > 100)) {
    errors.push('Result limit must be between 1 and 100.')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ── Provider Adapters ──────────────────────────────────────────────────────

/**
 * Maps high-level search filters to Apollo.io's mixed_people/search payload.
 */
export function toApolloSearchParams(filters: ContactSearchFilters): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    page: filters.page || 1,
    per_page: filters.limit || 50,
  }

  // Titles
  if (filters.titles && filters.titles.length > 0) {
    payload.person_titles = filters.titles
  }

  // Seniorities
  if (filters.seniorities && filters.seniorities.length > 0) {
    const seniorityMap: Record<string, string> = {
      owner: 'owner',
      founder: 'founder',
      c_suite: 'c_suite',
      vp: 'vp',
      director: 'director',
      manager: 'manager',
      senior: 'senior',
      entry: 'entry',
    }
    payload.person_seniorities = filters.seniorities.map((s) => seniorityMap[s] || s)
  }

  // Departments
  if (filters.departments && filters.departments.length > 0) {
    payload.person_departments = filters.departments
  }

  // Excluded Keywords
  if (filters.excludedTitleKeywords && filters.excludedTitleKeywords.length > 0) {
    payload.person_not_titles = filters.excludedTitleKeywords
  }

  // Person Locations
  if (filters.personLocations && filters.personLocations.length > 0) {
    payload.person_locations = filters.personLocations
  }

  // Company Names / Domains
  if (filters.companyNames && filters.companyNames.length > 0) {
    const domains = filters.companyNames.filter((c) => c.includes('.'))
    const names = filters.companyNames.filter((c) => !c.includes('.'))

    if (filters.companyMode === 'exclude') {
      if (domains.length > 0) payload.not_organization_domains = domains
      if (names.length > 0) payload.not_organization_names = names
    } else {
      if (domains.length > 0) payload.organization_domains = domains
      if (names.length > 0) payload.q_organization_name = names.join(' ')
    }
  }

  // Company Headcount
  if (filters.headcountRanges && filters.headcountRanges.length > 0) {
    payload.organization_num_employees_ranges = filters.headcountRanges
  }

  // Company HQ Locations
  if (filters.companyLocations && filters.companyLocations.length > 0) {
    payload.organization_locations = filters.companyLocations
  }

  // Technologies
  if (filters.technologies && filters.technologies.length > 0) {
    payload.currently_using_any_of_technology_uids = filters.technologies
  }

  // Data Quality
  if (filters.verifiedEmailOnly) {
    payload.contact_email_status = ['verified']
  } else {
    payload.contact_email_status = ['verified', 'likely_to_engage', 'unverified']
  }

  return payload
}

/**
 * Maps high-level search filters to Snov.io prospect search parameters.
 */
export function toSnovSearchParams(filters: ContactSearchFilters): Record<string, unknown> {
  const params: Record<string, unknown> = {
    limit: filters.limit || 50,
  }

  if (filters.titles && filters.titles.length > 0) {
    params.job_title = filters.titles.join(',')
  }

  if (filters.companyNames && filters.companyNames.length > 0) {
    params.company_name = filters.companyNames[0]
  }

  if (filters.personLocations && filters.personLocations.length > 0) {
    params.location = filters.personLocations.join(',')
  }

  return params
}

// ── In-Memory Refinement Layer ─────────────────────────────────────────────

/**
 * Deep filter validation & enforcement against contact objects
 * Ensures all filters (e.g. LinkedIn toggle, excluded keywords, headcount) are strictly honored.
 */
export function filterContactsInMemory(
  contacts: OutreachContact[],
  filters: ContactSearchFilters
): OutreachContact[] {
  return contacts.filter((contact) => {
    // 1. Verified Email Toggle
    if (filters.verifiedEmailOnly && contact.verified !== 'verified') {
      return false
    }

    // 2. LinkedIn Profile Toggle
    if (filters.hasLinkedIn && !contact.linkedinUrl) {
      return false
    }

    // 3. Excluded Title Keywords
    if (filters.excludedTitleKeywords && filters.excludedTitleKeywords.length > 0) {
      const titleLower = (contact.jobTitle || '').toLowerCase()
      const isExcluded = filters.excludedTitleKeywords.some((keyword) =>
        titleLower.includes(keyword.trim().toLowerCase())
      )
      if (isExcluded) return false
    }

    // 4. Seniority match (if specified and not empty)
    if (filters.seniorities && filters.seniorities.length > 0) {
      const titleLower = (contact.jobTitle || '').toLowerCase()
      const matchesSeniority = filters.seniorities.some((sen) => {
        switch (sen) {
          case 'founder':
          case 'owner':
            return /founder|owner|co-founder|partner|principal/i.test(titleLower)
          case 'c_suite':
            return /ceo|cto|cfo|coo|cmo|cpo|chief|c-level/i.test(titleLower)
          case 'vp':
            return /vp|vice president/i.test(titleLower)
          case 'director':
            return /director|head of/i.test(titleLower)
          case 'manager':
            return /manager|lead|supervisor/i.test(titleLower)
          case 'senior':
            return /senior|sr\.|staff|principal/i.test(titleLower)
          case 'entry':
            return /associate|entry|junior|intern|assistant/i.test(titleLower)
          default:
            return true
        }
      })
      if (!matchesSeniority) return false
    }

    // 5. Department match (if specified)
    if (filters.departments && filters.departments.length > 0) {
      const titleLower = (contact.jobTitle || '').toLowerCase()
      const isExecutive = /founder|owner|ceo|president|partner/i.test(titleLower)
      const matchesDept = isExecutive || filters.departments.some((dept) => {
        switch (dept) {
          case 'engineering':
            return /engineer|developer|software|devops|architect|technical|data|ml|ai|cto|technology/i.test(titleLower)
          case 'human_resources':
            return /hr|talent|recruiter|people|people ops|recruiting|hiring|chro/i.test(titleLower)
          case 'product':
            return /product|pm|program|cpo/i.test(titleLower)
          case 'design':
            return /design|ux|ui|creative|graphic/i.test(titleLower)
          case 'sales':
            return /sales|account|bdr|sdr|business development|cro/i.test(titleLower)
          case 'marketing':
            return /marketing|growth|content|seo|brand|copywriter|cmo/i.test(titleLower)
          case 'operations':
            return /operations|ops|logistics|supply|admin|coo/i.test(titleLower)
          case 'finance':
            return /finance|accounting|controller|treasury|tax|legal|cfo/i.test(titleLower)
          default:
            return true
        }
      })
      if (!matchesDept) return false
    }

    return true
  })
}
