import { InternshipSource } from './InternshipSource.js'
import logger from '../../../utils/logger.js'

export class AdzunaInternshipSource extends InternshipSource {
  constructor(options = {}) {
    super('adzuna')
    this.appId = options.appId || process.env.ADZUNA_APP_ID || '98057833'
    this.appKey = options.appKey || process.env.ADZUNA_APP_KEY || 'e4ed48a19b6767d3fa306c0899b26197'
    this.baseUrl = (options.baseUrl || process.env.ADZUNA_BASE_URL || 'https://api.adzuna.com/v1/api').replace(/\/+$/, '')
    this.countries = options.countries || ['in', 'us', 'gb']
    this.enabled = String(process.env.INTERNSHIP_SOURCE_ADZUNA_ENABLED ?? 'true').toLowerCase() !== 'false'
  }

  async healthCheck() {
    if (!this.enabled) {
      return { healthy: false, status: 'disabled', message: 'Adzuna provider is disabled via configuration' }
    }
    if (!this.appId || !this.appKey) {
      return { healthy: false, status: 'unauthorized', message: 'Missing Adzuna APP_ID or APP_KEY' }
    }
    try {
      const url = `${this.baseUrl}/jobs/in/search/1?app_id=${this.appId}&app_key=${this.appKey}&results_per_page=1&what=internship`
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
      if (res.ok) {
        return { healthy: true, status: 'healthy', message: 'Adzuna API connection active' }
      }
      if (res.status === 429) {
        return { healthy: false, status: 'rate_limited', message: 'Adzuna API rate limit exceeded' }
      }
      return { healthy: false, status: 'degraded', message: `Adzuna returned HTTP ${res.status}` }
    } catch (err) {
      return { healthy: false, status: 'unreachable', message: err.message }
    }
  }

  async search(params = {}) {
    if (!this.enabled || !this.appId || !this.appKey) {
      logger.warn('[AdzunaInternshipSource] Skipping search - provider not enabled or missing credentials')
      return []
    }

    const query = params.query || 'internship'
    const limit = Math.min(params.limit || 20, 50)
    const page = params.page || 1
    const results = []

    for (const country of this.countries) {
      try {
        const searchUrl = new URL(`${this.baseUrl}/jobs/${country}/search/${page}`)
        searchUrl.searchParams.set('app_id', this.appId)
        searchUrl.searchParams.set('app_key', this.appKey)
        searchUrl.searchParams.set('what', query)
        searchUrl.searchParams.set('results_per_page', String(limit))
        searchUrl.searchParams.set('sort_by', 'date')
        searchUrl.searchParams.set('content-type', 'application/json')

        if (params.location && country !== 'in') {
          searchUrl.searchParams.set('where', params.location)
        }

        const res = await fetch(searchUrl.toString(), {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(10000)
        })

        if (!res.ok) {
          logger.warn(`[AdzunaInternshipSource] ${country} search failed: HTTP ${res.status}`)
          continue
        }

        const data = await res.json()
        const items = Array.isArray(data?.results) ? data.results : []

        for (const item of items) {
          const postedDate = item.created ? new Date(item.created) : null
          results.push({
            externalId: `adzuna-${country}-${item.id}`,
            source: 'adzuna',
            sourceJobId: String(item.id),
            title: String(item.title || 'Internship').trim(),
            companyName: String(item.company?.display_name || 'Technology Company').trim(),
            companyLogo: null,
            description: String(item.description || '').trim(),
            employmentType: [item.contract_time, item.contract_type].filter(Boolean).join(' ') || 'Internship',
            experienceLevel: 'Entry Level / Student',
            location: item.location?.display_name || 'Location Not Specified',
            country: country.toUpperCase(),
            city: Array.isArray(item.location?.area) ? item.location.area[0] : '',
            isRemote: /\bremote\b/i.test(`${item.title} ${item.description} ${item.location?.display_name}`),
            isHybrid: /\bhybrid\b/i.test(`${item.title} ${item.description}`),
            skills: [],
            salaryMin: item.salary_min ? Math.round(item.salary_min) : null,
            salaryMax: item.salary_max ? Math.round(item.salary_max) : null,
            salaryText: item.salary_min ? `${Math.round(item.salary_min).toLocaleString()} ${country === 'in' ? 'INR' : 'USD'}` : 'Competitive Stipend',
            salaryCurrency: country === 'in' ? 'INR' : 'USD',
            salaryPeriod: 'month',
            postedAt: postedDate && !isNaN(postedDate.getTime()) ? postedDate.toISOString() : null,
            applyUrl: item.redirect_url || '',
            sourceUrl: item.redirect_url || '',
            metadata: {
              adzunaCategory: item.category?.label,
              latitude: item.latitude,
              longitude: item.longitude
            }
          })
        }
      } catch (err) {
        logger.warn(`[AdzunaInternshipSource] Country ${country} fetch error: ${err.message}`)
      }
    }

    return results
  }
}

export default AdzunaInternshipSource
