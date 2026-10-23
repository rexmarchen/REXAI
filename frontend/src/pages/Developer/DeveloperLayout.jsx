import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpenCheck,
  PlusCircle,
  HelpCircle,
  BarChart3,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Code2,
  Terminal,
  LogOut
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import styles from './DeveloperLayout.module.css'

const DeveloperLayout = ({ children, pageTitle = 'Developer Portal' }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const currentPath = location.pathname

  const NAV_ITEMS = [
    { path: '/developer', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/developer/quizzes', label: 'Manage Quizzes', icon: BookOpenCheck },
    { path: '/developer/quizzes/new', label: 'Create Quiz', icon: PlusCircle },
    { path: '/developer/questions', label: 'Question Bank', icon: HelpCircle },
    { path: '/developer/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/developer/apply', label: 'Developer Profile', icon: Code2 }
  ]

  const isAdmin = user?.role === 'admin'

  return (
    <div className={styles.shell}>
      {/* ── SIDEBAR ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <Link to="/developer" className={styles.brand}>
            <div className={styles.brandMark}>
              <Terminal size={20} />
            </div>
            <div>
              <div className={styles.brandName}>REXION</div>
              <div className={styles.brandSub}>DEVELOPER PORTAL</div>
            </div>
          </Link>

          <div className={styles.devBadgeWrap}>
            <div className={styles.devBadgeDot} />
            <span className={styles.devBadgeText}>
              {isAdmin ? 'Admin Console' : 'Authorized Developer'}
            </span>
          </div>

          <div className={styles.navSectionLabel}>Overview & Quizzes</div>
          <nav className={styles.navMenu}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = currentPath === item.path || (item.path !== '/developer' && currentPath.startsWith(item.path))
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                >
                  <div className={styles.navItemLeft}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={14} />}
                </Link>
              )
            })}
          </nav>

          {isAdmin && (
            <>
              <div className={styles.navSectionLabel}>Administration</div>
              <nav className={styles.navMenu}>
                <Link
                  to="/admin/developers"
                  className={`${styles.navItem} ${currentPath.startsWith('/admin/developers') ? styles.navItemActive : ''}`}
                >
                  <div className={styles.navItemLeft}>
                    <ShieldCheck size={18} />
                    <span>Developer Moderation</span>
                  </div>
                </Link>
              </nav>
            </>
          )}
        </div>

        <div className={styles.sidebarBottom}>
          <Link to="/career" className={styles.returnHubBtn} title="View public Career Hub">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ExternalLink size={16} color="#D96B43" />
              <span>Career Hub</span>
            </div>
            <ChevronRight size={14} color="#8E7E70" />
          </Link>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <main className={styles.main}>
        <header className={styles.topBar}>
          <div className={styles.topBarTitle}>
            {pageTitle}
          </div>

          <div className={styles.topBarActions}>
            <Link to="/developer/quizzes/new" className={styles.actionNewBtn}>
              <PlusCircle size={15} />
              <span>New Quiz</span>
            </Link>

            <div
              className={styles.userChip}
              onClick={() => navigate('/profile')}
              title="View profile settings"
            >
              <div className={styles.userAvatar}>
                {user?.name?.charAt(0).toUpperCase() || 'D'}
              </div>
              <span className={styles.userName}>
                {user?.name || 'Developer'}
              </span>
            </div>
          </div>
        </header>

        <div className={styles.pageBody}>
          {children}
        </div>
      </main>
    </div>
  )
}

export default DeveloperLayout
