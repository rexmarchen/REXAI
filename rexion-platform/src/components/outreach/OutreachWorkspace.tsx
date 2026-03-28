'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CompanySearch } from '@/components/outreach/CompanySearch'
import { ContactTable } from '@/components/outreach/ContactTable'
import { EmailComposer } from '@/components/outreach/EmailComposer'
import { OneClickOutreach } from '@/components/outreach/OneClickOutreach'
import { OutreachStepper } from '@/components/outreach/OutreachStepper'
import { SendConfirmation } from '@/components/outreach/SendConfirmation'
import { buildSuggestedSubject } from '@/lib/outreach/email'
import type { CompanyProfile, OutreachContactShape, OutreachTone } from '@/types'
import styles from '@/styles/outreach.module.css'

export function OutreachWorkspace() {
  const [step, setStep] = useState(1)
  const [company, setCompany] = useState<CompanyProfile | null>(null)
  const [contacts, setContacts] = useState<OutreachContactShape[]>([])
  const [tone, setTone] = useState<OutreachTone>('professional')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const restart = () => {
    setStep(1)
    setCompany(null)
    setContacts([])
    setTone('professional')
    setSubject('')
    setBody('')
  }

  const handleCompanySelect = (selectedCompany: CompanyProfile) => {
    setCompany(selectedCompany)
    setContacts([])
    setSubject(buildSuggestedSubject(selectedCompany.name))
    setStep(2)
  }

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Outreach Automation</h1>
          <p className={styles.copy}>
            Search the company, discover the right contacts, generate a focused email, then send and track the full campaign from one workflow.
          </p>
        </div>
        <div className={styles.headerActions}>
          <OneClickOutreach company={company} />
        </div>
      </div>

      <OutreachStepper step={step} />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {step === 1 ? (
          <CompanySearch selectedCompany={company} onSelect={handleCompanySelect} />
        ) : null}

        {step === 2 && company ? (
          <ContactTable
            company={company}
            selectedContacts={contacts}
            onBack={() => setStep(1)}
            onChange={setContacts}
            onNext={() => setStep(3)}
          />
        ) : null}

        {step === 3 && company ? (
          <EmailComposer
            company={company}
            contacts={contacts}
            tone={tone}
            subject={subject}
            body={body}
            onBack={() => setStep(2)}
            onBodyChange={setBody}
            onNext={() => setStep(4)}
            onSubjectChange={setSubject}
            onToneChange={setTone}
          />
        ) : null}

        {step === 4 && company ? (
          <SendConfirmation
            company={company}
            contacts={contacts}
            subject={subject}
            body={body}
            tone={tone}
            onBack={() => setStep(3)}
            onRestart={restart}
          />
        ) : null}
      </motion.div>
    </section>
  )
}
