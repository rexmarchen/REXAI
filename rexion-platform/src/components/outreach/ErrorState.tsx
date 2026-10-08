'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
        <AlertCircle size={18} className="text-red-400" />
      </div>
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-1 text-xs text-[var(--text-dim)]">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/10"
        >
          <RefreshCw size={12} />
          Try again
        </button>
      )}
    </div>
  )
}
