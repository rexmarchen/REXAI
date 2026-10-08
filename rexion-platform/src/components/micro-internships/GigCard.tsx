'use client'

import React from 'react'
import type { MicroGigShape } from '@/types'
import { AIMatchScore } from './AIMatchScore'

interface GigCardProps {
  gig: MicroGigShape
  score?: number
  explanation?: string
  onApply: (gig: MicroGigShape) => void
}

export function GigCard({ gig, score, explanation, onApply }: GigCardProps) {
  return (
    <article className="group relative flex flex-col justify-between rounded-[24px] border border-white/8 bg-[rgba(15,26,22,0.8)] p-6 shadow-soft transition-all duration-300 hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {typeof gig.company === 'string' ? gig.company : gig.company?.name || 'Company'}
            </span>
            <h3 className="mt-1 text-xl font-bold text-white transition-colors group-hover:text-emerald-300">{gig.title}</h3>
          </div>
          {score !== undefined && <AIMatchScore score={score} />}
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--text-secondary)]">{gig.description}</p>

        {explanation && (
          <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            <span className="font-semibold">Why match: </span>
            {explanation}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {gig.skills.map((skill) => (
            <span key={skill} className="rounded-lg border border-white/6 bg-white/5 px-2.5 py-1 text-xs text-white/80">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-white/6 pt-4 text-xs">
        <div className="flex items-center gap-4 text-[var(--text-secondary)]">
          <span className="font-semibold text-white">${gig.pay.toLocaleString()}</span>
          <span>•</span>
          <span>{gig.duration} week sprint</span>
          <span>•</span>
          <span>{gig.location}</span>
        </div>
        <button
          onClick={() => onApply(gig)}
          className="rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500 hover:text-black shadow-[0_0_15px_rgba(16,185,129,0.2)]"
        >
          Apply Sprint
        </button>
      </div>
    </article>
  )
}
