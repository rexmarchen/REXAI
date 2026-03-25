import styles from '../ResumeBuilder.module.css'

const Education = ({ items, errors = {}, onAdd, onUpdate, onRemove }) => (
  <div className={styles.entryStack}>
    <div className={styles.sectionFooter}>
      <span className={styles.helperText}>
        Include the most relevant academic history for your current target role.
      </span>
      <button
        type="button"
        className={`${styles.secondaryButton} ${styles.buttonCompact}`}
        onClick={onAdd}
      >
        Add Education
      </button>
    </div>

    {errors.education ? <div className={styles.sectionMessage}>{errors.education}</div> : null}

    {items.map((item, index) => {
      const entryErrors = errors.entries?.[item.id] || {}

      return (
        <article key={item.id} className={styles.entryCard}>
          <div className={styles.entryHeader}>
            <div>
              <div className={styles.entryTitle}>Education #{index + 1}</div>
              <div className={styles.helperText}>Degree, institution, and supporting context.</div>
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
              <label className={styles.fieldLabel}>Institution</label>
              <input
                className={styles.control}
                value={item.institution}
                onChange={(event) => onUpdate(item.id, { institution: event.target.value })}
                placeholder="Indian Institute of Technology"
              />
              {entryErrors.institution ? (
                <span className={styles.errorText}>{entryErrors.institution}</span>
              ) : null}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Degree</label>
              <input
                className={styles.control}
                value={item.degree}
                onChange={(event) => onUpdate(item.id, { degree: event.target.value })}
                placeholder="B.Tech in Computer Science"
              />
              {entryErrors.degree ? (
                <span className={styles.errorText}>{entryErrors.degree}</span>
              ) : null}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Location</label>
              <input
                className={styles.control}
                value={item.location}
                onChange={(event) => onUpdate(item.id, { location: event.target.value })}
                placeholder="Delhi, India"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Grade / GPA</label>
              <input
                className={styles.control}
                value={item.grade}
                onChange={(event) => onUpdate(item.id, { grade: event.target.value })}
                placeholder="8.9 CGPA"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Start Date</label>
              <input
                className={styles.control}
                value={item.startDate}
                onChange={(event) => onUpdate(item.id, { startDate: event.target.value })}
                placeholder="2017"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>End Date</label>
              <input
                className={styles.control}
                value={item.endDate}
                onChange={(event) => onUpdate(item.id, { endDate: event.target.value })}
                placeholder="2021"
              />
            </div>
          </div>
        </article>
      )
    })}
  </div>
)

export default Education
