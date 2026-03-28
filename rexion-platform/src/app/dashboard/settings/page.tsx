import styles from '@/styles/dashboard.module.css'

export default function SettingsPage() {
  return (
    <section className={styles.pageSection}>
      <div>
        <h1 className={styles.heroTitle}>Settings</h1>
        <p className={styles.heroCopy}>Control profile defaults, automation preferences, and account-level security options.</p>
      </div>
      <div className={styles.card}>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label htmlFor="targetRole">Default target role</label>
            <input id="targetRole" defaultValue="Frontend Engineer" />
          </div>
          <div className={styles.field}>
            <label htmlFor="preferredDomain">Preferred domain</label>
            <input id="preferredDomain" defaultValue="Frontend" />
          </div>
        </div>
      </div>
    </section>
  )
}
