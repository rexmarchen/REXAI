import React from 'react'
import styles from '../../WorkspaceSection.module.css'

const AccountSection = () => {
  return (
    <section className={styles.page}>
      <h2 className={styles.pageTitle}>My Account</h2>
      <p className={styles.pageSubtitle}>
        Manage your profile, team role and access security.
      </p>

      <article className={styles.accountCard}>
        <div className={styles.accountHeader}>
          <div className={styles.accountAvatar}>U</div>
          <div>
            <h3 className={styles.accountName}>User</h3>
            <p className={styles.accountMeta}>user@rexion.ai · Admin</p>
          </div>
        </div>

        <div className={styles.settingsList}>
          <div className={styles.settingRow}>
            <span className={styles.settingName}>Workspace Plan</span>
            <span className={styles.settingValue}>Pro Team</span>
          </div>
          <div className={styles.settingRow}>
            <span className={styles.settingName}>Two-Factor Authentication</span>
            <span className={styles.settingValue}>Enabled</span>
          </div>
          <div className={styles.settingRow}>
            <span className={styles.settingName}>Last Login</span>
            <span className={styles.settingValue}>Today, 09:41 AM</span>
          </div>
        </div>

        <div className={styles.accountActions}>
          <button type="button" className={styles.btnPrimary}>Edit Profile</button>
          <button type="button" className={styles.btnGhost}>Security</button>
          <button type="button" className={styles.btnGhost}>Billing</button>
        </div>
      </article>
    </section>
  )
}

export default AccountSection
