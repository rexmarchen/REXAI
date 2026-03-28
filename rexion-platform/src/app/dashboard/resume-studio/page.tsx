import styles from '@/styles/dashboard.module.css'

export default function ResumeStudioPage() {
  return (
    <section className={styles.pageSection}>
      <div>
        <h1 className={styles.heroTitle}>Resume Studio</h1>
        <p className={styles.heroCopy}>Refine your resume story, tighten your positioning, and prepare a stronger profile before outreach.</p>
      </div>
      <div className={styles.card}>
        <h3>Current status</h3>
        <p>The legacy resume analysis pipeline remains available during migration. This surface is ready for profile inputs, resume text, and future export controls.</p>
      </div>
    </section>
  )
}
