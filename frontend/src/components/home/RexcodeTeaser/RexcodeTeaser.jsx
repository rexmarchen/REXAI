import React from 'react'
import { Link } from 'react-router-dom'
import styles from './RexcodeTeaser.module.css'

const RexcodeTeaser = () => {
  return (
    <section className={styles.teaser}>
      <h2 className={styles.title}>Rexcode</h2>
      <p className={styles.description}>
        Describe the website you want, and our AI will generate it for you – instantly.
      </p>
      <Link to="/rexcode" className={styles.link}>Try Rexcode →</Link>
    </section>
  )
}

export default RexcodeTeaser