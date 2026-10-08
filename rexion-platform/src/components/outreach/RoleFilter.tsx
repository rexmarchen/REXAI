'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, Search } from 'lucide-react'

const ROLES = [
  'Founder',
  'Co-Founder',
  'CEO',
  'HR Manager',
  'Recruiter',
  'Hiring Manager',
  'Talent Acquisition',
  'Engineering Manager',
  'Talent Partner',
  'CTO',
]

interface RoleFilterProps {
  selected: string[]
  onChange: (roles: string[]) => void
}

export function RoleFilter({ selected, onChange }: RoleFilterProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const filtered = ROLES.filter((r) => r.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggle = (role: string) => {
    onChange(selected.includes(role) ? selected.filter((r) => r !== role) : [...selected, role])
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
          selected.length > 0
            ? 'border-[var(--blue)]/40 bg-[var(--blue)]/10 text-[var(--blue)]'
            : 'border-white/10 bg-white/5 text-[var(--text-dim)] hover:border-white/20 hover:text-white'
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        Role
        {selected.length > 0 && (
          <span className="rounded-full bg-[var(--blue)]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--blue)]">
            {selected.length}
          </span>
        )}
        <ChevronDown size={12} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#0f1419] shadow-xl"
            role="listbox"
            aria-multiselectable="true"
          >
            <div className="border-b border-white/8 p-2">
              <div className="flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5">
                <Search size={12} className="shrink-0 text-[var(--text-dim)]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search roles..."
                  className="w-full bg-transparent text-xs text-white placeholder-[var(--text-dim)] outline-none"
                  aria-label="Search roles"
                />
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto p-1">
              {filtered.map((role) => (
                <button
                  key={role}
                  onClick={() => toggle(role)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-white/5"
                  role="option"
                  aria-selected={selected.includes(role)}
                >
                  <span
                    className={`inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition ${
                      selected.includes(role)
                        ? 'border-[var(--blue)] bg-[var(--blue)]'
                        : 'border-white/20 bg-transparent'
                    }`}
                  >
                    {selected.includes(role) && <Check size={9} className="text-white" />}
                  </span>
                  <span className={selected.includes(role) ? 'text-white' : 'text-[var(--text-dim)]'}>
                    {role}
                  </span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-2.5 py-3 text-center text-xs text-[var(--text-dim)]">No roles found</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
