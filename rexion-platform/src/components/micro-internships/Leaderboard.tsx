'use client'

import { motion } from 'framer-motion'
import type { LeaderboardEntry } from '@/types'
import styles from '@/styles/micro.module.css'

export function Leaderboard({
  entries,
  domain,
  onDomainChange,
}: {
  entries: LeaderboardEntry[]
  domain: string
  onDomainChange: (domain: string) => void
}) {
  const filtered = domain === 'all' ? entries : entries.filter((entry) => entry.domain === domain)

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Fastest Micro-Gig to Full-Time Hall of Fame</h1>
          <p className={styles.copy}>The leaderboard rewards shipping speed, conversion velocity, and real money earned before the final offer.</p>
        </div>
      </div>

      <div className={styles.leaderboardCard}>
        <div className={styles.tabs}>
          {['all', 'Frontend', 'Data', 'Design'].map((value) => (
            <button
              key={value}
              className={domain === value ? styles.button : styles.buttonSubtle}
              onClick={() => onDomainChange(value)}
            >
              {value === 'all' ? 'All Domains' : value}
            </button>
          ))}
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>College</th>
              <th>Gig</th>
              <th>Company</th>
              <th>Days to Offer</th>
              <th>Earnings</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, index) => (
              <motion.tr
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
              >
                <td>{entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}</td>
                <td>{entry.name}</td>
                <td>{entry.college}</td>
                <td>{entry.gig}</td>
                <td>{entry.company}</td>
                <td>{entry.daysToOffer} days</td>
                <td>₹{entry.earnings.toLocaleString('en-IN')}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
