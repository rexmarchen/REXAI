import React from 'react'
import styles from '../../WorkspaceSection.module.css'

const BAR_VALUES = [42, 68, 51, 86, 60, 92, 74]
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const AnalyticsSection = () => {
  return (
    <section className={styles.page}>
      <h2 className={styles.pageTitle}>Analytics</h2>
      <p className={styles.pageSubtitle}>
        Track usage, response quality, latency and monthly spend.
      </p>

      <div className={styles.statsGrid}>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>API Calls Today</p>
          <p className={`${styles.statValue} ${styles.statBlue}`}>1,482</p>
          <p className={styles.statChange}>+23% vs yesterday</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Avg Response Time</p>
          <p className={`${styles.statValue} ${styles.statPurple}`}>1.2s</p>
          <p className={styles.statChange}>-15% faster</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Cost This Month</p>
          <p className={`${styles.statValue} ${styles.statGreen}`}>$12.40</p>
          <p className={styles.statChange}>Budget cap: $50</p>
        </article>
      </div>

      <article className={styles.analyticsChart}>
        <h3 className={styles.sectionDividerTitle}>Token Usage · Last 7 Days</h3>
        <div className={styles.bars}>
          {BAR_VALUES.map((value, index) => (
            <div key={`${value}-${index}`} className={styles.bar} style={{ height: `${value}%` }}></div>
          ))}
        </div>
        <div className={styles.barLabels}>
          {DAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
      </article>
    </section>
  )
}

export default AnalyticsSection
