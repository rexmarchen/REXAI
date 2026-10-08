'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export function UpgradeModal({
  open,
  onClose,
  requiredPlan,
  feature,
}: {
  open: boolean
  onClose: () => void
  requiredPlan: 'pro' | 'elite'
  feature: string
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.24 }}
            className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[var(--bg-surface)] p-7 shadow-glow"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="type-label">Upgrade Required</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">{feature}</h2>
                <p className="mt-3 max-w-md text-sm text-[var(--text-secondary)]">
                  This workflow is available on the {requiredPlan.toUpperCase()} plan and above.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard/billing"
                className="inline-flex rounded-full bg-[var(--accent-green)] px-5 py-3 text-sm font-semibold text-[#04110d]"
              >
                Upgrade Now
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex rounded-full border border-white/10 px-5 py-3 text-sm text-white"
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
