'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PreviewNavigatorProps {
  current: number // 0-indexed
  total: number
  onChange: (index: number) => void
}

export function PreviewNavigator({ current, total, onChange }: PreviewNavigatorProps) {
  if (total === 0) return null

  return (
    <div className="flex items-center gap-2 text-xs text-[var(--text-dim)]">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 0}
        className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-white/10 transition hover:bg-white/5 disabled:opacity-30"
        aria-label="Previous contact"
      >
        <ChevronLeft size={13} />
      </button>
      <span className="tabular-nums">
        {current + 1} / {total}
      </span>
      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total - 1}
        className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-white/10 transition hover:bg-white/5 disabled:opacity-30"
        aria-label="Next contact"
      >
        <ChevronRight size={13} />
      </button>
    </div>
  )
}
