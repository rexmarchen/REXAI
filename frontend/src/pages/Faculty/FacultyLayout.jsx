import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpenCheck,
  HelpCircle,
  PlusCircle,
  BarChart3,
  UserCheck,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  LogOut,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import facultyApi from '../../services/facultyApi'
import styles from './FacultyLayout.module.css'

const FacultyLayout = ({ children, pageTitle = 'Faculty Portal' }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const currentPath = location.pathname

  useEffect(() => {
    facultyApi.getProfile()
      .then(res => {
        if (res?.profile) {
          setProfile(res.profile)
        }
      })
      .catch(() => {})
  }, [currentPath])

  const status = profile?.status || user?.facultyStatus || 'unverified'
  const isVerified = status === 'verified'
  const isPending = status === 'pending'
  const isAdmin = user?.role === 'admin'

  const NAV_ITEMS = [
    { path: '/faculty', label: '1. Overview', icon: LayoutDashboard },
    { path: '/faculty/quizzes', label: '2. My Quizzes', icon: BookOpenCheck },
    { path: '/faculty/questions', label: '3. Question Bank', icon: HelpCircle },
    { path: '/faculty/quizzes/new', label: '4. Create Quiz', icon: PlusCircle },
    { path: '/faculty/analytics', label: '5. Student Results / Analytics', icon: BarChart3 },
    { path: '/faculty/profile', label: '6. Faculty Profile', icon: UserCheck },
    { path: '/faculty/verification', label: '7. Verification Status', icon: ShieldCheck }
  ]

  let badgeClass = styles.statusUnverified
  let dotClass = styles.statusDotUnverified
  let badgeLabel = 'Unverified (Publish Locked)'
  if (isVerified || isAdmin) {
    badgeClass = styles.statusVerified
    dotClass = styles.statusDotVerified
    badgeLabel = 'Verified Faculty 🎓'
  } else if (isPending) {
    badgeClass = styles.statusPending
    dotClass = styles.statusDotPending
    badgeLabel = 'Verification Pending ⏳'
  }

  return (
    <div className={styles.shell}>
      {/* ── SIDEBAR ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <Link to="/faculty" className={styles.brand}>
            <div className={styles.brandMark}>
              <GraduationCap size={22} />
            </div>
            <div>
              <div className={styles.brandName}>REXION</div>
              <div className={styles.brandSub}>FACULTY & EDUCATOR</div>
            </div>
          </Link>

          <Link to="/faculty/verification" style={{ textDecoration: 'none' }}>
            <div className={`${styles.statusBadgeWrap} ${badgeClass}`}>
              <div className={`${styles.statusDot} ${dotClass}`} />
              <span className={styles.statusBadgeText}>{badgeLabel}</span>
            </div>
          </Link>

          <div className={styles.navSectionLabel}>Faculty Dashboard</div>
          <nav className={styles.navMenu}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = currentPath === item.path || (item.path !== '/faculty' && currentPath.startsWith(item.path))
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                >
                  <div className={styles.navItemLeft}>
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={14} />}
                </Link>
              )
            })}
          </nav>

          {isAdmin && (
            <>
              <div className={styles.navSectionLabel}>Academic Moderation</div>
              <nav className={styles.navMenu}>
                <Link
                  to="/admin/faculty"
                  className={`${styles.navItem} ${currentPath.startsWith('/admin/faculty') ? styles.navItemActive : ''}`}
                >
                  <div className={styles.navItemLeft}>
                    <ShieldCheck size={17} color="#2563EB" />
                    <span>Faculty Verification Queue</span>
                  </div>
                </Link>
              </nav>
            </>
          )}
        </div>

        <div className={styles.sidebarBottom}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                profile?.fullName?.[0] || user?.name?.[0] || 'F'
              )}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>
                {(() => {
                  const rawName = profile?.fullName || user?.name || 'Faculty Member'
                  const title = profile?.professionalTitle
                  if (title && !rawName.toLowerCase().startsWith(title.toLowerCase().replace('.', '')) && !rawName.toLowerCase().startsWith('prof') && !rawName.toLowerCase().startsWith('dr')) {
                    return `${title} ${rawName}`
                  }
                  return rawName
                })()}
              </div>
              <div className={styles.userRole}>
                {profile?.institutionName && profile.institutionName !== 'College / University'
                  ? profile.institutionName
                  : (user?.role === 'admin' ? 'REXION System Administration' : 'Institution Affiliation Pending')}
              </div>
            </div>
          </div>

          <Link to="/quizzes" className={styles.returnHubBtn} title="View public Career Hub">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ExternalLink size={15} color="#2563EB" />
              <span>Career Hub Student View</span>
            </div>
            <ChevronRight size={14} />
          </Link>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className={styles.main}>
        <header className={styles.topBar}>
          <h1 className={styles.topBarTitle}>
            {pageTitle}
          </h1>
          <div className={styles.topBarActions}>
            {!isVerified && !isAdmin && (
              <Link
                to="/faculty/verification"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#92400E',
                  background: '#FEF9E7',
                  border: '1px solid rgba(180, 136, 5, 0.3)',
                  padding: '6px 14px',
                  borderRadius: 999,
                  textDecoration: 'none'
                }}
              >
                <AlertCircle size={14} /> Complete Verification to Publish
              </Link>
            )}
            <Link to="/faculty/quizzes/new" className={styles.quickCreateBtn}>
              <PlusCircle size={15} />
              <span>Create Quiz</span>
            </Link>
          </div>
        </header>

        <div className={styles.contentWrapper}>
          {children}
        </div>
      </main>
    </div>
  )
}

export default FacultyLayout
