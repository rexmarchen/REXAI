'use client'

import Link from 'next/link'
import { ArrowUpRight, Brain, BriefcaseBusiness, Send } from 'lucide-react'
import { motion } from 'framer-motion'

const actions = [
  {
    href: '/dashboard/outreach',
    title: 'Launch outreach',
    copy: 'Find hiring contacts and queue a clean outbound sequence.',
    icon: Send,
  },
  {
    href: '/dashboard/jobs',
    title: 'Review job matches',
    copy: 'Rank the best-fit openings and sharpen your next applications.',
    icon: Brain,
  },
  {
    href: '/dashboard/micro-gigs',
    title: 'Start a micro-gig',
    copy: 'Turn short proof-of-work into real interview leverage.',
    icon: BriefcaseBusiness,
  },
] as const

export function QuickActions() {
  return (
    <section className="rounded-[32px] border border-white/8 bg-[rgba(15,26,22,0.84)] p-6 shadow-soft">
      <div>
        <p className="type-label">Quick Actions</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Move the search forward</h2>
      </div>

      <div className="mt-6 space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: index * 0.06 }}
            >
              <Link
                href={action.href}
                className="group flex items-start justify-between gap-4 rounded-[24px] border border-white/6 bg-black/20 p-4 transition hover:border-emerald-400/20 hover:bg-emerald-400/5"
              >
                <div className="flex gap-4">
                  <span className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--bg-elevated)] text-white">
                    <Icon size={18} />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-white">{action.title}</div>
                    <div className="mt-1 text-xs leading-6 text-[var(--text-secondary)]">{action.copy}</div>
                  </div>
                </div>
                <ArrowUpRight size={17} className="mt-1 text-[var(--text-secondary)] transition group-hover:text-white" />
              </Link>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
