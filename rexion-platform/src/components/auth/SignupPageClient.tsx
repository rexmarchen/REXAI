'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import styles from '@/styles/auth.module.css'

export function SignupPageClient({ initialPlan }: { initialPlan: string | null }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(initialPlan)

  useEffect(() => {
    if (!selectedPlan && typeof window !== 'undefined') {
      const storedPlan = window.sessionStorage.getItem('rexion-selected-plan')
      if (storedPlan) {
        setSelectedPlan(storedPlan)
        router.replace(`/signup?plan=${storedPlan}`)
      }
    }
  }, [router, selectedPlan])

  const continueToCheckout = async (plan: string) => {
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan }),
    })
    const payload = (await response.json()) as { url?: string }
    router.push(payload.url || '/dashboard')
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    })

    const payload = (await response.json()) as { error?: string }
    if (!response.ok) {
      setError(payload.error || 'Unable to create your account.')
      setLoading(false)
      return
    }

    const signInResult = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl: '/dashboard?onboarding=true',
    })

    setLoading(false)

    if (signInResult?.error) {
      setError('Account created, but auto sign-in failed. Please log in manually.')
      return
    }

    if (selectedPlan === 'pro' || selectedPlan === 'elite') {
      await continueToCheckout(selectedPlan)
      return
    }

    router.push('/dashboard?onboarding=true')
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandMark} />
          REXION AI
        </div>
        <h1 className={styles.title}>Create your REXION account</h1>
        <p className={styles.copy}>Start with a clean hiring system, then scale into outreach and gigs when you&apos;re ready.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="name">Name</label>
            <input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>
          {error ? <div className={styles.error}>{error}</div> : null}
          <button className={styles.primaryButton} type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/dashboard?onboarding=true' })}
          >
            Continue with Google
          </button>
        </form>

        <div className={styles.meta}>
          Already have an account? <Link href="/login">{'Log in ->'}</Link>
        </div>
      </section>
    </main>
  )
}
