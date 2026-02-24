import React from 'react'
import { Link } from 'react-router-dom'
import styles from './Hero.module.css'

const Hero = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.badge}>NEXT GENERATION ARTIFICIAL INTELLIGENCE</div>
      <h1 className={styles.title}>REXION</h1>
      <p className={styles.subtitle}>INTELLIGENCE BEYOND IMAGINATION</p>
      <div className={styles.cta}>
        <Link to="/resume-predictor" className={styles.button}>Predict My Future</Link>
        <Link to="/rexcode" className={styles.button}>Create with AI</Link>
      </div>
    </section>
  )
}

export default Hero