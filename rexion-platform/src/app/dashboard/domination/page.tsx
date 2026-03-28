import { auth } from '@/lib/auth'
import { UpgradeGate } from '@/components/common/UpgradeGate'
import { hasRequiredPlan } from '@/lib/plan'
import styles from '@/styles/dashboard.module.css'

export default async function DominationPage() {
  const session = await auth()

  if (!session?.user || !hasRequiredPlan(session.user.plan, 'elite')) {
    return <UpgradeGate feature="1-Click Domination" requiredPlan="elite" />
  }

  return (
    <section className={styles.pageSection}>
      <div>
        <h1 className={styles.heroTitle}>1-Click Domination</h1>
        <p className={styles.heroCopy}>Fire the highest-output workflow: matching, outreach, networking, and follow-up orchestration from one surface.</p>
      </div>
      <div className={styles.card}>
        <h3>Ready state</h3>
        <p>This Elite control surface is wired and ready for the deeper orchestration workflow.</p>
      </div>
    </section>
  )
}
