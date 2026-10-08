'use client'

import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { CampaignTable } from './CampaignTable'

export function CampaignsTab() {
  const router = useRouter()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Campaigns</h2>
          <p className="mt-0.5 text-xs text-[var(--text-dim)]">Track delivery, opens, and replies</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/outreach/new')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--blue)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
        >
          <Plus size={13} />
          New campaign
        </button>
      </div>
      <CampaignTable />
    </div>
  )
}
