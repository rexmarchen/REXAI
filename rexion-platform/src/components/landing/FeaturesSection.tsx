'use client'

import { motion } from 'framer-motion'
import styles from '@/styles/landing.module.css'

const features = [
  {
    title: 'Outreach Automation',
    copy: 'Search any company, find HR contacts, generate personalized outreach, and send a clean campaign with trackable follow-ups.',
    large: true,
    extra: 'Mini stepper workflow',
  },
  {
    title: 'Resume Analyzer',
    copy: 'Upload your resume, get brutally useful feedback, and tighten your story before it reaches another hiring manager.',
  },
  {
    title: 'AI Job Matching',
    copy: 'Stop doomscrolling boards. REXION ranks the roles that fit your profile and current momentum.',
  },
  {
    title: 'Micro-Internship Arena',
    copy: 'Earn ₹8k–25k on short paid gigs at companies already showing pre-hiring signals.',
    extra: 'Pre-hiring signal',
  },
  {
    title: '1-Click Domination Mode',
    copy: 'Apply, email, network, and schedule follow-ups from one command surface instead of four disconnected tools.',
    large: true,
    extra: 'Parallel action flow',
  },
  {
    title: 'Application Tracker',
    copy: 'Know exactly where every application stands and which follow-up is due next.',
  },
  {
    title: 'AI Cold Email Generator',
    copy: 'Paste the role, keep your voice, and produce outreach that feels tailored instead of templated.',
  },
  {
    title: 'Rejection Autopsy',
    copy: 'See where your story lost conviction and what to fix before the next cycle.',
    extra: 'Coming soon',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionKicker}>Everything you need to get hired faster</span>
          <h2 className={styles.sectionTitle}>A full operating system for early-career hiring.</h2>
          <p className={styles.sectionDescription}>
            Built for freshers, students, and sharp early-career operators who want better signals, tighter outreach, and more conversion.
          </p>
        </div>

        <div className={styles.featureGrid} id="how-it-works">
          {features.map((feature, index) => (
            <motion.article
              key={feature.title}
              className={`${styles.featureCard} ${feature.large ? styles.featureLarge : ''}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className={styles.featureTitle}>
                <span>✦</span>
                {feature.title}
              </div>
              <p className={styles.featureCopy}>{feature.copy}</p>
              {feature.extra ? <span className={styles.miniBadge}>{feature.extra}</span> : null}
              {feature.title === 'Outreach Automation' ? (
                <div className={styles.featureMock}>
                  <div className={styles.mockLine} style={{ width: '68%' }} />
                  <div className={styles.mockLine} style={{ width: '82%' }} />
                  <div className={styles.mockLine} style={{ width: '57%' }} />
                </div>
              ) : null}
              {feature.title === '1-Click Domination Mode' ? (
                <div className={styles.featureFlow}>
                  <div className={styles.flowGrid}>
                    <div className={styles.flowNode} />
                    <div className={styles.flowNode} />
                    <div className={styles.flowNode} />
                    <div className={styles.flowNode} />
                  </div>
                </div>
              ) : null}
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
