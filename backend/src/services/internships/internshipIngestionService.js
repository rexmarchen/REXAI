import Internship from '../../models/Internship.js'
import { getActiveSources } from './sources/index.js'
import {
  isInternship,
  isWithin48Hours,
  generateContentHash,
  inferDomain
} from './internshipNormalizer.js'
import logger from '../../utils/logger.js'

let lastIngestionMetrics = {
  lastRunStartedAt: null,
  lastRunFinishedAt: null,
  durationMs: 0,
  fetched: 0,
  valid: 0,
  internships: 0,
  fresh48h: 0,
  duplicates: 0,
  inserted: 0,
  updated: 0,
  rejected: 0,
  errors: 0,
  sources: {}
}

/**
 * Runs the end-to-end ingestion pipeline across all active sources.
 * @param {Object} options
 * @returns {Promise<Object>} Telemetry metrics summary
 */
export async function runInternshipIngestion(options = {}) {
  const startedAt = Date.now()
  logger.info('[InternshipIngestion] Starting ingestion run...')

  const sources = options.sources || getActiveSources()
  const metrics = {
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: null,
    durationMs: 0,
    fetched: 0,
    valid: 0,
    internships: 0,
    fresh48h: 0,
    duplicates: 0,
    inserted: 0,
    updated: 0,
    rejected: 0,
    errors: 0,
    sources: {}
  }

  const seenHashesInThisRun = new Set()

  for (const source of sources) {
    const sourceName = source.name
    metrics.sources[sourceName] = {
      fetched: 0,
      inserted: 0,
      updated: 0,
      rejected: 0,
      errors: 0
    }

    try {
      logger.info(`[InternshipIngestion] Querying provider: ${sourceName}`)
      const rawJobs = await source.search({ query: 'internship', limit: 40 })
      metrics.sources[sourceName].fetched = rawJobs.length
      metrics.fetched += rawJobs.length

      for (const raw of rawJobs) {
        try {
          // 1. Basic validation
          if (!raw.title || !raw.applyUrl || !raw.companyName) {
            metrics.rejected += 1
            metrics.sources[sourceName].rejected += 1
            continue
          }
          metrics.valid += 1

          // 2. Internship Classification
          const classificationResult = isInternship(raw)
          if (!classificationResult.isInternship) {
            metrics.rejected += 1
            metrics.sources[sourceName].rejected += 1
            continue
          }
          metrics.internships += 1

          // 3. Timestamp Validation & Freshness Calculation
          const postedDate = raw.postedAt ? new Date(raw.postedAt) : null
          const hasValidDate = postedDate && !isNaN(postedDate.getTime())
          const isFresh = hasValidDate && isWithin48Hours(postedDate)
          if (isFresh) {
            metrics.fresh48h += 1
          }

          const freshnessStatus = isFresh
            ? 'fresh_48h'
            : (hasValidDate ? 'standard' : 'unknown')

          // 4. Content Hash & Deduplication
          const contentHash = generateContentHash(raw)
          if (seenHashesInThisRun.has(contentHash)) {
            metrics.duplicates += 1
            continue
          }
          seenHashesInThisRun.add(contentHash)

          // 5. Inferred Domain & Metadata
          const domain = raw.domain || inferDomain(raw.title, raw.description)

          // 6. MongoDB Upsert
          const docData = {
            externalId: raw.externalId || `${sourceName}-${contentHash.slice(0, 12)}`,
            source: sourceName,
            sourceJobId: raw.sourceJobId || '',
            title: raw.title.trim(),
            companyName: raw.companyName.trim(),
            companyLogo: raw.companyLogo || null,
            companyStage: raw.companyStage || 'Tech Employer',
            description: raw.description || '',
            employmentType: raw.employmentType || 'Internship',
            experienceLevel: raw.experienceLevel || 'Entry Level / Student',
            location: raw.location || 'Remote',
            country: raw.country || '',
            city: raw.city || '',
            isRemote: Boolean(raw.isRemote),
            isHybrid: Boolean(raw.isHybrid),
            domain,
            skills: Array.isArray(raw.skills) ? raw.skills : [],
            salaryMin: raw.salaryMin || null,
            salaryMax: raw.salaryMax || null,
            salaryText: raw.salaryText || 'Competitive Stipend',
            salaryCurrency: raw.salaryCurrency || 'USD',
            salaryPeriod: raw.salaryPeriod || 'month',
            postedAt: hasValidDate ? postedDate : new Date(),
            freshnessStatus,
            applyUrl: raw.applyUrl,
            sourceUrl: raw.sourceUrl || raw.applyUrl,
            isInternship: true,
            internshipClassification: classificationResult.classification,
            isActive: true,
            contentHash,
            lastSeenAt: new Date(),
            metadata: raw.metadata || {}
          }

          // Check for existing record by contentHash
          const existing = await Internship.findOne({ contentHash })

          if (existing) {
            await Internship.updateOne(
              { _id: existing._id },
              {
                $set: {
                  lastSeenAt: new Date(),
                  isActive: true,
                  applyUrl: docData.applyUrl,
                  freshnessStatus: docData.freshnessStatus
                }
              }
            )
            metrics.updated += 1
            metrics.sources[sourceName].updated += 1
          } else {
            await Internship.create({
              ...docData,
              firstSeenAt: new Date()
            })
            metrics.inserted += 1
            metrics.sources[sourceName].inserted += 1
          }
        } catch (itemErr) {
          logger.warn(`[InternshipIngestion] Error processing item from ${sourceName}: ${itemErr.message}`)
          metrics.errors += 1
          metrics.sources[sourceName].errors += 1
        }
      }
    } catch (sourceErr) {
      logger.error(`[InternshipIngestion] Provider ${sourceName} failed: ${sourceErr.message}`)
      metrics.errors += 1
      metrics.sources[sourceName].errors += 1
    }
  }

  const finishedAt = Date.now()
  metrics.finishedAt = new Date(finishedAt).toISOString()
  metrics.durationMs = finishedAt - startedAt

  lastIngestionMetrics = {
    lastRunStartedAt: metrics.startedAt,
    lastRunFinishedAt: metrics.finishedAt,
    durationMs: metrics.durationMs,
    ...metrics
  }

  logger.info(`[InternshipIngestion] Completed in ${metrics.durationMs}ms: ${metrics.inserted} inserted, ${metrics.updated} updated, ${metrics.fresh48h} fresh (<48h), ${metrics.duplicates} duplicates, ${metrics.errors} errors`)

  return metrics
}

export function getLastIngestionMetrics() {
  return lastIngestionMetrics
}

export default {
  runInternshipIngestion,
  getLastIngestionMetrics
}
