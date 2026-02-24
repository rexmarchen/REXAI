import React, { useMemo, useState } from 'react'
import HomeSection from './sections/HomeSection'
import AIChatSection from './sections/AIChatSection'
import EditorSection from './sections/EditorSection'
import ModelsSection from './sections/ModelsSection'
import FilesSection from './sections/FilesSection'
import ToolsSection from './sections/ToolsSection'
import DeploySection from './sections/DeploySection'
import AnalyticsSection from './sections/AnalyticsSection'
import SettingsSection from './sections/SettingsSection'
import AccountSection from './sections/AccountSection'
import styles from './WorkspaceSection.module.css'

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: 'H' },
  { id: 'aiChat', label: 'AI Chat', icon: 'A', badge: '3' },
  { id: 'editor', label: 'Editor', icon: 'E' },
  { id: 'models', label: 'Models', icon: 'M' },
  { id: 'files', label: 'Files', icon: 'F' },
  { id: 'tools', label: 'Tools', icon: 'T' },
  { id: 'deploy', label: 'Deploy', icon: 'D' },
  { id: 'analytics', label: 'Analytics', icon: 'N' },
  { id: 'settings', label: 'Settings', icon: 'S' }
]

const WorkspaceSection = () => {
  const [activeSection, setActiveSection] = useState('home')
  const [isPinnedExpanded, setIsPinnedExpanded] = useState(false)
  const [isHoverExpanded, setIsHoverExpanded] = useState(false)

  const isExpanded = isPinnedExpanded || isHoverExpanded

  const activeContent = useMemo(() => {
    switch (activeSection) {
      case 'aiChat':
        return <AIChatSection />
      case 'editor':
        return <EditorSection />
      case 'models':
        return <ModelsSection />
      case 'files':
        return <FilesSection />
      case 'tools':
        return <ToolsSection />
      case 'deploy':
        return <DeploySection />
      case 'analytics':
        return <AnalyticsSection />
      case 'settings':
        return <SettingsSection />
      case 'account':
        return <AccountSection />
      case 'home':
      default:
        return <HomeSection />
    }
  }, [activeSection])

  return (
    <div className={`${styles.workspaceShell} ${isExpanded ? styles.workspaceShellExpanded : ''}`}>
      <aside
        className={`${styles.sidebar} ${isExpanded ? styles.sidebarExpanded : ''}`}
        onMouseEnter={() => setIsHoverExpanded(true)}
        onMouseLeave={() => setIsHoverExpanded(false)}
      >
        <div className={styles.sidebarLogo}>
          <div className={styles.logoIcon}>Rx</div>
          <span className={styles.logoText}>REXION</span>
        </div>

        <div className={styles.navSection}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.navItem} ${activeSection === item.id ? styles.navItemActive : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navText}>{item.label}</span>
              {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
            </button>
          ))}
        </div>

        <div className={styles.sidebarFooter}>
          <button
            type="button"
            className={styles.navItem}
            onClick={() => setIsPinnedExpanded((prev) => !prev)}
          >
            <span className={styles.navIcon}>{isPinnedExpanded ? '<' : '>'}</span>
            <span className={styles.navText}>Collapse</span>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeSection === 'account' ? styles.navItemActive : ''}`}
            onClick={() => setActiveSection('account')}
          >
            <span className={styles.navAvatar}>U</span>
            <span className={styles.navText}>My Account</span>
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <div className={styles.bgCanvas}>
          <div className={`${styles.orb} ${styles.orb1}`}></div>
          <div className={`${styles.orb} ${styles.orb2}`}></div>
          <div className={`${styles.orb} ${styles.orb3}`}></div>
          <div className={styles.gridOverlay}></div>
        </div>

        <div className={styles.content}>{activeContent}</div>
      </div>
    </div>
  )
}

export default WorkspaceSection
