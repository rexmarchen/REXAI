'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff, Loader2, Sparkles, CheckCircle, AlertCircle } from 'lucide-react'
import styles from '@/styles/auth.module.css'

export function SignupPageClient({ initialPlan }: { initialPlan: string | null }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(initialPlan)

  useEffect(() => {
    if (!selectedPlan && typeof window !== 'undefined') {
      const storedPlan = window.sessionStorage.getItem('rexion-selected-plan')
      if (storedPlan) {
        setSelectedPlan(storedPlan)
      }
    }
  }, [selectedPlan])

  const continueToCheckout = async (plan: string) => {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      })
      const payload = (await response.json()) as { url?: string }
      router.push(payload.url || '/profile/setup')
    } catch {
      router.push('/profile/setup')
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedName) {
      setError('Please provide your full name.')
      return
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please provide a valid email address.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password,
          confirmPassword,
        }),
      })

      const payload = (await response.json()) as { error?: string; message?: string }
      if (!response.ok) {
        setError(payload.error || 'Unable to create your account.')
        setLoading(false)
        return
      }

      // Auto sign in user after registration
      const signInResult = await signIn('credentials', {
        email: trimmedEmail,
        password,
        redirect: false,
        callbackUrl: '/profile/setup',
      })

      setLoading(false)

      if (signInResult?.error) {
        router.push('/login?registered=true')
        return
      }

      if (selectedPlan === 'pro' || selectedPlan === 'elite') {
        await continueToCheckout(selectedPlan)
        return
      }

      // Redirect new user to profile onboarding flow
      router.push('/profile/setup')
      router.refresh()
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err?.message || 'Network error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.16em] uppercase text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            REXION AI
          </Link>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium tracking-wider uppercase text-[var(--text-muted)]">
            Career OS
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Create your account</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Join REXION to unlock AI-powered career profiling, intelligent matching, and agentic outreach.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              required
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/30 transition focus:border-emerald-500 focus:bg-white/[0.06] focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              required
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/30 transition focus:border-emerald-500 focus:bg-white/[0.06] focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
              Password <span className="text-[var(--text-muted)]">(min 8 characters)</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 pr-12 text-sm text-white placeholder-white/30 transition focus:border-emerald-500 focus:bg-white/[0.06] focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 pr-12 text-sm text-white placeholder-white/30 transition focus:border-emerald-500 focus:bg-white/[0.06] focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition"
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 py-3.5 text-sm font-semibold text-[#04110d] shadow-lg shadow-emerald-500/20 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating your account...
              </>
            ) : (
              'Create Account'
            )}
          </button>

          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative bg-[rgba(10,16,12,0.95)] px-3 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Or sign up with
            </span>
          </div>

          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/profile/setup' })}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>
        </form>

        <div className="mt-6 border-t border-white/6 pt-4 text-center text-xs text-[var(--text-secondary)]">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-emerald-400 hover:underline">
            Log in &rarr;
          </Link>
        </div>
      </section>
    </main>
  )
}
