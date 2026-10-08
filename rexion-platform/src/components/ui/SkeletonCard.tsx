import { cn } from '@/lib/utils'

export function SkeletonCard({
  width,
  height,
  className,
}: {
  width?: number | string
  height?: number | string
  className?: string
}) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-[var(--bg-elevated)]', className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}
