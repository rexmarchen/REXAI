'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  BellRing,
  Brain,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Mic2,
  Send,
  Settings,
  Sparkles,
  Target,
  UserCircle2,
  WandSparkles,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { hasRequiredPlan } from '@/lib/plan'
import { useUiStore } from '@/lib/stores/ui-store'
import type { SessionUser, SubscriptionPlan } from '@/types'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  requiredPlan?: SubscriptionPlan
}

const navigation: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Overview',
    items: [
      { href: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
      { href: '/dashboard/feed', label: 'Intelligence Feed', icon: BellRing },
    ],
  },
  {
    title: 'Job Hunt',
    items: [
      { href: '/dashboard/jobs', label: 'Job Matches', icon: Target },
      { href: '/dashboard/resume', label: 'Resume Studio', icon: ClipboardList },
      { href: '/dashboard/tracker', label: 'App Tracker', icon: ClipboardList },
    ],
  },
  {
    title: 'Power Tools',
    items: [
      { href: '/dashboard/outreach', label: 'Outreach', icon: Send, requiredPlan: 'pro' },
      {
        href: '/dashboard/micro-gigs',
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
    title: 'AI Tools',
    items: [
      { href: '/dashboard/resume-predictor', label: 'Resume Predictor', icon: Brain },
      { href: '/dashboard/inter-hunt', label: 'Inter Hunt', icon: Mic2 },
      { href: '/dashboard/resume-builder', label: 'Resume Builder', icon: WandSparkles },
    ],
  },
  {
    title: 'Account',
    items: [
      { href: '/dashboard/profile', label: 'Profile', icon: UserCircle2 },
      { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
]

function NavLink({
  item,
  active,
  collapsed,
  userPlan,
}: {
  item: NavItem
  active: boolean
  collapsed: boolean
  userPlan: SubscriptionPlan
}) {
  const Icon = item.icon
  const locked = item.requiredPlan ? !hasRequiredPlan(userPlan, item.requiredPlan) : false

  return (
    <Link
      href={locked ? '/dashboard/billing' : item.href}
      className="relative flex min-h-[50px] items-center justify-between overflow-hidden rounded-2xl px-3 py-3 text-sm text-[var(--text-secondary)] transition hover:text-white"
      title={item.label}
    >
      {active ? (
        <motion.span
          layoutId="activeNav"
          className="absolute inset-0 rounded-2xl border border-emerald-400/20 bg-[var(--accent-green-glow)]"
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        />
      ) : null}
      <span className="relative z-10 flex items-center gap-3">
        <Icon size={17} />
        {!collapsed ? <span>{item.label}</span> : null}
      </span>
      {!collapsed && item.requiredPlan ? (
        <span
          className={`relative z-10 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
            locked
              ? 'border-amber-400/20 bg-amber-400/10 text-amber-200'
              : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
          }`}
        >
          {item.requiredPlan}
        </span>
      ) : null}
    </Link>
  )
}

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useUiStore()

  return (
    <aside
      className={`hidden h-screen shrink-0 border-r border-white/6 bg-[rgba(8,12,12,0.96)] px-4 py-5 backdrop-blur-xl lg:flex lg:flex-col ${
        sidebarCollapsed ? 'w-[92px]' : 'w-[260px]'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-green)] text-sm font-bold text-[#04110d]">
            Rx
          </span>
          {!sidebarCollapsed ? (
            <div>
              <div className="font-display text-lg font-semibold tracking-[-0.03em] text-white">REXION</div>
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Career OS</div>
            </div>
          ) : null}
        </Link>
        <button
          type="button"
          onClick={toggleSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white"
          aria-label="Toggle sidebar"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="mt-8 flex-1 space-y-6 overflow-y-auto pr-1">
        {navigation.map((group) => (
          <div key={group.title}>
            {!sidebarCollapsed ? <p className="type-label mb-3">{group.title}</p> : null}
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={pathname === item.href}
                  collapsed={sidebarCollapsed}
                  userPlan={user.plan}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="rounded-[26px] border border-white/8 bg-white/5 p-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-sm font-semibold text-white">
            {user.name?.slice(0, 1) || 'R'}
          </div>
          {!sidebarCollapsed ? (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">{user.name}</div>
              <div className="truncate text-xs text-[var(--text-secondary)]">{user.email}</div>
            </div>
          ) : null}
        </div>

        {!sidebarCollapsed ? (
          <>
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-3 py-3">
              <span className="type-label !mb-0">Plan</span>
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-200">
                {user.plan}
              </span>
            </div>
            {user.plan === 'free' ? (
              <Link
                href="/dashboard/billing"
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[var(--accent-green)] px-4 py-2.5 text-sm font-semibold text-[#04110d]"
              >
                Upgrade
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Sign Out"
            className="mt-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--text-secondary)] transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
          >
            <LogOut size={14} />
          </button>
        )}
      </div>
    </aside>
  )
}

export const mobileNavigation = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/dashboard/jobs', label: 'Jobs', icon: Target },
  { href: '/dashboard/outreach', label: 'Outreach', icon: Send },
  { href: '/dashboard/micro-gigs', label: 'Gigs', icon: BriefcaseBusiness },
  { href: '/dashboard/profile', label: 'Profile', icon: UserCircle2 },
]
