'use client'

import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import type { MicroGigShape } from '@/types'
import styles from '@/styles/micro.module.css'
import { AIMatchScore } from '@/components/micro-internships/AIMatchScore'

function daysLeft(closingDate: string) {
  return Math.max(0, Math.ceil((new Date(closingDate).getTime() - Date.now()) / 86400000))
}

export function GigCard({
  gig,
  onApply,
  score,
  explanation,
}: {
  gig: MicroGigShape
  onApply: (gig: MicroGigShape) => void
  score?: number
  explanation?: string
}) {
  const closesIn = daysLeft(gig.closingDate)

  return (
    <article className={styles.card}>
      <div className={styles.cardMeta}>
        <div className={styles.companyRow}>
          <div>
            <div className={styles.strong}>{gig.company.name}</div>
            <div className={styles.muted}>
              {gig.company.rating ? `${gig.company.rating} rating` : 'Hiring partner'} · {gig.company.location || 'Remote'}
            </div>
          </div>
        </div>
        {gig.isPreHiring ? <span className={styles.badge}>Pre-Hiring</span> : null}
      </div>

      <div>
        <div className={styles.strong}>{gig.title}</div>
        <div className={styles.copy}>{gig.description}</div>
      </div>

      <div className={styles.inlineMeta}>
        <span>{gig.duration} days</span>
        <span>{formatCurrency(gig.pay)}</span>
        <span>{gig.location}</span>
      </div>

      <div className={styles.skillRow}>
        {gig.skills.map((skill) => (
          <span key={skill} className={styles.skillTag}>
            {skill}
          </span>
        ))}
      </div>

      <div className={styles.inlineMeta}>
        <span>{gig.spotsFilled} applied</span>
        <span className={closesIn <= 3 ? `${styles.statusTag} ${styles.urgentTag}` : styles.statusTag}>
          Closes in {closesIn} days
        </span>
      </div>

      {typeof score === 'number' ? <AIMatchScore score={score} explanation={explanation} /> : null}

      <div className={styles.cardActions}>
        <button className={styles.button} onClick={() => onApply(gig)}>
          Apply Now
        </button>
        <Link className={styles.buttonGhost} href={`/dashboard/micro-internships/${gig.id}`}>
          View Detail
        </Link>
      </div>
    </article>
  )
}
