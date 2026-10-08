'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { PeopleTab } from '@/components/outreach/PeopleTab'
import { CampaignsTab } from '@/components/outreach/CampaignsTab'

type Tab = 'people' | 'campaigns'

interface Metrics {
  campaigns: number
  contacts: number
  replies: number
}

// Stub — replace with API call: GET /api/outreach/metrics
async function fetchMetrics(): Promise<Metrics> {
  await new Promise((r) => setTimeout(r, 300))
  return { campaigns: 12, contacts: 248, replies: 18 }
}

export default function OutreachPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab') as Tab | null
  const [tab, setTab] = useState<Tab>(tabParam === 'campaigns' ? 'campaigns' : 'people')
  const [metrics, setMetrics] = useState<Metrics | null>(null)

  useEffect(() => {
    void fetchMetrics().then(setMetrics)
  }, [])

  const switchTab = (t: Tab) => {
    setTab(t)
    const url = new URL(window.location.href)
    if (t === 'campaigns') url.searchParams.set('tab', 'campaigns')
    else url.searchParams.delete('tab')
    router.replace(url.pathname + url.search)
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'people', label: 'People' },
    { id: 'campaigns', label: 'Campaigns' },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Outreach</h1>
          <p className="mt-1 text-sm text-[var(--text-dim)]">
            Find the right people, personalize your message, and start meaningful conversations.
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/outreach/new')}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--blue)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus size={15} />
          New Campaign
        </button>
      </div>

      {/* Metrics strip */}
      <div className="flex flex-wrap gap-6 border-b border-white/8 pb-5">
        {metrics
          ? [
              { label: 'Campaigns', value: metrics.campaigns },
              { label: 'Contacts', value: metrics.contacts },
              { label: 'Replies', value: metrics.replies },
            ].map((m) => (
              <div key={m.label}>
                <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)]">
                  {m.label}
                </p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums text-white">{m.value}</p>
              </div>
            ))
          : Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-2.5 w-16 animate-pulse rounded bg-white/8" />
                <div className="h-5 w-8 animate-pulse rounded bg-white/8" />
              </div>
            ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-white/8 bg-white/[0.03] p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            className={`relative rounded-md px-4 py-1.5 text-xs font-medium transition ${
              tab === t.id ? 'text-white' : 'text-[var(--text-dim)] hover:text-white'
            }`}
          >
            {tab === t.id && (
              <motion.span
                layoutId="outreachTab"
                className="absolute inset-0 rounded-md bg-white/10"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'people' ? <PeopleTab /> : <CampaignsTab />}
      </div>
    </div>
  )
}
