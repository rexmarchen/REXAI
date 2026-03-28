'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { toast } from 'sonner'
import type { MicroGigShape, SubscriptionPlan } from '@/types'
import styles from '@/styles/micro.module.css'

function buildPitch(gig: MicroGigShape) {
  const skills = gig.skills.slice(0, 3).join(', ')
  return `I can ship this ${gig.domain.toLowerCase()} sprint quickly because I already work comfortably with ${skills}. I can start fast, communicate clearly, and focus on delivering the specific outcome this team needs.`
}

export function ApplyModal({
  gig,
  open,
  plan,
  onClose,
}: {
  gig: MicroGigShape | null
  open: boolean
  plan: SubscriptionPlan
  onClose: () => void
}) {
  const [pitch, setPitch] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [canCommit, setCanCommit] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!gig) {
    return null
  }

  const submit = async () => {
    if (!canCommit) {
      toast.error('Confirm your availability before applying.')
      return
    }

    setIsSubmitting(true)
    const response = await fetch(`/api/micro-gigs/${gig.id}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pitch,
        startDate,
        resumeUrl: 'profile-resume.pdf',
      }),
    })

    const payload = (await response.json()) as { error?: string }
    if (!response.ok) {
      toast.error(payload.error || 'Application failed.')
      setIsSubmitting(false)
      return
    }

    toast.success('Application sent.')
    setSubmitted(true)
    setIsSubmitting(false)
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={styles.modalBackdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            onClick={(event) => event.stopPropagation()}
          >
            {!submitted ? (
              <>
                <div>
                  <h3 className={styles.title}>Apply to {gig.title}</h3>
                  <p className={styles.copy}>Two concise sentences, a start date, and a real commitment window are all you need.</p>
                </div>

                {plan === 'free' ? (
                  <div className={styles.notice}>
                    <div className={styles.strong}>Pro required to apply</div>
                    <div className={styles.muted}>
                      Free users can browse the arena, but applications unlock on Pro.
                    </div>
                    <Link href="/dashboard/billing" className={styles.button}>
                      Upgrade to Pro
                    </Link>
                  </div>
                ) : (
                  <div className={styles.formGrid}>
                    <div className={styles.field}>
                      <label>Resume</label>
                      <div className={styles.notice}>
                        Using the resume stored on your profile. You can update it from Settings later.
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label>Why are you the right person for this?</label>
                      <textarea
                        value={pitch}
                        onChange={(event) => setPitch(event.target.value.slice(0, 280))}
                        placeholder="Keep this to two sentences."
                      />
                      <div className={styles.inlineMeta}>
                        <span className={styles.muted}>{pitch.length}/280</span>
                        <button className={styles.buttonSubtle} onClick={() => setPitch(buildPitch(gig))}>
                          AI Help
                        </button>
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label>I can start</label>
                      <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                    </div>

                    <label className={styles.inlineMeta}>
                      <input
                        type="checkbox"
                        checked={canCommit}
                        onChange={(event) => setCanCommit(event.target.checked)}
                      />
                      I confirm I can commit {gig.duration} days to this gig.
                    </label>

                    <div className={styles.actionRow}>
                      <button className={styles.buttonGhost} onClick={onClose}>
                        Cancel
                      </button>
                      <button className={styles.button} onClick={submit} disabled={isSubmitting || !pitch.trim()}>
                        {isSubmitting ? 'Submitting...' : 'Submit Application'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.notice}>
                <div className={styles.strong}>Application sent</div>
                <div className={styles.muted}>We will notify you within 48 hours if the company moves you to review.</div>
                <button className={styles.button} onClick={onClose}>
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
