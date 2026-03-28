import { auth } from '@/lib/auth'
import styles from '@/styles/dashboard.module.css'

export default async function ProfilePage() {
  const session = await auth()

  return (
    <section className={styles.pageSection}>
      <div>
        <h1 className={styles.heroTitle}>Profile</h1>
        <p className={styles.heroCopy}>The data that powers matching, outreach, and micro-gig recommendations.</p>
      </div>
      <div className={styles.card}>
        <p><strong>Name:</strong> {session?.user?.name}</p>
        <p><strong>Email:</strong> {session?.user?.email}</p>
        <p><strong>Plan:</strong> {session?.user?.plan}</p>
      </div>
    </section>
  )
}
