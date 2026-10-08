'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { OutreachContact } from '@/types/outreach'

interface SelectionBarProps {
  selected: OutreachContact[]
  onClear: () => void
}

export function SelectionBar({ selected, onClear }: SelectionBarProps) {
  const router = useRouter()
  const count = selected.length

  const handleContinue = () => {
    // Store in sessionStorage so the compose page can pick it up
    sessionStorage.setItem('outreach:selectedContacts', JSON.stringify(selected.map((c) => c.id)))
    router.push('/dashboard/outreach/new')
  }

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className="fixed inset-x-4 bottom-20 z-40 mx-auto max-w-2xl lg:bottom-6"
          role="status"
          aria-live="polite"
          aria-label={`${count} contacts selected`}
        >
          <div className="flex items-center justify-between rounded-xl border border-white/12 bg-[#111620] px-5 py-3 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--blue)] text-[11px] font-semibold text-white">
                {count}
              </span>
              <span className="text-sm text-white">
                {count === 1 ? '1 contact' : `${count} contacts`} selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClear}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-[var(--text-dim)] transition hover:bg-white/5 hover:text-white"
                aria-label="Clear selection"
              >
                <X size={12} />
                Clear
              </button>
              <button
                onClick={handleContinue}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--blue)] px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
              >
                Continue
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
