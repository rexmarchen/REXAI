import { AdzunaInternshipSource } from './AdzunaInternshipSource.js'
import { CompanyCareerSource } from './CompanyCareerSource.js'
import { AuthorizedLinkedInSource } from './AuthorizedLinkedInSource.js'
import { LiveLinkedInScraperSource } from './LiveLinkedInScraperSource.js'

export {
  AdzunaInternshipSource,
  CompanyCareerSource,
  AuthorizedLinkedInSource,
  LiveLinkedInScraperSource
}

export function getActiveSources() {
  const sources = [
    new LiveLinkedInScraperSource(),
    new CompanyCareerSource()
  ]
  return sources
}

export default {
  getActiveSources,
  AdzunaInternshipSource,
  CompanyCareerSource,
  AuthorizedLinkedInSource,
  LiveLinkedInScraperSource
}
