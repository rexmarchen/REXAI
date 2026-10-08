'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, ChevronRight } from 'lucide-react'
import { CampaignComposer } from '@/components/outreach/CampaignComposer'

const STEPS = [
  { id: 1, label: 'People' },
  { id: 2, label: 'Compose' },
  { id: 3, label: 'Review' },
]

export default function NewCampaignPage() {
  const router = useRouter()
  const [contactIds, setContactIds] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('outreach:selectedContacts')
    if (!raw) {
      router.replace('/dashboard/outreach')
      return
    }
    setContactIds(JSON.parse(raw) as string[])
    setLoaded(true)
  }, [router])

  if (!loaded) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border border-white/20 border-t-white" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">New outreach campaign</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, i) => {
          const isDone = step.id < 2
          const isCurrent = step.id === 2
          return (
            <div key={step.id} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-[var(--blue)] text-white'
                      : 'bg-white/10 text-[var(--text-dim)]'
                  }`}
                >
                  {isDone ? <CheckCircle size={11} /> : step.id}
                </span>
                <span
                  className={`text-xs font-medium ${
                    isCurrent ? 'text-white' : 'text-[var(--text-dim)]'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight size={13} className="text-white/20" />
              )}
            </div>
          )
        })}
      </div>

      {/* Composer */}
      <CampaignComposer contactIds={contactIds} />
    </div>
  )
}
