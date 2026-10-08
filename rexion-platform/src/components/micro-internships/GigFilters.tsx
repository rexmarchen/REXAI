'use client'

import React from 'react'

export interface GigFilterState {
  domain: string
  duration: string
  location: string
  status: string
  payMin: number
  payMax: number
}

interface GigFiltersProps {
  filters: GigFilterState
  onChange: (filters: GigFilterState) => void
}

export function GigFilters({ filters, onChange }: GigFiltersProps) {
  return (
    <aside className="space-y-6 rounded-[24px] border border-white/8 bg-[rgba(15,26,22,0.8)] p-6 shadow-soft">
      <h2 className="text-lg font-semibold text-white">Filter Micro-Gigs</h2>

      <div className="space-y-4 text-xs">
        <div>
          <label className="block mb-2 font-medium text-[var(--text-secondary)]">Domain</label>
          <select
            value={filters.domain}
            onChange={(e) => onChange({ ...filters, domain: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All Domains</option>
            <option value="Frontend">Frontend Engineering</option>
            <option value="Backend">Backend & Infrastructure</option>
            <option value="AI/ML">AI & Machine Learning</option>
            <option value="Fullstack">Fullstack Development</option>
            <option value="Data">Data Engineering</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium text-[var(--text-secondary)]">Location</label>
          <select
            value={filters.location}
            onChange={(e) => onChange({ ...filters, location: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All Locations</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium text-[var(--text-secondary)]">Duration (Weeks)</label>
          <select
            value={filters.duration}
            onChange={(e) => onChange({ ...filters, duration: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">Any Duration</option>
            <option value="2">2 Weeks</option>
            <option value="3">3 Weeks</option>
            <option value="4">4 Weeks</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium text-[var(--text-secondary)]">Stipend Range (${filters.payMin} - ${filters.payMax})</label>
          <input
            type="range"
            min="5000"
            max="30000"
            step="1000"
            value={filters.payMax}
            onChange={(e) => onChange({ ...filters, payMax: Number(e.target.value) })}
            className="w-full accent-emerald-500"
          />
        </div>
      </div>
    </aside>
  )
}
