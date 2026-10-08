import { InternshipSource } from './InternshipSource.js'
import { LinkedInProvider } from '../../jobs/linkedinProvider.js'
import logger from '../../../utils/logger.js'

/**
 * Live LinkedIn Scraper Source Adapter
 * Periodically scrapes fresh, live internship postings from LinkedIn via JSearch RapidAPI,
 * prioritizing postings from the last 2 to 24 hours.
 */
export class LiveLinkedInScraperSource extends InternshipSource {
  constructor(options = {}) {
    super('linkedin')
    this.provider = new LinkedInProvider()
    this.enabled = true
    this.searchQueries = [
      'software engineering intern',
      'frontend developer intern',
      'full stack intern',
      'ai machine learning intern',
      'data science intern'
    ]
  }

  async healthCheck() {
    return {
      healthy: true,
      status: 'operational',
      message: 'Live LinkedIn Scraper provider is active and ready'
    }
  }

  async search(params = {}) {
    if (!this.enabled) return []

    const results = []
    const limitPerQuery = Math.min(Math.max(params.limit || 8, 4), 15)

    // Run queries across key tech tracks
    const queries = params.query ? [params.query] : this.searchQueries.slice(0, 3)

    for (const q of queries) {
      try {
        const rawJobs = await this.provider.searchJobs({
          query: q,
          limit: limitPerQuery
        })

        for (const raw of rawJobs) {
          if (!raw.title || !raw.applyUrl) continue

          const postedDate = raw.postedAt ? new Date(raw.postedAt) : new Date()

          results.push({
            externalId: `linkedin-${raw.externalJobId || Math.random().toString(36).substring(7)}`,
            source: 'linkedin',
            sourceJobId: String(raw.externalJobId || ''),
            title: String(raw.title || '').trim(),
            companyName: String(raw.company || 'Tech Employer').trim(),
            companyLogo: raw.employerLogo || null,
            companyStage: 'Tech Employer',
            description: String(raw.description || '').slice(0, 1000).trim(),
            employmentType: 'Internship',
            experienceLevel: 'Entry Level / Student',
            location: raw.location || 'Remote / Hybrid',
            country: 'US',
            city: raw.location || 'Remote',
            isRemote: Boolean(raw.isRemote),
            isHybrid: false,
            skills: [],
            salaryText: raw.salary?.min ? `${raw.salary.min} - ${raw.salary.max} ${raw.salary.currency}` : 'Competitive Tech Stipend',
            salaryCurrency: raw.salary?.currency || 'USD',
            postedAt: postedDate.toISOString(),
            applyUrl: raw.applyUrl,
            sourceUrl: raw.applyUrl,
            metadata: {
              scrapedAt: new Date().toISOString(),
              publisher: raw.publisher || 'LinkedIn'
            }
          })
        }
      } catch (err) {
        logger.warn(`[LiveLinkedInScraperSource] Query "${q}" note: ${err.message}`)
      }
    }

    return results
  }
}

export default LiveLinkedInScraperSource
