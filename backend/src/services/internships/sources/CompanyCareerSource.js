import { InternshipSource } from './InternshipSource.js'
import logger from '../../../utils/logger.js'

const TARGET_ATS_BOARDS = [
  { type: 'greenhouse', token: 'duolingo', name: 'Duolingo', stage: 'Public EdTech Titan' },
  { type: 'greenhouse', token: 'figma', name: 'Figma', stage: 'Design Tech Leader' },
  { type: 'greenhouse', token: 'lyft', name: 'Lyft', stage: 'Public Tech Giant' },
  { type: 'greenhouse', token: 'datadog', name: 'Datadog', stage: 'Enterprise Cloud' },
  { type: 'greenhouse', token: 'discord', name: 'Discord', stage: 'High-Growth Tech' },
  { type: 'greenhouse', token: 'twitch', name: 'Twitch', stage: 'Amazon Subsidiary' },
  { type: 'greenhouse', token: 'scaleai', name: 'Scale AI', stage: 'AI Unicorn' },
  { type: 'greenhouse', token: 'canonical', name: 'Canonical (Ubuntu)', stage: 'Open Source Leader' },
  { type: 'greenhouse', token: 'affirm', name: 'Affirm', stage: 'Fintech Leader' },
  { type: 'greenhouse', token: 'flexport', name: 'Flexport', stage: 'Logistics Tech' },
  { type: 'greenhouse', token: 'brex', name: 'Brex', stage: 'Fintech Unicorn' },
  { type: 'greenhouse', token: 'carta', name: 'Carta', stage: 'Fintech Platform' },
  { type: 'greenhouse', token: 'checkr', name: 'Checkr', stage: 'HR Tech Unicorn' },
  { type: 'greenhouse', token: 'elastic', name: 'Elastic', stage: 'Search Tech Giant' },
  { type: 'lever', token: 'palantir', name: 'Palantir', stage: 'Data Enterprise' }
]

export class CompanyCareerSource extends InternshipSource {
  constructor(options = {}) {
    super('company_career')
    this.boards = options.boards || TARGET_ATS_BOARDS
    this.enabled = String(process.env.INTERNSHIP_SOURCE_COMPANY_CAREER_ENABLED ?? 'true').toLowerCase() !== 'false'
  }

  async healthCheck() {
    if (!this.enabled) {
      return { healthy: false, status: 'disabled', message: 'Company career source is disabled' }
    }
    try {
      const testRes = await fetch('https://boards-api.greenhouse.io/v1/boards/duolingo/jobs', {
        signal: AbortSignal.timeout(5000)
      })
      if (testRes.ok) {
        return { healthy: true, status: 'healthy', message: `Active across ${this.boards.length} company career ATS boards` }
      }
      return { healthy: false, status: 'degraded', message: `Greenhouse returned HTTP ${testRes.status}` }
    } catch (err) {
      return { healthy: false, status: 'unreachable', message: err.message }
    }
  }

  async search(params = {}) {
    if (!this.enabled) return []

    const results = []

    for (const board of this.boards) {
      try {
        if (board.type === 'greenhouse') {
          const url = `https://boards-api.greenhouse.io/v1/boards/${board.token}/jobs?content=true`
          const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
          if (!res.ok) continue

          const data = await res.json()
          const jobs = Array.isArray(data?.jobs) ? data.jobs : []

          for (const job of jobs) {
            const postedDate = job.updated_at ? new Date(job.updated_at) : (job.created_at ? new Date(job.created_at) : null)
            const locName = job.location?.name || 'Remote / Hybrid'

            results.push({
              externalId: `greenhouse-${board.token}-${job.id}`,
              source: 'greenhouse',
              sourceJobId: String(job.id),
              title: String(job.title || '').trim(),
              companyName: board.name,
              companyLogo: null,
              companyStage: board.stage,
              description: String(job.content || '').replace(/<[^>]+>/g, ' ').slice(0, 1000).trim(),
              employmentType: 'Internship',
              experienceLevel: 'Entry Level / Student',
              location: locName,
              country: /india/i.test(locName) ? 'IN' : (/uk|london|england/i.test(locName) ? 'GB' : 'US'),
              city: locName.split(/[,•]/)[0]?.trim() || '',
              isRemote: /\bremote\b/i.test(locName),
              isHybrid: /\bhybrid\b/i.test(locName),
              skills: [],
              salaryText: 'Competitive Tech Stipend',
              salaryCurrency: 'USD',
              postedAt: postedDate && !isNaN(postedDate.getTime()) ? postedDate.toISOString() : null,
              applyUrl: job.absolute_url || `https://boards.greenhouse.io/${board.token}/jobs/${job.id}`,
              sourceUrl: `https://boards.greenhouse.io/${board.token}/jobs/${job.id}`,
              metadata: {
                boardToken: board.token,
                atsProvider: 'greenhouse',
                internalJobId: job.id
              }
            })
          }
        } else if (board.type === 'lever') {
          const url = `https://api.lever.co/v0/postings/${board.token}?mode=json`
          const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
          if (!res.ok) continue

          const data = await res.json()
          const postings = Array.isArray(data) ? data : []
          for (const post of postings) {
            const postedDate = post.createdAt ? new Date(post.createdAt) : null
            const locName = post.categories?.location || 'Remote'

            results.push({
              externalId: `lever-${board.token}-${post.id}`,
              source: 'lever',
              sourceJobId: String(post.id),
              title: String(post.text || '').trim(),
              companyName: board.name,
              companyLogo: null,
              companyStage: board.stage,
              description: String(post.descriptionPlain || '').slice(0, 1000).trim(),
              employmentType: post.categories?.commitment || 'Internship',
              experienceLevel: 'Entry Level / Student',
              location: locName,
              country: 'US',
              city: locName,
              isRemote: post.workplaceType === 'remote' || /\bremote\b/i.test(locName),
              isHybrid: post.workplaceType === 'hybrid',
              skills: [],
              salaryText: 'Competitive Tech Stipend',
              salaryCurrency: 'USD',
              postedAt: postedDate && !isNaN(postedDate.getTime()) ? postedDate.toISOString() : null,
              applyUrl: post.hostedUrl || post.applyUrl || '',
              sourceUrl: post.hostedUrl || '',
              metadata: {
                boardToken: board.token,
                atsProvider: 'lever',
                team: post.categories?.team
              }
            })
          }
        }
      } catch (err) {
        logger.warn(`[CompanyCareerSource] Board ${board.token} fetch error: ${err.message}`)
      }
    }

    return results
  }
}

export default CompanyCareerSource
