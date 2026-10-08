import { cn } from '@/lib/utils'

export function Badge({
  children,
  variant = 'neutral',
  className,
}: {
  children: React.ReactNode
  variant?: 'neutral' | 'success' | 'info' | 'warning' | 'danger'
  className?: string
}) {
  const variants = {
    neutral: 'border-white/10 bg-white/5 text-[var(--text-secondary)]',
    success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    info: 'border-sky-400/20 bg-sky-400/10 text-sky-200',
    warning: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
    danger: 'border-red-400/20 bg-red-400/10 text-red-200',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em]',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
