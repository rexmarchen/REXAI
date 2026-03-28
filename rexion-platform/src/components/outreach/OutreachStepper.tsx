'use client'

import { Check } from 'lucide-react'
import styles from '@/styles/outreach.module.css'

const steps = [
  { label: 'Search Company', copy: 'Pick a company with active hiring signals.' },
  { label: 'Select Contacts', copy: 'Choose the people worth reaching first.' },
  { label: 'Compose Email', copy: 'Generate and refine the cold email.' },
  { label: 'Send & Track', copy: 'Review, queue, and monitor the campaign.' },
]

export function OutreachStepper({ step }: { step: number }) {
  return (
    <div className={styles.stepper}>
      {steps.map((item, index) => {
        const current = index + 1
        const isActive = current === step
        const isComplete = current < step

        return (
          <div
            key={item.label}
            className={`${styles.stepCard} ${isActive ? styles.stepActive : ''} ${
              isComplete ? styles.stepComplete : ''
            }`}
          >
            <span className={styles.stepBadge}>{isComplete ? <Check size={16} /> : current}</span>
            <strong className={styles.stepLabel}>{item.label}</strong>
            <span className={styles.stepCopy}>{item.copy}</span>
          </div>
        )
      })}
    </div>
  )
}
