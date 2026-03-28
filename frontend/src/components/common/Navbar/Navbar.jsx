import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { buildLoginPath } from '../../../utils/authSession'
import styles from './Navbar.module.css'

const NAV_LINKS = [
  { label: 'Platform', href: '/#platform' },
  { label: 'Proof', href: '/#proof' },
  { label: 'Pricing', href: '/#pricing' }
]

const menuTransition = {
  type: 'spring',
  stiffness: 220,
  damping: 22
}

const getUserLabel = (user) => {
  if (!user) {
    return null
  }

  return user.fullName || user.name || user.email || 'Signed In'
}

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, logout, user } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  const handleSignOut = () => {
    logout()
    navigate('/')
  }

  const userLabel = getUserLabel(user)
  const dashboardHref = useMemo(
    () => (isAuthenticated ? '/dashboard' : buildLoginPath('/dashboard')),
    [isAuthenticated]
  )

  return (
    <motion.header
      className={`${styles.navbar} ${isScrolled ? styles.navbarScrolled : ''}`}
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className={styles.inner}>
        <Link to="/" className={styles.brand} aria-label="REXION home">
          <span className={styles.brandMark}>Rx</span>
          <span className={styles.brandText}>REXION</span>
        </Link>

        <nav className={styles.desktopNav} aria-label="Primary navigation">
          {NAV_LINKS.map((link) => (
            <a key={link.label} href={link.href} className={styles.navLink}>
              {link.label}
            </a>
          ))}
          <Link to={dashboardHref} className={styles.navLink}>
            Dashboard
          </Link>
        </nav>

        <div className={styles.actions}>
          {userLabel && <span className={styles.userBadge}>{userLabel}</span>}
          <Link to={isAuthenticated ? '/dashboard' : '/login'} className={styles.ghostButton}>
            {isAuthenticated ? 'Open Dashboard' : 'Log In'}
          </Link>
          {isAuthenticated ? (
            <button type="button" className={styles.primaryButton} onClick={handleSignOut}>
              Sign Out
            </button>
          ) : (
            <Link to="/register" className={styles.primaryButton}>
              Start Free
            </Link>
          )}
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-label="Toggle navigation"
          >
            {isOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.mobileMenu}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={menuTransition}
          >
            <div className={styles.mobileLinks}>
              {NAV_LINKS.map((link) => (
                <a key={link.label} href={link.href} className={styles.mobileLink}>
                  {link.label}
                </a>
              ))}
              <Link to={dashboardHref} className={styles.mobileLink}>
                Dashboard
              </Link>
              <Link to={isAuthenticated ? '/intern-hunt' : buildLoginPath('/intern-hunt')} className={styles.mobileLink}>
                Intern Hunt
              </Link>
              <Link to={isAuthenticated ? '/resume-predictor' : buildLoginPath('/resume-predictor')} className={styles.mobileLink}>
                Resume Predictor
              </Link>
              <Link to={isAuthenticated ? '/rexcode' : buildLoginPath('/rexcode')} className={styles.mobileLink}>
                Rexcode
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

export default Navbar
