import { Suspense } from 'react'
import { SignupPageClient } from '@/components/auth/SignupPageClient'
import styles from '@/styles/auth.module.css'

export const dynamic = 'force-dynamic'

export default function SignupPage({
  searchParams,
}: {
  searchParams: { plan?: string | string[] }
}) {
  const selectedPlan = typeof searchParams.plan === 'string' ? searchParams.plan : null

  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <section className={styles.card}>
            <h1 className={styles.title}>Loading signup...</h1>
          </section>
        </main>
      }
    >
      <SignupPageClient initialPlan={selectedPlan} />
    </Suspense>
  )
}
