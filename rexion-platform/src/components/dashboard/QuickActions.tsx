import Link from 'next/link'
import styles from '@/styles/dashboard.module.css'

const actions = [
  { href: '/dashboard/outreach', label: '⚡ New Outreach' },
  { href: '/dashboard/job-matches', label: '🎯 Find Jobs' },
  { href: '/dashboard/micro-internships', label: '💼 Browse Gigs' },
]

export function QuickActions() {
  return (
    <div className={styles.card}>
      <h3>Quick Actions</h3>
      <div className={styles.actionList}>
        {actions.map((action) => (
          <Link key={action.href} href={action.href} className={styles.quickButton}>
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
