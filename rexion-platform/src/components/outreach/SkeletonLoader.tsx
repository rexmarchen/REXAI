'use client'

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-white/6 ${className}`}
    />
  )
}

export function ContactTableSkeleton() {
  return (
    <div className="space-y-px">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-white/5 px-4 py-3"
        >
          <SkeletonLine className="h-4 w-4 shrink-0 rounded" />
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <SkeletonLine className="h-7 w-7 shrink-0 rounded-full" />
            <SkeletonLine className="h-3.5 w-32" />
          </div>
          <SkeletonLine className="h-3.5 w-24 hidden sm:block" />
          <SkeletonLine className="h-3.5 w-28 hidden md:block" />
          <SkeletonLine className="h-3.5 w-24 hidden lg:block" />
          <SkeletonLine className="h-3.5 w-36 hidden xl:block" />
          <SkeletonLine className="h-5 w-16 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  )
}

export function CampaignTableSkeleton() {
  return (
    <div className="space-y-px">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-white/5 px-4 py-4"
        >
          <SkeletonLine className="h-3.5 w-40 flex-1" />
          <SkeletonLine className="h-3.5 w-16 hidden sm:block" />
          <SkeletonLine className="h-3.5 w-16 hidden md:block" />
          <SkeletonLine className="h-3.5 w-16 hidden lg:block" />
          <SkeletonLine className="h-5 w-20 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  )
}

export function MetricsSkeleton() {
  return (
    <div className="flex gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <SkeletonLine className="h-3 w-20" />
          <SkeletonLine className="h-6 w-12" />
        </div>
      ))}
    </div>
  )
}

export function PreviewSkeleton() {
  return (
    <div className="space-y-3 p-5">
      <SkeletonLine className="h-3 w-32" />
      <SkeletonLine className="h-3 w-48" />
      <div className="my-4 border-t border-white/5" />
      <SkeletonLine className="h-3 w-full" />
      <SkeletonLine className="h-3 w-5/6" />
      <SkeletonLine className="h-3 w-4/5" />
      <SkeletonLine className="h-3 w-full" />
      <SkeletonLine className="h-3 w-2/3" />
    </div>
  )
}
