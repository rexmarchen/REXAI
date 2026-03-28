'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import type { MicroGigShape, SubscriptionPlan } from '@/types'
import styles from '@/styles/micro.module.css'
import { ApplyModal } from '@/components/micro-internships/ApplyModal'

const tabs = ['overview', 'deliverables', 'company', 'alumni'] as const

export function GigDetail({
  gig,
  plan,
}: {
  gig: MicroGigShape
  plan: SubscriptionPlan
}) {
  const [tab, setTab] = useState<(typeof tabs)[number]>('overview')
  const [open, setOpen] = useState(false)
  const spotsLeft = gig.spotsTotal - gig.spotsFilled

  return (
    <>
      <section className={styles.detailLayout}>
        <div className={styles.detailBody}>
          <div className={styles.heroPanel}>
            <div className={styles.detailHeader}>
              <div>
                <div className={styles.strong}>{gig.company.name}</div>
                <div className={styles.muted}>
                  {gig.company.rating ? `${gig.company.rating} rating` : 'Hiring partner'} ·{' '}
                  {gig.company.location || 'Remote'}
                </div>
              </div>
              {gig.isPreHiring ? <span className={styles.badge}>Active Hiring</span> : null}
            </div>

            <h1 className={styles.title}>{gig.title}</h1>

            <div className={styles.detailTabs}>
              {tabs.map((item) => (
                <button
                  key={item}
                  className={tab === item ? styles.button : styles.buttonSubtle}
                  onClick={() => setTab(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className={styles.tagRow}>
              <span className={styles.statusTag}>{gig.duration} days</span>
              <span className={styles.statusTag}>{formatCurrency(gig.pay)}</span>
              <span className={styles.statusTag}>{gig.location}</span>
            </div>
          </div>

          {tab === 'overview' ? (
            <div className={styles.card}>
              <div className={styles.copy}>{gig.description}</div>
              <div className={styles.strong}>Skills you will use</div>
              <div className={styles.skillRow}>
                {gig.skills.map((skill) => (
                  <span key={skill} className={styles.skillTag}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {tab === 'deliverables' ? (
            <div className={styles.card}>
              <div className={styles.strong}>What you will build</div>
              <ul>
                <li>Ship the core outcome described in the brief within {gig.duration} days.</li>
                <li>Share updates clearly and hand over working output with notes.</li>
                <li>Leave behind a clean implementation the full-time team can extend.</li>
              </ul>
            </div>
          ) : null}

          {tab === 'company' ? (
            <div className={styles.card}>
              <div className={styles.strong}>Company context</div>
              <div className={styles.copy}>
                {gig.company.name} is using this micro-internship as a high-signal way to evaluate shipping quality before full-time hiring decisions.
              </div>
            </div>
          ) : null}

          {tab === 'alumni' ? (
            <div className={styles.card}>
              <div className={styles.strong}>People who did this gig</div>
              <div className={styles.notice}>3 out of 5 recent completions converted to full-time offers here.</div>
            </div>
          ) : null}
        </div>

        <aside className={styles.applyBox}>
          <div className={styles.strong}>{formatCurrency(gig.pay)}</div>
          <div className={styles.muted}>{gig.duration} days · {gig.location}</div>
          <div className={styles.muted}>Spots left: {spotsLeft} of {gig.spotsTotal}</div>
          <button className={styles.button} onClick={() => setOpen(true)}>
            Apply Now
          </button>
          <button className={styles.buttonGhost}>Save Gig</button>
          {gig.isPreHiring ? (
            <div className={styles.notice}>
              Pre-Hiring Signal: this company currently has {gig.activeRoles || 1} open full-time roles.
            </div>
          ) : null}
          <div className={styles.muted}>REXION takes 10% on completion. You receive {formatCurrency(Math.round(gig.pay * 0.9))}.</div>
        </aside>
      </section>

      <ApplyModal gig={gig} open={open} plan={plan} onClose={() => setOpen(false)} />
    </>
  )
}
