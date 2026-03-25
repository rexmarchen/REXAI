import styles from '../ResumeBuilder.module.css'

const Experience = ({
  items,
  errors = {},
  onAdd,
  onUpdate,
  onRemove,
  onAddBullet,
  onUpdateBullet,
  onRemoveBullet,
  onImproveBullets,
  improvingId,
}) => (
  <div className={styles.entryStack}>
    <div className={styles.sectionFooter}>
      <span className={styles.helperText}>
        Add impact-focused roles with quantified outcomes wherever possible.
      </span>
      <button
        type="button"
        className={`${styles.secondaryButton} ${styles.buttonCompact}`}
        onClick={onAdd}
      >
        Add Experience
      </button>
    </div>

    {items.map((item, index) => {
      const entryErrors = errors.entries?.[item.id] || {}

      return (
        <article key={item.id} className={styles.entryCard}>
          <div className={styles.entryHeader}>
            <div>
              <div className={styles.entryTitle}>Experience #{index + 1}</div>
              <div className={styles.helperText}>Employer, role, dates, and achievement bullets.</div>
            </div>
            <div className={styles.entryMeta}>
              <button
                type="button"
                className={`${styles.dangerButton} ${styles.buttonCompact}`}
                onClick={() => onRemove(item.id)}
              >
                Remove
              </button>
            </div>
          </div>

          <div className={styles.fieldGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Role</label>
              <input
                className={styles.control}
                value={item.role}
                onChange={(event) => onUpdate(item.id, { role: event.target.value })}
                placeholder="Senior Frontend Engineer"
              />
              {entryErrors.role ? <span className={styles.errorText}>{entryErrors.role}</span> : null}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Company</label>
              <input
                className={styles.control}
                value={item.company}
                onChange={(event) => onUpdate(item.id, { company: event.target.value })}
                placeholder="Rexion Labs"
              />
              {entryErrors.company ? (
                <span className={styles.errorText}>{entryErrors.company}</span>
              ) : null}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Location</label>
              <input
                className={styles.control}
                value={item.location}
                onChange={(event) => onUpdate(item.id, { location: event.target.value })}
                placeholder="Remote / Bengaluru"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Current Role</label>
              <div className={styles.switchRow}>
                <button
                  type="button"
                  className={`${styles.togglePill} ${item.current ? styles.togglePillActive : ''}`}
                  onClick={() => onUpdate(item.id, { current: !item.current })}
                />
                <span className={styles.helperText}>
                  {item.current ? 'Currently working here' : 'Set as current role'}
                </span>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Start Date</label>
              <input
                className={styles.control}
                value={item.startDate}
                onChange={(event) => onUpdate(item.id, { startDate: event.target.value })}
                placeholder="Jan 2022"
              />
              {entryErrors.startDate ? (
                <span className={styles.errorText}>{entryErrors.startDate}</span>
              ) : null}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>End Date</label>
              <input
                className={styles.control}
                value={item.endDate}
                onChange={(event) => onUpdate(item.id, { endDate: event.target.value })}
                placeholder={item.current ? 'Present' : 'Mar 2025'}
                disabled={item.current}
              />
              {entryErrors.endDate ? (
                <span className={styles.errorText}>{entryErrors.endDate}</span>
              ) : null}
            </div>

            <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
              <label className={styles.fieldLabel}>Achievement Bullets</label>
              <div className={styles.bulletList}>
                {item.bullets.map((bullet, bulletIndex) => (
                  <div key={`${item.id}-${bulletIndex}`} className={styles.bulletRow}>
                    <span className={styles.bulletMarker}>-</span>
                    <textarea
                      className={`${styles.control} ${styles.textarea}`}
                      value={bullet}
                      onChange={(event) =>
                        onUpdateBullet(item.id, bulletIndex, event.target.value)
                      }
                      placeholder="Improved release velocity by 28% by redesigning the frontend delivery workflow."
                    />
                    <button
                      type="button"
                      className={`${styles.ghostButton} ${styles.buttonCompact}`}
                      onClick={() => onRemoveBullet(item.id, bulletIndex)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className={styles.sectionFooter}>
                <button
                  type="button"
                  className={`${styles.secondaryButton} ${styles.buttonCompact}`}
                  onClick={() => onAddBullet(item.id)}
                >
                  Add Bullet
                </button>
                <button
                  type="button"
                  className={`${styles.primaryButton} ${styles.buttonCompact}`}
                  onClick={() => onImproveBullets(item.id)}
                  disabled={improvingId === item.id}
                >
                  {improvingId === item.id ? 'Improving...' : 'Improve Bullets'}
                </button>
              </div>
              {entryErrors.bullets ? (
                <span className={styles.errorText}>{entryErrors.bullets}</span>
              ) : null}
            </div>
          </div>
        </article>
      )
    })}
  </div>
)

export default Experience
