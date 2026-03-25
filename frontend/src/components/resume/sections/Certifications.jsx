import styles from '../ResumeBuilder.module.css'

const Certifications = ({ items, errors = {}, onAdd, onUpdate, onRemove }) => (
  <div className={styles.entryStack}>
    <div className={styles.sectionFooter}>
      <span className={styles.helperText}>
        Add certifications that directly support the role you are targeting.
      </span>
      <button
        type="button"
        className={`${styles.secondaryButton} ${styles.buttonCompact}`}
        onClick={onAdd}
      >
        Add Certification
      </button>
    </div>

    {items.map((item, index) => {
      const entryErrors = errors.entries?.[item.id] || {}

      return (
        <article key={item.id} className={styles.entryCard}>
          <div className={styles.entryHeader}>
            <div>
              <div className={styles.entryTitle}>Certification #{index + 1}</div>
              <div className={styles.helperText}>Credential, issuer, date, and optional verification.</div>
            </div>
            <button
              type="button"
              className={`${styles.dangerButton} ${styles.buttonCompact}`}
              onClick={() => onRemove(item.id)}
            >
              Remove
            </button>
          </div>

          <div className={styles.fieldGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Certification Name</label>
              <input
                className={styles.control}
                value={item.name}
                onChange={(event) => onUpdate(item.id, { name: event.target.value })}
                placeholder="AWS Certified Solutions Architect"
              />
              {entryErrors.name ? <span className={styles.errorText}>{entryErrors.name}</span> : null}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Issuer</label>
              <input
                className={styles.control}
                value={item.issuer}
                onChange={(event) => onUpdate(item.id, { issuer: event.target.value })}
                placeholder="Amazon Web Services"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Awarded Date</label>
              <input
                className={styles.control}
                value={item.date}
                onChange={(event) => onUpdate(item.id, { date: event.target.value })}
                placeholder="Feb 2025"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Credential ID</label>
              <input
                className={styles.control}
                value={item.credentialId}
                onChange={(event) => onUpdate(item.id, { credentialId: event.target.value })}
                placeholder="ABC-123-XYZ"
              />
            </div>

            <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
              <label className={styles.fieldLabel}>Credential URL</label>
              <input
                className={styles.control}
                value={item.url}
                onChange={(event) => onUpdate(item.id, { url: event.target.value })}
                placeholder="https://credential.net/..."
              />
            </div>
          </div>
        </article>
      )
    })}
  </div>
)

export default Certifications
