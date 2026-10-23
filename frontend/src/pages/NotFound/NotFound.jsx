import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Compass, Home, LayoutDashboard, Briefcase, ArrowLeft } from 'lucide-react'
import styles from './NotFound.module.css'

const NotFound = () => {
  const navigate = useNavigate()

  return (
    <div className={styles.container}>
      <div className={styles.glowBlob} />
      <div className={styles.card}>
        <div className={styles.codeBadge}>
          <Compass size={15} /> Orbit Desynchronized
        </div>

        <div className={styles.glitchNumber}>404</div>

        <h1 className={styles.title}>You've Ventured Off-Trajectory</h1>
        <p className={styles.description}>
          The surface or resource you requested isn't available, has been relocated, or never existed in the REXION AI career ecosystem.
        </p>

        <div className={styles.buttonGroup}>
          <Link to="/" className={styles.primaryBtn}>
            <Home size={18} /> Return Home
          </Link>
          <button onClick={() => navigate(-1)} className={styles.secondaryBtn}>
            <ArrowLeft size={18} /> Go Back
          </button>
        </div>

        <div className={styles.quickNav}>
          <div className={styles.quickNavTitle}>Quick Navigation</div>
          <div className={styles.quickNavLinks}>
            <Link to="/career" className={styles.quickNavLink}>Career Hub</Link>
            <Link to="/intern-hunt" className={styles.quickNavLink}>Intern Hunt</Link>
            <Link to="/rexcode" className={styles.quickNavLink}>Rexcode Arena</Link>
            <Link to="/dashboard" className={styles.quickNavLink}>Dashboard</Link>
            <Link to="/privacy" className={styles.quickNavLink}>Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound
