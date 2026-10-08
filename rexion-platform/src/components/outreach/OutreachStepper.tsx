'use client'

// OutreachStepper — step indicator component
// Used in /dashboard/outreach/new and /dashboard/outreach/review pages
// Exported here for backward compatibility; the actual step indicator is inline in those pages.
export function OutreachStepper({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = ['People', 'Compose', 'Review']
  return (
    <div className="flex items-center gap-2 text-xs">
      {steps.map((label, i) => {
        const step = i + 1
        const isDone = step < currentStep
        const isCurrent = step === currentStep
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full font-semibold ${
                isDone ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-[var(--blue)] text-white' : 'bg-white/10 text-[var(--text-dim)]'
              }`}
            >
              {step}
            </span>
            <span className={isCurrent ? 'text-white' : 'text-[var(--text-dim)]'}>{label}</span>
            {i < steps.length - 1 && <span className="text-white/20">›</span>}
          </div>
        )
      })}
    </div>
  )
}
