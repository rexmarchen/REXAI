import { Suspense } from 'react'
import { LoginPageClient } from '@/components/auth/LoginPageClient'
import styles from '@/styles/auth.module.css'

export const dynamic = 'force-dynamic'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string | string[] }
}) {
  const callbackUrl =
    typeof searchParams.callbackUrl === 'string' ? searchParams.callbackUrl : '/dashboard'

  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <section className={styles.card}>
            <h1 className={styles.title}>Loading login...</h1>
          </section>
        </main>
      }
    >
      <LoginPageClient callbackUrl={callbackUrl} />
    </Suspense>
  )
}
