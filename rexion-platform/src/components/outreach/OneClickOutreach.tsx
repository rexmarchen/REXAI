'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, LoaderCircle, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { mockCompanies } from '@/lib/mock-data'
import { selectTopContacts } from '@/lib/outreach/contacts'
import type { CompanyProfile, OutreachContactShape } from '@/types'
import styles from '@/styles/outreach.module.css'

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const oneClickSteps = [
  'Searching for top contacts...',
  'Generating personalized email...',
  'Queuing emails...',
  'Done. Emails sent.',
]

export function OneClickOutreach({
  company,
  onCompleted,
}: {
  company?: CompanyProfile | null
  onCompleted?: (payload: { company: CompanyProfile; contacts: OutreachContactShape[] }) => void
}) {
  const [open, setOpen] = useState(false)
  const [activeStep, setActiveStep] = useState(-1)
  const [done, setDone] = useState(false)
  const [working, setWorking] = useState(false)
  const companyToUse = useMemo(() => company || mockCompanies[0], [company])

  const runFlow = async () => {
    setOpen(true)
    setDone(false)
    setWorking(true)
    setActiveStep(0)

    try {
      const contactsResponse = await fetch('/api/outreach/find-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: companyToUse.name,
          domain: companyToUse.domain,
        }),
      })
      const contactsPayload = (await contactsResponse.json()) as OutreachContactShape[]
      const topContacts = selectTopContacts(Array.isArray(contactsPayload) ? contactsPayload : [])

      await wait(450)
      setActiveStep(1)

      const emailResponse = await fetch('/api/outreach/generate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: companyToUse.name,
          contactRole: topContacts[0]?.role || 'Recruiter',
          tone: 'professional',
        }),
      })
      const emailPayload = (await emailResponse.json()) as { subject: string; body: string }

      await wait(450)
      setActiveStep(2)

      await fetch('/api/outreach/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company: companyToUse,
          contacts: topContacts,
          subject: emailPayload.subject,
          body: emailPayload.body,
          tone: 'professional',
          openTracking: true,
          followUp: {
            enabled: true,
            days: 3,
            message: 'Checking back in with a quick follow-up.',
          },
        }),
      })

      await wait(300)
      setActiveStep(3)
      setDone(true)
      onCompleted?.({ company: companyToUse, contacts: topContacts })
      toast.success(`One-click outreach finished for ${companyToUse.name}.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'One-click outreach failed.')
    } finally {
      setWorking(false)
    }
  }

  return (
    <>
      <button className={styles.button} onClick={runFlow}>
        <Sparkles size={14} /> 1-Click AI Outreach
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!working) {
                setOpen(false)
              }
            }}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div>
                <h3 className={styles.title}>One-click outreach</h3>
                <p className={styles.copy}>
                  Running the automatic flow for {companyToUse.name}. If you have not selected a company yet, the flow uses the first recommended company.
                </p>
              </div>

              <div className={styles.oneClickList}>
                {oneClickSteps.map((label, index) => {
                  const isComplete = index < activeStep || (done && index === activeStep)
                  const isActive = index === activeStep && !done
                  return (
                    <div
                      key={label}
                      className={`${styles.oneClickStep} ${isComplete ? styles.oneClickDone : ''} ${
                        index > activeStep ? styles.oneClickPending : ''
                      }`}
                    >
                      <span>{label}</span>
                      {isComplete ? <CheckCircle2 size={18} /> : null}
                      {isActive ? <LoaderCircle size={18} className="animate-spin" /> : null}
                    </div>
                  )
                })}
              </div>

              <div className={styles.actionRow}>
                {!working ? (
                  <button className={styles.buttonGhost} onClick={() => setOpen(false)}>
                    Close
                  </button>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
