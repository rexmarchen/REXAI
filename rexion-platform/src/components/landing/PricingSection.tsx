'use client'

import { startTransition, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import styles from '@/styles/landing.module.css'

const plans = [
  {
    name: 'Free',
    monthly: 0,
    annual: 0,
    description: 'Core matching and resume workflows to get moving fast.',
    features: ['5 job matches/day', 'Resume analyzer (3 scans/month)', 'Basic email composer', 'Job tracker (up to 10 applications)'],
  },
  {
    name: 'Pro',
    monthly: 999,
    annual: 799,
    description: 'The most balanced growth setup for outreach, gigs, and follow-up velocity.',
    features: ['Everything in Free', 'Outreach Automation (50 emails/day)', 'AI cold email generator (unlimited)', 'Resume builder + unlimited analysis', 'Micro-Internship Arena access', 'Priority gig matching', 'Auto follow-up system', 'Application tracker (unlimited)'],
    featured: true,
  },
  {
    name: 'Elite',
    monthly: 2499,
    annual: 1999,
    description: 'High-output mode with elite automation, deeper visibility, and faster support.',
    features: ['Everything in Pro', '200 outreach emails/day', '1-Click Domination Mode', 'Rejection Autopsy AI engine', 'Hiring Velocity Map (beta)', 'Dedicated support + onboarding call'],
  },
]

export function PricingSection() {
  const [annual, setAnnual] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()

  const startCheckout = async (plan: 'pro' | 'elite') => {
    if (!session?.user) {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('rexion-selected-plan', plan)
      }
      router.push(`/signup?plan=${plan}`)
      return
    }

    toast.info('Redirecting to checkout...')
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan }),
    })

    const payload = (await response.json()) as { url?: string; error?: string }
    if (payload.url) {
      startTransition(() => router.push(payload.url!))
      return
    }

    toast.error(payload.error || 'Unable to start checkout right now.')
  }

  return (
    <section id="pricing" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionKicker}>Simple pricing. Serious results.</span>
          <h2 className={styles.sectionTitle}>Choose the pace that matches your ambition.</h2>
          <p className={styles.sectionDescription}>
            Free gets you into the system. Pro is the default operating mode. Elite is for the highest-output search.
          </p>
        </div>

        <div className={styles.billingToggle}>
          <button className={`${styles.billingOption} ${!annual ? styles.billingOptionActive : ''}`} onClick={() => setAnnual(false)}>
            Monthly
          </button>
          <button className={`${styles.billingOption} ${annual ? styles.billingOptionActive : ''}`} onClick={() => setAnnual(true)}>
            Annual
          </button>
        </div>

        <div className={styles.pricingGrid}>
          {plans.map((plan) => {
            const price = annual ? plan.annual : plan.monthly
            return (
              <article key={plan.name} className={`${styles.pricingCard} ${plan.featured ? styles.pricingFeatured : ''}`}>
                {plan.featured ? <span className={styles.pricingTag}>Most Popular</span> : null}
                <h3 style={{ marginTop: plan.featured ? '18px' : 0 }}>{plan.name}</h3>
                <div className={styles.priceLine}>
                  <span className={styles.priceValue}>₹{price}</span>
                  <span className={styles.priceNote}>/ month</span>
                </div>
                <p className={styles.sectionDescription}>{plan.description}</p>
                <ul className={styles.planList}>
                  {plan.features.map((feature) => (
                    <li key={feature} className={styles.planItem}>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: '24px' }}>
                  {plan.name === 'Free' ? (
                    <Link href="/signup" className={styles.ghostButton}>
                      Get Started Free
                    </Link>
                  ) : (
                    <button
                      className={styles.primaryButton}
                      onClick={() => startCheckout(plan.name.toLowerCase() as 'pro' | 'elite')}
                    >
                      {plan.name === 'Pro' ? 'Start Pro →' : 'Go Elite →'}
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
