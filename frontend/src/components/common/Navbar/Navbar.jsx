import React from 'react'
import { Link } from 'react-router-dom'
import styles from './Navbar.module.css'

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>REXION</div>
      <ul className={styles.navLinks}>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/intern-hunt">Intern Hunt</Link></li>
        <li><Link to="/resume-predictor">Resume Predictor</Link></li>
        <li><a href="/#workspace">Workspace</a></li>
        <li><Link to="/login" className={styles.loginLink}>Login</Link></li>
      </ul>
    </nav>
  )
}

export default Navbar
