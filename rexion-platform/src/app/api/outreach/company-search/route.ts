import { ok } from '@/lib/api'
import { searchApolloOrganizations } from '@/lib/apollo'
import { findCompanyByName } from '@/lib/clearbit'

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim()
  if (!query) {
    return ok([])
  }

  const [clearbitCompany, apolloCompanies] = await Promise.all([
    findCompanyByName(query),
    searchApolloOrganizations(query),
  ])

  const deduped = new Map<string, Awaited<ReturnType<typeof findCompanyByName>>>()

  if (clearbitCompany) {
    deduped.set(clearbitCompany.domain, clearbitCompany)
  }

  apolloCompanies.forEach((company) => {
    deduped.set(company.domain, company)
  })

  return ok([...deduped.values()].filter(Boolean))
}
