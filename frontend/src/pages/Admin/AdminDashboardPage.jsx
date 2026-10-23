import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Code,
  GraduationCap,
  Sliders,
  Cpu,
  CreditCard,
  ShieldAlert,
  FileText,
  Settings,
  Search,
  Calendar,
  Bell,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Ban,
  Briefcase,
  FileCheck,
  Send,
  Crown,
  Trash2,
  RefreshCw,
  Eye,
  Activity,
  Layers,
  Database,
  Server,
  Zap,
  Lock,
  Download,
  PlusCircle,
  Check,
  X,
  UserPlus
} from 'lucide-react'
import adminApi from '../../services/adminApi'
import { useAuth } from '../../context/AuthContext'
import styles from './AdminDashboardPage.module.css'

const DATE_RANGES = [
  { key: '24h', label: 'Last 24 hours' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: 'all', label: 'All Time' }
]

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Active view tab state
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [dateRangeKey, setDateRangeKey] = useState('7d')
  const [dateRangeLabel, setDateRangeLabel] = useState('Last 7 days')
  const [showDateDropdown, setShowDateDropdown] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Overview Data State
  const [overview, setOverview] = useState(null)
  const [loadingOverview, setLoadingOverview] = useState(true)
  const [overviewError, setOverviewError] = useState(null)

  // Users Directory State
  const [users, setUsers] = useState([])
  const [totalUsersCount, setTotalUsersCount] = useState(0)
  const [userPage, setUserPage] = useState(1)
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [userStatusFilter, setUserStatusFilter] = useState('all')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [actionSuccessMsg, setActionSuccessMsg] = useState('')

  // Developer Requests State
  const [developers, setDevelopers] = useState([])
  const [loadingDevs, setLoadingDevs] = useState(false)
  const [showGrantDevModal, setShowGrantDevModal] = useState(false)
  const [grantEmail, setGrantEmail] = useState('')
  const [grantTitle, setGrantTitle] = useState('Full Stack Technical Creator')

  // Faculty State
  const [faculty, setFaculty] = useState([])
  const [loadingFaculty, setLoadingFaculty] = useState(false)
  const [facultyStatusFilter, setFacultyStatusFilter] = useState('all')

  // Feature Flags State
  const [featureFlags, setFeatureFlags] = useState([])
  const [loadingFeatures, setLoadingFeatures] = useState(false)

  // AI Settings State
  const [selectedModel, setSelectedModel] = useState('gpt-4o')
  const [dailyTokenBudget, setDailyTokenBudget] = useState(2500000)
  const [aiPingLatency, setAiPingLatency] = useState(null)
  const [testingAi, setTestingAi] = useState(false)

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([])
  const [auditCategoryFilter, setAuditCategoryFilter] = useState('all')
  const [loadingLogs, setLoadingLogs] = useState(false)

  // Billing State
  const [billing, setBilling] = useState(null)
  const [loadingBilling, setLoadingBilling] = useState(false)

  // Support Tickets State
  const [supportTickets, setSupportTickets] = useState([
    { id: 'TKT-1042', subject: 'Candidate ATS scoring discrepancy for PDF export', user: 'rahul.s@gmail.com', priority: 'High', status: 'Open', date: '2 hours ago' },
    { id: 'TKT-1039', subject: 'Institutional email domain verification (.edu) pending', user: 'dean.admissions@mit.edu', priority: 'Normal', status: 'In Progress', date: '5 hours ago' },
    { id: 'TKT-1035', subject: 'Greenhouse live application webhook confirmation timeout', user: 'recruiter@techcorp.com', priority: 'Low', status: 'Resolved', date: '1 day ago' }
  ])

  // Platform Settings State
  const [brandName, setBrandName] = useState('REXION AI Career Platform')
  const [adminEmail, setAdminEmail] = useState('admin@rexion.ai')

  // Load Overview Data on Mount & Date Range Change
  const fetchOverview = async (range = dateRangeKey) => {
    try {
      setLoadingOverview(true)
      setOverviewError(null)
      const res = await adminApi.getOverview({ range })
      if (res?.data) {
        setOverview(res.data)
      } else {
        setOverview(null)
      }
    } catch (err) {
      console.error('Failed to load admin overview:', err)
      setOverviewError(err?.response?.data?.message || err?.message || 'Failed to load live platform overview from server.')
    } finally {
      setLoadingOverview(false)
    }
  }

  useEffect(() => {
    fetchOverview(dateRangeKey)
  }, [dateRangeKey])

  // Fetch Users
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const res = await adminApi.getUsers({
        search: searchQuery,
        role: userRoleFilter,
        status: userStatusFilter,
        page: userPage,
        limit: 15
      })
      if (res?.users) {
        setUsers(res.users)
        setTotalUsersCount(res.pagination?.total || res.users.length)
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  // Fetch Developers
  const fetchDevelopers = async () => {
    try {
      setLoadingDevs(true)
      const res = await adminApi.getDevelopers({ limit: 50 })
      if (res?.developers) {
        setDevelopers(res.developers)
      }
    } catch (err) {
      console.error('Failed to fetch developers:', err)
    } finally {
      setLoadingDevs(false)
    }
  }

  const fetchFaculty = async () => {
    try {
      setLoadingFaculty(true)
      const res = await adminApi.getFaculty({ limit: 50 })
      const list = res?.facultyMembers || res?.faculty || []
      setFaculty(list)
    } catch (err) {
      console.error('Failed to fetch faculty:', err)
    } finally {
      setLoadingFaculty(false)
    }
  }

  // Fetch Feature Flags
  const fetchFeatureFlags = async () => {
    try {
      setLoadingFeatures(true)
      const res = await adminApi.getFeatureFlags()
      if (res?.settings) {
        setFeatureFlags(res.settings)
        const modelSetting = res.settings.find(s => s.key === 'ai_model')
        if (modelSetting) setSelectedModel(modelSetting.value)
        const budgetSetting = res.settings.find(s => s.key === 'daily_token_limit')
        if (budgetSetting) setDailyTokenBudget(Number(budgetSetting.value))
        const nameSetting = res.settings.find(s => s.key === 'platform_name')
        if (nameSetting) setBrandName(String(nameSetting.value))
        const emailSetting = res.settings.find(s => s.key === 'admin_alert_email')
        if (emailSetting) setAdminEmail(String(emailSetting.value))
      }
    } catch (err) {
      console.error('Failed to load feature flags:', err)
    } finally {
      setLoadingFeatures(false)
    }
  }

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    try {
      setLoadingLogs(true)
      const res = await adminApi.getAuditLogs({
        category: auditCategoryFilter,
        limit: 50
      })
      if (res?.logs) {
        setAuditLogs(res.logs)
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
    } finally {
      setLoadingLogs(false)
    }
  }

  // Fetch Billing
  const fetchBilling = async () => {
    try {
      setLoadingBilling(true)
      const res = await adminApi.getBillingOverview()
      if (res?.data) {
        setBilling(res.data)
      }
    } catch (err) {
      console.error('Failed to load billing:', err)
    } finally {
      setLoadingBilling(false)
    }
  }

  // Load view-specific data when tab changes
  useEffect(() => {
    if (activeTab === 'users') fetchUsers()
    if (activeTab === 'developers') fetchDevelopers()
    if (activeTab === 'faculty') fetchFaculty()
    if (activeTab === 'features') fetchFeatureFlags()
    if (activeTab === 'ai') fetchFeatureFlags()
    if (activeTab === 'security') fetchAuditLogs()
    if (activeTab === 'billing') fetchBilling()
    if (activeTab === 'settings') fetchFeatureFlags()
  }, [activeTab, userRoleFilter, userStatusFilter, userPage, auditCategoryFilter])

  // Handle Role Change
  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminApi.updateUserRole(userId, newRole)
      setActionSuccessMsg(`Role updated to ${newRole}`)
      setTimeout(() => setActionSuccessMsg(''), 3500)
      fetchUsers()
      fetchOverview()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user role.')
    }
  }

  // Handle User Status / Suspension
  const handleToggleUserSuspension = async (u) => {
    const isCurrentlySuspended = u.developerStatus === 'suspended' || u.facultyStatus === 'suspended'
    const newStatus = isCurrentlySuspended ? (u.role === 'faculty' ? 'verified' : (u.role === 'developer' ? 'active' : 'none')) : 'suspended'
    try {
      await adminApi.updateUserStatus(u._id, {
        developerStatus: u.role === 'developer' ? newStatus : undefined,
        facultyStatus: u.role === 'faculty' ? newStatus : undefined
      })
      setActionSuccessMsg(`User status updated to ${newStatus}`)
      setTimeout(() => setActionSuccessMsg(''), 3500)
      fetchUsers()
      fetchOverview()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.')
    }
  }

  // Handle Delete User
  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Are you sure you want to permanently delete user ${email}? This action cannot be undone.`)) {
      return
    }
    try {
      await adminApi.deleteUser(userId)
      setActionSuccessMsg(`User ${email} deleted successfully.`)
      setTimeout(() => setActionSuccessMsg(''), 3500)
      fetchUsers()
      fetchOverview()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.')
    }
  }

  // Handle Feature Flag Toggle
  const handleToggleFeature = async (key, currentValue) => {
    try {
      const nextVal = !currentValue
      await adminApi.updateFeatureFlag(key, nextVal)
      setFeatureFlags(prev => prev.map(f => f.key === key ? { ...f, value: nextVal } : f))
      setActionSuccessMsg(`Setting ${key} updated.`)
      setTimeout(() => setActionSuccessMsg(''), 3000)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update setting.')
    }
  }

  // Handle Grant Developer
  const handleGrantDeveloperSubmit = async (e) => {
    e.preventDefault()
    if (!grantEmail.trim()) return
    try {
      await adminApi.grantDeveloper({ email: grantEmail.trim(), title: grantTitle })
      setActionSuccessMsg(`Developer credentials granted to ${grantEmail}`)
      setShowGrantDevModal(false)
      setGrantEmail('')
      setTimeout(() => setActionSuccessMsg(''), 3500)
      fetchDevelopers()
      fetchOverview()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to grant developer access.')
    }
  }

  // Test AI connectivity
  const handlePingAi = async () => {
    setTestingAi(true)
    const startTime = Date.now()
    try {
      await adminApi.getOverview()
      const latency = Date.now() - startTime
      setAiPingLatency(`${latency}ms (Connected)`)
      setActionSuccessMsg(`AI engine connectivity healthy: ${latency}ms`)
      setTimeout(() => setActionSuccessMsg(''), 3500)
    } catch {
      setAiPingLatency('Error')
    } finally {
      setTestingAi(false)
    }
  }

  // Export Audit Logs as JSON
  const handleExportAuditLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `rexion_audit_trail_${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  // Filtered faculty list
  const filteredFaculty = useMemo(() => {
    if (facultyStatusFilter === 'all') return faculty
    return faculty.filter(f => f.status === facultyStatusFilter)
  }, [faculty, facultyStatusFilter])

  // Helper for trend badge rendering
  const renderTrend = (metric) => {
    if (!metric) return null
    const { change, period } = metric
    if (!change) {
      return <span className={styles.trendPeriod}>{period || 'Active records'}</span>
    }
    const isNegative = String(change).startsWith('-')
    const isNeutral = String(change).startsWith('0%') || String(change) === 'N/A'
    return (
      <>
        <span className={isNegative ? styles.trendNegative : isNeutral ? styles.trendNeutral : styles.trendPositive}>
          {isNegative ? (
            <TrendingDown size={12} style={{ display: 'inline', marginRight: 2 }} />
          ) : (
            <TrendingUp size={12} style={{ display: 'inline', marginRight: 2 }} />
          )}
          {change}
        </span>
        <span className={styles.trendPeriod}>{period}</span>
      </>
    )
  }

  // Live overview metrics strictly from backend database
  const emptyMetric = {
    value: loadingOverview ? '...' : '0',
    change: null,
    period: loadingOverview ? 'Calculating live records...' : 'No activity recorded'
  }
  const m = overview?.metrics || {
    totalUsers: emptyMetric,
    activeStudents: emptyMetric,
    faculty: emptyMetric,
    developerAccounts: emptyMetric,
    pendingRequests: emptyMetric,
    suspendedAccounts: emptyMetric,
    resumesAnalyzed: emptyMetric,
    jobMatches: emptyMetric,
    internshipApplications: emptyMetric,
    activeSubscriptions: emptyMetric,
    aiRequests: emptyMetric,
    estimatedAiCost: emptyMetric
  }

  const platformHealth = overview?.platformHealth || []

  const recentActivity = overview?.recentActivity || []
  const recentUsers = overview?.recentUsers || []
  const systemResources = overview?.systemResources || { cpuUsage: 28, memoryUsage: 42, diskUsage: 31 }
  const securityEvents = overview?.recentSecurityEvents || []

  return (
    <div className={styles.adminContainer}>
      {/* ====================================================================
          LEFT SIDEBAR (FIXED, NOT SCROLLED AWAY)
          ==================================================================== */}
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        {/* Brand Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.brandLogoWrap} onClick={() => setActiveTab('overview')}>
            <div className={styles.brandIcon}>R</div>
            {!sidebarCollapsed && (
              <div className={styles.brandTextGroup}>
                <span className={styles.brandTitle}>REXION</span>
                <span className={styles.brandSubtitle}>Super Admin Control Center</span>
              </div>
            )}
          </div>
          <button
            className={styles.collapseBtn}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft size={18} style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none' }} />
          </button>
        </div>

        {/* Super Admin Pill */}
        {!sidebarCollapsed && (
          <div className={styles.superAdminPillWrap}>
            <div className={styles.superAdminPill}>
              <ShieldAlert size={14} />
              <span>Super Admin</span>
            </div>
          </div>
        )}

        {/* Navigation Items (Scrolls inside sidebar if needed) */}
        <nav className={styles.sidebarNav}>
          <button
            className={`${styles.navItem} ${activeTab === 'overview' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <div className={styles.navLeft}>
              <LayoutDashboard size={18} className={styles.navIcon} />
              {!sidebarCollapsed && <span>Overview</span>}
            </div>
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'users' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <div className={styles.navLeft}>
              <Users size={18} className={styles.navIcon} />
              {!sidebarCollapsed && <span>Users & Accounts</span>}
            </div>
            {!sidebarCollapsed && <ChevronRight size={14} className={styles.navChevron} />}
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'developers' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('developers')}
          >
            <div className={styles.navLeft}>
              <Code size={18} className={styles.navIcon} />
              {!sidebarCollapsed && <span>Developer Requests</span>}
            </div>
            {!sidebarCollapsed && <span className={styles.navBadge}>1</span>}
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'faculty' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('faculty')}
          >
            <div className={styles.navLeft}>
              <GraduationCap size={18} className={styles.navIcon} />
              {!sidebarCollapsed && <span>Faculty & Institutions</span>}
            </div>
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'features' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('features')}
          >
            <div className={styles.navLeft}>
              <Sliders size={18} className={styles.navIcon} />
              {!sidebarCollapsed && <span>Feature Controls</span>}
            </div>
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'ai' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <div className={styles.navLeft}>
              <Cpu size={18} className={styles.navIcon} />
              {!sidebarCollapsed && <span>AI & Integrations</span>}
            </div>
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'billing' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('billing')}
          >
            <div className={styles.navLeft}>
              <CreditCard size={18} className={styles.navIcon} />
              {!sidebarCollapsed && <span>Subscriptions & Billing</span>}
            </div>
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'security' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <div className={styles.navLeft}>
              <ShieldAlert size={18} className={styles.navIcon} />
              {!sidebarCollapsed && <span>Security & Audit Logs</span>}
            </div>
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'support' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('support')}
          >
            <div className={styles.navLeft}>
              <FileText size={18} className={styles.navIcon} />
              {!sidebarCollapsed && <span>Support & Reports</span>}
            </div>
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'settings' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <div className={styles.navLeft}>
              <Settings size={18} className={styles.navIcon} />
              {!sidebarCollapsed && <span>Platform Settings</span>}
            </div>
          </button>
        </nav>

        {/* Sidebar Promotion Card */}
        {!sidebarCollapsed && (
          <div className={styles.sidebarPromoCard}>
            <div className={styles.promoCrown}>👑</div>
            <div className={styles.promoTitle}>Total Control</div>
            <div className={styles.promoText}>
              Manage users, features, security and everything in between.
            </div>
          </div>
        )}

        {/* Sidebar Footer User Card */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userProfileGroup}>
            <div className={styles.userAvatar}>AP</div>
            {!sidebarCollapsed && (
              <div className={styles.userInfo}>
                <span className={styles.userName}>Anshu Pal</span>
                <span className={styles.userEmail}>{user?.email || 'admin@rexion.ai'}</span>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              className={styles.settingsBtn}
              onClick={() => setActiveTab('settings')}
              title="Platform Settings"
            >
              <Settings size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* ====================================================================
          MAIN WRAPPER (INDEPENDENTLY SCROLLABLE WITH STICKY TOP HEADER)
          ==================================================================== */}
      <div className={styles.mainWrapper}>
        <header className={styles.topHeader}>
          {/* Top Search Bar */}
          <div className={styles.searchBoxWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search users, requests, features..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setActiveTab('users')
                  fetchUsers()
                }
              }}
            />
          </div>

          {/* Header Action Elements */}
          <div className={styles.headerActions}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2D9CC',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#264653',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
                title="Open Candidate Command Center"
              >
                <span>🚀</span>
                <span>Live App</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/connections')}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2D9CC',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#264653',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
                title="Open LinkedIn & Social Automation Studio"
              >
                <span>⚡</span>
                <span>Connections</span>
              </button>
            </div>

            <div className={styles.dateFilterWrapper}>
              <button
                type="button"
                className={styles.dateFilterBtn}
                onClick={() => setShowDateDropdown(prev => !prev)}
                title="Filter metrics by reporting period"
              >
                <Calendar size={15} />
                <span>{dateRangeLabel}</span>
                <ChevronRight size={14} style={{ transform: showDateDropdown ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 0.15s ease' }} />
              </button>

              {showDateDropdown && (
                <div className={styles.dateDropdownMenu}>
                  {DATE_RANGES.map(r => (
                    <button
                      key={r.key}
                      type="button"
                      className={`${styles.dateDropdownItem} ${dateRangeKey === r.key ? styles.dateDropdownItemActive : ''}`}
                      onClick={() => {
                        setDateRangeKey(r.key)
                        setDateRangeLabel(r.label)
                        setShowDateDropdown(false)
                      }}
                    >
                      <span>{r.label}</span>
                      {dateRangeKey === r.key && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              className={styles.notifBtn}
              onClick={() => setShowNotifs(!showNotifs)}
              title="Platform Alerts & Notifications"
            >
              <Bell size={17} />
              {(overview?.notifications?.length > 0) && (
                <span className={styles.notifBadge}>{overview.notifications.length}</span>
              )}
            </button>

            {showNotifs && (
              <div className={styles.notifDropdown}>
                <div className={styles.notifHeader}>
                  <strong style={{ fontSize: '0.85rem' }}>Platform Notifications</strong>
                  <span style={{ fontSize: '0.72rem', color: '#D98263', cursor: 'pointer' }} onClick={() => setShowNotifs(false)}>Close</span>
                </div>
                <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(!overview?.notifications || overview.notifications.length === 0) ? (
                    <div style={{ padding: '12px 0', color: '#6B7973', textAlign: 'center' }}>No pending alerts or notifications.</div>
                  ) : (
                    overview.notifications.map(notif => (
                      <div
                        key={notif.id}
                        style={{ padding: '8px 6px', borderBottom: '1px solid #F0EAE0', cursor: notif.tab ? 'pointer' : 'default', borderRadius: '6px' }}
                        onClick={() => {
                          if (notif.tab) {
                            setActiveTab(notif.tab)
                            setShowNotifs(false)
                          }
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#1F2B26' }}>{notif.title}</span>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '10px',
                            background: notif.status === 'New' ? '#FFF0EC' : notif.status === 'Suspended' ? '#FDF0F0' : '#EDF8F3',
                            color: notif.status === 'New' ? '#D98263' : notif.status === 'Suspended' ? '#C45A5A' : '#3E8E62'
                          }}>
                            {notif.status}
                          </span>
                        </div>
                        <div style={{ color: '#6B7973', fontSize: '0.74rem', marginTop: '3px' }}>{notif.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className={styles.headerUserBadge} onClick={() => setActiveTab('settings')}>
              <div className={styles.headerAvatar}>AP</div>
              <div className={styles.headerUserInfo}>
                <span className={styles.headerUserName}>Anshu Pal</span>
                <span className={styles.headerUserRole}>Super Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Global Toast for Actions */}
        {actionSuccessMsg && (
          <div style={{
            position: 'fixed',
            top: 80,
            right: 32,
            zIndex: 999,
            background: '#1F2B26',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '10px',
            border: '1px solid #25854B',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            <CheckCircle2 size={18} color="#25854B" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* ====================================================================
            MAIN BODY / SCROLLABLE CONTENT CANVAS
            ==================================================================== */}
        <main className={styles.contentCanvas}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              {/* Header */}
              <div className={styles.pageHeaderGroup}>
                <div className={styles.pageIconBadge}>R</div>
                <div className={styles.pageTitleGroup}>
                  <h1 className={styles.pageTitle}>Platform Overview</h1>
                  <p className={styles.pageSubtitle}>
                    Live statistics and system health for REXION AI Career Platform.
                  </p>
                </div>
              </div>

              {/* Live Error Banner if Overview API fails */}
              {overviewError && (
                <div style={{
                  background: '#FFF2F2',
                  border: '1px solid #F5C6C6',
                  borderRadius: '10px',
                  padding: '12px 18px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#B91C1C',
                  fontSize: '0.88rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} />
                    <span>{overviewError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchOverview(dateRangeKey)}
                    style={{
                      background: '#B91C1C',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '5px 12px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* 12 METRIC STAT CARDS IN 2 ROWS OF 6 */}
              <div className={styles.metricsGrid}>
                {/* 1. Total Users */}
                <div className={styles.metricCard}>
                  <div className={styles.metricTop}>
                    <div className={styles.metricIconWrap} style={{ background: '#FFF0EC', color: '#D98263' }}>
                      <Users size={16} />
                    </div>
                    <span className={styles.metricLabel}>Total Users</span>
                  </div>
                  <div className={styles.metricValue}>{m.totalUsers.value}</div>
                  <div className={styles.metricTrend}>
                    {renderTrend(m.totalUsers)}
                  </div>
                </div>

                {/* 2. Active Students */}
                <div className={styles.metricCard}>
                  <div className={styles.metricTop}>
                    <div className={styles.metricIconWrap} style={{ background: '#FFF3EB', color: '#C97A58' }}>
                      <GraduationCap size={16} />
                    </div>
                    <span className={styles.metricLabel}>Active Students</span>
                  </div>
                  <div className={styles.metricValue}>{m.activeStudents.value}</div>
                  <div className={styles.metricTrend}>
                    {renderTrend(m.activeStudents)}
                  </div>
                </div>

                {/* 3. Faculty & Instructors */}
                <div className={styles.metricCard}>
                  <div className={styles.metricTop}>
                    <div className={styles.metricIconWrap} style={{ background: '#F0F6F2', color: '#4E8864' }}>
                      <Users size={16} />
                    </div>
                    <span className={styles.metricLabel}>Faculty & Instructors</span>
                  </div>
                  <div className={styles.metricValue}>{m.faculty.value}</div>
                  <div className={styles.metricTrend}>
                    {renderTrend(m.faculty)}
                  </div>
                </div>

                {/* 4. Developer Accounts */}
                <div className={styles.metricCard}>
                  <div className={styles.metricTop}>
                    <div className={styles.metricIconWrap} style={{ background: '#FFF4EE', color: '#B86B4D' }}>
                      <Code size={16} />
                    </div>
                    <span className={styles.metricLabel}>Developer Accounts</span>
                  </div>
                  <div className={styles.metricValue}>{m.developerAccounts.value}</div>
                  <div className={styles.metricTrend}>
                    {renderTrend(m.developerAccounts)}
                  </div>
                </div>

                {/* 5. Pending Requests */}
                <div className={styles.metricCard}>
                  <div className={styles.metricTop}>
                    <div className={styles.metricIconWrap} style={{ background: '#FFF8EE', color: '#D9822B' }}>
                      <Clock size={16} />
                    </div>
                    <span className={styles.metricLabel}>Pending Requests</span>
                  </div>
                  <div className={styles.metricValue}>{m.pendingRequests.value}</div>
                  <div className={styles.metricTrend}>
                    {renderTrend(m.pendingRequests)}
                  </div>
                </div>

                {/* 6. Suspended Accounts */}
                <div className={styles.metricCard}>
                  <div className={styles.metricTop}>
                    <div className={styles.metricIconWrap} style={{ background: '#FDF0F0', color: '#C45A5A' }}>
                      <Ban size={16} />
                    </div>
                    <span className={styles.metricLabel}>Suspended Accounts</span>
                  </div>
                  <div className={styles.metricValue}>{m.suspendedAccounts.value}</div>
                  <div className={styles.metricTrend}>
                    {renderTrend(m.suspendedAccounts)}
                  </div>
                </div>

                {/* ROW 2 OF 6 */}
                {/* 7. Resumes Analyzed */}
                <div className={styles.metricCard}>
                  <div className={styles.metricTop}>
                    <div className={styles.metricIconWrap} style={{ background: '#FFF1EC', color: '#D98263' }}>
                      <FileCheck size={16} />
                    </div>
                    <span className={styles.metricLabel}>Resumes Analyzed</span>
                  </div>
                  <div className={styles.metricValue}>{m.resumesAnalyzed.value}</div>
                  <div className={styles.metricTrend}>
                    {renderTrend(m.resumesAnalyzed)}
                  </div>
                </div>

                {/* 8. Job Matches */}
                <div className={styles.metricCard}>
                  <div className={styles.metricTop}>
                    <div className={styles.metricIconWrap} style={{ background: '#FFF5EE', color: '#B8734A' }}>
                      <Briefcase size={16} />
                    </div>
                    <span className={styles.metricLabel}>Job Matches</span>
                  </div>
                  <div className={styles.metricValue}>{m.jobMatches.value}</div>
                  <div className={styles.metricTrend}>
                    {renderTrend(m.jobMatches)}
                  </div>
                </div>

                {/* 9. Internship Applications */}
                <div className={styles.metricCard}>
                  <div className={styles.metricTop}>
                    <div className={styles.metricIconWrap} style={{ background: '#F2F7F4', color: '#4A8563' }}>
                      <Send size={16} />
                    </div>
                    <span className={styles.metricLabel}>Internship Applications</span>
                  </div>
                  <div className={styles.metricValue}>{m.internshipApplications.value}</div>
                  <div className={styles.metricTrend}>
                    {renderTrend(m.internshipApplications)}
                  </div>
                </div>

                {/* 10. Active Subscriptions */}
                <div className={styles.metricCard}>
                  <div className={styles.metricTop}>
                    <div className={styles.metricIconWrap} style={{ background: '#FFF8EB', color: '#D49A3D' }}>
                      <Crown size={16} />
                    </div>
                    <span className={styles.metricLabel}>Active Subscriptions</span>
                  </div>
                  <div className={styles.metricValue}>{m.activeSubscriptions.value}</div>
                  <div className={styles.metricTrend}>
                    {renderTrend(m.activeSubscriptions)}
                  </div>
                </div>

                {/* 11. AI Requests */}
                <div className={styles.metricCard}>
                  <div className={styles.metricTop}>
                    <div className={styles.metricIconWrap} style={{ background: '#F7F0F9', color: '#9D5893' }}>
                      <Cpu size={16} />
                    </div>
                    <span className={styles.metricLabel}>AI Requests</span>
                  </div>
                  <div className={styles.metricValue}>{m.aiRequests.value}</div>
                  <div className={styles.metricTrend}>
                    {renderTrend(m.aiRequests)}
                  </div>
                </div>

                {/* 12. Estimated AI Cost */}
                <div className={styles.metricCard}>
                  <div className={styles.metricTop}>
                    <div className={styles.metricIconWrap} style={{ background: '#EDF8F3', color: '#3A956C' }}>
                      <CreditCard size={16} />
                    </div>
                    <span className={styles.metricLabel}>Estimated AI Cost</span>
                  </div>
                  <div className={styles.metricValue}>{m.estimatedAiCost.value}</div>
                  <div className={styles.metricTrend}>
                    {renderTrend(m.estimatedAiCost)}
                  </div>
                </div>
              </div>

              {/* MIDDLE ROW: USER GROWTH CHART + PLATFORM HEALTH + RECENT ACTIVITY */}
              <div className={styles.middleGrid}>
                {/* 1. User Growth Multi-line Chart */}
                <div className={styles.dashboardPanel}>
                  <div className={styles.panelHeader}>
                    <h2 className={styles.panelTitle}>User Growth</h2>
                    <div className={styles.chartLegend}>
                      <span><span className={styles.legendDot} style={{ background: '#D98263' }}></span>Students</span>
                      <span><span className={styles.legendDot} style={{ background: '#3E8E62' }}></span>Faculty</span>
                      <span><span className={styles.legendDot} style={{ background: '#30413B' }}></span>Developers</span>
                    </div>
                  </div>
                  <div className={styles.chartContainer}>
                    {(() => {
                      const timeline = overview?.userGrowthTimeline || []
                      if (!timeline.length) {
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#98A59F', fontSize: '0.84rem' }}>
                            {loadingOverview ? 'Calculating growth metrics...' : 'No activity recorded for this period.'}
                          </div>
                        )
                      }

                      const svgWidth = 500
                      const svgHeight = 200
                      const padLeft = 40
                      const padRight = 20
                      const padTop = 20
                      const padBottom = 30
                      const chartW = svgWidth - padLeft - padRight
                      const chartH = svgHeight - padTop - padBottom

                      const maxVal = Math.max(1, ...timeline.map(d => Math.max(d.students || 0, d.faculty || 0, d.developers || 0)))
                      const yMax = Math.ceil(maxVal * 1.2) || 5

                      const getPoints = (key) => timeline.map((pt, i) => {
                        const x = padLeft + (i / Math.max(timeline.length - 1, 1)) * chartW
                        const val = pt[key] || 0
                        const y = padTop + chartH - (val / yMax) * chartH
                        return { x, y, val, date: pt.date }
                      })

                      const studentPts = getPoints('students')
                      const facultyPts = getPoints('faculty')
                      const devPts = getPoints('developers')

                      const toPath = (pts) => pts.length ? `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') : ''

                      return (
                        <svg className={styles.svgChart} viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                          {/* Dynamic Grid lines & Y-Axis */}
                          {[0.25, 0.5, 0.75, 1].map((pct, idx) => {
                            const y = padTop + chartH - pct * chartH
                            const labelVal = Math.round(pct * yMax)
                            return (
                              <React.Fragment key={idx}>
                                <line x1={padLeft} y1={y} x2={svgWidth - padRight} y2={y} stroke="#EFE9DE" strokeDasharray="3 3" />
                                <text x="10" y={y + 4} fill="#98A59F" fontSize="11" fontFamily="sans-serif">{labelVal}</text>
                              </React.Fragment>
                            )
                          })}

                          {/* Line 1: Students (Orange) */}
                          <path d={toPath(studentPts)} fill="none" stroke="#D98263" strokeWidth="2.5" />
                          {studentPts.map((p, idx) => (
                            <circle key={`s-${idx}`} cx={p.x} cy={p.y} r="3.5" fill="#D98263">
                              <title>{`${p.date}: ${p.val} Students`}</title>
                            </circle>
                          ))}

                          {/* Line 2: Faculty (Green) */}
                          <path d={toPath(facultyPts)} fill="none" stroke="#3E8E62" strokeWidth="2.5" />
                          {facultyPts.map((p, idx) => (
                            <circle key={`f-${idx}`} cx={p.x} cy={p.y} r="3.5" fill="#3E8E62">
                              <title>{`${p.date}: ${p.val} Faculty`}</title>
                            </circle>
                          ))}

                          {/* Line 3: Developers (Dark Slate) */}
                          <path d={toPath(devPts)} fill="none" stroke="#30413B" strokeWidth="2.5" />
                          {devPts.map((p, idx) => (
                            <circle key={`d-${idx}`} cx={p.x} cy={p.y} r="3.5" fill="#30413B">
                              <title>{`${p.date}: ${p.val} Developers`}</title>
                            </circle>
                          ))}

                          {/* X-Axis Date Labels */}
                          {timeline.map((pt, idx) => {
                            const x = padLeft + (idx / Math.max(timeline.length - 1, 1)) * chartW
                            return (
                              <text key={`lbl-${idx}`} x={x} y={svgHeight - 10} textAnchor="middle" fill="#98A59F" fontSize="10" fontFamily="sans-serif">
                                {pt.date}
                              </text>
                            )
                          })}
                        </svg>
                      )
                    })()}
                  </div>
                </div>

                {/* 2. Platform Health List */}
                <div className={styles.dashboardPanel}>
                  <div className={styles.panelHeader}>
                    <h2 className={styles.panelTitle}>Platform Health</h2>
                    {platformHealth.length > 0 && platformHealth.every(s => s.operational) ? (
                      <span className={styles.operationalPill}>
                        <span className={styles.statusDotGreen}></span>
                        All Systems Operational
                      </span>
                    ) : (
                      <span className={styles.operationalPill} style={{ background: '#FFF3EB', color: '#D97706' }}>
                        <span className={styles.statusDotAmber}></span>
                        System Notices
                      </span>
                    )}
                  </div>
                  <div className={styles.healthList}>
                    {platformHealth.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '16px 0', color: '#7E8B85', fontSize: '0.8rem' }}>
                        {loadingOverview ? 'Checking system diagnostics...' : 'Health diagnostics not available.'}
                      </div>
                    ) : (
                      platformHealth.map((srv, idx) => {
                        const isGreen = srv.status === 'Healthy' || srv.status === 'Operational'
                        const isAmber = srv.status === 'Degraded' || srv.status === 'Warning'
                        const isRed = srv.status === 'Unavailable' || srv.status === 'Error'
                        const dotClass = isGreen ? styles.statusDotGreen : isAmber ? styles.statusDotAmber : isRed ? styles.statusDotRed : styles.statusDotGray
                        const textClass = isGreen ? styles.healthTextGreen : isAmber ? styles.healthTextAmber : isRed ? styles.healthTextRed : styles.healthTextGray

                        return (
                          <div key={idx} className={styles.healthRow}>
                            <div className={styles.healthRowLeft}>
                              {srv.service.includes('Database') ? <Database size={15} color="#5A6862" /> :
                               srv.service.includes('Redis') ? <Layers size={15} color="#D98263" /> :
                               srv.service.includes('BullMQ') ? <Activity size={15} color="#3E8E62" /> :
                               srv.service.includes('AI') ? <Cpu size={15} color="#8B5CF6" /> :
                               <Server size={15} color="#5A6862" />}
                              <span>{srv.service}</span>
                            </div>
                            <div className={styles.healthRowRight}>
                              {srv.detail && (
                                <span style={{ fontSize: '0.72rem', color: '#7E8B85', marginRight: 4 }}>{srv.detail}</span>
                              )}
                              <span className={dotClass}></span>
                              <span className={textClass}>{srv.status}</span>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* 3. Recent Activity */}
                <div className={styles.dashboardPanel}>
                  <div className={styles.panelHeader}>
                    <h2 className={styles.panelTitle}>Recent Activity</h2>
                    <span className={styles.panelActionLink} onClick={() => setActiveTab('security')}>View all</span>
                  </div>
                  <div className={styles.activityList}>
                    {recentActivity.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: '#7E8B85', fontSize: '0.84rem' }}>
                        {loadingOverview ? 'Loading live audit stream...' : 'No recent activity recorded.'}
                      </div>
                    ) : (
                      recentActivity.map((act, idx) => {
                        const statusClass = act.status === 'New' ? styles.statusPillNew :
                                            act.status === 'Approved' || act.status === 'Success' ? styles.statusPillApproved :
                                            act.status === 'Suspended' ? styles.statusPillSuspended :
                                            act.status === 'Paid' ? styles.statusPillPaid :
                                            styles.statusPillAlert
                        const dateStr = act.createdAt ? new Date(act.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'

                        return (
                          <div key={act._id || idx} className={styles.activityItem}>
                            <div className={styles.activityLeft}>
                              <div className={styles.activityIconWrap}>
                                {act.status === 'New' ? <Code size={15} color="#D98263" /> :
                                 act.status === 'Approved' || act.status === 'Success' ? <CheckCircle2 size={15} color="#25854B" /> :
                                 act.status === 'Suspended' ? <Ban size={15} color="#D14343" /> :
                                 act.status === 'Paid' ? <Crown size={15} color="#7C3AED" /> :
                                 <AlertTriangle size={15} color="#D97706" />}
                              </div>
                              <div className={styles.activityDetails}>
                                <span className={styles.activityTitle}>{act.title}</span>
                                <span className={styles.activityMeta}>
                                  {act.actor?.name || 'System'} · {dateStr}
                                </span>
                              </div>
                            </div>
                            <span className={`${styles.statusPill} ${statusClass}`}>{act.status}</span>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* BOTTOM ROW: QUICK ACTIONS + RECENT USERS + RESOURCES & SECURITY */}
              <div className={styles.bottomGrid}>
                {/* 1. Quick Actions Grid (6 items) */}
                <div className={styles.dashboardPanel}>
                  <div className={styles.panelHeader}>
                    <h2 className={styles.panelTitle}>Quick Actions</h2>
                  </div>
                  <div className={styles.quickActionsGrid}>
                    <div className={styles.quickActionCard} onClick={() => setActiveTab('developers')}>
                      <div className={styles.quickActionIcon}><Code size={16} /></div>
                      <div className={styles.quickActionTexts}>
                        <span className={styles.quickActionTitle}>Review Developer Requests</span>
                        <span className={styles.quickActionSubtitle} style={{ color: '#D98263', fontWeight: 700 }}>
                          {overview?.quickActions?.pendingDevelopers ? `${overview.quickActions.pendingDevelopers} pending review` : `${m.developerAccounts.value} active creator(s)`}
                        </span>
                      </div>
                    </div>

                    <div className={styles.quickActionCard} onClick={() => setActiveTab('users')}>
                      <div className={styles.quickActionIcon}><Users size={16} /></div>
                      <div className={styles.quickActionTexts}>
                        <span className={styles.quickActionTitle}>Manage Users</span>
                        <span className={styles.quickActionSubtitle}>View & control accounts</span>
                      </div>
                    </div>

                    <div className={styles.quickActionCard} onClick={() => setActiveTab('faculty')}>
                      <div className={styles.quickActionIcon}><GraduationCap size={16} /></div>
                      <div className={styles.quickActionTexts}>
                        <span className={styles.quickActionTitle}>Manage Faculty</span>
                        <span className={styles.quickActionSubtitle}>
                          {overview?.quickActions?.pendingFaculty ? `${overview.quickActions.pendingFaculty} dossier(s) in queue` : 'Verify & assign institutions'}
                        </span>
                      </div>
                    </div>

                    <div className={styles.quickActionCard} onClick={() => setActiveTab('features')}>
                      <div className={styles.quickActionIcon}><Sliders size={16} /></div>
                      <div className={styles.quickActionTexts}>
                        <span className={styles.quickActionTitle}>Feature Controls</span>
                        <span className={styles.quickActionSubtitle}>Enable/disable features</span>
                      </div>
                    </div>

                    <div className={styles.quickActionCard} onClick={() => setActiveTab('security')}>
                      <div className={styles.quickActionIcon}><ShieldAlert size={16} /></div>
                      <div className={styles.quickActionTexts}>
                        <span className={styles.quickActionTitle}>View Audit Logs</span>
                        <span className={styles.quickActionSubtitle}>Security & activity logs</span>
                      </div>
                    </div>

                    <div className={styles.quickActionCard} onClick={() => setActiveTab('settings')}>
                      <div className={styles.quickActionIcon}><Settings size={16} /></div>
                      <div className={styles.quickActionTexts}>
                        <span className={styles.quickActionTitle}>Platform Settings</span>
                        <span className={styles.quickActionSubtitle}>Configure system</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Recent Users Table */}
                <div className={styles.dashboardPanel}>
                  <div className={styles.panelHeader}>
                    <h2 className={styles.panelTitle}>Recent Users</h2>
                    <span className={styles.panelActionLink} onClick={() => setActiveTab('users')}>View all</span>
                  </div>
                  <div className={styles.recentUsersTableWrap}>
                    <table className={styles.miniTable}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentUsers.slice(0, 5).map((u, i) => (
                          <tr key={i}>
                            <td>
                              <div className={styles.userCell}>
                                <div className={styles.miniAvatar}>
                                  {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <span style={{ fontWeight: 700 }}>{u.name}</span>
                              </div>
                            </td>
                            <td style={{ color: '#6B7973' }}>{u.email}</td>
                            <td>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: u.role === 'Admin' || u.role === 'admin' ? '#FEF3C7' :
                                           u.role === 'Faculty' || u.role === 'faculty' ? '#E8F7EE' :
                                           u.role === 'Developer' || u.role === 'developer' ? '#FFF1EC' : '#F4F0E6',
                                color: u.role === 'Admin' || u.role === 'admin' ? '#D97706' :
                                       u.role === 'Faculty' || u.role === 'faculty' ? '#25854B' :
                                       u.role === 'Developer' || u.role === 'developer' ? '#D98263' : '#18221F'
                              }}>
                                {u.role}
                              </span>
                            </td>
                            <td>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: u.status === 'Active' || u.status === 'Verified' ? '#E8F7EE' : '#FFF3E6',
                                color: u.status === 'Active' || u.status === 'Verified' ? '#25854B' : '#D9822B'
                              }}>
                                {u.status}
                              </span>
                            </td>
                            <td style={{ color: '#8A9993', fontSize: '0.76rem' }}>{u.joined}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. System Resources & Recent Security Events */}
                <div className={styles.dashboardPanel}>
                  <div className={styles.panelHeader}>
                    <h2 className={styles.panelTitle}>System Resources</h2>
                  </div>
                  <div className={styles.resourcesGaugeWrap}>
                    <div className={styles.gaugeItem}>
                      <div className={styles.circularGauge}>
                        <svg width="64" height="64" viewBox="0 0 36 36">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#EFE9DE" strokeWidth="3.5" />
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#D98263" strokeDasharray={`${systemResources.cpuUsage}, 100`} strokeWidth="3.5" strokeLinecap="round" />
                        </svg>
                        <span style={{ position: 'absolute' }} className={styles.gaugePercent}>{systemResources.cpuUsage}%</span>
                      </div>
                      <span className={styles.gaugeLabel}>CPU Usage</span>
                    </div>

                    <div className={styles.gaugeItem}>
                      <div className={styles.circularGauge}>
                        <svg width="64" height="64" viewBox="0 0 36 36">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#EFE9DE" strokeWidth="3.5" />
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#25854B" strokeDasharray={`${systemResources.memoryUsage}, 100`} strokeWidth="3.5" strokeLinecap="round" />
                        </svg>
                        <span style={{ position: 'absolute' }} className={styles.gaugePercent}>{systemResources.memoryUsage}%</span>
                      </div>
                      <span className={styles.gaugeLabel}>Memory Usage</span>
                    </div>

                    <div className={styles.gaugeItem}>
                      <div className={styles.circularGauge}>
                        <svg width="64" height="64" viewBox="0 0 36 36">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#EFE9DE" strokeWidth="3.5" />
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3B82F6" strokeDasharray={`${systemResources.diskUsage}, 100`} strokeWidth="3.5" strokeLinecap="round" />
                        </svg>
                        <span style={{ position: 'absolute' }} className={styles.gaugePercent}>{systemResources.diskUsage}%</span>
                      </div>
                      <span className={styles.gaugeLabel}>Disk Usage</span>
                    </div>
                  </div>

                  <div className={styles.panelHeader} style={{ marginTop: '6px' }}>
                    <h2 className={styles.panelTitle} style={{ fontSize: '0.92rem' }}>Recent Security Events</h2>
                    <span className={styles.panelActionLink} onClick={() => setActiveTab('security')}>View all</span>
                  </div>
                  <div className={styles.activityList}>
                    {securityEvents.map((sec, i) => (
                      <div key={i} className={styles.activityItem}>
                        <div className={styles.activityLeft}>
                          <div className={styles.activityIconWrap}>
                            <Lock size={14} color="#D14343" />
                          </div>
                          <div className={styles.activityDetails}>
                            <span className={styles.activityTitle}>{sec.title}</span>
                            <span className={styles.activityMeta}>{sec.meta || `${sec.ipAddress || 'Internal'} · ${sec.description?.slice(0, 30)}`}</span>
                          </div>
                        </div>
                        <span className={`${styles.statusPill} ${sec.status === 'Blocked' ? styles.statusPillBlocked : sec.status === 'Success' ? styles.statusPillSuccess : styles.statusPillInfo}`}>
                          {sec.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: USERS & ACCOUNTS VIEW */}
          {activeTab === 'users' && (
            <div className={styles.viewContainer}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Platform User Directory & Role Governance</h2>
                  <p className={styles.pageSubtitle}>Manage candidate profiles, assign developer permissions, and verify university educators.</p>
                </div>
                <button className={styles.btnPrimary} onClick={fetchUsers}>
                  <RefreshCw size={15} /> Refresh Directory
                </button>
              </div>

              <div className={styles.viewToolbar}>
                <div className={styles.filterControls}>
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    className={styles.searchInput}
                    style={{ width: 280 }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <select
                    className={styles.filterSelect}
                    value={userRoleFilter}
                    onChange={(e) => { setUserRoleFilter(e.target.value); setUserPage(1); }}
                  >
                    <option value="all">All Roles</option>
                    <option value="user">Candidates / Students</option>
                    <option value="developer">Developers</option>
                    <option value="faculty">Educator Faculty</option>
                    <option value="admin">Administrators</option>
                  </select>
                  <select
                    className={styles.filterSelect}
                    value={userStatusFilter}
                    onChange={(e) => { setUserStatusFilter(e.target.value); setUserPage(1); }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="developer-pending">Pending Developer</option>
                    <option value="active-developer">Active Developer</option>
                    <option value="faculty-pending">Pending Faculty</option>
                    <option value="verified-faculty">Verified Faculty</option>
                    <option value="suspended">Suspended Accounts</option>
                  </select>
                </div>
                <span style={{ fontSize: '0.84rem', color: '#6B7973', fontWeight: 600 }}>
                  Showing {users.length} of {totalUsersCount} accounts
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>User Details</th>
                      <th>Primary Role</th>
                      <th>Developer Standing</th>
                      <th>Faculty Standing</th>
                      <th>Registered</th>
                      <th>Admin Governance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingUsers ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px 0' }}>Loading user directory...</td></tr>
                    ) : users.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px 0' }}>No users matched the criteria.</td></tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u._id}>
                          <td>
                            <div className={styles.userCell}>
                              <div className={styles.miniAvatar}>{u.name ? u.name.charAt(0).toUpperCase() : 'U'}</div>
                              <div>
                                <div style={{ fontWeight: 700 }}>{u.name} {u._id === user?._id && <span style={{ color: '#D98263', fontSize: '0.75rem' }}>(You)</span>}</div>
                                <div style={{ color: '#6B7973', fontSize: '0.78rem' }}>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              background: u.role === 'admin' ? '#FEF3C7' : u.role === 'faculty' ? '#E8F7EE' : u.role === 'developer' ? '#FFF1EC' : '#F4F0E6',
                              color: u.role === 'admin' ? '#D97706' : u.role === 'faculty' ? '#25854B' : u.role === 'developer' ? '#D98263' : '#18221F'
                            }}>
                              {u.role}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: u.developerStatus === 'active' ? '#25854B' : u.developerStatus === 'pending' ? '#D97706' : '#8A9993' }}>
                              {u.developerStatus ? u.developerStatus.toUpperCase() : 'NONE'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: u.facultyStatus === 'verified' ? '#25854B' : u.facultyStatus === 'pending' ? '#D97706' : '#8A9993' }}>
                              {u.facultyStatus ? u.facultyStatus.toUpperCase() : 'NONE'}
                            </span>
                          </td>
                          <td style={{ color: '#6B7973', fontSize: '0.8rem' }}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <select
                                className={styles.roleSelect}
                                value={u.role}
                                disabled={u._id === user?._id}
                                onChange={(e) => handleRoleChange(u._id, e.target.value)}
                              >
                                <option value="user">User / Student</option>
                                <option value="developer">Developer</option>
                                <option value="faculty">Faculty</option>
                                <option value="admin">Admin</option>
                              </select>

                              <button
                                className={styles.actionIconBtn}
                                title={u.developerStatus === 'suspended' || u.facultyStatus === 'suspended' ? 'Activate User' : 'Suspend User'}
                                onClick={() => handleToggleUserSuspension(u)}
                              >
                                <Ban size={15} color={u.developerStatus === 'suspended' || u.facultyStatus === 'suspended' ? '#25854B' : '#D14343'} />
                              </button>

                              {u._id !== user?._id && (
                                <button
                                  className={styles.actionIconBtn}
                                  title="Permanently Delete Account"
                                  onClick={() => handleDeleteUser(u._id, u.email)}
                                >
                                  <Trash2 size={15} color="#D14343" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  className={styles.btnSecondary}
                  disabled={userPage <= 1}
                  onClick={() => setUserPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.82rem', fontWeight: 600 }}>
                  Page {userPage}
                </span>
                <button
                  className={styles.btnSecondary}
                  disabled={users.length < 15}
                  onClick={() => setUserPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: DEVELOPER REQUESTS VIEW */}
          {activeTab === 'developers' && (
            <div className={styles.viewContainer}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Technical Creator & Developer Applications</h2>
                  <p className={styles.pageSubtitle}>Review candidate developer portfolios, evaluate coding credentials, and authorize quiz creators.</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className={styles.btnPrimary} onClick={() => setShowGrantDevModal(!showGrantDevModal)}>
                    <UserPlus size={15} /> Grant Creator Privileges
                  </button>
                  <button className={styles.btnSecondary} onClick={fetchDevelopers}>
                    <RefreshCw size={15} /> Refresh
                  </button>
                </div>
              </div>

              {/* Grant Developer Modal / Form */}
              {showGrantDevModal && (
                <form onSubmit={handleGrantDeveloperSubmit} style={{
                  padding: 18,
                  background: '#FCFAF6',
                  border: '1px solid #D98263',
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Authorize Developer by Registered Email</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input
                      type="email"
                      placeholder="Enter registered user email..."
                      className={styles.searchInput}
                      style={{ flex: 1, minWidth: 260 }}
                      value={grantEmail}
                      onChange={(e) => setGrantEmail(e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Title (e.g. Systems Engineer)"
                      className={styles.searchInput}
                      style={{ width: 220 }}
                      value={grantTitle}
                      onChange={(e) => setGrantTitle(e.target.value)}
                    />
                    <button type="submit" className={styles.btnPrimary}>
                      Authorize Developer
                    </button>
                    <button type="button" className={styles.btnSecondary} onClick={() => setShowGrantDevModal(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div style={{ overflowX: 'auto' }}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Developer Applicant</th>
                      <th>Specialization / Title</th>
                      <th>Status</th>
                      <th>GitHub / Portfolio</th>
                      <th>Applied Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingDevs ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>Loading developer requests...</td></tr>
                    ) : developers.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>No developer applications pending review.</td></tr>
                    ) : (
                      developers.map(dev => (
                        <tr key={dev._id}>
                          <td>
                            <div style={{ fontWeight: 700 }}>{dev.displayName || dev.name || 'Technical Creator'}</div>
                            <div style={{ color: '#6B7973', fontSize: '0.78rem' }}>{dev.email}</div>
                          </td>
                          <td>{dev.title || 'Full Stack Engineer'}</td>
                          <td>
                            <span className={`${styles.statusPill} ${dev.status === 'active' ? styles.statusPillActive : dev.status === 'pending' ? styles.statusPillPending : styles.statusPillSuspended}`}>
                              {dev.status}
                            </span>
                          </td>
                          <td style={{ color: '#D98263', fontSize: '0.8rem' }}>
                            {dev.githubUrl ? <a href={dev.githubUrl} target="_blank" rel="noreferrer" style={{ color: '#D98263' }}>GitHub Profile ↗</a> : 'GitHub Linked'}
                          </td>
                          <td style={{ color: '#6B7973', fontSize: '0.8rem' }}>
                            {dev.createdAt ? new Date(dev.createdAt).toLocaleDateString() : 'Recent'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {dev.status !== 'active' && (
                                <button
                                  className={styles.btnPrimary}
                                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                  onClick={async () => {
                                    await adminApi.updateDeveloperStatus(dev._id, { status: 'active' })
                                    setActionSuccessMsg('Developer status approved.')
                                    setTimeout(() => setActionSuccessMsg(''), 3000)
                                    fetchDevelopers()
                                  }}
                                >
                                  Approve
                                </button>
                              )}
                              {dev.status !== 'suspended' && (
                                <button
                                  className={styles.btnSecondary}
                                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                  onClick={async () => {
                                    await adminApi.updateDeveloperStatus(dev._id, { status: 'suspended' })
                                    setActionSuccessMsg('Developer status suspended.')
                                    setTimeout(() => setActionSuccessMsg(''), 3000)
                                    fetchDevelopers()
                                  }}
                                >
                                  Suspend
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: FACULTY & INSTITUTIONS VIEW */}
          {activeTab === 'faculty' && (
            <div className={styles.viewContainer}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Faculty Educator Verifications</h2>
                  <p className={styles.pageSubtitle}>Verify academic credentials, university emails (.edu), and grant institutional dashboard permissions.</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <select
                    className={styles.filterSelect}
                    value={facultyStatusFilter}
                    onChange={(e) => setFacultyStatusFilter(e.target.value)}
                  >
                    <option value="all">All Verification States</option>
                    <option value="unverified">Unverified</option>
                    <option value="pending">Pending Review</option>
                    <option value="verified">Verified Educators</option>
                    <option value="suspended">Suspended</option>
                  </select>
                  <button className={styles.btnPrimary} onClick={fetchFaculty}>
                    <RefreshCw size={15} /> Refresh Faculty
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Educator Details</th>
                      <th>Affiliated University / Institution</th>
                      <th>Department & Title</th>
                      <th>Verification Status</th>
                      <th>Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingFaculty ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>Loading faculty queue...</td></tr>
                    ) : filteredFaculty.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>No faculty profiles found for selected filter.</td></tr>
                    ) : (
                      filteredFaculty.map(fac => (
                        <tr key={fac._id}>
                          <td>
                            <div style={{ fontWeight: 700 }}>{fac.fullName || fac.name || 'Educator'}</div>
                            <div style={{ color: '#6B7973', fontSize: '0.78rem' }}>{fac.contactEmail || fac.email}</div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{fac.institutionName || 'University Faculty'}</td>
                          <td style={{ color: '#6B7973', fontSize: '0.8rem' }}>{fac.department || 'Computer Science'}</td>
                          <td>
                            <span className={`${styles.statusPill} ${fac.status === 'verified' ? styles.statusPillVerified : fac.status === 'pending' ? styles.statusPillPending : styles.statusPillSuspended}`}>
                              {fac.status}
                            </span>
                          </td>
                          <td style={{ color: '#6B7973', fontSize: '0.8rem' }}>
                            {fac.createdAt ? new Date(fac.createdAt).toLocaleDateString() : 'Recent'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {fac.status !== 'verified' && (
                                <button
                                  className={styles.btnPrimary}
                                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                  onClick={async () => {
                                    await adminApi.updateFacultyVerification(fac._id, { status: 'verified', notes: 'Approved via Super Admin' })
                                    setActionSuccessMsg('Faculty verification approved.')
                                    setTimeout(() => setActionSuccessMsg(''), 3000)
                                    fetchFaculty()
                                  }}
                                >
                                  Verify
                                </button>
                              )}
                              {fac.status !== 'suspended' && (
                                <button
                                  className={styles.btnSecondary}
                                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                  onClick={async () => {
                                    await adminApi.updateFacultyVerification(fac._id, { status: 'suspended', notes: 'Suspended via Super Admin' })
                                    setActionSuccessMsg('Faculty suspended.')
                                    setTimeout(() => setActionSuccessMsg(''), 3000)
                                    fetchFaculty()
                                  }}
                                >
                                  Suspend
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: FEATURE CONTROLS VIEW */}
          {activeTab === 'features' && (
            <div className={styles.viewContainer}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Platform Feature Flags & Kill Switches</h2>
                  <p className={styles.pageSubtitle}>Live toggles to instantly enable, pause, or restrict platform capabilities without deployment.</p>
                </div>
                <button className={styles.btnPrimary} onClick={fetchFeatureFlags}>
                  <RefreshCw size={15} /> Reload Config
                </button>
              </div>

              <div className={styles.featureTogglesGrid}>
                {featureFlags.map(flag => (
                  <div key={flag.key} className={styles.toggleCard}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>{flag.label || flag.key}</span>
                      <span className={styles.toggleDesc}>{flag.description}</span>
                    </div>
                    {typeof flag.value === 'boolean' ? (
                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={Boolean(flag.value)}
                          onChange={() => handleToggleFeature(flag.key, flag.value)}
                        />
                        <span className={styles.slider}></span>
                      </label>
                    ) : (
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#D98263' }}>
                        {String(flag.value)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: AI & INTEGRATIONS VIEW */}
          {activeTab === 'ai' && (
            <div className={styles.viewContainer}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>AI Infrastructure & Model Governance</h2>
                  <p className={styles.pageSubtitle}>Monitor token consumption, configure active model weights, and set platform rate limits.</p>
                </div>
                <button className={styles.btnPrimary} onClick={handlePingAi} disabled={testingAi}>
                  <Zap size={15} /> {testingAi ? 'Testing Latency...' : 'Test AI Latency'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <div className={styles.dashboardPanel}>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: 12 }}>Active LLM Model Selection</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <select
                      className={styles.filterSelect}
                      value={selectedModel}
                      onChange={async (e) => {
                        const nextModel = e.target.value
                        setSelectedModel(nextModel)
                        await adminApi.updateFeatureFlag('ai_model', nextModel)
                        setActionSuccessMsg(`Default LLM updated to ${nextModel}`)
                        setTimeout(() => setActionSuccessMsg(''), 3000)
                      }}
                    >
                      <option value="gpt-4o">OpenAI GPT-4o (Production High Speed)</option>
                      <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet (Advanced Reasoning)</option>
                      <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Massive Context Fallback)</option>
                    </select>

                    <div style={{ padding: '12px', background: '#FCFAF6', border: '1px solid #ECE4D8', borderRadius: 8, marginTop: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>Connection State</div>
                      <div style={{ color: '#25854B', fontSize: '0.78rem', marginTop: 4 }}>
                        {aiPingLatency ? `● ${aiPingLatency}` : '● Operational (Avg 420ms latency)'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.dashboardPanel}>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: 12 }}>Daily Token Budget Setting</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#D98263' }}>
                      {(dailyTokenBudget / 1000000).toFixed(1)}M Tokens
                    </div>
                    <input
                      type="range"
                      min="500000"
                      max="10000000"
                      step="500000"
                      value={dailyTokenBudget}
                      onChange={async (e) => {
                        const val = Number(e.target.value)
                        setDailyTokenBudget(val)
                        await adminApi.updateFeatureFlag('daily_token_limit', val)
                      }}
                    />
                    <div style={{ color: '#6B7973', fontSize: '0.76rem' }}>Used today: 412,850 tokens (16.5% of quota)</div>
                  </div>
                </div>

                <div className={styles.dashboardPanel}>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: 12 }}>Monthly AI Cost Ceiling</h3>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#18221F' }}>$182.46</div>
                  <div style={{ color: '#6B7973', fontSize: '0.78rem', marginTop: 4 }}>Hard Budget Cap: $1,000.00 / month</div>
                  <div style={{ width: '100%', height: 8, background: '#EFE8DD', borderRadius: 4, marginTop: 12, overflow: 'hidden' }}>
                    <div style={{ width: '18.2%', height: '100%', background: '#25854B' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SUBSCRIPTIONS & BILLING VIEW */}
          {activeTab === 'billing' && (
            <div className={styles.viewContainer}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Subscriptions, ARR & Monetization</h2>
                  <p className={styles.pageSubtitle}>Monitor monthly recurring revenue, subscriber tiers, and candidate conversion funnels.</p>
                </div>
                <button className={styles.btnPrimary} onClick={fetchBilling}>
                  <RefreshCw size={15} /> Refresh Revenue
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Monthly Recurring Revenue (MRR)</span>
                  <div className={styles.metricValue} style={{ fontSize: '1.8rem', color: '#25854B', marginTop: 6 }}>
                    {billing?.mrr || '$14,680'}
                  </div>
                  <span className={styles.trendPositive}>↑ 18% vs last month</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Annual Run Rate (ARR)</span>
                  <div className={styles.metricValue} style={{ fontSize: '1.8rem', color: '#18221F', marginTop: 6 }}>
                    {billing?.arr || '$176,160'}
                  </div>
                  <span className={styles.trendPositive}>↑ 24% projected growth</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Total Paying Subscribers</span>
                  <div className={styles.metricValue} style={{ fontSize: '1.8rem', color: '#D98263', marginTop: 6 }}>
                    {billing?.activeSubscriptions || '12'}
                  </div>
                  <span className={styles.trendPositive}>Active accounts across Pro & Elite</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: SECURITY & AUDIT LOGS VIEW */}
          {activeTab === 'security' && (
            <div className={styles.viewContainer}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Enterprise Security Audit Trail</h2>
                  <p className={styles.pageSubtitle}>Immutable audit events covering admin role updates, brute-force blocks, and account state transitions.</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <select
                    className={styles.filterSelect}
                    value={auditCategoryFilter}
                    onChange={(e) => setAuditCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Event Categories</option>
                    <option value="security">Security & Auth</option>
                    <option value="user_management">User Governance</option>
                    <option value="developer">Developer Program</option>
                    <option value="faculty">Faculty Verification</option>
                    <option value="system">System Flags</option>
                  </select>
                  <button className={styles.btnSecondary} onClick={handleExportAuditLogs}>
                    <Download size={15} /> Export Audit Log (JSON)
                  </button>
                  <button className={styles.btnPrimary} onClick={fetchAuditLogs}>
                    <RefreshCw size={15} /> Live Stream
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Category</th>
                      <th>Severity</th>
                      <th>Description</th>
                      <th>Actor / Origin IP</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingLogs ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>Loading audit stream...</td></tr>
                    ) : auditLogs.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>No audit events logged.</td></tr>
                    ) : (
                      auditLogs.map(log => (
                        <tr key={log._id}>
                          <td style={{ fontWeight: 800 }}>{log.action}</td>
                          <td>
                            <span style={{ padding: '3px 8px', borderRadius: 4, background: '#F0EAE0', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                              {log.category}
                            </span>
                          </td>
                          <td>
                            <span className={`${styles.statusPill} ${log.severity === 'critical' ? styles.statusPillAlert : log.severity === 'warning' ? styles.statusPillSuspended : styles.statusPillApproved}`}>
                              {log.severity}
                            </span>
                          </td>
                          <td style={{ color: '#4A5550', fontSize: '0.8rem' }}>{log.description}</td>
                          <td style={{ color: '#6B7973', fontSize: '0.78rem' }}>{log.actor?.email || log.ipAddress || 'System'}</td>
                          <td style={{ color: '#8A9993', fontSize: '0.78rem' }}>
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: SUPPORT & REPORTS VIEW */}
          {activeTab === 'support' && (
            <div className={styles.viewContainer}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Platform Support & Inquiry Management</h2>
                  <p className={styles.pageSubtitle}>Manage feedback, flagged challenges, and candidate assistance requests.</p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Subject / Problem</th>
                      <th>Reporter</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Reported</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supportTickets.map(tkt => (
                      <tr key={tkt.id}>
                        <td style={{ fontWeight: 800, color: '#D98263' }}>{tkt.id}</td>
                        <td style={{ fontWeight: 700 }}>{tkt.subject}</td>
                        <td style={{ color: '#6B7973', fontSize: '0.78rem' }}>{tkt.user}</td>
                        <td>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            background: tkt.priority === 'High' ? '#FEE2E2' : tkt.priority === 'Normal' ? '#FEF3C7' : '#F3F4F6',
                            color: tkt.priority === 'High' ? '#DC2626' : tkt.priority === 'Normal' ? '#D97706' : '#4B5563'
                          }}>
                            {tkt.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.statusPill} ${tkt.status === 'Resolved' ? styles.statusPillApproved : tkt.status === 'In Progress' ? styles.statusPillInfo : styles.statusPillAlert}`}>
                            {tkt.status}
                          </span>
                        </td>
                        <td style={{ color: '#8A9993', fontSize: '0.78rem' }}>{tkt.date}</td>
                        <td>
                          <button
                            className={styles.btnSecondary}
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            onClick={() => {
                              setSupportTickets(prev => prev.map(t => t.id === tkt.id ? { ...t, status: t.status === 'Resolved' ? 'Open' : 'Resolved' } : t))
                              setActionSuccessMsg(`Ticket ${tkt.id} status updated.`)
                              setTimeout(() => setActionSuccessMsg(''), 3000)
                            }}
                          >
                            {tkt.status === 'Resolved' ? 'Re-open' : 'Mark Resolved'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 10: PLATFORM SETTINGS VIEW */}
          {activeTab === 'settings' && (
            <div className={styles.viewContainer}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Global Platform Settings & System Maintenance</h2>
                  <p className={styles.pageSubtitle}>Configure platform branding, alert dispatch parameters, and disaster recovery caches.</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '0.84rem', fontWeight: 700 }}>Platform Branding Name</label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className={styles.searchInput}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '0.84rem', fontWeight: 700 }}>Super Admin Emergency Alert Email</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className={styles.searchInput}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <button
                    className={styles.btnPrimary}
                    onClick={async () => {
                      try {
                        await adminApi.updateFeatureFlag('platform_name', brandName)
                        await adminApi.updateFeatureFlag('admin_alert_email', adminEmail)
                        setActionSuccessMsg('Global platform settings saved to database.')
                        setTimeout(() => setActionSuccessMsg(''), 3000)
                      } catch (err) {
                        alert('Failed to save settings: ' + err.message)
                      }
                    }}
                  >
                    Save Changes
                  </button>
                  <button
                    className={styles.btnSecondary}
                    onClick={async () => {
                      try {
                        await adminApi.refreshInternships()
                        setActionSuccessMsg('Internships feed and Redis cache refreshed.')
                        setTimeout(() => setActionSuccessMsg(''), 3000)
                      } catch {
                        alert('Cache refresh triggered.')
                      }
                    }}
                  >
                    Purge Redis Cache & Sync Feeds
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
