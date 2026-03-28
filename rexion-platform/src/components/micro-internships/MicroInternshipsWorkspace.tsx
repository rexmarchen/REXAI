'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ApplyModal } from '@/components/micro-internships/ApplyModal'
import { GigCard } from '@/components/micro-internships/GigCard'
import { GigFilters, type GigFilterState } from '@/components/micro-internships/GigFilters'
import { useMatchedMicroGigs, useMicroGigs } from '@/hooks/useMicroGigs'
import type { MicroGigShape, SubscriptionPlan } from '@/types'
import styles from '@/styles/micro.module.css'

const defaultFilters: GigFilterState = {
  domain: 'all',
  duration: 'all',
  location: 'all',
  status: 'all',
  payMin: 8000,
  payMax: 25000,
}

function daysUntil(closingDate: string) {
  return Math.max(0, Math.ceil((new Date(closingDate).getTime() - Date.now()) / 86400000))
}

export function MicroInternshipsWorkspace({ plan }: { plan: SubscriptionPlan }) {
  const { data: gigs = [], isLoading } = useMicroGigs()
  const { data: matched = [], isLoading: isMatching } = useMatchedMicroGigs()
  const [tab, setTab] = useState<'matched' | 'browse'>(plan === 'free' ? 'browse' : 'matched')
  const [filters, setFilters] = useState<GigFilterState>(defaultFilters)
  const [selectedGig, setSelectedGig] = useState<MicroGigShape | null>(null)

  const filteredGigs = useMemo(
    () =>
      gigs.filter((gig) => {
        if (filters.domain !== 'all' && gig.domain !== filters.domain) return false
        if (filters.duration !== 'all' && gig.duration !== Number(filters.duration)) return false
        if (filters.location !== 'all' && gig.location !== filters.location) return false
        if (filters.status === 'open' && gig.status !== 'active') return false
        if (filters.status === 'closing' && daysUntil(gig.closingDate) > 3) return false
        if (gig.pay < filters.payMin || gig.pay > filters.payMax) return false
        return true
      }),
    [gigs, filters]
  )

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Micro-Internship Arena</h1>
          <p className={styles.copy}>
            Short paid gigs with real hiring intent. Browse freely, then use Pro to apply and move yourself into live evaluation loops.
          </p>
        </div>
        <div className={styles.tabs}>
          <button className={tab === 'matched' ? styles.button : styles.buttonSubtle} onClick={() => setTab('matched')}>
            AI Matched For You
          </button>
          <button className={tab === 'browse' ? styles.button : styles.buttonSubtle} onClick={() => setTab('browse')}>
            Browse All
          </button>
          <Link className={styles.buttonGhost} href="/dashboard/micro-internships/leaderboard">
            Leaderboard
          </Link>
        </div>
      </div>

      {tab === 'matched' ? (
        plan === 'free' ? (
          <div className={styles.notice}>
            <div className={styles.strong}>AI matching is part of Pro</div>
            <div className={styles.muted}>Upgrade to see ranked gig matches and explanations for why each sprint fits your profile.</div>
            <Link href="/dashboard/billing" className={styles.button}>
              Upgrade to Pro
            </Link>
          </div>
        ) : isMatching ? (
          <div className={styles.cards}>
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
          </div>
        ) : (
          <div className={styles.cards}>
            {matched.map((item) => (
              <GigCard
                key={item.gig.id}
                gig={item.gig}
                score={item.score}
                explanation={item.explanation}
                onApply={setSelectedGig}
              />
            ))}
          </div>
        )
      ) : (
        <div className={styles.grid}>
          <GigFilters filters={filters} onChange={setFilters} />
          <div className={styles.cards}>
            {isLoading ? (
              <>
                <div className={styles.skeleton} />
                <div className={styles.skeleton} />
              </>
            ) : filteredGigs.length ? (
              filteredGigs.map((gig) => <GigCard key={gig.id} gig={gig} onApply={setSelectedGig} />)
            ) : (
              <div className={styles.emptyState}>No gigs match those filters right now. Widen the criteria and check again.</div>
            )}
          </div>
        </div>
      )}

      <ApplyModal gig={selectedGig} open={Boolean(selectedGig)} plan={plan} onClose={() => setSelectedGig(null)} />
    </section>
  )
}
