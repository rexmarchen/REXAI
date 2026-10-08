'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import type { MicroGigShape } from '@/types'

export function GigMatchStrip({ gigs }: { gigs: MicroGigShape[] }) {
  return (
    <section className="rounded-[32px] border border-white/8 bg-[rgba(15,26,22,0.84)] p-6 shadow-soft">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="type-label">Gig Match Strip</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Micro-gigs with signal upside</h2>
        </div>
        <Link href="/dashboard/micro-gigs" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          View all gigs <ArrowRight size={16} />
        </Link>
      </div>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
        {gigs.map((gig, index) => (
          <motion.article
            key={gig.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="min-w-[300px] flex-1 rounded-[28px] border border-white/6 bg-black/20 p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">{gig.company.name}</div>
                <div className="mt-1 text-xs text-[var(--text-secondary)]">{gig.company.location || 'Remote'}</div>
              </div>
              {gig.isPreHiring ? <Badge variant="success">Pre-Hiring</Badge> : <Badge>Open</Badge>}
            </div>
            <h3 className="mt-5 text-xl font-semibold text-white">{gig.title}</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{gig.description}</p>
            <div className="mt-5 flex items-center justify-between text-sm text-white">
              <span>{formatCurrency(gig.pay)}</span>
              <span>{gig.duration} days</span>
              <span>{gig.location}</span>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
