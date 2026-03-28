import styles from '@/styles/dashboard.module.css'

export default function TrackerPage() {
  return (
    <section className={styles.pageSection}>
      <div>
        <h1 className={styles.heroTitle}>Application Tracker</h1>
        <p className={styles.heroCopy}>Track what you sent, when you followed up, and what needs action next.</p>
      </div>
      <div className={styles.card}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Activity</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Razorpay</td>
                <td>Frontend Engineer</td>
                <td>Interview loop</td>
                <td>Follow-up sent today</td>
              </tr>
              <tr>
                <td>Postman</td>
                <td>Product Design Intern</td>
                <td>Applied</td>
                <td>Waiting for review</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
