'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import styles from '@/styles/auth.module.css'

export function LoginPageClient({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl,
    })

    setLoading(false)

    if (result?.error) {
      setError('Invalid email or password.')
      return
    }

    router.push(callbackUrl)
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandMark} />
          REXION AI
        </div>
        <h1 className={styles.title}>Welcome back to REXION</h1>
        <p className={styles.copy}>Log in to access your dashboard, campaigns, and gig pipeline.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>
          {error ? <div className={styles.error}>{error}</div> : null}
          <button className={styles.primaryButton} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Log In'}
          </button>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => signIn('google', { callbackUrl })}
          >
            Continue with Google
          </button>
        </form>

        <div className={styles.meta}>
          Don&apos;t have an account? <Link href="/signup">{'Sign up ->'}</Link>
        </div>
      </section>
    </main>
  )
}
