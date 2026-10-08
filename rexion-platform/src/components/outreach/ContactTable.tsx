'use client'

import type { OutreachContact } from '@/types/outreach'
import { ContactRow } from './ContactRow'
import { ContactTableSkeleton } from './SkeletonLoader'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { Users } from 'lucide-react'

interface ContactTableProps {
  contacts: OutreachContact[]
  selectedIds: Set<string>
  onToggle: (contact: OutreachContact) => void
  onSelectAll: () => void
  onClearAll: () => void
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  isFiltered: boolean
  onClearFilters: () => void
}

export function ContactTable({
  contacts,
  selectedIds,
  onToggle,
  onSelectAll,
  onClearAll,
  isLoading,
  isError,
  onRetry,
  isFiltered,
  onClearFilters,
}: ContactTableProps) {
  const allSelected = contacts.length > 0 && contacts.every((c) => selectedIds.has(c.id))

  if (isLoading) return <ContactTableSkeleton />
  if (isError) return <ErrorState title="Unable to load contacts" message="Something went wrong while searching for contacts." onRetry={onRetry} />

  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={isFiltered ? 'No people found' : 'Start searching for people'}
        description={
          isFiltered
            ? 'Try adjusting your role, company, or location filters.'
            : 'Search for a name, company, or role above.'
        }
        action={isFiltered ? { label: 'Clear filters', onClick: onClearFilters } : undefined}
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/8 bg-[#0b0e13]">
      {/* Table Header */}
      <div
        className="flex items-center gap-4 border-b border-white/8 px-4 py-2"
        role="row"
      >
        <button
          onClick={allSelected ? onClearAll : onSelectAll}
          className={`inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition ${
            allSelected ? 'border-[var(--blue)] bg-[var(--blue)]' : 'border-white/20 hover:border-white/40'
          }`}
          aria-label={allSelected ? 'Deselect all' : 'Select all'}
        >
          {allSelected && (
            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
              <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <span className="flex-1 text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)]">
          Person
        </span>
        <span className="hidden w-40 shrink-0 text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)] sm:block">
          Role
        </span>
        <span className="hidden w-36 shrink-0 text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)] md:block">
          Company
        </span>
        <span className="hidden w-32 shrink-0 text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)] lg:block">
          Location
        </span>
        <span className="hidden flex-1 text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)] xl:block">
          Email
        </span>
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)]">
          Status
        </span>
      </div>

      {/* Rows */}
      <div role="rowgroup">
        {contacts.map((contact) => (
          <ContactRow
            key={contact.id}
            contact={contact}
            selected={selectedIds.has(contact.id)}
            onToggle={onToggle}
          />
        ))}
      </div>

      {/* Footer */}
      {contacts.length > 0 && (
        <div className="border-t border-white/8 px-4 py-2">
          <span className="text-xs text-[var(--text-dim)]">
            {contacts.length} {contacts.length === 1 ? 'person' : 'people'} found
            {selectedIds.size > 0 && (
              <span className="ml-2 text-white">
                · {selectedIds.size} selected
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  )
}
