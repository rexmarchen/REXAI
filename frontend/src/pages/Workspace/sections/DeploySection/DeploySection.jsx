import React from 'react'
import styles from '../../WorkspaceSection.module.css'

const DeploySection = () => {
  return (
    <section className={styles.page}>
      <h2 className={styles.pageTitle}>Deploy</h2>
      <p className={styles.pageSubtitle}>
        Push your project to production with verified quality gates.
      </p>

      <article className={styles.deployCard}>
        <h3 className={styles.quickCardTitle}>rexion-ecommerce-app</h3>
        <p className={styles.deployMeta}>Last deployed 18 min ago · Version 2.4.1</p>
        <div className={styles.deployActions}>
          <button type="button" className={styles.btnPrimary}>Deploy Now</button>
          <button type="button" className={styles.btnGhost}>Preview</button>
          <button type="button" className={styles.btnGhost}>Logs</button>
        </div>
      </article>

      <article className={styles.logCard}>
        <div className={styles.logSuccess}>✓ Build successful</div>
        <div className={styles.logSuccess}>✓ Tests passing (48/48)</div>
        <div className={styles.logSuccess}>✓ Artifacts uploaded to CDN</div>
        <div className={styles.logProgress}>→ Deploying to production cluster...</div>
        <div>● region: us-east-1 · env: production</div>
      </article>
    </section>
  )
}

export default DeploySection
