import Link from 'next/link'
import { auth } from '@/lib/auth'
import { PostGigForm } from '@/components/micro-internships/PostGigForm'
import styles from '@/styles/micro.module.css'

export default async function PostGigPage() {
  const session = await auth()

  if (session?.user?.role !== 'company' && session?.user?.role !== 'admin') {
    return (
      <section className={styles.page}>
        <div className={styles.notice}>
          <div className={styles.strong}>Company account required</div>
          <div className={styles.muted}>Switch your account role to company before posting gigs into the arena.</div>
          <Link className={styles.button} href="/dashboard/profile">
            Open Profile
          </Link>
        </div>
      </section>
    )
  }

  return <PostGigForm />
}
