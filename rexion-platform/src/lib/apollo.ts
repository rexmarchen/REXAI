import type { CompanyProfile, OutreachContactShape } from '@/types'
import { mockCompanies, mockContacts } from '@/lib/mock-data'

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
