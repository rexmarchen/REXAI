'use client'

import { Bell } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import styles from '@/styles/dashboard.module.css'
import type { SessionUser } from '@/types'

function formatBreadcrumb(pathname: string) {
  const parts = pathname.split('/').filter(Boolean).slice(1)
  if (parts.length === 0) {
    return 'Dashboard'
  }

  return ['Dashboard', ...parts.map((part) => part.replace(/-/g, ' '))].join(' > ')
}

export function DashboardNavbar({ user }: { user: SessionUser }) {
  const pathname = usePathname()

  return (
    <header className={styles.topbar}>
      <div className={styles.breadcrumb}>{formatBreadcrumb(pathname)}</div>
      <div className={styles.topbarActions}>
        {user.plan === 'free' ? <Link href="/dashboard/billing" className={styles.upgradeButton}>Upgrade</Link> : null}
        <button className={styles.iconButton} aria-label="Notifications">
          <Bell size={16} />
        </button>
        <Link href="/dashboard/profile" className={styles.avatarButton}>
          <span>{user.name?.slice(0, 1)}</span>
          <span>{user.name}</span>
        </Link>
      </div>
    </header>
  )
}
