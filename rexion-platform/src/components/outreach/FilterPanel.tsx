'use client'

import React, { useState, useEffect } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Filter,
  RotateCcw,
  Bookmark,
  Plus,
  X,
  Building,
  User,
  ShieldCheck,
  Ban,
  Sparkles,
  Search,
  Check,
  Trash2,
} from 'lucide-react'
import {
  type ContactSearchFilters,
  DEFAULT_SEARCH_FILTERS,
  SENIORITY_OPTIONS,
  DEPARTMENT_OPTIONS,
  INDUSTRY_OPTIONS,
  HEADCOUNT_OPTIONS,
  REVENUE_OPTIONS,
  FUNDING_STAGE_OPTIONS,
  YEARS_IN_ROLE_OPTIONS,
} from '@/lib/search-filters'

interface SavedSearchItem {
  id: string
  name: string
  filters: ContactSearchFilters
  createdAt: string
}

interface FilterPanelProps {
  filters: ContactSearchFilters
  onChange: (newFilters: ContactSearchFilters) => void
  onReset: () => void
  activeCount: number
  isOpen?: boolean
  onToggleOpen?: () => void
}

export default function FilterPanel({
  filters,
  onChange,
  onReset,
  activeCount,
  isOpen = true,
  onToggleOpen,
}: FilterPanelProps) {
  // Accordion Section States
  const [openSections, setOpenSections] = useState({
    person: true,
    company: true,
    quality: true,
    exclusions: false,
    saved: false,
  })

  // Tag Input Local States
  const [titleInput, setTitleInput] = useState('')
  const [excludeTitleInput, setExcludeTitleInput] = useState('')
  const [personLocInput, setPersonLocInput] = useState('')
  const [companyInput, setCompanyInput] = useState('')
  const [companyLocInput, setCompanyLocInput] = useState('')
  const [techInput, setTechInput] = useState('')

  // Saved Searches Local State
  const [savedSearches, setSavedSearches] = useState<SavedSearchItem[]>([])
  const [saveSearchName, setSaveSearchName] = useState('')
  const [isSavingSearch, setIsSavingSearch] = useState(false)
  const [savedSearchNotice, setSavedSearchNotice] = useState('')

  useEffect(() => {
    fetchSavedSearches()
  }, [])

  const fetchSavedSearches = async () => {
    try {
      const res = await fetch('/api/outreach/saved-searches')
      if (res.ok) {
        const data = await res.json()
        if (data.savedSearches) {
          setSavedSearches(data.savedSearches)
        }
      }
    } catch (e) {
      console.error('Failed to load saved searches:', e)
    }
  }

  const handleSaveSearch = async () => {
    if (!saveSearchName.trim()) return
    setIsSavingSearch(true)
    setSavedSearchNotice('')

    try {
      const res = await fetch('/api/outreach/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveSearchName.trim(),
          filters,
        }),
      })

      if (res.ok) {
        setSaveSearchName('')
        setSavedSearchNotice('Search saved successfully!')
        await fetchSavedSearches()
        setTimeout(() => setSavedSearchNotice(''), 3000)
      }
    } catch (e) {
      console.error('Failed to save search:', e)
    } finally {
      setIsSavingSearch(false)
    }
  }

  const handleDeleteSavedSearch = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/outreach/saved-searches?id=${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setSavedSearches((prev) => prev.filter((s) => s.id !== id))
      }
    } catch (e) {
      console.error('Failed to delete saved search:', e)
    }
  }

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  // Tag helper
  const addTag = (
    key: keyof ContactSearchFilters,
    value: string,
    clearInput: () => void
  ) => {
    const trimmed = value.trim()
    if (!trimmed) return
    const currentList = (filters[key] as string[]) || []
    if (!currentList.includes(trimmed)) {
      onChange({ ...filters, [key]: [...currentList, trimmed] })
    }
    clearInput()
  }

  const removeTag = (key: keyof ContactSearchFilters, value: string) => {
    const currentList = (filters[key] as string[]) || []
    onChange({ ...filters, [key]: currentList.filter((item) => item !== value) })
  }

  // Multi-checkbox helper
  const toggleCheckbox = (key: keyof ContactSearchFilters, value: string) => {
    const currentList = (filters[key] as string[]) || []
    const nextList = currentList.includes(value)
      ? currentList.filter((v) => v !== value)
      : [...currentList, value]
    onChange({ ...filters, [key]: nextList })
  }

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 bg-[#0d1613]/95 border border-emerald-500/15 rounded-2xl p-4 md:p-5 shadow-xl text-slate-200 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-emerald-500/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Filter size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white">Search Filters</h3>
            <p className="text-[11px] text-slate-400">Apollo & Snov Multi-Tier</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">
              {activeCount}
            </span>
          )}
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition"
              title="Reset all filters"
            >
              <RotateCcw size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Filter Group 5: Saved Searches ─────────────────────────────── */}
      <div className="border border-emerald-500/10 rounded-xl overflow-hidden bg-[#0a110f]">
        <button
          type="button"
          onClick={() => toggleSection('saved')}
          className="w-full flex items-center justify-between p-3 text-xs font-semibold text-slate-300 hover:bg-emerald-500/5 transition"
        >
          <span className="flex items-center gap-2">
            <Bookmark size={14} className="text-emerald-400" />
            Saved Search Presets
            {savedSearches.length > 0 && (
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded-full">
                {savedSearches.length}
              </span>
            )}
          </span>
          {openSections.saved ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {openSections.saved && (
          <div className="p-3 pt-1 space-y-3 border-t border-emerald-500/10 text-xs">
            {savedSearches.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {savedSearches.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onChange(item.filters)}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 hover:bg-emerald-950/40 border border-emerald-500/10 cursor-pointer group transition"
                  >
                    <span className="truncate font-medium text-slate-200 group-hover:text-emerald-300">
                      {item.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSavedSearch(item.id, e)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition"
                      title="Delete saved search"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic">No saved search presets yet.</p>
            )}

            {/* Save current filters */}
            <div className="flex gap-1.5 pt-1">
              <input
                type="text"
                value={saveSearchName}
                onChange={(e) => setSaveSearchName(e.target.value)}
                placeholder="e.g. Fintech Series A HR"
                className="w-full bg-[#070c0a] border border-emerald-500/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleSaveSearch}
                disabled={isSavingSearch || !saveSearchName.trim()}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 font-bold rounded-lg flex items-center gap-1 shrink-0 transition"
              >
                <Plus size={12} /> Save
              </button>
            </div>
            {savedSearchNotice && (
              <p className="text-[11px] text-emerald-400">{savedSearchNotice}</p>
            )}
          </div>
        )}
      </div>

      {/* ── Filter Group 1: Person Filters ──────────────────────────────── */}
      <div className="border border-emerald-500/10 rounded-xl overflow-hidden bg-[#0a110f]">
        <button
          type="button"
          onClick={() => toggleSection('person')}
          className="w-full flex items-center justify-between p-3 text-xs font-semibold text-slate-300 hover:bg-emerald-500/5 transition"
        >
          <span className="flex items-center gap-2">
            <User size={14} className="text-emerald-400" />
            Person & Role Filters
          </span>
          {openSections.person ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {openSections.person && (
          <div className="p-3 pt-1 space-y-4 border-t border-emerald-500/10 text-xs">
            {/* Job Titles Tag Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400">Job Titles</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag('titles', titleInput, () => setTitleInput(''))
                    }
                  }}
                  placeholder="e.g. Founder, CEO, VP Eng..."
                  className="w-full bg-[#070c0a] border border-emerald-500/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => addTag('titles', titleInput, () => setTitleInput(''))}
                  className="px-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg border border-emerald-500/30"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Title chips */}
              {filters.titles.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {filters.titles.map((title) => (
                    <span
                      key={title}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 rounded-md text-[11px]"
                    >
                      {title}
                      <X
                        size={10}
                        className="cursor-pointer hover:text-white"
                        onClick={() => removeTag('titles', title)}
                      />
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Seniority Checkboxes */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400">Seniority Level</label>
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {SENIORITY_OPTIONS.map((opt) => {
                  const checked = filters.seniorities.includes(opt.value)
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-1.5 p-1.5 rounded-md cursor-pointer text-[11px] border transition ${
                        checked
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-medium'
                          : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCheckbox('seniorities', opt.value)}
                        className="hidden"
                      />
                      <div
                        className={`w-3 h-3 rounded flex items-center justify-center border ${
                          checked ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-slate-700'
                        }`}
                      >
                        {checked && <Check size={10} strokeWidth={3} />}
                      </div>
                      <span className="truncate">{opt.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Department Checkboxes */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400">Department / Function</label>
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {DEPARTMENT_OPTIONS.map((opt) => {
                  const checked = filters.departments.includes(opt.value)
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-1.5 p-1.5 rounded-md cursor-pointer text-[11px] border transition ${
                        checked
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-medium'
                          : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCheckbox('departments', opt.value)}
                        className="hidden"
                      />
                      <div
                        className={`w-3 h-3 rounded flex items-center justify-center border ${
                          checked ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-slate-700'
                        }`}
                      >
                        {checked && <Check size={10} strokeWidth={3} />}
                      </div>
                      <span className="truncate">{opt.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Exclude Title Keywords */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Ban size={11} className="text-rose-400" /> Exclude Title Keywords
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={excludeTitleInput}
                  onChange={(e) => setExcludeTitleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag('excludedTitleKeywords', excludeTitleInput, () => setExcludeTitleInput(''))
                    }
                  }}
                  placeholder="e.g. Intern, Assistant, Student..."
                  className="w-full bg-[#070c0a] border border-rose-500/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={() => addTag('excludedTitleKeywords', excludeTitleInput, () => setExcludeTitleInput(''))}
                  className="px-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg border border-rose-500/30"
                >
                  <Plus size={14} />
                </button>
              </div>

              {filters.excludedTitleKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {filters.excludedTitleKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-950/60 border border-rose-500/30 text-rose-300 rounded-md text-[11px]"
                    >
                      -{kw}
                      <X
                        size={10}
                        className="cursor-pointer hover:text-white"
                        onClick={() => removeTag('excludedTitleKeywords', kw)}
                      />
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Years in role */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400">Years in Current Role</label>
              <select
                value={filters.yearsInRole}
                onChange={(e) => onChange({ ...filters, yearsInRole: e.target.value })}
                className="w-full bg-[#070c0a] border border-emerald-500/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
              >
                {YEARS_IN_ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Person Location */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400">Person Location</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={personLocInput}
                  onChange={(e) => setPersonLocInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag('personLocations', personLocInput, () => setPersonLocInput(''))
                    }
                  }}
                  placeholder="e.g. San Francisco, India, London..."
                  className="w-full bg-[#070c0a] border border-emerald-500/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => addTag('personLocations', personLocInput, () => setPersonLocInput(''))}
                  className="px-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg border border-emerald-500/30"
                >
                  <Plus size={14} />
                </button>
              </div>

              {filters.personLocations.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {filters.personLocations.map((loc) => (
                    <span
                      key={loc}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 rounded-md text-[11px]"
                    >
                      {loc}
                      <X
                        size={10}
                        className="cursor-pointer hover:text-white"
                        onClick={() => removeTag('personLocations', loc)}
                      />
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Filter Group 2: Company Filters ─────────────────────────────── */}
      <div className="border border-emerald-500/10 rounded-xl overflow-hidden bg-[#0a110f]">
        <button
          type="button"
          onClick={() => toggleSection('company')}
          className="w-full flex items-center justify-between p-3 text-xs font-semibold text-slate-300 hover:bg-emerald-500/5 transition"
        >
          <span className="flex items-center gap-2">
            <Building size={14} className="text-emerald-400" />
            Company & Industry Filters
          </span>
          {openSections.company ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {openSections.company && (
          <div className="p-3 pt-1 space-y-4 border-t border-emerald-500/10 text-xs">
            {/* Company Name / Domain Input + Mode Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-slate-400">Company Name / Domain</label>
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800 text-[10px]">
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, companyMode: 'include' })}
                    className={`px-1.5 py-0.5 rounded ${
                      filters.companyMode === 'include'
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    Include
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, companyMode: 'exclude' })}
                    className={`px-1.5 py-0.5 rounded ${
                      filters.companyMode === 'exclude'
                        ? 'bg-rose-500/20 text-rose-300 font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    Exclude
                  </button>
                </div>
              </div>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={companyInput}
                  onChange={(e) => setCompanyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag('companyNames', companyInput, () => setCompanyInput(''))
                    }
                  }}
                  placeholder="e.g. Stripe, google.com, Airbnb..."
                  className="w-full bg-[#070c0a] border border-emerald-500/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => addTag('companyNames', companyInput, () => setCompanyInput(''))}
                  className="px-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg border border-emerald-500/30"
                >
                  <Plus size={14} />
                </button>
              </div>

              {filters.companyNames.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {filters.companyNames.map((comp) => (
                    <span
                      key={comp}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] border ${
                        filters.companyMode === 'exclude'
                          ? 'bg-rose-950/60 border-rose-500/30 text-rose-300'
                          : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                      }`}
                    >
                      {filters.companyMode === 'exclude' ? `-${comp}` : comp}
                      <X
                        size={10}
                        className="cursor-pointer hover:text-white"
                        onClick={() => removeTag('companyNames', comp)}
                      />
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Headcount Ranges */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400">Employee Headcount</label>
              <div className="grid grid-cols-2 gap-1.5">
                {HEADCOUNT_OPTIONS.map((opt) => {
                  const checked = filters.headcountRanges.includes(opt.value)
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-1.5 p-1.5 rounded-md cursor-pointer text-[11px] border transition ${
                        checked
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-medium'
                          : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCheckbox('headcountRanges', opt.value)}
                        className="hidden"
                      />
                      <div
                        className={`w-3 h-3 rounded flex items-center justify-center border ${
                          checked ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-slate-700'
                        }`}
                      >
                        {checked && <Check size={10} strokeWidth={3} />}
                      </div>
                      <span className="truncate">{opt.value}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Funding Stage */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400">Funding Stage</label>
              <div className="grid grid-cols-2 gap-1.5">
                {FUNDING_STAGE_OPTIONS.map((opt) => {
                  const checked = filters.fundingStages.includes(opt.value)
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-1.5 p-1.5 rounded-md cursor-pointer text-[11px] border transition ${
                        checked
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-medium'
                          : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCheckbox('fundingStages', opt.value)}
                        className="hidden"
                      />
                      <div
                        className={`w-3 h-3 rounded flex items-center justify-center border ${
                          checked ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-slate-700'
                        }`}
                      >
                        {checked && <Check size={10} strokeWidth={3} />}
                      </div>
                      <span className="truncate">{opt.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Tech Stack used */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400">Technologies Used</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag('technologies', techInput, () => setTechInput(''))
                    }
                  }}
                  placeholder="e.g. React, AWS, Python, Salesforce..."
                  className="w-full bg-[#070c0a] border border-emerald-500/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => addTag('technologies', techInput, () => setTechInput(''))}
                  className="px-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg border border-emerald-500/30"
                >
                  <Plus size={14} />
                </button>
              </div>

              {filters.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {filters.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 rounded-md text-[11px]"
                    >
                      {tech}
                      <X
                        size={10}
                        className="cursor-pointer hover:text-white"
                        onClick={() => removeTag('technologies', tech)}
                      />
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Filter Group 3: Data Quality Toggles ─────────────────────────── */}
      <div className="border border-emerald-500/10 rounded-xl overflow-hidden bg-[#0a110f]">
        <button
          type="button"
          onClick={() => toggleSection('quality')}
          className="w-full flex items-center justify-between p-3 text-xs font-semibold text-slate-300 hover:bg-emerald-500/5 transition"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-400" />
            Contact Data Quality
          </span>
          {openSections.quality ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {openSections.quality && (
          <div className="p-3 pt-1 space-y-3 border-t border-emerald-500/10 text-xs">
            {/* Verified Email Only */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <span className="font-medium text-slate-200 group-hover:text-white">Verified Emails Only</span>
                <p className="text-[10px] text-slate-400">Strict zero-bounce email enforcement</p>
              </div>
              <input
                type="checkbox"
                checked={filters.verifiedEmailOnly}
                onChange={(e) => onChange({ ...filters, verifiedEmailOnly: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </label>

            {/* Has LinkedIn */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <span className="font-medium text-slate-200 group-hover:text-white">Has LinkedIn Profile</span>
                <p className="text-[10px] text-slate-400">Required for 1-click LinkedIn automation</p>
              </div>
              <input
                type="checkbox"
                checked={filters.hasLinkedIn}
                onChange={(e) => onChange({ ...filters, hasLinkedIn: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </label>

            {/* Has Phone */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <span className="font-medium text-slate-200 group-hover:text-white">Has Phone Number</span>
                <p className="text-[10px] text-slate-400">Direct dial / company line</p>
              </div>
              <input
                type="checkbox"
                checked={filters.hasPhone}
                onChange={(e) => onChange({ ...filters, hasPhone: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </label>
          </div>
        )}
      </div>

      {/* ── Filter Group 4: List Management & Exclusions ────────────────── */}
      <div className="border border-emerald-500/10 rounded-xl overflow-hidden bg-[#0a110f]">
        <button
          type="button"
          onClick={() => toggleSection('exclusions')}
          className="w-full flex items-center justify-between p-3 text-xs font-semibold text-slate-300 hover:bg-emerald-500/5 transition"
        >
          <span className="flex items-center gap-2">
            <Ban size={14} className="text-emerald-400" />
            List Management & Exclusions
          </span>
          {openSections.exclusions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {openSections.exclusions && (
          <div className="p-3 pt-1 space-y-3 border-t border-emerald-500/10 text-xs">
            {/* Exclude Saved Contacts */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <span className="font-medium text-slate-200 group-hover:text-white">Exclude Saved Contacts</span>
                <p className="text-[10px] text-slate-400">Do not re-show already saved people</p>
              </div>
              <input
                type="checkbox"
                checked={filters.excludeExistingContacts}
                onChange={(e) => onChange({ ...filters, excludeExistingContacts: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </label>

            {/* Exclude Contacted in last N days */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-200">Exclude Recently Contacted</span>
                <span className="text-emerald-400 font-bold">{filters.excludeContactedDays} days</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={filters.excludeContactedDays}
                onChange={(e) => onChange({ ...filters, excludeContactedDays: Number(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">Prevents contacting the same lead within 30 days</p>
            </div>

            {/* Always Enforced Suppression Notice */}
            <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-start gap-2">
              <ShieldCheck size={14} className="shrink-0 mt-0.5 text-emerald-400" />
              <span>
                <strong>Suppression List Enforced:</strong> Unsubscribed & bounced contacts are automatically excluded.
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
