'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Search } from 'lucide-react'

const RECENT_COMPANIES = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Flipkart', 'Swiggy', 'Razorpay']

interface CompanyFilterProps {
  selected: string[]
  onChange: (companies: string[]) => void
}

export function CompanyFilter({ selected, onChange }: CompanyFilterProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = RECENT_COMPANIES.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase())
  )

  const toggle = (company: string) => {
    onChange(selected.includes(company) ? selected.filter((c) => c !== company) : [...selected, company])
  }

  const handleQueryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim() && !selected.includes(query.trim())) {
      onChange([...selected, query.trim()])
      setQuery('')
    }
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
        Company
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
          >
            <div className="border-b border-white/8 p-2">
              <div className="flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5">
                <Search size={12} className="shrink-0 text-[var(--text-dim)]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleQueryKeyDown}
                  placeholder="Search company..."
                  className="w-full bg-transparent text-xs text-white placeholder-[var(--text-dim)] outline-none"
                  aria-label="Search companies"
                />
              </div>
            </div>
            <div className="p-2">
              <p className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)]">
                Recent
              </p>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {filtered.map((company) => (
                  <button
                    key={company}
                    onClick={() => toggle(company)}
                    className={`w-full rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                      selected.includes(company)
                        ? 'bg-[var(--blue)]/10 text-[var(--blue)]'
                        : 'text-[var(--text-dim)] hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {company}
                  </button>
                ))}
              </div>
              <p className="mt-2 px-2 text-[10px] text-[var(--text-dim)]">
                Press Enter to add custom company
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
