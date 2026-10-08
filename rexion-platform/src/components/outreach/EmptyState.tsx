'use client'

import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
          <Icon size={18} className="text-[var(--text-dim)]" />
        </div>
      )}
      <p className="text-sm font-medium text-white">{title}</p>
      {description && <p className="mt-1 max-w-xs text-xs text-[var(--text-dim)]">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--blue)] px-4 py-2 text-xs font-medium text-white transition hover:opacity-90"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
