import { mockMicroGigs } from '@/lib/mock-data'
import styles from '@/styles/dashboard.module.css'

export default function JobMatchesPage() {
  return (
    <section className={styles.pageSection}>
      <div>
        <h1 className={styles.heroTitle}>Job Matches</h1>
        <p className={styles.heroCopy}>A tighter ranked feed of roles and projects that fit your current profile.</p>
      </div>
      <div className={styles.card}>
        <h3>Suggested focus areas</h3>
        <ul>
          {mockMicroGigs.map((gig) => (
            <li key={gig.id}>{gig.title}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
