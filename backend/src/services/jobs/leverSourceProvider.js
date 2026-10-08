import { JobProviderInterface } from './jobProviderInterface.js'
import { evaluateJobFreshness, computeJobCanonicalHash } from './jobFreshnessEngine.js'
import logger from '../../utils/logger.js'

const DEFAULT_LEVER_COMPANIES = [
  'netflix', 'shopify', 'lever', 'vercel', 'hotjar', 'stackadapt', 'figma'
]

export class LeverSourceProvider extends JobProviderInterface {
  constructor(companies = DEFAULT_LEVER_COMPANIES) {
    super('lever')
    this.companies = companies
  }

  async searchJobs({ query = '', location = '', domain = '', limit = 30 } = {}) {
    const results = []
    const queryLower = query.toLowerCase()

    for (const company of this.companies) {
      if (results.length >= limit) break
      try {
        const res = await fetch(`https://api.lever.co/v0/postings/${company}?mode=json`, {
          signal: AbortSignal.timeout(8000)
        })
        if (!res.ok) continue

        const rawList = await res.json()
        const postings = Array.isArray(rawList) ? rawList : []

        for (const raw of postings) {
          const normalized = this.normalizeJob(raw, company)
          if (!normalized) continue

          if (queryLower) {
            const matchesQuery =
              normalized.title.toLowerCase().includes(queryLower) ||
              normalized.description.toLowerCase().includes(queryLower)
            if (!matchesQuery) continue
          }

          results.push(normalized)
          if (results.length >= limit) break
        }
      } catch (err) {
        logger.debug(`[LeverProvider] Company "${company}" fetch failed: ${err.message}`)
      }
    }

    return results
  }

  normalizeJob(raw, company = 'lever') {
    if (!raw || !raw.id || !raw.text) return null

    const postedDate = raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString()
    const freshness = evaluateJobFreshness(postedDate)
    const companyName = company.charAt(0).toUpperCase() + company.slice(1)
    const loc = raw.categories?.location || raw.categories?.allLocations?.[0] || 'Remote / Multiple Locations'

    const rawDesc = typeof raw.description === 'string'
      ? raw.description
      : typeof raw.descriptionPlain === 'string'
        ? raw.descriptionPlain
        : ''

    const normalized = {
      externalJobId: `lever-${company}-${raw.id}`,
      title: raw.text.trim(),
      company: companyName,
      location: loc,
      isRemote: Boolean(
        raw.text.toLowerCase().includes('remote') ||
        loc.toLowerCase().includes('remote') ||
        rawDesc.toLowerCase().includes('remote')
      ),
      description: rawDesc.replace(/<\/?[^>]+(>|$)/g, ' ').slice(0, 1500).trim(),
      applyUrl: raw.hostedUrl || `https://jobs.lever.co/${company}/${raw.id}`,
      provider: 'lever',
      tier: 1, // Tier 1: direct ATS
      postedAt: postedDate,
      freshness
    }

    normalized.canonicalHash = computeJobCanonicalHash(normalized)
    return normalized
  }
}

export default new LeverSourceProvider()
