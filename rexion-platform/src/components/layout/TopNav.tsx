'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Bell, ChevronRight, LogOut, Sparkles } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import type { SessionUser } from '@/types'

function formatBreadcrumb(pathname: string) {
  const parts = pathname.split('/').filter(Boolean).slice(1)
  if (!parts.length) {
    return ['Dashboard']
  }

  return ['Dashboard', ...parts.map((part) => part.replace(/-/g, ' '))]
}

export function TopNav({ user }: { user: SessionUser }) {
  const pathname = usePathname()
  const breadcrumb = formatBreadcrumb(pathname)

  return (
    <header className="sticky top-0 z-30 border-b border-white/6 bg-[rgba(8,12,12,0.82)] px-4 py-4 backdrop-blur-xl lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
          {breadcrumb.map((part, index) => (
            <span key={`${part}-${index}`} className="inline-flex items-center gap-2 capitalize">
              {index > 0 ? <ChevronRight size={14} className="text-[var(--text-muted)]" /> : null}
              <span className={index === breadcrumb.length - 1 ? 'text-white' : ''}>{part}</span>
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100"
          >
            <span className="relative inline-flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
            </span>
            REXION is working for you
          </motion.div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white"
            aria-label="Notifications"
          >
            <Bell size={17} />
          </button>

          <Link
            href="/dashboard/outreach"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-green)] px-4 py-3 text-sm font-semibold text-[#04110d]"
          >
            <Sparkles size={16} />
            New Outreach
          </Link>

          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-xs font-semibold text-emerald-400">
              {user.name?.slice(0, 1) || 'R'}
            </span>
            <span className="hidden sm:block text-xs font-medium">{user.name}</span>
          </Link>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Log out"
            aria-label="Log out"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--text-muted)] transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}
