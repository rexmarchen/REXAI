import styles from '../ResumeBuilder.module.css'

const Projects = ({ items, errors = {}, onAdd, onUpdate, onRemove }) => (
  <div className={styles.entryStack}>
    <div className={styles.sectionFooter}>
      <span className={styles.helperText}>
        Use projects to prove ownership, technical range, and shipped outcomes.
      </span>
      <button
        type="button"
        className={`${styles.secondaryButton} ${styles.buttonCompact}`}
        onClick={onAdd}
      >
        Add Project
      </button>
    </div>

    {items.map((item, index) => {
      const entryErrors = errors.entries?.[item.id] || {}

      return (
        <article key={item.id} className={styles.entryCard}>
          <div className={styles.entryHeader}>
            <div>
              <div className={styles.entryTitle}>Project #{index + 1}</div>
              <div className={styles.helperText}>Live product, case study, or technical build.</div>
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
              <label className={styles.fieldLabel}>Project Name</label>
              <input
                className={styles.control}
                value={item.name}
                onChange={(event) => onUpdate(item.id, { name: event.target.value })}
                placeholder="Rexion Dashboard"
              />
              {entryErrors.name ? <span className={styles.errorText}>{entryErrors.name}</span> : null}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Your Role</label>
              <input
                className={styles.control}
                value={item.role}
                onChange={(event) => onUpdate(item.id, { role: event.target.value })}
                placeholder="Lead Product Designer"
              />
            </div>

            <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
              <label className={styles.fieldLabel}>Project Description</label>
              <textarea
                className={`${styles.control} ${styles.textarea}`}
                value={item.description}
                onChange={(event) => onUpdate(item.id, { description: event.target.value })}
                placeholder="Designed and launched an AI-assisted workspace that improved recruiter turnaround time and candidate matching speed."
              />
              {entryErrors.description ? (
                <span className={styles.errorText}>{entryErrors.description}</span>
              ) : null}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Project URL</label>
              <input
                className={styles.control}
                value={item.url}
                onChange={(event) => onUpdate(item.id, { url: event.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Technologies</label>
              <input
                className={styles.control}
                value={(item.technologies || []).join(', ')}
                onChange={(event) =>
                  onUpdate(item.id, {
                    technologies: event.target.value
                      .split(',')
                      .map((value) => value.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="React, Vite, Zustand, Node.js"
              />
            </div>
          </div>
        </article>
      )
    })}
  </div>
)

export default Projects
