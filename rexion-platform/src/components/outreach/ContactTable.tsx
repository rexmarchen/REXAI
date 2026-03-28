'use client'

import { motion } from 'framer-motion'
import { Eye, Linkedin, Mail } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useFindContacts } from '@/hooks/useOutreach'
import { maskEmail } from '@/lib/outreach/contacts'
import type { CompanyProfile, OutreachContactShape } from '@/types'
import styles from '@/styles/outreach.module.css'

type FilterKey = 'all' | 'hr' | 'recruiter' | 'founder' | 'manager'

function matchesFilter(contact: OutreachContactShape, filter: FilterKey) {
  const role = contact.role.toLowerCase()
  if (filter === 'all') return true
  if (filter === 'hr') return role.includes('talent') || role.includes('hr')
  if (filter === 'recruiter') return role.includes('recruit')
  if (filter === 'founder') return role.includes('founder')
  return role.includes('manager')
}

function avatarClassName(role: string) {
  const normalized = role.toLowerCase()
  if (normalized.includes('founder')) {
    return `${styles.contactAvatar} ${styles.contactAvatarFounder}`
  }
  if (normalized.includes('recruit')) {
    return `${styles.contactAvatar} ${styles.contactAvatarRecruiter}`
  }
  return styles.contactAvatar
}

export function ContactTable({
  company,
  selectedContacts,
  onBack,
  onChange,
  onNext,
}: {
  company: CompanyProfile
  selectedContacts: OutreachContactShape[]
  onBack: () => void
  onChange: (contacts: OutreachContactShape[]) => void
  onNext: () => void
}) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [previewContact, setPreviewContact] = useState<OutreachContactShape | null>(null)
  const { data, isLoading, isError } = useFindContacts(company.name, company.domain, Boolean(company))

  const contacts = data || []
  const filteredContacts = useMemo(
    () => contacts.filter((contact) => matchesFilter(contact, filter)),
    [contacts, filter]
  )

  const selectedIds = new Set(selectedContacts.map((contact) => contact.id))

  const updateSelection = (contact: OutreachContactShape) => {
    if (selectedIds.has(contact.id)) {
      onChange(selectedContacts.filter((item) => item.id !== contact.id))
      return
    }

    onChange([...selectedContacts, contact])
  }

  const selectGroup = (group: FilterKey) => {
    const groupContacts = contacts.filter((contact) => matchesFilter(contact, group))
    const merged = new Map(selectedContacts.map((contact) => [contact.id, contact]))
    groupContacts.forEach((contact) => merged.set(contact.id, contact))
    onChange([...merged.values()])
  }

  return (
    <section className={styles.surface}>
      <div className={styles.campaignHeader}>
        <div>
          <h2 className={styles.strong}>Finding contacts at {company.name}</h2>
          <p className={styles.copy}>
            The table merges Hunter- and Apollo-style contact results, then keeps the strongest record per email.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.buttonGhost} onClick={onBack}>
            Back
          </button>
        </div>
      </div>

      <div className={styles.filterRow}>
        {[
          ['all', 'All'],
          ['hr', 'HR'],
          ['recruiter', 'Recruiters'],
          ['founder', 'Founders'],
          ['manager', 'Hiring Managers'],
        ].map(([value, label]) => (
          <button
            key={value}
            className={filter === value ? styles.button : styles.buttonSubtle}
            onClick={() => setFilter(value as FilterKey)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.actionRow}>
        <button className={styles.buttonSubtle} onClick={() => selectGroup('hr')}>
          Select All HR
        </button>
        <button className={styles.buttonSubtle} onClick={() => selectGroup('recruiter')}>
          Select All Recruiters
        </button>
      </div>

      {isLoading ? (
        <div className={styles.contactGrid}>
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </div>
      ) : null}

      {!isLoading && isError ? (
        <div className={styles.emptyState}>Contact discovery is unavailable right now. Try again in a moment.</div>
      ) : null}

      {!isLoading ? (
        <div className={styles.contactGrid}>
          {filteredContacts.map((contact, index) => (
            <motion.article
              key={contact.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.2 }}
              className={styles.contactCard}
            >
              <div className={styles.contactHeader}>
                <div className={styles.metaRow}>
                  <span className={avatarClassName(contact.role)}>{contact.name.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <div className={styles.strong}>{contact.name}</div>
                    <div className={styles.metaText}>{contact.role}</div>
                  </div>
                </div>

                <div className={styles.metaRow}>
                  <span className={styles.confidenceChip}>{contact.confidence}</span>
                  <label className={styles.metaRow}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(contact.id)}
                      onChange={() => updateSelection(contact)}
                    />
                    Select
                  </label>
                </div>
              </div>

              <div className={styles.metaRow}>
                <span className={styles.metaText}>
                  <Mail size={14} /> {maskEmail(contact.email)}
                </span>
                {contact.linkedinUrl ? (
                  <a href={contact.linkedinUrl} target="_blank" rel="noreferrer" className={styles.metaText}>
                    <Linkedin size={14} /> View LinkedIn
                  </a>
                ) : null}
              </div>

              <div className={styles.actionRow}>
                <button className={styles.buttonSubtle} onClick={() => setPreviewContact(contact)}>
                  <Eye size={14} /> Preview
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      ) : null}

      {previewContact ? (
        <div className={styles.previewCard}>
          <div className={styles.previewHeader}>
            <div>
              <div className={styles.strong}>{previewContact.name}</div>
              <div className={styles.metaText}>{previewContact.role}</div>
            </div>
            <span className={styles.confidenceChip}>{previewContact.email}</span>
          </div>
        </div>
      ) : null}

      <div className={styles.stickyBar}>
        <span className={styles.metaText}>{selectedContacts.length} contacts selected</span>
        <div className={styles.actionRow}>
          <button className={styles.buttonGhost} onClick={onBack}>
            Change Company
          </button>
          <button className={styles.button} onClick={onNext} disabled={selectedContacts.length === 0}>
            Next: Compose Email
          </button>
        </div>
      </div>
    </section>
  )
}
