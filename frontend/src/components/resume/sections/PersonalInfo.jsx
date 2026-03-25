import styles from '../ResumeBuilder.module.css'

const PersonalInfo = ({ personal, errors = {}, onFieldChange }) => (
  <div className={styles.fieldGrid}>
    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>Full Name</label>
      <input
        className={styles.control}
        value={personal.name}
        onChange={(event) => onFieldChange('name', event.target.value)}
        placeholder="Alex Morgan"
      />
      {errors.name ? <span className={styles.errorText}>{errors.name}</span> : null}
    </div>

    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>Target Role</label>
      <input
        className={styles.control}
        value={personal.role}
        onChange={(event) => onFieldChange('role', event.target.value)}
        placeholder="Senior Frontend Engineer"
      />
      {errors.role ? <span className={styles.errorText}>{errors.role}</span> : null}
    </div>

    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>Email</label>
      <input
        type="email"
        className={styles.control}
        value={personal.email}
        onChange={(event) => onFieldChange('email', event.target.value)}
        placeholder="alex@example.com"
      />
      {errors.email ? <span className={styles.errorText}>{errors.email}</span> : null}
    </div>

    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>Phone</label>
      <input
        className={styles.control}
        value={personal.phone}
        onChange={(event) => onFieldChange('phone', event.target.value)}
        placeholder="+91 98765 43210"
      />
      {errors.phone ? <span className={styles.errorText}>{errors.phone}</span> : null}
    </div>

    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>Location</label>
      <input
        className={styles.control}
        value={personal.location}
        onChange={(event) => onFieldChange('location', event.target.value)}
        placeholder="Bengaluru, India"
      />
    </div>

    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>Years of Experience</label>
      <input
        type="number"
        min="0"
        className={styles.control}
        value={personal.years}
        onChange={(event) => onFieldChange('years', event.target.value)}
        placeholder="5"
      />
    </div>

    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>Website / Portfolio</label>
      <input
        className={styles.control}
        value={personal.website}
        onChange={(event) => onFieldChange('website', event.target.value)}
        placeholder="https://portfolio.dev"
      />
    </div>

    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>LinkedIn</label>
      <input
        className={styles.control}
        value={personal.linkedin}
        onChange={(event) => onFieldChange('linkedin', event.target.value)}
        placeholder="linkedin.com/in/alexmorgan"
      />
    </div>
  </div>
)

export default PersonalInfo
