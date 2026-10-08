'use client'

import { Copy, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import type { OutreachContact } from '@/types/outreach'
import { ContactAvatar } from './ContactAvatar'

interface ContactRowProps {
  contact: OutreachContact
  selected: boolean
  onToggle: (contact: OutreachContact) => void
}

const verificationConfig = {
  verified: { label: 'Verified', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  likely: { label: 'Likely', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  unknown: { label: 'Unknown', className: 'bg-white/5 text-[var(--text-dim)] border-white/10' },
}

export function ContactRow({ contact, selected, onToggle }: ContactRowProps) {
  const vConfig = verificationConfig[contact.verified]

  const copyEmail = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(contact.email)
    toast.success('Email copied')
  }

  return (
    <div
      onClick={() => onToggle(contact)}
      className={`group flex cursor-pointer items-center gap-4 border-b border-white/5 px-4 py-2.5 transition hover:bg-white/[0.03] ${
        selected ? 'bg-[var(--blue)]/[0.04]' : ''
      }`}
      role="row"
      aria-selected={selected}
    >
      {/* Checkbox */}
      <span
        className={`inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition ${
          selected ? 'border-[var(--blue)] bg-[var(--blue)]' : 'border-white/20 bg-transparent group-hover:border-white/40'
        }`}
        aria-hidden="true"
      >
        {selected && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>

      {/* Person */}
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <ContactAvatar contact={contact} />
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-white">
            {contact.firstName} {contact.lastName}
          </p>
        </div>
      </div>

      {/* Role */}
      <div className="hidden w-40 shrink-0 sm:block">
        <p className="truncate text-xs text-[var(--text-dim)]">{contact.jobTitle}</p>
      </div>

      {/* Company */}
      <div className="hidden w-36 shrink-0 md:block">
        <p className="truncate text-xs text-[var(--text-dim)]">{contact.companyName}</p>
      </div>

      {/* Location */}
      <div className="hidden w-32 shrink-0 lg:block">
        <p className="truncate text-xs text-[var(--text-dim)]">{contact.location}</p>
      </div>

      {/* Email */}
      <div className="hidden min-w-0 flex-1 items-center gap-1.5 xl:flex">
        <p className="truncate text-xs text-[var(--text-dim)]">{contact.email}</p>
        <button
          onClick={copyEmail}
          className="shrink-0 opacity-0 transition group-hover:opacity-100"
          aria-label="Copy email address"
        >
          <Copy size={11} className="text-[var(--text-dim)] hover:text-white" />
        </button>
      </div>

      {/* Verification + LinkedIn */}
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${vConfig.className}`}
        >
          {vConfig.label}
        </span>
        {contact.linkedinUrl && (
          <a
            href={contact.linkedinUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 transition group-hover:opacity-60 hover:!opacity-100"
            aria-label="View LinkedIn profile"
          >
            <ExternalLink size={12} className="text-[var(--text-dim)]" />
          </a>
        )}
      </div>
    </div>
  )
}
