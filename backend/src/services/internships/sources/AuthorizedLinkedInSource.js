import { InternshipSource } from './InternshipSource.js'
import logger from '../../../utils/logger.js'

/**
 * Authorized LinkedIn Integration Adapter
 * 
 * STRICT COMPLIANCE RULES:
 * 1. Zero web scraping, zero Puppeteer/Playwright/Selenium browser automation.
 * 2. Disabled by default unless valid official LinkedIn Partner OAuth credentials 
 *    (LINKEDIN_ACCESS_TOKEN / LINKEDIN_PARTNER_CLIENT_ID) are configured.
 * 3. Never claim or fabricate LinkedIn data unless officially returned by authorized API.
 */
export class AuthorizedLinkedInSource extends InternshipSource {
  constructor(options = {}) {
    super('linkedin_authorized')
    this.clientId = options.clientId || process.env.LINKEDIN_CLIENT_ID || ''
    this.clientSecret = options.clientSecret || process.env.LINKEDIN_CLIENT_SECRET || ''
    this.accessToken = options.accessToken || process.env.LINKEDIN_ACCESS_TOKEN || ''
    this.apiVersion = options.apiVersion || process.env.LINKEDIN_VERSION || '202405'
    
    // Explicitly disabled by default unless explicitly enabled AND access token is present
    this.enabled = String(process.env.INTERNSHIP_SOURCE_LINKEDIN_ENABLED || 'false').toLowerCase() === 'true' && Boolean(this.accessToken)
  }

  async healthCheck() {
    if (!this.enabled) {
      return {
        healthy: false,
        status: 'disabled',
        message: 'Authorized LinkedIn partner integration is disabled. Official LinkedIn Partner API credentials are required to enable.'
      }
    }

    if (!this.accessToken) {
      return {
        healthy: false,
        status: 'unauthorized',
        message: 'Missing LINKEDIN_ACCESS_TOKEN. LinkedIn official partner access requires active authorized token.'
      }
    }

    try {
      // Check official LinkedIn REST API endpoint
      const res = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'LinkedIn-Version': this.apiVersion,
          'X-Restli-Protocol-Version': '2.0.0'
        },
        signal: AbortSignal.timeout(5000)
      })

      if (res.ok) {
        return {
          healthy: true,
          status: 'healthy',
          message: 'Official LinkedIn Partner API authorization active'
        }
      }

      if (res.status === 401 || res.status === 403) {
        return {
          healthy: false,
          status: 'unauthorized',
          message: 'LinkedIn access token expired or lacks job partner permissions'
        }
      }

      return {
        healthy: false,
        status: 'degraded',
        message: `LinkedIn API responded with HTTP ${res.status}`
      }
    } catch (err) {
      return {
        healthy: false,
        status: 'unreachable',
        message: `LinkedIn API connection error: ${err.message}`
      }
    }
  }

  async search(params = {}) {
    if (!this.enabled || !this.accessToken) {
      // Do NOT attempt unauthorized access or unofficial scraping
      return []
    }

    try {
      // Official LinkedIn Job Search API query (when authorized)
      const url = new URL('https://api.linkedin.com/v2/jobPostings')
      url.searchParams.set('q', 'keywords')
      url.searchParams.set('keywords', params.query || 'internship')
      url.searchParams.set('count', String(Math.min(params.limit || 20, 50)))

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'LinkedIn-Version': this.apiVersion,
          'X-Restli-Protocol-Version': '2.0.0',
          Accept: 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      })

      if (!res.ok) {
        logger.warn(`[AuthorizedLinkedInSource] API query returned HTTP ${res.status}`)
        return []
      }

      const data = await res.json()
      const elements = Array.isArray(data?.elements) ? data.elements : []
      const results = []

      for (const item of elements) {
        const postedDate = item.listedAt ? new Date(item.listedAt) : null
        results.push({
          externalId: `li-${item.id}`,
          source: 'linkedin_authorized',
          sourceJobId: String(item.id),
          title: item.title,
          companyName: item.companyDetails?.companyName || 'Employer',
          description: item.description?.text || '',
          employmentType: 'Internship',
          experienceLevel: 'Entry Level / Student',
          location: item.formattedLocation || 'Remote',
          country: item.countryCode || '',
          city: item.city || '',
          isRemote: item.workplaceType === 'remote',
          isHybrid: item.workplaceType === 'hybrid',
          skills: item.skills || [],
          postedAt: postedDate && !isNaN(postedDate.getTime()) ? postedDate.toISOString() : null,
          applyUrl: item.applyMethod?.companyApplyUrl || `https://www.linkedin.com/jobs/view/${item.id}`,
          sourceUrl: `https://www.linkedin.com/jobs/view/${item.id}`,
          metadata: {
            linkedInId: item.id,
            trackingId: item.trackingId
          }
        })
      }

      return results
    } catch (err) {
      logger.error(`[AuthorizedLinkedInSource] Query exception: ${err.message}`)
      return []
    }
  }
}

export default AuthorizedLinkedInSource
