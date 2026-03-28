import Link from 'next/link'
import { auth } from '@/lib/auth'
import { activityFeed, dashboardStats } from '@/lib/mock-data'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { QuickActions } from '@/components/dashboard/QuickActions'
import styles from '@/styles/dashboard.module.css'

export default async function DashboardHomePage() {
  const session = await auth()
  const firstName = session?.user?.name?.split(' ')[0] || 'there'

  return (
    <section className={styles.pageSection}>
      <div className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>Good morning, {firstName}. Let&apos;s get you hired.</h1>
          <p className={styles.heroCopy}>
            REXION keeps your search organized across matching, outreach, and short-form work that can convert into offers.
          </p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {dashboardStats.map((stat) => (
          <StatsCard key={stat.id} stat={stat} />
        ))}
      </div>

      {session?.user?.plan !== 'free' ? (
        <div className={styles.banner}>
          You have 3 new gig matches. <Link href="/dashboard/micro-internships">See them →</Link>
        </div>
      ) : null}

      <div className={styles.grid}>
        <ActivityFeed items={activityFeed} />
        <QuickActions />
      </div>
    </section>
  )
}
