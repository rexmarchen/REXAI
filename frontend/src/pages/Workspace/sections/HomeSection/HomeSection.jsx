import React from 'react'
import styles from '../../WorkspaceSection.module.css'

const QUICK_ACTIONS = [
  { key: 'new-app', icon: 'NA', title: 'New App', desc: 'Generate a production-ready project scaffold.', iconClass: styles.quickIconBlue },
  { key: 'fix-bugs', icon: 'FB', title: 'Fix Bugs', desc: 'Run AI-assisted diagnostics and patch suggestions.', iconClass: styles.quickIconPurple },
  { key: 'optimize', icon: 'OP', title: 'Optimize', desc: 'Improve performance, DX and deployment quality.', iconClass: styles.quickIconGreen },
  { key: 'ship', icon: 'DP', title: 'Deploy', desc: 'Publish your latest build with one click.', iconClass: styles.quickIconOrange }
]

const ACTIVITIES = [
  { title: 'Refactored auth middleware with token rotation', meta: '2 min ago · AI Chat', dotClass: styles.activityBlue },
  { title: 'Generated API route tests for checkout flow', meta: '14 min ago · Tools', dotClass: styles.activityPurple },
  { title: 'Deployment completed on production environment', meta: '18 min ago · Deploy', dotClass: styles.activityGreen }
]

const HomeSection = () => {
  return (
    <section className={styles.page}>
      <div className={styles.welcomeTag}>
        <span className={styles.dotPulse}></span>
        AI WORKSPACE ONLINE
      </div>

      <h2 className={styles.homeTitle}>
        Build Faster With <span className={styles.homeGradient}>REXION AI</span>
      </h2>
      <p className={styles.pageSubtitle}>
        Use one workspace for generation, debugging, deployment and analytics.
        This dashboard is structured for production teams and real workflows.
      </p>

      <div className={styles.quickGrid}>
        {QUICK_ACTIONS.map((item) => (
          <article key={item.key} className={styles.quickCard}>
            <div className={`${styles.quickCardIcon} ${item.iconClass}`}>{item.icon}</div>
            <h3 className={styles.quickCardTitle}>{item.title}</h3>
            <p className={styles.quickCardDesc}>{item.desc}</p>
          </article>
        ))}
      </div>

      <div className={styles.statsGrid}>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>API Calls Today</p>
          <p className={`${styles.statValue} ${styles.statBlue}`}>1,482</p>
          <p className={styles.statChange}>+23% vs yesterday</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Avg Response Time</p>
          <p className={`${styles.statValue} ${styles.statPurple}`}>1.2s</p>
          <p className={styles.statChange}>15% faster</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Deployment Success</p>
          <p className={`${styles.statValue} ${styles.statGreen}`}>99.9%</p>
          <p className={styles.statChange}>Stable build health</p>
        </article>
      </div>

      <h3 className={styles.sectionDividerTitle}>Recent Activity</h3>
      <div className={styles.activityList}>
        {ACTIVITIES.map((activity) => (
          <div key={activity.title} className={styles.activityItem}>
            <span className={`${styles.activityDot} ${activity.dotClass}`}></span>
            <div>
              <p className={styles.activityTitle}>{activity.title}</p>
              <p className={styles.activityMeta}>{activity.meta}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default HomeSection
