'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

interface SendConfirmationProps {
  isOpen: boolean
  recipientCount: number
  fromEmail?: string
  campaignName: string
  onConfirm: () => void
  onCancel: () => void
}

export function SendConfirmation({
  isOpen,
  recipientCount,
  fromEmail,
  campaignName,
  onConfirm,
  onCancel,
}: SendConfirmationProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2"
            role="dialog"
            aria-modal="true"
            aria-labelledby="send-modal-title"
          >
            <div className="overflow-hidden rounded-2xl border border-white/12 bg-[#0f1419] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                <h2 id="send-modal-title" className="text-sm font-semibold text-white">
                  Send campaign?
                </h2>
                <button
                  onClick={onCancel}
                  className="rounded-lg p-1 text-[var(--text-dim)] transition hover:bg-white/5 hover:text-white"
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-sm text-[var(--text-dim)]">
                  You&#39;re about to send{' '}
                  <span className="font-semibold text-white">
                    {recipientCount} personalized email{recipientCount !== 1 ? 's' : ''}
                  </span>{' '}
                  as part of <span className="font-semibold text-white">{campaignName || 'this campaign'}</span>.
                </p>

                <div className="space-y-2.5 rounded-xl border border-white/8 bg-white/[0.03] p-4">
                  {fromEmail && (
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)]">From</span>
                      <span className="text-right text-xs text-white">{fromEmail}</span>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)]">Recipients</span>
                    <span className="text-right text-xs text-white">{recipientCount}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)]">Personalization</span>
                    <span className="text-right text-xs text-emerald-400">Individual per recipient</span>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-dim)]">
                  Each recipient will receive an individually personalized message. This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-white/8 px-5 py-4">
                <button
                  onClick={onCancel}
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-[var(--text-dim)] transition hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="rounded-lg bg-[var(--blue)] px-5 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  Send {recipientCount} email{recipientCount !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
