'use client'

import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import type { CampaignContact } from '@/types/outreach'
import { ContactAvatar } from './ContactAvatar'

interface SendProgressProps {
  contacts: CampaignContact[]
  sentCount: number
  total: number
}

export function SendProgress({ contacts, sentCount, total }: SendProgressProps) {
  const pct = total > 0 ? Math.round((sentCount / total) * 100) : 0

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-white">Sending campaign...</span>
          <span className="tabular-nums text-[var(--text-dim)]">
            {sentCount} / {total}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[var(--blue)] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        {contacts.map((cc) => {
          const isDone = cc.status === 'delivered' || cc.status === 'failed' || cc.status === 'bounced'
          const isSending = cc.status === 'sending'
          const isSuccess = cc.status === 'delivered'

          return (
            <div key={cc.id} className="flex items-center gap-3">
              {isDone && isSuccess ? (
                <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
              ) : isDone && !isSuccess ? (
                <Circle size={14} className="shrink-0 text-red-400" />
              ) : isSending ? (
                <Loader2 size={14} className="shrink-0 animate-spin text-[var(--blue)]" />
              ) : (
                <Circle size={14} className="shrink-0 text-white/20" />
              )}
              <ContactAvatar contact={cc.contact} />
              <span className="text-xs text-[var(--text-dim)]">
                {cc.contact.firstName} {cc.contact.lastName}
              </span>
              {isDone && !isSuccess && (
                <span className="ml-auto text-[10px] text-red-400">Failed</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
