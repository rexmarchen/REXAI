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
          <div className={styles.column}>
            <h3>Legal</h3>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '18px' }}>
          <p style={{ margin: 0, border: 'none', padding: 0 }}>© {new Date().getFullYear()} REXION AI. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.86rem' }}>
            <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link to="/terms" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
