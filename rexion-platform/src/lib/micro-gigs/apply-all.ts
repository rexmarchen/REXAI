import { createGigApplicationRecord, createApplicationBatchRecord, findExistingGigApplication, findUserById, getGigById } from '@/lib/server-data'
import { sendMicroGigApplyAllSummaryEmail } from '@/lib/micro-gigs/email'
import { buildMicroGigPitch } from '@/lib/micro-gigs/pitch'
import type { ApplicationBatchItemShape, ApplicationBatchShape } from '@/types'

export async function applyToMicroGigsBatch(input: { userId: string; gigIds: string[] }) {
  const uniqueGigIds = Array.from(new Set(input.gigIds.filter(Boolean)))
  const startDate = new Date().toISOString().slice(0, 10)
  const results: ApplicationBatchItemShape[] = []

  for (const gigId of uniqueGigIds) {
    const gig = await getGigById(gigId)
    if (!gig) {
      results.push({
        targetId: gigId,
        title: 'Unknown gig',
        companyName: 'Unavailable',
        status: 'failed',
        note: 'Gig not found.',
      })
      continue
    }

    const existingApplication = await findExistingGigApplication({
      userId: input.userId,
      gigId,
    })

    if (existingApplication) {
      results.push({
        targetId: gig.id,
        title: gig.title,
        companyName: gig.company.name,
        status: 'skipped',
        note: 'Already applied earlier.',
      })
      continue
    }

    try {
      await createGigApplicationRecord({
        gigId: gig.id,
        userId: input.userId,
        resumeUrl: 'profile-resume.pdf',
        pitch: buildMicroGigPitch(gig),
        startDate,
      })

      results.push({
        targetId: gig.id,
        title: gig.title,
        companyName: gig.company.name,
        status: 'applied',
      })
    } catch (error) {
      results.push({
        targetId: gig.id,
        title: gig.title,
        companyName: gig.company.name,
        status: 'failed',
        note: error instanceof Error ? error.message : 'Application failed.',
      })
    }
  }

  const batch = await createApplicationBatchRecord({
    userId: input.userId,
    source: 'micro-gigs',
    results,
  })

  const user = await findUserById(input.userId)
  if (user?.email) {
    await sendMicroGigApplyAllSummaryEmail(user, batch)
  }

  return batch
}

export function summarizeApplicationBatch(batch: ApplicationBatchShape) {
  return {
    total: batch.totalJobsProcessed,
    successful: batch.successfulApplications,
    skipped: batch.skippedApplications,
    failed: batch.failedApplications,
  }
}
