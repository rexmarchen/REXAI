'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { startTransition, useState } from 'react'
import { toast } from 'sonner'
import { buildSuggestedSubject, countWords, substituteEmailVariables } from '@/lib/outreach/email'
import type { CompanyProfile, OutreachContactShape, OutreachTone } from '@/types'
import styles from '@/styles/outreach.module.css'

const toneLabels: Array<{ value: OutreachTone; label: string }> = [
  { value: 'professional', label: 'Professional' },
  { value: 'bold', label: 'Bold' },
  { value: 'friendly', label: 'Friendly' },
]

const variables = ['{Name}', '{Company}', '{Role}', '{Position}', '{Date}']

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function EmailComposer({
  company,
  contacts,
  tone,
  subject,
  body,
  onBack,
  onBodyChange,
  onNext,
  onSubjectChange,
  onToneChange,
}: {
  company: CompanyProfile
  contacts: OutreachContactShape[]
  tone: OutreachTone
  subject: string
  body: string
  onBack: () => void
  onBodyChange: (body: string) => void
  onNext: () => void
  onSubjectChange: (subject: string) => void
  onToneChange: (tone: OutreachTone) => void
}) {
  const [previewIndex, setPreviewIndex] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const previewContact = contacts[previewIndex] || contacts[0]
  const personalizedPreview = previewContact
    ? substituteEmailVariables(body, company.name, previewContact)
    : body
  const wordCount = countWords(personalizedPreview)

  const generateEmail = async () => {
    setIsGenerating(true)
    toast.info('Generating email...')

    try {
      const response = await fetch('/api/outreach/generate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: company.name,
          contactRole: previewContact?.role || 'Hiring Manager',
          tone,
        }),
      })

      const payload = (await response.json()) as { subject?: string; body?: string; error?: string }
      if (!response.ok || !payload.body) {
        throw new Error(payload.error || 'Failed to generate email.')
      }

      onSubjectChange(payload.subject || buildSuggestedSubject(company.name, previewContact?.role))
      onBodyChange('')

      for (let index = 0; index < payload.body.length; index += 1) {
        await wait(5)
        startTransition(() => {
          onBodyChange(payload.body?.slice(0, index + 1) || '')
        })
      }

      toast.success('Email draft ready.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate email.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <section className={styles.surface}>
      <div className={styles.campaignHeader}>
        <div>
          <h2 className={styles.strong}>Compose email</h2>
          <p className={styles.copy}>
            Generate a concise draft, keep it under 150 words, and preview it against every selected contact before you queue it.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.buttonGhost} onClick={onBack}>
            Back
          </button>
        </div>
      </div>

      <div className={styles.toneRow}>
        {toneLabels.map((item) => (
          <button
            key={item.value}
            className={tone === item.value ? styles.button : styles.buttonSubtle}
            onClick={() => onToneChange(item.value)}
          >
            {item.label}
          </button>
        ))}
        <button className={styles.buttonGhost} onClick={generateEmail} disabled={isGenerating}>
          <Sparkles size={14} /> {isGenerating ? 'Generating...' : 'AI Generate'}
        </button>
      </div>

      <div className={styles.editorGrid}>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={styles.editorPane}>
          <div className={styles.field}>
            <label className={styles.strong}>Subject</label>
            <input
              value={subject}
              onChange={(event) => onSubjectChange(event.target.value)}
              placeholder={buildSuggestedSubject(company.name, previewContact?.role)}
            />
          </div>

          <div className={styles.chipRow}>
            {variables.map((variable) => (
              <button
                key={variable}
                className={styles.variableChip}
                onClick={() => onBodyChange(`${body}${body ? ' ' : ''}${variable}`)}
              >
                {variable}
              </button>
            ))}
          </div>

          <textarea
            value={body}
            onChange={(event) => onBodyChange(event.target.value)}
            placeholder="Hi {Name}, I’m reaching out because..."
          />
        </motion.div>

        <motion.aside initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={styles.previewPane}>
          <div className={styles.previewMeta}>
            <div>
              <div className={styles.strong}>Live preview</div>
              <div className={styles.metaText}>Rendering with actual contact data.</div>
            </div>
            <select value={previewIndex} onChange={(event) => setPreviewIndex(Number(event.target.value))}>
              {contacts.map((contact, index) => (
                <option key={contact.id} value={index}>
                  {contact.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.previewCard}>
            <div className={styles.metaText}>From: {company.name} candidate profile</div>
            <div className={styles.metaText}>To: {previewContact?.email || 'Selected contact'}</div>
            <div className={styles.strong}>Subject: {subject || buildSuggestedSubject(company.name, previewContact?.role)}</div>
            <div className={styles.divider} />
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{personalizedPreview || 'Your email preview will appear here.'}</div>
          </div>

          <span className={wordCount > 150 ? `${styles.statusChip} ${styles.statusWarning}` : styles.statusChip}>
            {wordCount > 150 ? 'Too long' : 'Looks great'} · {wordCount} words
          </span>
        </motion.aside>
      </div>

      <div className={styles.stickyBar}>
        <span className={styles.metaText}>Using {contacts.length} selected contacts for personalization.</span>
        <button className={styles.button} onClick={onNext} disabled={!subject.trim() || !body.trim()}>
          Next: Review & Send
        </button>
      </div>
    </section>
  )
}
