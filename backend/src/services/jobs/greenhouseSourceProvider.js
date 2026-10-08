import { JobProviderInterface } from './jobProviderInterface.js'
import { evaluateJobFreshness, computeJobCanonicalHash } from './jobFreshnessEngine.js'
import logger from '../../utils/logger.js'

const DEFAULT_GREENHOUSE_BOARDS = [
  'airbnb', 'figma', 'anthropic', 'scaleai',
  'cloudflare', 'fingerprint', 'datadog', 'elastic', 'reddit'
]

export class GreenhouseSourceProvider extends JobProviderInterface {
  constructor(boards = DEFAULT_GREENHOUSE_BOARDS) {
    super('greenhouse')
    this.boards = boards
  }

  async searchJobs({ query = '', location = '', domain = '', limit = 30 } = {}) {
    const results = []
    const queryLower = query.toLowerCase()

    for (const board of this.boards) {
      if (results.length >= limit) break
      try {
        const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`, {
          signal: AbortSignal.timeout(8000)
        })
        if (!res.ok) continue

        const data = await res.json()
        const rawJobs = Array.isArray(data?.jobs) ? data.jobs : []

        for (const raw of rawJobs) {
          const normalized = this.normalizeJob(raw, board)
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
        logger.debug(`[GreenhouseProvider] Board "${board}" fetch failed: ${err.message}`)
      }
    }

    return results
  }

  normalizeJob(raw, board = 'greenhouse') {
    if (!raw || !raw.id || !raw.title) return null

    const postedDate = raw.updated_at || new Date().toISOString()
    const freshness = evaluateJobFreshness(postedDate)
    const company = board.charAt(0).toUpperCase() + board.slice(1)
    const loc = raw.location?.name || 'Remote / Multiple Locations'

    const normalized = {
      externalJobId: `greenhouse-${board}-${raw.id}`,
      title: raw.title.trim(),
      company,
      location: loc,
      isRemote: Boolean(
        raw.title.toLowerCase().includes('remote') ||
        loc.toLowerCase().includes('remote') ||
        (raw.content && raw.content.toLowerCase().includes('remote'))
      ),
      description: (raw.content || '').replace(/<\/?[^>]+(>|$)/g, ' ').slice(0, 1500).trim(),
      applyUrl: raw.absolute_url || `https://boards.greenhouse.io/${board}/jobs/${raw.id}`,
      provider: 'greenhouse',
      tier: 1, // Tier 1: direct ATS
      postedAt: postedDate,
      freshness
    }

    normalized.canonicalHash = computeJobCanonicalHash(normalized)
    return normalized
  }
}

export default new GreenhouseSourceProvider()
