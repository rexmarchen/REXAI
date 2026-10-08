'use client'

import { X } from 'lucide-react'
import type { FilterState } from '@/types/outreach'
import { RoleFilter } from './RoleFilter'
import { CompanyFilter } from './CompanyFilter'
import { LocationFilter } from './LocationFilter'

interface FilterBarProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--blue)]/30 bg-[var(--blue)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--blue)]">
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 hover:bg-[var(--blue)]/20"
        aria-label={`Remove ${label} filter`}
      >
        <X size={9} />
      </button>
    </span>
  )
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const setRoles = (roles: string[]) => onChange({ ...filters, roles })
  const setCompanies = (companies: string[]) => onChange({ ...filters, companies })
  const setLocations = (locations: string[]) => onChange({ ...filters, locations })

  const removeRole = (r: string) => setRoles(filters.roles.filter((x) => x !== r))
  const removeCompany = (c: string) => setCompanies(filters.companies.filter((x) => x !== c))
  const removeLocation = (l: string) => setLocations(filters.locations.filter((x) => x !== l))

  const hasActiveFilters =
    filters.roles.length > 0 || filters.companies.length > 0 || filters.locations.length > 0

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <RoleFilter selected={filters.roles} onChange={setRoles} />
        <CompanyFilter selected={filters.companies} onChange={setCompanies} />
        <LocationFilter selected={filters.locations} onChange={setLocations} />

        {hasActiveFilters && (
          <button
            onClick={() => onChange({ ...filters, roles: [], companies: [], locations: [] })}
            className="text-xs text-[var(--text-dim)] hover:text-white transition"
          >
            Clear all
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5">
          {filters.roles.map((r) => (
            <FilterChip key={r} label={r} onRemove={() => removeRole(r)} />
          ))}
          {filters.companies.map((c) => (
            <FilterChip key={c} label={c} onRemove={() => removeCompany(c)} />
          ))}
          {filters.locations.map((l) => (
            <FilterChip key={l} label={l} onRemove={() => removeLocation(l)} />
          ))}
        </div>
      )}
    </div>
  )
}
