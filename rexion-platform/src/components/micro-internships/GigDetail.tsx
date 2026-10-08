'use client'

import React from 'react'
import type { MicroGigShape } from '@/types'

interface GigDetailProps {
  gig: MicroGigShape
  onClose: () => void
  onApply: (gig: MicroGigShape) => void
}

export function GigDetail({ gig, onClose, onApply }: GigDetailProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-[rgba(15,26,22,0.95)] p-8 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-emerald-400">
              {typeof gig.company === 'string' ? gig.company : gig.company?.name || 'Company'}
            </span>
            <h2 className="mt-1 text-2xl font-bold text-white">{gig.title}</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-white/60 hover:text-white">✕</button>
        </div>

        <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{gig.description}</p>

        <div className="mt-6 space-y-4">
          <div>
            <h4 className="text-xs font-semibold uppercase text-white/80">Required Tech Stack</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {gig.skills.map((s) => (
                <span key={s} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-y border-white/10 py-4 text-xs">
            <div>
              <span className="block text-[var(--text-secondary)]">Stipend</span>
              <span className="text-base font-semibold text-emerald-400">${gig.pay.toLocaleString()}</span>
            </div>
            <div>
              <span className="block text-[var(--text-secondary)]">Duration</span>
              <span className="text-base font-semibold text-white">{gig.duration} Weeks</span>
            </div>
            <div>
              <span className="block text-[var(--text-secondary)]">Location</span>
              <span className="text-base font-semibold text-white">{gig.location}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button onClick={onClose} className="rounded-xl border border-white/10 px-5 py-2.5 text-xs text-white hover:bg-white/5">
            Close
          </button>
          <button
            onClick={() => {
              onClose()
              onApply(gig)
            }}
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-black hover:bg-emerald-400"
          >
            Apply Now
          </button>
        </div>
      </div>
    </div>
  )
}
