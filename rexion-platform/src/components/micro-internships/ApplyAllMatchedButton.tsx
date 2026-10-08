'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { ApplicationBatchShape, MicroGigShape } from '@/types'
import styles from '@/styles/micro.module.css'

export function ApplyAllMatchedButton({ gigs }: { gigs: MicroGigShape[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [batch, setBatch] = useState<ApplicationBatchShape | null>(null)

  const submit = async () => {
    if (!gigs.length) {
      toast.error('No matched gigs available right now.')
      return
    }

    setIsSubmitting(true)
    const response = await fetch('/api/micro-gigs/apply-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gigIds: gigs.map((gig) => gig.id),
      }),
    })

    const payload = (await response.json()) as {
      error?: string
      batch?: ApplicationBatchShape
      summary?: {
        total: number
        successful: number
        skipped: number
        failed: number
      }
    }

    if (!response.ok || !payload.batch || !payload.summary) {
      toast.error(payload.error || 'Batch apply failed.')
      setIsSubmitting(false)
      return
    }

    setBatch(payload.batch)
    toast.success(
      `Applied to ${payload.summary.successful} gigs. ${payload.summary.skipped} skipped.`
    )
    setIsSubmitting(false)
  }

  return (
    <section className={styles.heroPanel}>
      <div className={styles.cardMeta}>
        <div>
          <div className={styles.strong}>Apply all matched gigs</div>
          <div className={styles.muted}>
            Uses your profile resume plus an AI-generated two-sentence pitch for each matched sprint.
          </div>
        </div>
        <button className={styles.button} onClick={submit} disabled={isSubmitting || !gigs.length}>
          {isSubmitting ? 'Applying...' : `Apply All (${gigs.length})`}
        </button>
      </div>

      {batch ? (
        <div className={styles.notice}>
          <div className={styles.strong}>Batch complete</div>
          <div className={styles.inlineMeta}>
            <span className={styles.skillTag}>{batch.totalJobsProcessed} processed</span>
            <span className={styles.skillTag}>{batch.successfulApplications} applied</span>
            <span className={styles.skillTag}>{batch.skippedApplications} skipped</span>
            <span className={styles.skillTag}>{batch.failedApplications} failed</span>
          </div>
          <div className={styles.muted}>
            A confirmation summary is prepared through your configured email delivery setup.
          </div>
        </div>
      ) : null}
    </section>
  )
}
