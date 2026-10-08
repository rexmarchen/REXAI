'use client'

import { CheckCircle, ChevronRight } from 'lucide-react'
import { CampaignReview } from '@/components/outreach/CampaignReview'

const STEPS = [
  { id: 1, label: 'People' },
  { id: 2, label: 'Compose' },
  { id: 3, label: 'Review' },
]

export default function ReviewPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Review campaign</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, i) => {
          const isDone = step.id < 3
          const isCurrent = step.id === 3
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

      <CampaignReview />
    </div>
  )
}
