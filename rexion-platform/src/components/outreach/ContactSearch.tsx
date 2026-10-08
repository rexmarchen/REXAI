'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search,
  ShieldCheck,
  MapPin,
  Building,
  Users,
  Check,
  AlertCircle,
  Filter,
  X,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  Linkedin,
} from 'lucide-react'
import type { OutreachContact } from '@/types/outreach'
import {
  type ContactSearchFilters,
  DEFAULT_SEARCH_FILTERS,
  SENIORITY_OPTIONS,
  DEPARTMENT_OPTIONS,
} from '@/lib/search-filters'
import FilterPanel from './FilterPanel'

interface ContactSearchProps {
  onContactsSelected: (selectedContacts: OutreachContact[]) => void
}

export default function ContactSearch({ onContactsSelected }: ContactSearchProps) {
  const [filters, setFilters] = useState<ContactSearchFilters>({
    ...DEFAULT_SEARCH_FILTERS,
    titles: ['Founder', 'CEO', 'Head of Talent'],
  })

  const [contacts, setContacts] = useState<OutreachContact[]>([])
  const [telemetry, setTelemetry] = useState<any>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFilterPanel, setShowFilterPanel] = useState(true)

  // Quick search input in the top bar
  const [quickQuery, setQuickQuery] = useState('')

  // Debounce ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate active filter count
  const calculateActiveCount = useCallback((f: ContactSearchFilters) => {
    let count = 0
    if (f.titles.length > 0) count += f.titles.length
    if (f.seniorities.length > 0) count += f.seniorities.length
    if (f.departments.length > 0) count += f.departments.length
    if (f.excludedTitleKeywords.length > 0) count += f.excludedTitleKeywords.length
    if (f.yearsInRole) count += 1
    if (f.personLocations.length > 0) count += f.personLocations.length
    if (f.companyNames.length > 0) count += f.companyNames.length
    if (f.industries.length > 0) count += f.industries.length
    if (f.headcountRanges.length > 0) count += f.headcountRanges.length
    if (f.fundingStages.length > 0) count += f.fundingStages.length
    if (f.technologies.length > 0) count += f.technologies.length
    if (f.verifiedEmailOnly !== DEFAULT_SEARCH_FILTERS.verifiedEmailOnly) count += 1
    if (f.hasLinkedIn) count += 1
    if (f.hasPhone) count += 1
    if (!f.excludeExistingContacts) count += 1
    if (f.excludeContactedDays !== DEFAULT_SEARCH_FILTERS.excludeContactedDays) count += 1
    return count
  }, [])

  const activeFilterCount = calculateActiveCount(filters)

  // Search execution
  const executeSearch = useCallback(
    async (searchFilters: ContactSearchFilters) => {
      setLoading(true)
      setError(null)
      setSearched(true)

      try {
        const res = await fetch('/api/outreach/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filters: searchFilters,
            targetRole: searchFilters.titles[0] || 'Software & ML Engineer',
            targetDomain: 'Technology',
            minScore: 60,
          }),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Failed to search contacts.')
        }

        const data = await res.json()
        setContacts(data.contacts || [])
        setTelemetry(data.telemetry || null)
        setSelectedIds(new Set())
      } catch (err: any) {
        setError(err.message || 'An error occurred during search.')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Debounced filter change listener
  const handleFiltersChange = (newFilters: ContactSearchFilters) => {
    setFilters(newFilters)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      executeSearch(newFilters)
    }, 400)
  }

  // Initial search on mount
  useEffect(() => {
    executeSearch(filters)
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [])

  const handleResetFilters = () => {
    const fresh = { ...DEFAULT_SEARCH_FILTERS }
    setFilters(fresh)
    executeSearch(fresh)
  }

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickQuery.trim()) return

    const isDomain = quickQuery.includes('.')
    const updated: ContactSearchFilters = {
      ...filters,
      ...(isDomain
        ? { companyNames: Array.from(new Set([...filters.companyNames, quickQuery.trim()])) }
        : { titles: Array.from(new Set([...filters.titles, quickQuery.trim()])) }),
    }
    setQuickQuery('')
    handleFiltersChange(updated)
  }

  const removeChip = (key: keyof ContactSearchFilters, value: string) => {
    const current = (filters[key] as string[]) || []
    const updated = {
      ...filters,
      [key]: current.filter((item) => item !== value),
    }
    handleFiltersChange(updated)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(contacts.map((c) => c.id)))
    }
  }

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const handleProceed = () => {
    const selected = contacts.filter((c) => selectedIds.has(c.id))
    onContactsSelected(selected)
  }

  return (
    <div className="space-y-5">
      {/* Top Search & Filter Bar */}
      <div className="bg-[#111c18]/90 border border-emerald-500/15 rounded-2xl p-4 md:p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Quick Query Form */}
          <form onSubmit={handleQuickSearchSubmit} className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              placeholder="Quick search by title (e.g. CTO, VP Talent) or company (e.g. Stripe.com)..."
              className="w-full bg-[#0b1210] border border-emerald-500/15 rounded-xl pl-10 pr-24 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500 transition"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg transition"
            >
              Add Filter
            </button>
          </form>

          {/* Toggle Sidebar Button */}
          <button
            type="button"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition shrink-0 ${
              showFilterPanel
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-[#0b1210] border-emerald-500/15 text-slate-300 hover:border-emerald-500/30'
            }`}
          >
            <SlidersHorizontal size={15} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Active Filter Chips Bar */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-emerald-500/10">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Active:
            </span>

            {/* Titles */}
            {filters.titles.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs"
              >
                <Users size={11} /> {t}
                <X size={11} className="cursor-pointer hover:text-white" onClick={() => removeChip('titles', t)} />
              </span>
            ))}

            {/* Seniorities */}
            {filters.seniorities.map((s) => {
              const label = SENIORITY_OPTIONS.find((o) => o.value === s)?.label || s
              return (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs"
                >
                  {label}
                  <X size={11} className="cursor-pointer hover:text-white" onClick={() => removeChip('seniorities', s)} />
                </span>
              )
            })}

            {/* Departments */}
            {filters.departments.map((d) => {
              const label = DEPARTMENT_OPTIONS.find((o) => o.value === d)?.label || d
              return (
                <span
                  key={d}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs"
                >
                  {label}
                  <X size={11} className="cursor-pointer hover:text-white" onClick={() => removeChip('departments', d)} />
                </span>
              )
            })}

            {/* Excluded Keywords */}
            {filters.excludedTitleKeywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-950/60 border border-rose-500/30 text-rose-300 rounded-lg text-xs"
              >
                No: {kw}
                <X size={11} className="cursor-pointer hover:text-white" onClick={() => removeChip('excludedTitleKeywords', kw)} />
              </span>
            ))}

            {/* Companies */}
            {filters.companyNames.map((c) => (
              <span
                key={c}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border ${
                  filters.companyMode === 'exclude'
                    ? 'bg-rose-950/60 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                }`}
              >
                <Building size={11} /> {filters.companyMode === 'exclude' ? `Exclude: ${c}` : c}
                <X size={11} className="cursor-pointer hover:text-white" onClick={() => removeChip('companyNames', c)} />
              </span>
            ))}

            {/* Person Locations */}
            {filters.personLocations.map((l) => (
              <span
                key={l}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs"
              >
                <MapPin size={11} /> {l}
                <X size={11} className="cursor-pointer hover:text-white" onClick={() => removeChip('personLocations', l)} />
              </span>
            ))}

            {/* Headcount */}
            {filters.headcountRanges.map((hc) => (
              <span
                key={hc}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs"
              >
                Size: {hc}
                <X size={11} className="cursor-pointer hover:text-white" onClick={() => removeChip('headcountRanges', hc)} />
              </span>
            ))}

            {/* Funding */}
            {filters.fundingStages.map((fs) => (
              <span
                key={fs}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs"
              >
                Funding: {fs}
                <X size={11} className="cursor-pointer hover:text-white" onClick={() => removeChip('fundingStages', fs)} />
              </span>
            ))}

            {/* Tech Stack */}
            {filters.technologies.map((tch) => (
              <span
                key={tch}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs"
              >
                Tech: {tch}
                <X size={11} className="cursor-pointer hover:text-white" onClick={() => removeChip('technologies', tch)} />
              </span>
            ))}

            {/* Verified Email Tag */}
            {filters.verifiedEmailOnly && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[11px]">
                <ShieldCheck size={11} /> Verified Only
              </span>
            )}

            {/* Has LinkedIn */}
            {filters.hasLinkedIn && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[11px]">
                <Linkedin size={11} /> Has LinkedIn
              </span>
            )}

            {/* Clear All */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 ml-2 font-medium transition"
            >
              <RotateCcw size={11} /> Clear All
            </button>
          </div>
        )}
      </div>

      {/* Main Layout: Filter Panel Sidebar + Results Table */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Collapsible Filter Panel */}
        {showFilterPanel && (
          <FilterPanel
            filters={filters}
            onChange={handleFiltersChange}
            onReset={handleResetFilters}
            activeCount={activeFilterCount}
          />
        )}

        {/* Results Area */}
        <div className="flex-1 w-full space-y-4">
          {/* Telemetry & Stats Bar */}
          {telemetry && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d1613]/90 border border-emerald-500/15 rounded-xl px-4 py-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{contacts.length} Qualified Contacts</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400 font-medium">
                  {telemetry.totalFound} Scanned
                </span>
                {telemetry.suppressedCount > 0 && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-rose-400">{telemetry.suppressedCount} Suppressed</span>
                  </>
                )}
                {telemetry.excludedCount > 0 && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{telemetry.excludedCount} Excluded</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">
                  {selectedIds.size} selected
                </span>
                {selectedIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleProceed}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg transition"
                  >
                    Proceed ({selectedIds.size})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 bg-red-950/20 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading ? (
            <div className="bg-[#111c18]/90 border border-emerald-500/15 rounded-2xl p-6 shadow-lg space-y-4">
              <div className="flex items-center gap-3 animate-pulse">
                <div className="h-4 w-32 bg-slate-800 rounded"></div>
                <div className="h-4 w-48 bg-slate-800 rounded"></div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="h-16 bg-[#0a110f] border border-slate-800/80 rounded-xl animate-pulse p-4 flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-40 bg-slate-800 rounded"></div>
                      <div className="h-3 w-56 bg-slate-800/60 rounded"></div>
                    </div>
                    <div className="h-8 w-24 bg-slate-800 rounded-lg"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : contacts.length > 0 ? (
            /* Results Table */
            <div className="bg-[#111c18]/90 border border-emerald-500/15 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-[#0b1210]/95 border-b border-emerald-500/15 text-slate-400 font-medium">
                    <tr>
                      <th className="px-5 py-3.5 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === contacts.length && contacts.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-emerald-500/20 text-emerald-600 focus:ring-emerald-500/20 accent-emerald-500 cursor-pointer h-4 w-4"
                        />
                      </th>
                      <th className="px-5 py-3.5">Contact</th>
                      <th className="px-5 py-3.5">Role & Match Reason</th>
                      <th className="px-5 py-3.5">Company</th>
                      <th className="px-5 py-3.5">AI Match</th>
                      <th className="px-5 py-3.5 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-500/5 text-slate-200">
                    {contacts.map((contact: any) => {
                      const qual = contact.qualification
                      const score = qual?.score ?? 88
                      const verdict = qual?.verdict ?? 'Strong Match'
                      const badges = qual?.badges ?? ['🎯 Decision Maker']

                      return (
                        <tr key={contact.id} className="hover:bg-emerald-500/[0.03] transition">
                          <td className="px-5 py-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(contact.id)}
                              onChange={() => toggleSelectOne(contact.id)}
                              className="rounded border-emerald-500/20 text-emerald-600 focus:ring-emerald-500/20 accent-emerald-500 cursor-pointer h-4 w-4"
                            />
                          </td>
                          <td className="px-5 py-3.5 font-medium">
                            <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                              {contact.firstName} {contact.lastName}
                              {contact.linkedinUrl && (
                                <a
                                  href={contact.linkedinUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 transition"
                                  title="LinkedIn Profile"
                                >
                                  <Linkedin size={13} />
                                </a>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">{contact.email}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="text-slate-200 font-medium text-xs">{contact.jobTitle}</div>
                            {qual?.reasoning && (
                              <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                {qual.reasoning}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {badges.map((b: string, i: number) => (
                                <span
                                  key={i}
                                  className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-1.5 py-0.2 rounded"
                                >
                                  {b}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-slate-300">
                            <div className="font-medium text-slate-200">{contact.companyName}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-1">
                              <MapPin size={11} className="text-slate-500" />
                              {contact.location || 'Remote'}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                  score >= 85
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : score >= 70
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                }`}
                              >
                                {score}/100
                              </span>
                              <span className="text-xs text-slate-300">{verdict}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 rounded-full text-xs font-medium">
                              <ShieldCheck size={12} /> {contact.verified === 'verified' ? 'Verified' : 'Likely'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Action Footer */}
              <div className="bg-[#0b1210]/95 px-5 py-3.5 border-t border-emerald-500/15 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {selectedIds.size} of {contacts.length} selected
                </span>
                <button
                  type="button"
                  onClick={handleProceed}
                  disabled={selectedIds.size === 0}
                  className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-slate-950 font-bold px-5 py-2 rounded-xl text-sm transition"
                >
                  Proceed with {selectedIds.size} Selected
                </button>
              </div>
            </div>
          ) : searched ? (
            /* No Results */
            <div className="text-center py-16 bg-[#111c18]/90 border border-emerald-500/15 rounded-2xl p-8 space-y-2">
              <p className="text-base font-semibold text-slate-300">No matching contacts found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try widening your seniority levels, adding alternative job titles, or clearing industry/location constraints.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium rounded-lg border border-emerald-500/30 transition"
              >
                <RotateCcw size={12} /> Reset Filters
              </button>
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-20 bg-[#111c18]/90 border border-emerald-500/15 rounded-2xl p-8 flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-emerald-500/5 rounded-full border border-emerald-500/10 text-emerald-400">
                <Search size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-200">Find Hiring Manager & Founder Leads</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Use the left filter panel to target specific industries, funding stages, seniority tiers, and tech stacks.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
