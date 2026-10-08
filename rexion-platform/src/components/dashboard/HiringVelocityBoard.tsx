'use client'

import { motion } from 'framer-motion'
import { CountUp } from '@/components/ui/CountUp'

const velocityMetrics = [
  { label: 'Jobs matched today', value: 84, tone: 'emerald' },
  { label: 'Outreach queued', value: 26, tone: 'blue' },
  { label: 'Micro-gig matches', value: 7, tone: 'emerald' },
  { label: 'Follow-ups due', value: 12, tone: 'blue' },
] as const

export function HiringVelocityBoard() {
  return (
    <section className="rounded-[32px] border border-white/8 bg-[rgba(15,26,22,0.84)] p-6 shadow-soft">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="type-label">Hiring Velocity Board</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Live execution signals</h2>
        </div>
        <p className="max-w-xl text-sm text-[var(--text-secondary)]">
          This board compresses your search into the four numbers that matter most right now.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {velocityMetrics.map((metric, index) => (
          <motion.article
            key={metric.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.06 }}
            className="rounded-[24px] border border-white/6 bg-black/20 p-5"
          >
            <p className="type-label">{metric.label}</p>
            <div
              className={`mt-4 text-[36px] font-semibold tracking-[-0.05em] ${
                metric.tone === 'emerald' ? 'text-emerald-300' : 'text-sky-300'
              }`}
            >
              <CountUp to={metric.value} />
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
