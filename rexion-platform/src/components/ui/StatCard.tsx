'use client'

import { motion } from 'framer-motion'
import { CountUp } from '@/components/ui/CountUp'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  change,
  points,
  highlight = false,
  prefix = '',
  suffix = '',
}: {
  label: string
  value: number
  change: string
  points: number[]
  highlight?: boolean
  prefix?: string
  suffix?: string
}) {
  const max = Math.max(...points, 1)
  const min = Math.min(...points, 0)
  const path = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100
      const normalized = (point - min) / Math.max(max - min, 1)
      const y = 42 - normalized * 32
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        'rounded-[28px] border p-6 shadow-soft backdrop-blur-xl',
        highlight
          ? 'border-emerald-400/25 bg-[linear-gradient(180deg,rgba(16,185,129,0.12),rgba(15,26,22,0.92))]'
          : 'border-white/8 bg-[rgba(15,26,22,0.84)]'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="type-label">{label}</p>
          <div className="mt-4 type-stat text-white">
            <CountUp from={Math.round(value * 0.65)} to={value} prefix={prefix} suffix={suffix} />
          </div>
        </div>
        <Badge variant={highlight ? 'success' : 'info'}>{change}</Badge>
      </div>

      <div className="mt-6 rounded-2xl border border-white/5 bg-black/20 p-3">
        <svg viewBox="0 0 100 48" className="h-14 w-full overflow-visible">
          <defs>
            <linearGradient id={`spark-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(74,158,255,0.35)" />
              <stop offset="100%" stopColor="rgba(16,185,129,0.95)" />
            </linearGradient>
          </defs>
          <path
            d={path}
            fill="none"
            stroke={`url(#spark-${label})`}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </motion.article>
  )
}
