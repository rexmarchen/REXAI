'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { mobileNavigation, Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'
import { PageTransition } from '@/components/ui/PageTransition'
import type { SessionUser } from '@/types'

export function DashboardLayout({
  user,
  children,
}: {
  user: SessionUser
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-white">
      <div className="flex min-h-screen">
        <Sidebar user={user} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <TopNav user={user} />
          <main className="flex-1 px-4 pb-28 pt-6 lg:px-8 lg:pb-8">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between rounded-[24px] border border-white/10 bg-[rgba(8,12,12,0.92)] p-2 backdrop-blur-xl lg:hidden">
        {mobileNavigation.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-3 text-[11px] font-medium text-[var(--text-secondary)]"
            >
              {active ? (
                <motion.span
                  layoutId="mobileActiveNav"
                  className="absolute inset-0 rounded-2xl bg-[var(--accent-green-glow)]"
                />
              ) : null}
              <Icon size={16} className="relative z-10" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
