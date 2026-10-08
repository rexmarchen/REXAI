'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Clock, MessageSquare, Send, XCircle } from 'lucide-react'
import type { Campaign, CampaignContact, CampaignContactStatus } from '@/types/outreach'
import { campaignService } from '@/lib/outreach/campaign-service'
import { ContactAvatar } from './ContactAvatar'
import { CampaignTableSkeleton } from './SkeletonLoader'
import { ErrorState } from './ErrorState'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

const statusConfig: Record<CampaignContactStatus, { label: string; icon: React.ReactNode; className: string }> = {
  queued: { label: 'Queued', icon: <Clock size={12} />, className: 'text-[var(--text-dim)]' },
  sending: { label: 'Sending', icon: <Send size={12} />, className: 'text-blue-400' },
  delivered: { label: 'Delivered', icon: <CheckCircle2 size={12} />, className: 'text-emerald-400' },
  opened: { label: 'Opened', icon: <CheckCircle2 size={12} />, className: 'text-blue-300' },
  replied: { label: 'Replied', icon: <MessageSquare size={12} />, className: 'text-violet-400' },
  bounced: { label: 'Bounced', icon: <XCircle size={12} />, className: 'text-red-400' },
  failed: { label: 'Failed', icon: <XCircle size={12} />, className: 'text-red-400' },
}

interface CampaignDetailsProps {
  id: string
}

export function CampaignDetails({ id }: CampaignDetailsProps) {
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const load = async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const data = await campaignService.getById(id)
      if (!data) throw new Error('Not found')
      setCampaign(data)
    } catch {
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { void load() }, [id])

  if (isLoading) return <CampaignTableSkeleton />
  if (isError || !campaign) return <ErrorState title="Campaign not found" onRetry={load} />

  const metrics = [
    { label: 'Recipients', value: campaign.recipients },
    { label: 'Delivered', value: campaign.delivered },
    { label: 'Bounced', value: campaign.bounced },
    { label: 'Replies', value: campaign.replies },
  ]

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-xs text-[var(--text-dim)] transition hover:text-white"
      >
        <ArrowLeft size={13} />
        All campaigns
      </button>

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">{campaign.name}</h1>
        <p className="mt-1 text-xs text-[var(--text-dim)]">
          Created {formatDate(campaign.createdAt)}
        </p>
      </div>

      {/* Metrics strip */}
      <div className="flex flex-wrap gap-6 rounded-xl border border-white/8 bg-[#0b0e13] px-5 py-4">
        {metrics.map((m) => (
          <div key={m.label}>
            <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)]">{m.label}</p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums text-white">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Recipients table */}
      {campaign.contacts.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-white/8 bg-[#0b0e13]">
          <div className="flex items-center gap-4 border-b border-white/8 px-4 py-2">
            <span className="flex-1 text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)]">Recipient</span>
            <span className="hidden w-32 shrink-0 text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)] md:block">Sent</span>
            <span className="w-24 shrink-0 text-right text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)]">Status</span>
          </div>
          {campaign.contacts.map((cc: CampaignContact) => {
            const sc = statusConfig[cc.status]
            return (
              <div
                key={cc.id}
                className="flex items-center gap-4 border-b border-white/5 px-4 py-3 last:border-b-0"
              >
                <div className="flex flex-1 items-center gap-2.5 min-w-0">
                  <ContactAvatar contact={cc.contact} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-white">
                      {cc.contact.firstName} {cc.contact.lastName}
                    </p>
                    <p className="truncate text-[11px] text-[var(--text-dim)]">{cc.contact.email}</p>
                  </div>
                </div>
                <span className="hidden w-32 shrink-0 text-xs text-[var(--text-dim)] md:block">
                  {cc.sentAt ? new Date(cc.sentAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
                <div className="w-24 shrink-0 flex justify-end">
                  <span className={`inline-flex items-center gap-1 text-xs ${sc.className}`}>
                    {sc.icon}
                    {sc.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
