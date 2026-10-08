'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronDown } from 'lucide-react'
import { AVAILABLE_VARIABLES } from '@/types/outreach'

interface VariablePickerProps {
  onInsert: (variable: string) => void
}

// Group variables by their group
const grouped = AVAILABLE_VARIABLES.reduce<Record<string, typeof AVAILABLE_VARIABLES[number][]>>(
  (acc, v) => {
    ;(acc[v.group] ??= []).push(v)
    return acc
  },
  {}
)

export function VariablePicker({ onInsert }: VariablePickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleInsert = (key: string) => {
    onInsert(key)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-[var(--text-dim)] transition hover:border-white/20 hover:text-white"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Plus size={12} />
        Insert variable
        <ChevronDown size={11} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute bottom-full left-0 z-50 mb-1.5 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#0f1419] shadow-xl"
            role="listbox"
          >
            <div className="p-1">
              {Object.entries(grouped).map(([group, vars]) => (
                <div key={group}>
                  <p className="mb-0.5 mt-1.5 px-2.5 text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)] first:mt-0">
                    {group}
                  </p>
                  {vars.map((v) => (
                    <button
                      key={v.key}
                      onClick={() => handleInsert(v.key)}
                      className="group flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-white/5"
                      role="option"
                    >
                      <span className="rounded bg-[var(--blue)]/15 px-1.5 py-0.5 font-mono text-[11px] text-[var(--blue)]">
                        {v.key}
                      </span>
                      <span className="text-[var(--text-dim)] group-hover:text-white">{v.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
