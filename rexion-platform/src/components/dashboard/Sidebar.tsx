'use client'

import Link from 'next/link'
import {
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Receipt,
  Send,
  Settings,
  Sparkles,
  Target,
  UserCircle2,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import styles from '@/styles/dashboard.module.css'
import { useUiStore } from '@/lib/stores/ui-store'
import { hasRequiredPlan } from '@/lib/plan'
import type { SessionUser, SubscriptionPlan } from '@/types'

interface NavItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
  requiredPlan?: SubscriptionPlan
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const groups: NavGroup[] = [
  {
    label: 'Core',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/job-matches', label: 'Job Matches', icon: Target },
      { href: '/dashboard/resume-studio', label: 'Resume Studio', icon: FileText },
      { href: '/dashboard/tracker', label: 'App Tracker', icon: ClipboardList },
    ],
  },
  {
    label: 'Power Tools',
    items: [
      { href: '/dashboard/outreach', label: 'Outreach', icon: Send, requiredPlan: 'pro' },
      {
        href: '/dashboard/micro-internships',
        label: 'Micro-Internships',
        icon: BriefcaseBusiness,
        requiredPlan: 'pro',
      },
      {
        href: '/dashboard/domination',
        label: '1-Click Domination',
        icon: Sparkles,
        requiredPlan: 'elite',
      },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/dashboard/profile', label: 'Profile', icon: UserCircle2 },
      { href: '/dashboard/billing', label: 'Billing', icon: Receipt },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useUiStore()

  return (
    <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
      <div className={styles.brand}>
        <Link href="/dashboard" className={styles.brandIdentity}>
          <span className={styles.brandMark} />
          {!sidebarCollapsed ? 'REXION AI' : 'R'}
        </Link>
        <button className={styles.collapseButton} onClick={toggleSidebar} aria-label="Toggle sidebar">
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {groups.map((group) => (
        <section key={group.label} className={styles.group}>
          {!sidebarCollapsed ? <div className={styles.groupLabel}>{group.label}</div> : null}
          <div className={styles.navList}>
            {group.items.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href
              const locked = item.requiredPlan ? !hasRequiredPlan(user.plan, item.requiredPlan) : false

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                  title={item.label}
                >
                  <span className={styles.navItemLabel}>
                    <Icon size={16} />
                    {!sidebarCollapsed ? item.label : null}
                  </span>
                  {!sidebarCollapsed && item.requiredPlan ? (
                    <span
                      className={`${styles.navBadge} ${
                        item.requiredPlan === 'elite' ? styles.badgeElite : styles.badgePro
                      }`}
                    >
                      {locked ? item.requiredPlan.toUpperCase() : user.plan.toUpperCase()}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </div>
        </section>
      ))}

      <div className={styles.sidebarFooter}>
        <div className={styles.userCard}>
          <strong>{sidebarCollapsed ? user.name?.slice(0, 1) : user.name}</strong>
          {!sidebarCollapsed ? <span>{user.email}</span> : null}
          {!sidebarCollapsed ? <span className={styles.planPill}>{user.plan.toUpperCase()}</span> : null}
          {!sidebarCollapsed && user.plan === 'free' ? (
            <Link href="/dashboard/billing" className={styles.upgradeButton}>
              {'Upgrade to Pro ->'}
            </Link>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
