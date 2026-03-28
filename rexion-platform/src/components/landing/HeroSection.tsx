'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import styles from '@/styles/landing.module.css'
import { ParticleBackground } from '@/components/landing/ParticleBackground'

const stats = [
  '2,847 cold emails sent today',
  '94% average open rate',
  '312 interviews booked this week',
]

export function HeroSection() {
  return (
    <section className={styles.hero}>
      <ParticleBackground />
      <div className={styles.heroInner}>
        <div className={styles.heroContent}>
          <motion.div initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowMark} />
              The AI Job Hacking System — Now Live
            </span>
          </motion.div>

          <motion.h1 className={styles.headline} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.15 }}>
            Stop Applying.
            <br />
            Start Getting <span className={styles.headlineAccent}>Hired.</span>
          </motion.h1>

          <motion.p className={styles.subheadline} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.32 }}>
            REXION finds jobs, discovers HR contacts, writes your cold emails, and auto-applies while you focus on interviews and conversion-ready work.
          </motion.p>

          <motion.div className={styles.ctaRow} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.46 }}>
            <Link href="/signup" className={styles.primaryButton}>
              Start Free →
            </Link>
            <a href="#pricing" className={styles.secondaryButton}>
              Watch Demo ▶
            </a>
          </motion.div>

          <motion.div className={styles.statsGrid} initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.58 }}>
            {stats.map((stat) => (
              <article key={stat} className={styles.statCard}>
                <strong>{stat.split(' ')[0]}</strong>
                <span className={styles.statValue}>{stat}</span>
              </article>
            ))}
          </motion.div>

          <motion.div className={styles.scrollHint} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            ↓ Scroll to see the full workflow
          </motion.div>
        </div>
      </div>
    </section>
  )
}
