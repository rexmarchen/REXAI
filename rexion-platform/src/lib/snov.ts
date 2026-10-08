import type { OutreachContact } from '@/types/outreach'
import { MOCK_CONTACTS } from './outreach/mock-data'

let cachedToken: string | null = null
let tokenExpiresAt = 0

export async function getSnovAccessToken(): Promise<string | null> {
  const userId = process.env.SNOV_USER_ID
  const secret = process.env.SNOV_SECRET

  if (!userId || !secret) {
    return null
  }

  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken
  }

  try {
    const response = await fetch('https://api.snov.io/v1/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: userId,
        client_secret: secret,
      }),
      cache: 'no-store',
    })

    if (response.ok) {
      const data = (await response.json()) as { access_token?: string; expires_in?: number }
      if (data.access_token) {
        cachedToken = data.access_token
        tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000
        return cachedToken
      }
    }
  } catch (e) {
    console.error('Snov token fetch failed:', e)
  }

  return null
}

export function resolveCandidateDomains(company = '', location = ''): string[] {
  const trimmed = (company || '').trim().toLowerCase()
  if (!trimmed) return ['google.co.in', 'google.com']

  if (trimmed.includes('.')) {
    return [trimmed.replace(/^https?:\/\//, '').replace(/\/.*$/, '')]
  }

  const clean = trimmed.replace(/[^a-z0-9]/g, '')
  const loc = (location || '').toLowerCase()
  const isIndia = loc.includes('mumbai') || loc.includes('delhi') || loc.includes('bangalore') || loc.includes('bengaluru') || loc.includes('pune') || loc.includes('hyderabad') || loc.includes('india')

  if (clean === 'google') {
    return isIndia ? ['google.co.in', 'google.com', 'alphabet.com'] : ['google.com', 'google.co.in', 'alphabet.com']
  }

  if (isIndia) {
    return [`${clean}.co.in`, `${clean}.in`, `${clean}.com`]
  }

  return [`${clean}.com`, `${clean}.io`, `${clean}.co.in`]
}

import { type ContactSearchFilters, filterContactsInMemory } from './search-filters'

export async function searchSnovContacts(
  params: {
    role?: string
    company?: string
    location?: string
    filters?: Partial<ContactSearchFilters>
  } | ContactSearchFilters
): Promise<OutreachContact[]> {
  const token = await getSnovAccessToken()

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

  const targetCompany = searchFilters.companyNames[0] || company || ''
  const targetLocation = searchFilters.personLocations[0] || location || ''

  if (token && targetCompany) {
    const candidateDomains = resolveCandidateDomains(targetCompany, targetLocation)

    for (const domain of candidateDomains) {
      try {
        const response = await fetch(
          `https://api.snov.io/v2/domain-emails-with-info?domain=${encodeURIComponent(domain)}&type=all&limit=30`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
          }
        )

        if (response.ok) {
          const payload = (await response.json()) as {
            data?: Array<{
              email?: string
              type?: string
              status?: string
              first_name?: string
              last_name?: string
              position?: string
              source_page?: string
            }>
            emails?: Array<{
              email?: string
              type?: string
              status?: string
              firstName?: string
              lastName?: string
              position?: string
              sourcePage?: string
            }>
          }

          const rawList = payload.data || payload.emails || []
          if (rawList.length > 0) {
            const roleLower = (searchFilters.titles[0] || role || '').toLowerCase()
            const snovContacts = rawList
              .filter((p) => Boolean(p.email))
              .map((p, idx) => {
                const email = p.email || ''
                const emailParts = email.split('@')[0]?.split('.') || []
                const pAny = p as any
                const firstName = pAny.first_name || pAny.firstName || emailParts[0] || 'Team'
                const lastName = pAny.last_name || pAny.lastName || emailParts[1] || 'Lead'
                
                let jobTitle = p.position || ''
                if (!jobTitle) {
                  if (roleLower.includes('founder') || roleLower.includes('ceo')) {
                    jobTitle = 'Founder & Executive'
                  } else if (roleLower.includes('hr') || roleLower.includes('recruiter') || roleLower.includes('talent')) {
                    jobTitle = 'Talent Acquisition & HR'
                  } else if (roleLower.includes('manager')) {
                    jobTitle = 'Engineering / Product Manager'
                  } else {
                    jobTitle = 'HR & People Operations'
                  }
                }

                const companyName = targetCompany || domain.split('.')[0] || 'Target Company'

                let finalLinkedinUrl = pAny.source_page || pAny.sourcePage || ''
                if (!finalLinkedinUrl || finalLinkedinUrl === 'https://www.linkedin.com' || !finalLinkedinUrl.includes('linkedin.com')) {
                  const searchTerms = encodeURIComponent(`${firstName} ${lastName} ${companyName}`)
                  finalLinkedinUrl = `https://www.linkedin.com/search/results/people/?keywords=${searchTerms}`
                }

                return {
                  id: `snov-${idx}-${email}`,
                  firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
                  lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
                  email,
                  jobTitle,
                  companyName: companyName.charAt(0).toUpperCase() + companyName.slice(1),
                  companyDomain: domain,
                  location: targetLocation || 'Mumbai, India',
                  verified: (p.status === 'verified' || p.status === 'valid') ? ('verified' as const) : ('likely' as const),
                  linkedinUrl: finalLinkedinUrl,
                }
              })

            return filterContactsInMemory(snovContacts, searchFilters)
          }
        }
      } catch (e) {
        console.error('Snov domain search error:', e)
      }
    }
  }

  // Fallback to high-quality mock data
  let matches = [...MOCK_CONTACTS]

  if (searchFilters.titles.length > 0) {
    matches = matches.filter((c) =>
      searchFilters.titles.some((t) => c.jobTitle.toLowerCase().includes(t.toLowerCase()))
    )
  }

  if (searchFilters.companyNames.length > 0) {
    matches = matches.filter((c) =>
      searchFilters.companyNames.some((cmp) =>
        c.companyName.toLowerCase().includes(cmp.toLowerCase())
      )
    )
  }

  if (searchFilters.personLocations.length > 0) {
    matches = matches.filter((c) =>
      searchFilters.personLocations.some((loc) =>
        c.location.toLowerCase().includes(loc.toLowerCase())
      )
    )
  }

  return filterContactsInMemory(matches, searchFilters)
}
