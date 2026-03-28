import type { CompanyProfile } from '@/types'
import { mockCompanies } from '@/lib/mock-data'

export async function findCompanyByName(query: string): Promise<CompanyProfile | null> {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) {
    return null
  }

  const apiKey = process.env.CLEARBIT_API_KEY
  if (apiKey) {
    const url = `https://company.clearbit.com/v2/companies/find?name=${encodeURIComponent(trimmedQuery)}`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: 'no-store',
    })

    if (response.ok) {
      const payload = (await response.json()) as {
        name?: string
        domain?: string
        category?: { sector?: string }
        location?: string
        metrics?: { employees?: number }
        logo?: string
        linkedin?: { handle?: string }
      }

      return {
        name: payload.name || trimmedQuery,
        domain: payload.domain || `${trimmedQuery.toLowerCase().replace(/\s+/g, '')}.com`,
        logo: payload.logo || trimmedQuery.charAt(0).toUpperCase(),
        industry: payload.category?.sector || 'Technology',
        size: payload.metrics?.employees ? `${payload.metrics.employees}+` : 'Unknown',
        location: payload.location || 'Unknown',
        linkedinUrl: payload.linkedin?.handle
          ? `https://www.linkedin.com/company/${payload.linkedin.handle}`
          : undefined,
        hiringStatus: 'Unknown',
      }
    }
  }

  return (
    mockCompanies.find((company) =>
      company.name.toLowerCase().includes(trimmedQuery.toLowerCase())
    ) || null
  )
}
