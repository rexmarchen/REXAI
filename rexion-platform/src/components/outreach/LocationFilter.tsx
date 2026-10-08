'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, Search } from 'lucide-react'

const LOCATIONS = [
  'India',
  'United States',
  'United Kingdom',
  'Remote',
  'Delhi',
  'Bangalore',
  'Mumbai',
  'Pune',
  'Hyderabad',
  'Chennai',
  'Singapore',
  'Dubai',
]

interface LocationFilterProps {
  selected: string[]
  onChange: (locations: string[]) => void
}

export function LocationFilter({ selected, onChange }: LocationFilterProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const filtered = LOCATIONS.filter((l) => l.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggle = (loc: string) => {
    onChange(selected.includes(loc) ? selected.filter((l) => l !== loc) : [...selected, loc])
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
      >
        Location
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
            className="absolute left-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#0f1419] shadow-xl"
            role="listbox"
            aria-multiselectable="true"
          >
            <div className="border-b border-white/8 p-2">
              <div className="flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5">
                <Search size={12} className="shrink-0 text-[var(--text-dim)]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search location..."
                  className="w-full bg-transparent text-xs text-white placeholder-[var(--text-dim)] outline-none"
                  aria-label="Search locations"
                />
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto p-1">
              {filtered.map((loc) => (
                <button
                  key={loc}
                  onClick={() => toggle(loc)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-white/5"
                  role="option"
                  aria-selected={selected.includes(loc)}
                >
                  <span
                    className={`inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition ${
                      selected.includes(loc)
                        ? 'border-[var(--blue)] bg-[var(--blue)]'
                        : 'border-white/20 bg-transparent'
                    }`}
                  >
                    {selected.includes(loc) && <Check size={9} className="text-white" />}
                  </span>
                  <span className={selected.includes(loc) ? 'text-white' : 'text-[var(--text-dim)]'}>
                    {loc}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
