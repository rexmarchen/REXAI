import styles from '../ResumeBuilder.module.css'

const Summary = ({ summary, errors = {}, onChange, onGenerate, isGenerating }) => (
  <div className={styles.fieldGrid}>
    <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
      <label className={styles.fieldLabel}>Professional Summary</label>
      <textarea
        className={`${styles.control} ${styles.textarea}`}
        value={summary}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Product-minded engineer with experience leading performant interfaces, scalable systems, and measurable launches across growth-stage teams."
      />
      <div className={styles.sectionFooter}>
        <span className={styles.helperText}>
          Aim for 2 to 4 sentences with role focus, strengths, and measurable impact.
        </span>
        <button
          type="button"
          className={`${styles.primaryButton} ${styles.buttonCompact}`}
          onClick={onGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate with AI'}
        </button>
      </div>
      {errors.summary ? <span className={styles.errorText}>{errors.summary}</span> : null}
    </div>
  </div>
)

export default Summary
