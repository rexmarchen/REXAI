import React from 'react'
import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandBlock}>
          <span className={styles.eyebrow}>REXION AI</span>
          <h2 className={styles.title}>The operating system for a sharper job search.</h2>
          <p className={styles.copy}>
            Built for candidates who want structured outreach, stronger signals, and less wasted time.
          </p>
        </div>

        <div className={styles.linkColumns}>
          <div className={styles.column}>
            <h3>Product</h3>
            <a href="/#platform">Platform</a>
            <a href="/#pricing">Pricing</a>
            <Link to="/dashboard">Dashboard</Link>
          </div>
          <div className={styles.column}>
            <h3>Tools</h3>
            <Link to="/intern-hunt">Intern Hunt</Link>
            <Link to="/resume-predictor">Resume Predictor</Link>
            <Link to="/resume">Resume Builder</Link>
          </div>
          <div className={styles.column}>
            <h3>Studio</h3>
            <Link to="/rexcode">Rexcode</Link>
            <Link to="/login">Log In</Link>
            <Link to="/register">Start Free</Link>
          </div>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <p>© {new Date().getFullYear()} REXION AI. Premium frontend refreshed for the unified platform.</p>
      </div>
    </footer>
  )
}

export default Footer
