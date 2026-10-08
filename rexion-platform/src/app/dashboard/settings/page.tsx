import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserCircle2, CreditCard, Lock, Bell, Sparkles, ShieldCheck } from 'lucide-react'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <div>
        <span className="type-label">Account & Workspace</span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Manage your account preferences, security, subscriptions, and AI agent permissions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/dashboard/profile"
          className="group rounded-3xl border border-white/8 bg-[rgba(15,26,22,0.85)] p-6 transition hover:border-emerald-400/30 hover:bg-white/[0.04]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400 mb-4">
            <UserCircle2 size={20} />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-emerald-200 transition">Career Profile</h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
            Update your professional summary, skills, work history, projects, resume, and job preferences.
          </p>
        </Link>

        <Link
          href="/dashboard/billing"
          className="group rounded-3xl border border-white/8 bg-[rgba(15,26,22,0.85)] p-6 transition hover:border-emerald-400/30 hover:bg-white/[0.04]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400/10 text-teal-400 mb-4">
            <CreditCard size={20} />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-teal-200 transition">Billing & Subscription</h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
            Manage your REXION tier (Free / Pro / Elite), view invoices, and upgrade your agent limits.
          </p>
        </Link>
      </div>

      {/* Account Info Details */}
      <div className="rounded-3xl border border-white/8 bg-[rgba(15,26,22,0.85)] p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Account Information</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/6 bg-black/30 p-3.5">
            <span className="type-label !mb-1 block">Account Name</span>
            <strong className="text-sm font-semibold text-white">{session.user.name || 'REXION User'}</strong>
          </div>
          <div className="rounded-2xl border border-white/6 bg-black/30 p-3.5">
            <span className="type-label !mb-1 block">Email Address</span>
            <strong className="text-sm font-semibold text-white">{session.user.email}</strong>
          </div>
          <div className="rounded-2xl border border-white/6 bg-black/30 p-3.5">
            <span className="type-label !mb-1 block">Current Plan</span>
            <strong className="text-sm font-semibold uppercase text-emerald-300">{session.user.plan || 'Free'}</strong>
          </div>
          <div className="rounded-2xl border border-white/6 bg-black/30 p-3.5">
            <span className="type-label !mb-1 block">User Role</span>
            <strong className="text-sm font-semibold capitalize text-white">{session.user.role || 'user'}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
