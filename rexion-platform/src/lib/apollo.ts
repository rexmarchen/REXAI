import type { CompanyProfile, OutreachContactShape } from '@/types'
import type { OutreachContact } from '@/types/outreach'
import { mockCompanies, mockContacts } from '@/lib/mock-data'
import { MOCK_CONTACTS } from './outreach/mock-data'
import { toApolloSearchParams, type ContactSearchFilters, filterContactsInMemory } from './search-filters'

export async function searchApolloOrganizations(query: string): Promise<CompanyProfile[]> {
  const apiKey = process.env.APOLLO_API_KEY

  if (apiKey) {
    const response = await fetch('https://api.apollo.io/v1/organizations/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        q_organization_name: query,
        page: 1,
      }),
      cache: 'no-store',
    })

    if (response.ok) {
      const payload = (await response.json()) as {
        organizations?: Array<{
          name?: string
          website_url?: string
          estimated_num_employees?: number
          linkedin_url?: string
          primary_location?: { city?: string }
        }>
      }

      return (payload.organizations || []).map((organization) => ({
        name: organization.name || query,
        domain: organization.website_url?.replace(/^https?:\/\//, '') || `${query}.com`,
        logo: organization.name?.charAt(0).toUpperCase(),
        size: organization.estimated_num_employees
          ? `${organization.estimated_num_employees}+`
          : 'Unknown',
        location: organization.primary_location?.city || 'Unknown',
        linkedinUrl: organization.linkedin_url,
        hiringStatus: 'Unknown',
      }))
    }
  }

  return mockCompanies.filter((company) =>
    company.name.toLowerCase().includes(query.toLowerCase())
  )
}

export async function searchApolloPeople(domain: string): Promise<OutreachContactShape[]> {
  const apiKey = process.env.APOLLO_API_KEY

  if (apiKey) {
    const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        organization_domains: [domain],
        person_titles: ['HR', 'Recruiter', 'Talent Acquisition', 'Hiring Manager', 'Founder', 'Co-founder'],
      }),
      cache: 'no-store',
    })

    if (response.ok) {
      const payload = (await response.json()) as {
        people?: Array<{
          id?: string
          name?: string
          title?: string
          email?: string
          linkedin_url?: string
        }>
      }

      return (payload.people || [])
        .filter((person): person is NonNullable<typeof person> => Boolean(person.email))
        .map((person) => ({
          id: person.id || person.email || domain,
          name: person.name || 'Unknown Contact',
          role: person.title || 'Recruiter',
          email: person.email || '',
          confidence: 'likely',
          linkedinUrl: person.linkedin_url,
        }))
    }
  }

  return mockContacts.filter((contact) => contact.email.includes(domain.split('.')[0]))
}

export async function searchApolloContacts(
  params: {
    role?: string
    company?: string
    location?: string
    filters?: Partial<ContactSearchFilters>
  } | ContactSearchFilters
): Promise<OutreachContact[]> {
  const apiKey = process.env.APOLLO_API_KEY

  // Normalize incoming options into a ContactSearchFilters object
  const rawFilters = 'titles' in params ? params : (params.filters || {})
  const role = 'role' in params ? params.role : undefined
  const company = 'company' in params ? params.company : undefined
  const location = 'location' in params ? params.location : undefined

  const searchFilters: ContactSearchFilters = {
    titles: rawFilters.titles || (role ? [role] : []),
    seniorities: rawFilters.seniorities || [],
    departments: rawFilters.departments || [],
    excludedTitleKeywords: rawFilters.excludedTitleKeywords || [],
    yearsInRole: rawFilters.yearsInRole || '',
    personLocations: rawFilters.personLocations || (location ? [location] : []),
    personLocationRadius: rawFilters.personLocationRadius || 25,
    companyNames: rawFilters.companyNames || (company ? [company] : []),
    companyMode: rawFilters.companyMode || 'include',
    industries: rawFilters.industries || [],
    headcountRanges: rawFilters.headcountRanges || [],
    revenueRanges: rawFilters.revenueRanges || [],
    fundingStages: rawFilters.fundingStages || [],
    companyLocations: rawFilters.companyLocations || [],
    technologies: rawFilters.technologies || [],
    verifiedEmailOnly: rawFilters.verifiedEmailOnly !== false,
    hasLinkedIn: Boolean(rawFilters.hasLinkedIn),
    hasPhone: Boolean(rawFilters.hasPhone),
    excludeExistingContacts: rawFilters.excludeExistingContacts !== false,
    excludeContactedDays: rawFilters.excludeContactedDays ?? 30,
    page: rawFilters.page || 1,
    limit: rawFilters.limit || 50,
  }

  if (apiKey) {
    const payload = toApolloSearchParams(searchFilters)

    try {
      const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      })

      if (response.ok) {
        const data = (await response.json()) as {
          people?: Array<{
            id?: string
            first_name?: string
            last_name?: string
            name?: string
            title?: string
            email?: string
            email_status?: string
            linkedin_url?: string
            city?: string
            state?: string
            country?: string
            organization?: { name?: string; website_url?: string; primary_phone?: string }
          }>
        }

        const apolloContacts: OutreachContact[] = (data.people || [])
          .filter((person) => {
            const status = String(person.email_status || '').toLowerCase()
            return Boolean(person.email) && !['dead', 'invalid', 'bounced', 'unavailable'].includes(status)
          })
          .map((person) => {
            const firstName = person.first_name || person.name?.split(' ')[0] || 'Unknown'
            const lastName = person.last_name || person.name?.split(' ').slice(1).join(' ') || ''
            const status = String(person.email_status || '').toLowerCase()
            const verified = status === 'verified' ? ('verified' as const) : ('likely' as const)
            const city = person.city || ''
            const state = person.state || ''
            const country = person.country || ''
            const locStr = [city, state, country].filter(Boolean).join(', ') || 'Remote'

            return {
              id: person.id || `ap_${Math.random().toString(36).substring(7)}`,
              firstName,
              lastName,
              jobTitle: person.title || 'Professional',
              companyName: person.organization?.name || searchFilters.companyNames[0] || 'Target Company',
              email: person.email || '',
              location: locStr,
              verified,
              linkedinUrl: person.linkedin_url,
            }
          })

        return filterContactsInMemory(apolloContacts, searchFilters)
      }
    } catch (e) {
      console.error('Apollo API search failed:', e)
    }
  }

  // Fallback to mock data
  let matches = [...MOCK_CONTACTS]

  if (searchFilters.titles.length > 0) {
    matches = matches.filter((c) =>
      searchFilters.titles.some((t: string) => c.jobTitle.toLowerCase().includes(t.toLowerCase()))
    )
  }

  if (searchFilters.companyNames.length > 0) {
    matches = matches.filter((c) =>
      searchFilters.companyNames.some((cmp: string) =>
        c.companyName.toLowerCase().includes(cmp.toLowerCase())
      )
    )
  }

  if (searchFilters.personLocations.length > 0) {
    matches = matches.filter((c) =>
      searchFilters.personLocations.some((loc: string) =>
        c.location.toLowerCase().includes(loc.toLowerCase())
      )
    )
  }

  return filterContactsInMemory(matches, searchFilters)
}
