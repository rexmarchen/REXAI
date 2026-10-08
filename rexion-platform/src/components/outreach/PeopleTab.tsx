'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search } from 'lucide-react'
import type { FilterState, OutreachContact } from '@/types/outreach'
import { contactService } from '@/lib/outreach/contact-service'
import { FilterBar } from './FilterBar'
import { ContactTable } from './ContactTable'
import { SelectionBar } from './SelectionBar'

const INITIAL_FILTERS: FilterState = {
  query: '',
  roles: [],
  companies: [],
  locations: [],
  industries: [],
}

export function PeopleTab() {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)
  const [contacts, setContacts] = useState<OutreachContact[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isFiltered, setIsFiltered] = useState(false)
  const [selected, setSelected] = useState<OutreachContact[]>([])
  const searchRef = useRef<AbortController | null>(null)

  const doSearch = useCallback(async (f: FilterState) => {
    setIsLoading(true)
    setIsError(false)
    try {
      const result = await contactService.search(f)
      setContacts(result.contacts)
      setIsFiltered(result.isFiltered)
    } catch {
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounce query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        filters.query.trim() ||
        filters.roles.length > 0 ||
        filters.companies.length > 0 ||
        filters.locations.length > 0
      ) {
        void doSearch(filters)
      } else {
        setContacts([])
        setIsFiltered(false)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [filters, doSearch])

  const selectedIds = new Set(selected.map((c) => c.id))

  const toggle = (contact: OutreachContact) => {
    setSelected((prev) =>
      prev.some((c) => c.id === contact.id)
        ? prev.filter((c) => c.id !== contact.id)
        : [...prev, contact]
    )
  }

  const selectAll = () => {
    const newSelected = new Map(selected.map((c) => [c.id, c]))
    contacts.forEach((c) => newSelected.set(c.id, c))
    setSelected([...newSelected.values()])
  }

  const clearAll = () => setSelected([])

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS)
    setContacts([])
    setIsFiltered(false)
  }

  return (
    <div className="space-y-4">
      {/* Search header */}
      <div>
        <h2 className="text-sm font-semibold text-white">Find people</h2>
        <p className="mt-0.5 text-xs text-[var(--text-dim)]">
          Search founders, recruiters, hiring managers...
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]"
        />
        <input
          type="search"
          value={filters.query}
          onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
          placeholder="Search people, companies or roles..."
          className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 text-sm text-white placeholder-[var(--text-dim)] outline-none transition focus:border-[var(--blue)]/50 focus:bg-white/[0.07]"
          aria-label="Search people, companies, or roles"
          autoComplete="off"
        />
      </div>

      {/* Filters */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Results */}
      <ContactTable
        contacts={contacts}
        selectedIds={selectedIds}
        onToggle={toggle}
        onSelectAll={selectAll}
        onClearAll={clearAll}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void doSearch(filters)}
        isFiltered={isFiltered}
        onClearFilters={clearFilters}
      />

      {/* Floating selection bar */}
      <SelectionBar selected={selected} onClear={clearAll} />
    </div>
  )
}
