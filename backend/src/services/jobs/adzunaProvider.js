import { JobProviderInterface } from './jobProviderInterface.js'
import { evaluateJobFreshness, computeJobCanonicalHash } from './jobFreshnessEngine.js'
import logger from '../../utils/logger.js'

export class AdzunaProvider extends JobProviderInterface {
  constructor(appId = process.env.ADZUNA_APP_ID, apiKey = process.env.ADZUNA_API_KEY) {
    super('adzuna')
    this.appId = appId
    this.apiKey = apiKey
    this.country = 'us'
  }

  async searchJobs({ query = 'software engineer', location = '', domain = '', page = 1, limit = 20 } = {}) {
    if (!this.appId || !this.apiKey) {
      logger.debug('[AdzunaProvider] Adzuna credentials not configured, returning empty search')
      return []
    }

    try {
      const endpoint = `https://api.adzuna.com/v1/api/jobs/${this.country}/search/${page}?app_id=${this.appId}&app_key=${this.apiKey}&results_per_page=${limit}&what=${encodeURIComponent(query)}&where=${encodeURIComponent(location)}&content-type=application/json`
      const res = await fetch(endpoint, { signal: AbortSignal.timeout(10000) })
      if (!res.ok) {
        logger.warn(`[AdzunaProvider] HTTP ${res.status}: ${res.statusText}`)
        return []
      }

      const data = await res.json()
      const rawResults = Array.isArray(data?.results) ? data.results : []
      return rawResults.map((raw) => this.normalizeJob(raw)).filter(Boolean)
    } catch (err) {
      logger.warn(`[AdzunaProvider] Search error: ${err.message}`)
      return []
    }
  }

  normalizeJob(raw) {
    if (!raw || !raw.title) return null

    const postedDate = raw.created || raw.updated || new Date().toISOString()
    const freshness = evaluateJobFreshness(postedDate)

    const normalized = {
      externalJobId: String(raw.id || `adzuna-${Math.random()}`),
      title: raw.title.replace(/<\/?[^>]+(>|$)/g, ''),
      company: raw.company?.display_name || 'Confidential',
      location: raw.location?.display_name || 'Remote / Unspecified',
      isRemote: Boolean(
        raw.title.toLowerCase().includes('remote') ||
        raw.description?.toLowerCase().includes('remote') ||
        raw.location?.display_name?.toLowerCase().includes('remote')
      ),
      description: (raw.description || '').replace(/<\/?[^>]+(>|$)/g, ' ').trim(),
      applyUrl: raw.redirect_url || '',
      provider: 'adzuna',
      tier: 2,
      postedAt: postedDate,
      freshness,
      salary: {
        min: raw.salary_min || 0,
        max: raw.salary_max || 0,
        currency: 'USD'
      }
    }

    normalized.canonicalHash = computeJobCanonicalHash(normalized)
    return normalized
  }
}

export default new AdzunaProvider()
