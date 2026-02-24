import React from 'react'
import styles from '../../WorkspaceSection.module.css'

const SETTINGS = [
  ['Default Model', 'claude-opus-4'],
  ['Theme', 'Dark (System)'],
  ['API Endpoint', 'https://api.anthropic.com'],
  ['Max Tokens', '4096'],
  ['Temperature', '0.7'],
  ['Auto Save', 'Enabled'],
  ['Telemetry', 'Minimal']
]

const SettingsSection = () => {
  return (
    <section className={styles.page}>
      <h2 className={styles.pageTitle}>Settings</h2>
      <p className={styles.pageSubtitle}>
        Configure models, runtime behavior and workspace defaults.
      </p>

      <div className={styles.settingsList}>
        {SETTINGS.map(([name, value]) => (
          <article key={name} className={styles.settingRow}>
            <span className={styles.settingName}>{name}</span>
            <span className={styles.settingValue}>{value}</span>
          </article>
        ))}
      </div>
    </section>
  )
}

export default SettingsSection
