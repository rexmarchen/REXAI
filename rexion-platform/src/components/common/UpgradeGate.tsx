import Link from 'next/link'
import styles from '@/styles/dashboard.module.css'

export function UpgradeGate({
  feature,
  requiredPlan,
}: {
  feature: string
  requiredPlan: 'pro' | 'elite'
}) {
  return (
    <section className={styles.gate}>
      <h2>{feature} requires {requiredPlan.toUpperCase()}</h2>
      <p className={styles.heroCopy}>
        Upgrade to unlock the full workflow, campaign controls, and higher daily execution limits for this module.
      </p>
      <div className={styles.gateActions}>
        <Link href="/dashboard/billing" className={styles.upgradeButton}>
          Upgrade Plan
        </Link>
        <Link href="/dashboard" className={styles.quickButton}>
          Back to Dashboard
        </Link>
      </div>
    </section>
  )
}
