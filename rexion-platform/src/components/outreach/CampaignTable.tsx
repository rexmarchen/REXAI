'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Send } from 'lucide-react'
import type { Campaign } from '@/types/outreach'
import { campaignService } from '@/lib/outreach/campaign-service'
import { CampaignTableSkeleton } from './SkeletonLoader'
import { ErrorState } from './ErrorState'
import { EmptyState } from './EmptyState'

const statusConfig: Record<
  Campaign['status'],
  { label: string; className: string }
> = {
  draft: { label: 'Draft', className: 'bg-white/5 text-[var(--text-dim)] border-white/10' },
  active: { label: 'Active', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  completed: { label: 'Completed', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  paused: { label: 'Paused', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  failed: { label: 'Failed', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function CampaignTable() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const load = async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const data = await campaignService.getAll()
      setCampaigns(data)
    } catch {
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  if (isLoading) return <CampaignTableSkeleton />
  if (isError) return <ErrorState title="Unable to load campaigns" onRetry={load} />
  if (campaigns.length === 0) {
    return (
      <EmptyState
        icon={Send}
        title="No campaigns yet"
        description="Start your first outreach campaign."
        action={{ label: 'New campaign', onClick: () => router.push('/dashboard/outreach/new') }}
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/8 bg-[#0b0e13]">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-white/8 px-4 py-2">
        <span className="flex-1 text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)]">Campaign</span>
        <span className="hidden w-24 shrink-0 text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)] sm:block">Created</span>
        <span className="hidden w-20 shrink-0 text-center text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)] md:block">Recipients</span>
        <span className="hidden w-20 shrink-0 text-center text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)] lg:block">Delivered</span>
        <span className="hidden w-16 shrink-0 text-center text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)] lg:block">Replies</span>
        <span className="w-24 shrink-0 text-right text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)]">Status</span>
      </div>

      {/* Rows */}
      {campaigns.map((campaign) => {
        const sc = statusConfig[campaign.status]
        return (
          <button
            key={campaign.id}
            onClick={() => router.push(`/dashboard/outreach/campaign/${campaign.id}`)}
            className="group flex w-full items-center gap-4 border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/[0.03] last:border-b-0"
          >
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-white group-hover:text-[var(--blue)]">
                {campaign.name}
              </p>
            </div>
            <span className="hidden w-24 shrink-0 text-xs text-[var(--text-dim)] sm:block">
              {formatDate(campaign.createdAt)}
            </span>
            <span className="hidden w-20 shrink-0 text-center text-xs tabular-nums text-[var(--text-dim)] md:block">
              {campaign.recipients}
            </span>
            <span className="hidden w-20 shrink-0 text-center text-xs tabular-nums text-[var(--text-dim)] lg:block">
              {campaign.delivered}
            </span>
            <span className="hidden w-16 shrink-0 text-center text-xs tabular-nums text-[var(--text-dim)] lg:block">
              {campaign.replies}
            </span>
            <div className="w-24 shrink-0 flex justify-end">
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${sc.className}`}>
                {sc.label}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
