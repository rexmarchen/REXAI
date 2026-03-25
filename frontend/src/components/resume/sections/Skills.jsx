import { useState } from 'react'
import styles from '../ResumeBuilder.module.css'

const Skills = ({
  skills,
  errors = {},
  onAddSkill,
  onRemoveSkill,
  onSuggestSkills,
  isSuggesting,
}) => {
  const [draftSkill, setDraftSkill] = useState('')

  const handleAddSkill = () => {
    onAddSkill(draftSkill)
    setDraftSkill('')
  }

  return (
    <div className={styles.fieldGrid}>
      <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
        <label className={styles.fieldLabel}>Skills</label>
        <div className={styles.tagComposer}>
          <input
            className={`${styles.control} ${styles.tagInput}`}
            value={draftSkill}
            onChange={(event) => setDraftSkill(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleAddSkill()
              }
            }}
            placeholder="Add a skill like React, SQL, Leadership..."
          />
          <button
            type="button"
            className={`${styles.secondaryButton} ${styles.buttonCompact}`}
            onClick={handleAddSkill}
          >
            Add Skill
          </button>
          <button
            type="button"
            className={`${styles.primaryButton} ${styles.buttonCompact}`}
            onClick={onSuggestSkills}
            disabled={isSuggesting}
          >
            {isSuggesting ? 'Suggesting...' : 'Suggest Skills'}
          </button>
        </div>

        <div className={styles.tagList}>
          {skills.length > 0 ? (
            skills.map((skill) => (
              <span key={skill} className={styles.tagChip}>
                {skill}
                <button
                  type="button"
                  className={`${styles.iconButton} ${styles.buttonCompact}`}
                  onClick={() => onRemoveSkill(skill)}
                >
                  Remove
                </button>
              </span>
            ))
          ) : (
            <span className={styles.helperText}>
              Add at least 3 role-specific skills to improve ATS coverage.
            </span>
          )}
        </div>

        {errors.skills ? <span className={styles.errorText}>{errors.skills}</span> : null}
      </div>
    </div>
  )
}

export default Skills
