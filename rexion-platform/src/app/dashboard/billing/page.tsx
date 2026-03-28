'use client'

import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import styles from '@/styles/dashboard.module.css'

export default function BillingPage() {
  const { data: session } = useSession()

  const openPortal = async () => {
    const response = await fetch('/api/stripe/portal', { method: 'POST' })
    const payload = (await response.json()) as { url?: string; error?: string }

    if (payload.url) {
      window.location.href = payload.url
      return
    }

    toast.error(payload.error || 'Customer portal unavailable.')
  }

  return (
    <section className={styles.pageSection}>
      <div>
        <h1 className={styles.heroTitle}>Billing</h1>
        <p className={styles.heroCopy}>Manage plan access, compare limits, and open the Stripe customer portal when billing is configured.</p>
      </div>
      <div className={styles.card}>
        <h3>Current plan: {session?.user?.plan?.toUpperCase() || 'FREE'}</h3>
        <p>Pro unlocks outreach and gigs. Elite unlocks domination mode and higher daily limits.</p>
        <button className={styles.upgradeButton} onClick={openPortal}>
          Manage Plan
        </button>
      </div>
    </section>
  )
}
