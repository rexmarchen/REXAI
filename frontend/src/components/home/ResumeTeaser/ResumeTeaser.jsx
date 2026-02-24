import React from 'react'
import { Link } from 'react-router-dom'
import styles from './ResumeTeaser.module.css'

const ResumeTeaser = () => {
  return (
    <section className={styles.teaser}>
      <h2 className={styles.title}>Future Resume Predictor</h2>
      <p className={styles.description}>
        Upload your resume and let Rexion predict your career path.
      </p>
      <Link to="/resume-predictor" className={styles.link}>Predict Now →</Link>
    </section>
  )
}

export default ResumeTeaser