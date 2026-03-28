import styles from '@/styles/dashboard.module.css'
import type { DashboardStat } from '@/types'

export function StatsCard({ stat }: { stat: DashboardStat }) {
  return (
    <article className={styles.card}>
      <div className={styles.statLabel}>{stat.label}</div>
      <div className={styles.statValue}>{stat.value}</div>
      <div className={styles.statChange}>{stat.change}</div>
    </article>
  )
}
