import React, { useEffect, useMemo, useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { buildLoginPath } from '../../../utils/authSession'
import styles from './Navbar.module.css'

const NAV_LINKS = [
  { label: 'Platform', href: '/#platform' },
  { label: 'Proof', href: '/#proof' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Connections', href: '/connections', isRoute: true },
  { label: 'Career Hub', href: '/career', isRoute: true }
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
  const { isAuthenticated, isReady, logout, user } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [quickMenuOpen, setQuickMenuOpen] = useState(false)
  const quickMenuRef = useRef(null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setQuickMenuOpen(false)
      }
    }
    const handleClickOutside = (e) => {
      if (quickMenuRef.current && !quickMenuRef.current.contains(e.target)) {
        setQuickMenuOpen(false)
      }
    }
    if (quickMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [quickMenuOpen])

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setIsOpen(false)
    setQuickMenuOpen(false)
  }, [location.pathname])

  const handleSignOut = () => {
    logout()
    navigate('/')
  }

  const canOpenProtectedRoutes = isReady && isAuthenticated
  const userLabel = canOpenProtectedRoutes ? getUserLabel(user) : null
  const dashboardHref = useMemo(() => '/dashboard', [])

  return (
    <motion.header
      className={`${styles.navbar} ${isScrolled ? styles.navbarScrolled : ''}`}
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className={styles.inner}>
        <div className={styles.brandGroup} ref={quickMenuRef}>
          <button
            type="button"
            className={styles.threeLinesButton}
            onClick={() => setQuickMenuOpen((prev) => !prev)}
            aria-expanded={quickMenuOpen}
            aria-label="Toggle Features Panel"
            title="Features & Navigation"
          >
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
          </button>

          <Link to="/" className={styles.brand} aria-label="REXION home">
            <span className={styles.brandMark}>Rx</span>
            <span className={styles.brandText}>REXION</span>
          </Link>

          {/* In-page Left Features Panel (No upper backdrop, on this page directly) */}
          <AnimatePresence>
            {quickMenuOpen && (
              <motion.div
                className={styles.leftFeaturesPanel}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
              >
                <div className={styles.panelHeader}>
                  <span className={styles.panelBadge}>WORKSPACE TOOLS</span>
                  <button
                    type="button"
                    className={styles.panelCloseBtn}
                    onClick={() => setQuickMenuOpen(false)}
                    aria-label="Close"
                    title="Close"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <div className={styles.panelContent}>
                  {user?.role === 'admin' && (
                    <>
                      <div className={styles.drawerSectionLabel} style={{ color: '#E07A5F', fontWeight: 800, letterSpacing: '0.05em' }}>
                        Super Admin Access
                      </div>
                      <Link
                        to="/admin"
                        className={styles.drawerItem}
                        style={{
                          background: 'rgba(224, 122, 95, 0.1)',
                          border: '1px solid rgba(224, 122, 95, 0.35)',
                          borderRadius: '12px',
                          marginBottom: '10px'
                        }}
                        onClick={() => setQuickMenuOpen(false)}
                      >
                        <div className={styles.drawerItemIcon} style={{ color: '#E07A5F' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                          </svg>
                        </div>
                        <div className={styles.drawerItemMeta}>
                          <strong style={{ color: '#E07A5F', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>Admin Control Center</span>
                            <span style={{ fontSize: '0.68rem', padding: '1px 6px', background: '#E07A5F', color: '#FFF', borderRadius: '4px', fontWeight: 800 }}>PRO</span>
                          </strong>
                          <p>Manage users, roles, subscriptions, automation & logs</p>
                        </div>
                      </Link>
                      <div className={styles.drawerDivider} />
                    </>
                  )}

                  <div className={styles.drawerSectionLabel}>Core Tools</div>

                  <Link
                    to={canOpenProtectedRoutes ? '/activity' : buildLoginPath('/activity')}
                    className={styles.drawerItem}
                    style={{
                      background: 'rgba(224, 122, 95, 0.08)',
                      border: '1px solid rgba(224, 122, 95, 0.25)',
                      borderRadius: '12px',
                      marginBottom: '8px'
                    }}
                    onClick={() => setQuickMenuOpen(false)}
                  >
                    <div className={styles.drawerItemIcon} style={{ color: '#E07A5F' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                    </div>
                    <div className={styles.drawerItemMeta}>
                      <strong style={{ color: '#E07A5F' }}>Activity Tracker</strong>
                      <p>View your live activity timeline, history & progress stats</p>
                    </div>
                  </Link>

                  <Link
                    to={canOpenProtectedRoutes ? '/resume' : buildLoginPath('/resume')}
                    className={styles.drawerItem}
                    onClick={() => setQuickMenuOpen(false)}
                  >
                    <div className={styles.drawerItemIcon}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                    </div>
                    <div className={styles.drawerItemMeta}>
                      <strong>Resume Builder</strong>
                      <p>Build, format and export job-targeted resumes</p>
                    </div>
                  </Link>

                  <Link
                    to={canOpenProtectedRoutes ? '/resume-predictor' : buildLoginPath('/resume-predictor')}
                    className={styles.drawerItem}
                    onClick={() => setQuickMenuOpen(false)}
                  >
                    <div className={styles.drawerItemIcon}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                      </svg>
                    </div>
                    <div className={styles.drawerItemMeta}>
                      <strong>Autonomous Apply & ATS</strong>
                      <p>Resume intelligence, ATS score & 1-click agent apply</p>
                    </div>
                  </Link>

                  <Link
                    to="/career"
                    className={styles.drawerItem}
                    onClick={() => setQuickMenuOpen(false)}
                  >
                    <div className={styles.drawerItemIcon}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                    </div>
                    <div className={styles.drawerItemMeta}>
                      <strong>Career Hub</strong>
                      <p>Daily challenges, skill progress, quizzes & code arena</p>
                    </div>
                  </Link>

                  <Link
                    to="/internships"
                    className={styles.drawerItem}
                    onClick={() => setQuickMenuOpen(false)}
                  >
                    <div className={styles.drawerItemIcon}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                      </svg>
                    </div>
                    <div className={styles.drawerItemMeta}>
                      <strong>Verified Internships</strong>
                      <p>Curated roles & AI skill-gap analyzer</p>
                    </div>
                  </Link>

                  <div className={styles.drawerDivider} />
                  <div className={styles.drawerSectionLabel}>Technical Author & Developer</div>

                  <Link
                    to={canOpenProtectedRoutes ? (user?.role === 'developer' || user?.developerStatus === 'active' ? '/developer' : '/developer/apply') : buildLoginPath('/developer/apply')}
                    className={styles.drawerItem}
                    onClick={() => setQuickMenuOpen(false)}
                  >
                    <div className={styles.drawerItemIcon} style={{ color: '#F97316' }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6"></polyline>
                        <polyline points="8 6 2 12 8 18"></polyline>
                      </svg>
                    </div>
                    <div className={styles.drawerItemMeta}>
                      <strong style={{ color: '#F97316' }}>
                        {user?.role === 'developer' || user?.developerStatus === 'active'
                          ? 'Developer Portal'
                          : user?.developerStatus === 'pending'
                          ? 'Developer Status: Under Review'
                          : user?.developerStatus === 'suspended'
                          ? 'Developer Access Suspended'
                          : 'Create Developer Account'}
                      </strong>
                      <p>Author technical quizzes, question banks & code challenges</p>
                    </div>
                  </Link>

                  {user?.role === 'admin' && (
                    <Link
                      to="/admin/developers"
                      className={styles.drawerItem}
                      onClick={() => setQuickMenuOpen(false)}
                    >
                      <div className={styles.drawerItemIcon} style={{ color: '#38BDF8' }}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                      </div>
                      <div className={styles.drawerItemMeta}>
                        <strong style={{ color: '#38BDF8' }}>Developer Moderation</strong>
                        <p>Review developer applications & grant privileges</p>
                      </div>
                    </Link>
                  )}

                  <div className={styles.drawerDivider} />
                  <div className={styles.drawerSectionLabel}>Educator & Administration</div>

                  {user?.role === 'faculty' && (
                    <Link
                      to="/faculty"
                      className={styles.drawerItem}
                      onClick={() => setQuickMenuOpen(false)}
                    >
                      <div className={styles.drawerItemIcon} style={{ color: '#FBBF24' }}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                          <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                        </svg>
                      </div>
                      <div className={styles.drawerItemMeta}>
                        <strong style={{ color: '#FBBF24' }}>Faculty Portal</strong>
                        <p>Quiz authoring, question banks & educator verification</p>
                      </div>
                    </Link>
                  )}

                  {user?.role === 'admin' && (
                    <Link
                      to="/admin/faculty"
                      className={styles.drawerItem}
                      onClick={() => setQuickMenuOpen(false)}
                    >
                      <div className={styles.drawerItemIcon} style={{ color: '#34D399' }}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                      </div>
                      <div className={styles.drawerItemMeta}>
                        <strong style={{ color: '#34D399' }}>Faculty Moderation</strong>
                        <p>Review educator dossiers & grant quiz publishing</p>
                      </div>
                    </Link>
                  )}

                  <div className={styles.drawerDivider} />
                  <div className={styles.drawerSectionLabel}>Account & System</div>

                  <Link
                    to={canOpenProtectedRoutes ? '/dashboard' : buildLoginPath('/dashboard')}
                    className={styles.drawerItem}
                    onClick={() => setQuickMenuOpen(false)}
                  >
                    <div className={styles.drawerItemIcon}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                    <div className={styles.drawerItemMeta}>
                      <strong>Profile</strong>
                      <p>Candidate background, links & credentials</p>
                    </div>
                  </Link>

                  {(!user?.plan || String(user?.plan).toLowerCase() === 'free') ? (
                    <Link
                      to={canOpenProtectedRoutes ? '/dashboard' : buildLoginPath('/dashboard')}
                      className={`${styles.drawerItem} ${styles.drawerUpgradeItem}`}
                      onClick={() => setQuickMenuOpen(false)}
                    >
                      <div className={styles.drawerItemIconUpgrade}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                        </svg>
                      </div>
                      <div className={styles.drawerItemMeta}>
                        <div className={styles.drawerUpgradeTitleRow}>
                          <strong style={{ color: '#ffffff' }}>Upgrade Plan</strong>
                          <span className={styles.drawerBadgePro}>PRO</span>
                        </div>
                        <p>Access Outreach automation, unlimited matches & gigs</p>
                      </div>
                    </Link>
                  ) : (
                    <Link
                      to={canOpenProtectedRoutes ? '/dashboard' : buildLoginPath('/dashboard')}
                      className={styles.drawerItem}
                      onClick={() => setQuickMenuOpen(false)}
                    >
                      <div className={styles.drawerItemIcon}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                          <line x1="2" y1="10" x2="22" y2="10"></line>
                        </svg>
                      </div>
                      <div className={styles.drawerItemMeta}>
                        <div className={styles.drawerUpgradeTitleRow}>
                          <strong>Subscription Plan</strong>
                          <span className={styles.drawerBadgeActive}>{String(user?.plan).toUpperCase()}</span>
                        </div>
                        <p>Manage subscription, quota & billing invoices</p>
                      </div>
                    </Link>
                  )}

                  <Link
                    to={canOpenProtectedRoutes ? '/dashboard' : buildLoginPath('/dashboard')}
                    className={styles.drawerItem}
                    onClick={() => setQuickMenuOpen(false)}
                  >
                    <div className={styles.drawerItemIcon}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                    </div>
                    <div className={styles.drawerItemMeta}>
                      <strong>Settings</strong>
                      <p>Outreach defaults, preferences & notifications</p>
                    </div>
                  </Link>
                </div>

                <div className={styles.drawerFooter}>
                  {canOpenProtectedRoutes ? (
                    <div className={styles.drawerUserBox}>
                      <div className={styles.drawerUserAvatar}>
                        {userLabel ? userLabel.slice(0, 1).toUpperCase() : 'U'}
                      </div>
                      <div className={styles.drawerUserMeta}>
                        <strong>{userLabel}</strong>
                        <span>{user?.email || 'Logged In'}</span>
                      </div>
                      <button
                        type="button"
                        className={styles.drawerSignOutBtn}
                        onClick={() => {
                          setQuickMenuOpen(false)
                          handleSignOut()
                        }}
                        title="Sign Out"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                          <polyline points="16 17 21 12 16 7"></polyline>
                          <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <Link
                      to="/login"
                      className={styles.drawerLoginBtn}
                      onClick={() => setQuickMenuOpen(false)}
                    >
                      Log In to Account
                    </Link>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className={styles.desktopNav} aria-label="Primary navigation">
          {NAV_LINKS.map((link) =>
            link.isRoute ? (
              <Link
                key={link.label}
                to={link.href}
                className={`${styles.navLink} ${location.pathname === link.href ? styles.navLinkActive : ''}`}
              >
                {link.label}
              </Link>
            ) : (
              <a key={link.label} href={link.href} className={styles.navLink}>
                {link.label}
              </a>
            )
          )}
          <Link to={dashboardHref} className={styles.navLink}>
            Dashboard
          </Link>
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className={`${styles.navLink} ${location.pathname.startsWith('/admin') ? styles.navLinkActive : ''}`}
              style={{
                color: '#E07A5F',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span>Admin</span>
            </Link>
          )}
        </nav>

        <div className={styles.actions}>
          {userLabel && <span className={styles.userBadge}>{userLabel}</span>}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className={styles.ghostButton}
              style={{
                borderColor: 'rgba(224, 122, 95, 0.45)',
                color: '#E07A5F',
                background: 'rgba(224, 122, 95, 0.08)',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span>Admin Panel</span>
            </Link>
          )}
          {canOpenProtectedRoutes ? (
            <Link to="/dashboard" className={styles.ghostButton}>
              Open Dashboard
            </Link>
          ) : (
            <Link to="/login" className={styles.ghostButton}>
              Log In
            </Link>
          )}
          {canOpenProtectedRoutes ? (
            <button type="button" className={styles.primaryButton} onClick={handleSignOut}>
              Sign Out
            </button>
          ) : (
            <Link to="/register" className={styles.primaryButton}>
              Sign Up
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
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className={styles.mobileLink}
                  style={{ color: '#E07A5F', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={() => setIsOpen(false)}
                >
                  <span>🛡️</span>
                  <span>Admin Control Center</span>
                </Link>
              )}
              {NAV_LINKS.map((link) =>
                link.isRoute ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    className={`${styles.mobileLink} ${location.pathname === link.href ? styles.mobileLinkActive : ''}`}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a key={link.label} href={link.href} className={styles.mobileLink}>
                    {link.label}
                  </a>
                )
              )}
              {!canOpenProtectedRoutes ? (
                <a href="/#tools" className={styles.mobileLink}>
                  Explore Tools
                </a>
              ) : null}
              <Link to={dashboardHref} className={styles.mobileLink}>
                Dashboard
              </Link>
              <Link to={canOpenProtectedRoutes ? '/intern-hunt' : buildLoginPath('/intern-hunt')} className={styles.mobileLink}>
                Intern Hunt
              </Link>
              <Link to={canOpenProtectedRoutes ? '/resume-predictor' : buildLoginPath('/resume-predictor')} className={styles.mobileLink}>
                Resume Predictor
              </Link>
              <Link to={canOpenProtectedRoutes ? '/rexcode' : buildLoginPath('/rexcode')} className={styles.mobileLink}>
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
