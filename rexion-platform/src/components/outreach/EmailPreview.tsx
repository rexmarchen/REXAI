'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { OutreachContact } from '@/types/outreach'
import { resolveVariables } from '@/lib/outreach/variables'
import { ContactAvatar } from './ContactAvatar'
import { PreviewNavigator } from './PreviewNavigator'
import { PreviewSkeleton } from './SkeletonLoader'

interface EmailPreviewProps {
  contacts: OutreachContact[]
  subject: string
  body: string
  currentIndex: number
  onNavigate: (index: number) => void
  isLoading?: boolean
}

export function EmailPreview({
  contacts,
  subject,
  body,
  currentIndex,
  onNavigate,
  isLoading,
}: EmailPreviewProps) {
  const contact = contacts[currentIndex]

  const resolvedSubject = contact ? resolveVariables(subject, contact) : subject
  const resolvedBody = contact ? resolveVariables(body, contact) : body

  return (
    <div className="flex h-full flex-col rounded-xl border border-white/8 bg-[#0b0e13]">
      {/* Preview header */}
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <span className="text-xs font-medium text-white">Preview</span>
        {contacts.length > 0 && (
          <PreviewNavigator
            current={currentIndex}
            total={contacts.length}
            onChange={onNavigate}
          />
        )}
      </div>

      {/* Preview body */}
      {isLoading ? (
        <PreviewSkeleton />
      ) : !contact ? (
        <div className="flex flex-1 items-center justify-center text-xs text-[var(--text-dim)]">
          Select contacts to preview emails
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="flex-1 overflow-y-auto p-5"
          >
            {/* To */}
            <div className="mb-4 flex items-center gap-2.5">
              <ContactAvatar contact={contact} size="md" />
              <div>
                <p className="text-xs font-medium text-white">
                  {contact.firstName} {contact.lastName}
                </p>
                <p className="text-[11px] text-[var(--text-dim)]">{contact.email}</p>
              </div>
            </div>

            {/* Subject */}
            <div className="mb-4">
              <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)]">
                Subject
              </p>
              <p className="text-sm font-medium text-white">{resolvedSubject || '—'}</p>
            </div>

            <div className="mb-4 border-t border-white/8" />

            {/* Body */}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#c8d0d9]">
              {resolvedBody || <span className="text-[var(--text-dim)]">No message yet</span>}
            </p>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
