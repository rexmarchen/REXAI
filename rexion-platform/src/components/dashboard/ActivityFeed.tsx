'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/Badge'
import type { ActivityItem } from '@/types'

const toneMap: Record<ActivityItem['category'], 'success' | 'info' | 'warning'> = {
  outreach: 'info',
  job: 'success',
  gig: 'warning',
  billing: 'warning',
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <section className="rounded-[32px] border border-white/8 bg-[rgba(15,26,22,0.84)] p-6 shadow-soft">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="type-label">Activity Feed</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">What moved today</h2>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {items.map((item, index) => (
          <motion.article
            key={item.id}
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.28, delay: index * 0.05 }}
            className="flex flex-col gap-3 rounded-[24px] border border-white/6 bg-black/20 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <div className="text-sm font-medium text-white">{item.title}</div>
              <div className="mt-1 text-xs text-[var(--text-secondary)]">{item.timestamp}</div>
            </div>
            <Badge variant={toneMap[item.category]}>{item.category}</Badge>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
