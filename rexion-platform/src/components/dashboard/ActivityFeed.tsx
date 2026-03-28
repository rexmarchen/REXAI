import styles from '@/styles/dashboard.module.css'
import type { ActivityItem } from '@/types'

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className={styles.card}>
      <h3>Recent Activity</h3>
      <div className={styles.activityList}>
        {items.map((item) => (
          <article key={item.id} className={styles.activityItem}>
            <div>
              <strong>{item.title}</strong>
              <div>{item.timestamp}</div>
            </div>
            <span>{item.category}</span>
          </article>
        ))}
      </div>
    </div>
  )
}
