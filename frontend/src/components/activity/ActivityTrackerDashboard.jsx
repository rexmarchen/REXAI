import React, { useEffect, useState, useMemo, useRef } from 'react'
import {
  fetchActivities,
  fetchActivitySummary,
  downloadActivitiesCsv,
  deleteActivity
} from '../../services/activityApi'
import styles from './ActivityTrackerDashboard.module.css'

const formatRelativeTime = (dateInput) => {
  if (!dateInput) return ''
  const date = new Date(dateInput)
  const now = new Date()
  const diffSec = Math.floor((now - date) / 1000)

  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}h ago`
  const diffDays = Math.floor(diffHour / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const CATEGORY_CONFIG = {
  ai: {
    label: 'AI Requests',
    bg: '#FFF0E8',
    color: '#E07A5F',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
      </svg>
    )
  },
  resume: {
    label: 'Resumes',
    bg: '#FFF0ED',
    color: '#E56A54',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    )
  },
  jobs: {
    label: 'Job Matches',
    bg: '#EFF8F3',
    color: '#4E9A70',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
      </svg>
    )
  },
  applications: {
    label: 'Applications',
    bg: '#F5F3FF',
    color: '#7C3AED',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
      </svg>
    )
  },
  learning: {
    label: 'Quizzes',
    bg: '#FFFBEB',
    color: '#D97706',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    )
  },
  account: {
    label: 'Account',
    bg: '#F3F4F6',
    color: '#4B5563',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    )
  }
}

const DATE_RANGES = [
  { id: '7d', label: 'Last 7 days' },
  { id: 'today', label: 'Today' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
  { id: 'all', label: 'All Time' }
]

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All Activities' },
  { id: 'ai', label: 'AI Requests' },
  { id: 'resume', label: 'Resume Studio' },
  { id: 'jobs', label: 'Job Matches' },
  { id: 'applications', label: 'Applications' },
  { id: 'learning', label: 'Quizzes & Code' },
  { id: 'account', label: 'Account Updates' }
]

export default function ActivityTrackerDashboard({ inWorkspace = false }) {
  const [selectedRange, setSelectedRange] = useState('7d')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false)
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)

  const [activities, setActivities] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Live sync state
  const [isLive, setIsLive] = useState(false)
  const [lastSynced, setLastSynced] = useState(null)
  const [liveCount, setLiveCount] = useState(0)

  const dateMenuRef = useRef(null)
  const filterMenuRef = useRef(null)
  const pollIntervalRef = useRef(null)

  const dateBounds = useMemo(() => {
    const now = new Date()
    let startDate = null
    let endDate = null

    if (selectedRange === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      startDate = today.toISOString()
      endDate = now.toISOString()
    } else if (selectedRange === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      endDate = now.toISOString()
    } else if (selectedRange === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      endDate = now.toISOString()
    } else if (selectedRange === '90d') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
      endDate = now.toISOString()
    }

    return { startDate, endDate }
  }, [selectedRange])

  const dateLabel = useMemo(() => {
    const found = DATE_RANGES.find((r) => r.id === selectedRange)
    if (selectedRange === '7d') {
      const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const end = new Date()
      const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      return `${startStr} – ${endStr}`
    }
    return found ? found.label : 'Select Date'
  }, [selectedRange])

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dateMenuRef.current && !dateMenuRef.current.contains(e.target)) {
        setDateDropdownOpen(false)
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target)) {
        setFilterDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Load summary metrics whenever date range changes
  useEffect(() => {
    let active = true
    const loadSummary = async () => {
      try {
        const data = await fetchActivitySummary({
          startDate: dateBounds.startDate,
          endDate: dateBounds.endDate
        })
        if (active && data) {
          setSummary(data)
        }
      } catch (err) {
        console.error('Failed to load activity summary:', err)
      }
    }
    loadSummary()
    return () => { active = false }
  }, [dateBounds])

  // Load activities feed
  const loadFeed = async (resetPage = false) => {
    try {
      setLoading(true)
      const currentPage = resetPage ? 1 : page
      const res = await fetchActivities({
        category: selectedCategory,
        startDate: dateBounds.startDate,
        endDate: dateBounds.endDate,
        search: searchQuery,
        page: currentPage,
        limit: 15
      })

      if (resetPage) {
        setActivities(res.activities || [])
        setPage(1)
      } else {
        setActivities((prev) => [...prev, ...(res.activities || [])])
      }
      setHasMore(Boolean(res.hasMore))
    } catch (err) {
      console.error('Failed to load activities:', err)
    } finally {
      setLoading(false)
    }
  }

  // Refetch when filters change
  useEffect(() => {
    loadFeed(true)
  }, [selectedCategory, dateBounds, searchQuery])

  const handleLoadMore = () => {
    setPage((prev) => prev + 1)
  }

  useEffect(() => {
    if (page > 1) {
      loadFeed(false)
    }
  }, [page])

  // Live sync: toggle real-time polling
  const toggleLiveSync = () => {
    setIsLive((prev) => {
      const next = !prev
      if (next) {
        // Start polling every 15 seconds for live data
        pollIntervalRef.current = setInterval(async () => {
          try {
            const res = await fetchActivities({
              category: selectedCategory,
              startDate: dateBounds.startDate,
              endDate: dateBounds.endDate,
              search: searchQuery,
              page: 1,
              limit: 15
            })
            const newActivities = res.activities || []
            setLastSynced(new Date())
            setLiveCount(newActivities.length)
            // Only update if there's actually new data
            if (newActivities.length > 0) {
              setActivities(newActivities)
            }
          } catch (err) {
            console.error('Live sync poll failed:', err)
          }
        }, 15000)
      } else {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
      }
      return next
    })
  }

  // Manual live sync trigger
  const handleLiveSync = async () => {
    try {
      setLoading(true)
      const res = await fetchActivities({
        category: selectedCategory,
        startDate: dateBounds.startDate,
        endDate: dateBounds.endDate,
        search: searchQuery,
        page: 1,
        limit: 15
      })
      const newActivities = res.activities || []
      setActivities(newActivities)
      setLastSynced(new Date())
      setLiveCount(newActivities.length)
      setHasMore(Boolean(res.hasMore))
    } catch (err) {
      console.error('Manual live sync failed:', err)
    } finally {
      setLoading(false)
    }
  }

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  const handleDeleteActivity = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Remove this activity from your history?')) return
    try {
      await deleteActivity(id)
      setActivities((prev) => prev.filter((a) => a._id !== id))
      const updatedSummary = await fetchActivitySummary({
        startDate: dateBounds.startDate,
        endDate: dateBounds.endDate
      })
      if (updatedSummary) setSummary(updatedSummary)
    } catch (err) {
      console.error('Failed to delete activity:', err)
    }
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      await downloadActivitiesCsv({
        category: selectedCategory,
        startDate: dateBounds.startDate,
        endDate: dateBounds.endDate,
        search: searchQuery
      })
    } catch (err) {
      alert('Failed to export CSV: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  const donutSegments = useMemo(() => {
    if (!summary?.breakdown || summary.breakdown.length === 0) return []
    const total = summary.totalActivities || 1
    const radius = 54
    const circumference = 2 * Math.PI * radius
    let accumulatedOffset = 0

    return summary.breakdown.map((item) => {
      const fraction = item.count / total
      const strokeLength = fraction * circumference
      const strokeDasharray = `${strokeLength} ${circumference}`
      const strokeDashoffset = -accumulatedOffset
      accumulatedOffset += strokeLength
      return {
        ...item,
        strokeDasharray,
        strokeDashoffset
      }
    })
  }, [summary])

  return (
    <div className={`${styles.wrapper} ${inWorkspace ? styles.inWorkspace : ''}`}>
      {/* =========================================================================
          HEADER BANNER - Live Database Stream
          ========================================================================= */}
      <div className={styles.headerBanner}>
        <div className={styles.liveStreamBadge}>
          <span className={styles.liveDot} style={{ animation: isLive ? 'pulse 2s infinite' : 'none' }}></span>
          <span className={styles.liveText}>
            {isLive ? 'LIVE DATABASE STREAM' : 'DATABASE STREAM'} • MONGODB ATLAS
          </span>
        </div>

        <div className={styles.headerTitleGroup}>
          <div className={styles.headerIconBox}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
          <div>
            <h1 className={styles.headerHeading}>App & Activity Tracker</h1>
            <p className={styles.headerSubheading}>
              Track your real-time applications, outreach, and pipeline activity
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.liveSyncBtn}
            onClick={handleLiveSync}
            disabled={loading}
            title="Manually sync live data from database"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
              <path d="M21 12a9 9 0 0 1 9 9 9.75 9.75 0 0 1 6.74-2.74L21 16"></path>
              <path d="M21 21v-5h-5"></path>
            </svg>
            <span>{isLive ? 'Live Sync On' : 'Live Sync'}</span>
            {liveCount > 0 && (
              <span className={styles.syncCount}>+{liveCount} new</span>
            )}
          </button>

          <button
            type="button"
            className={styles.toggleLiveBtn}
            onClick={toggleLiveSync}
            classNameActive={isLive}
            title={isLive ? 'Disable live polling' : 'Enable live polling (15s interval)'}
          >
            <span className={styles.toggleLabel}>{isLive ? 'LIVE: ON' : 'LIVE: OFF'}</span>
          </button>

          {/* Date Filter Dropdown */}
          <div ref={dateMenuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className={styles.dateFilterBtn}
              onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>{dateLabel}</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {dateDropdownOpen && (
              <div className={styles.dropdownMenu}>
                {DATE_RANGES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`${styles.dropdownOption} ${selectedRange === r.id ? styles.activeOption : ''}`}
                    onClick={() => {
                      setSelectedRange(r.id)
                      setDateDropdownOpen(false)
                    }}
                  >
                    <span>{r.label}</span>
                    {selectedRange === r.id && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Last synced indicator */}
      {lastSynced && (
        <div className={styles.lastSyncedBar}>
          <span className={styles.syncedLabel}>Last synced:</span>
          <span className={styles.syncedTime}>{lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {isLive && (
            <span className={styles.syncedStatus} style={{ color: '#4E9A70' }}>
              ● Live polling active
            </span>
          )}
        </div>
      )}

      {/* Top 5 Metric Cards */}
      <div className={styles.metricsGrid}>
        {/* Card 1: AI Requests */}
        <div className={styles.metricCard}>
          <div className={styles.metricTopRow}>
            <div className={styles.metricIconWrap} style={{ background: '#FFF0E8', color: '#E07A5F' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
              </svg>
            </div>
            <span className={styles.metricLabel}>AI Requests</span>
          </div>
          <div className={styles.metricBottomRow}>
            <span className={styles.metricValue}>{summary?.kpis?.aiRequests?.value ?? 0}</span>
            <span className={`${styles.metricTrend} ${summary?.kpis?.aiRequests?.positive ? styles.trendPositive : styles.trendNeutral}`}>
              {summary?.kpis?.aiRequests?.changeText || '+0 this week'}
            </span>
          </div>
        </div>

        {/* Card 2: Resumes Analyzed */}
        <div className={styles.metricCard}>
          <div className={styles.metricTopRow}>
            <div className={styles.metricIconWrap} style={{ background: '#FFF0ED', color: '#E56A54' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
            <span className={styles.metricLabel}>Resumes Analyzed</span>
          </div>
          <div className={styles.metricBottomRow}>
            <span className={styles.metricValue}>{summary?.kpis?.resumesAnalyzed?.value ?? 0}</span>
            <span className={`${styles.metricTrend} ${summary?.kpis?.resumesAnalyzed?.positive ? styles.trendPositive : styles.trendNeutral}`}>
              {summary?.kpis?.resumesAnalyzed?.changeText || '+0 this week'}
            </span>
          </div>
        </div>

        {/* Card 3: Job Matches */}
        <div className={styles.metricCard}>
          <div className={styles.metricTopRow}>
            <div className={styles.metricIconWrap} style={{ background: '#EFF8F3', color: '#4E9A70' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
            <span className={styles.metricLabel}>Job Matches</span>
          </div>
          <div className={styles.metricBottomRow}>
            <span className={styles.metricValue}>{summary?.kpis?.jobMatches?.value ?? 0}</span>
            <span className={`${styles.metricTrend} ${summary?.kpis?.jobMatches?.positive ? styles.trendPositive : styles.trendNeutral}`}>
              {summary?.kpis?.jobMatches?.changeText || '+0 this week'}
            </span>
          </div>
        </div>

        {/* Card 4: Applications */}
        <div className={styles.metricCard}>
          <div className={styles.metricTopRow}>
            <div className={styles.metricIconWrap} style={{ background: '#F5F3FF', color: '#7C3AED' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </div>
            <span className={styles.metricLabel}>Applications</span>
          </div>
          <div className={styles.metricBottomRow}>
            <span className={styles.metricValue}>{summary?.kpis?.applications?.value ?? 0}</span>
            <span className={`${styles.metricTrend} ${summary?.kpis?.applications?.positive ? styles.trendPositive : styles.trendNeutral}`}>
              {summary?.kpis?.applications?.changeText || '+0 this week'}
            </span>
          </div>
        </div>

        {/* Card 5: Quiz Attempts */}
        <div className={styles.metricCard}>
          <div className={styles.metricTopRow}>
            <div className={styles.metricIconWrap} style={{ background: '#FFFBEB', color: '#D97706' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <span className={styles.metricLabel}>Quiz Attempts</span>
          </div>
          <div className={styles.metricBottomRow}>
            <span className={styles.metricValue}>{summary?.kpis?.quizAttempts?.value ?? 0}</span>
            <span className={`${styles.metricTrend} ${summary?.kpis?.quizAttempts?.positive ? styles.trendPositive : styles.trendNeutral}`}>
              {summary?.kpis?.quizAttempts?.changeText || '+0 this week'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Grid: Recent Activity Feed + Breakdown / Top Activities */}
      <div className={styles.dashboardSplit}>
        {/* Left: Recent Activity Feed */}
        <div className={styles.activityFeedCard}>
          <div className={styles.feedHeader}>
            <h2 className={styles.feedTitle}>Recent Activity</h2>

            <div className={styles.filterControls}>
              <div ref={filterMenuRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className={styles.filterBtn}
                  onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                  </svg>
                  <span>Filter</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {filterDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    {CATEGORY_FILTERS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className={`${styles.dropdownOption} ${selectedCategory === f.id ? styles.activeOption : ''}`}
                        onClick={() => {
                          setSelectedCategory(f.id)
                          setFilterDropdownOpen(false)
                        }}
                      >
                        <span>{f.label}</span>
                        {selectedCategory === f.id && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timeline Feed */}
          {loading && activities.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '20px 0' }}>
              <div className={styles.skeletonLine} style={{ width: '80%' }}></div>
              <div className={styles.skeletonLine} style={{ width: '60%' }}></div>
              <div className={styles.skeletonLine} style={{ width: '70%' }}></div>
            </div>
          ) : activities.length === 0 ? (
            <div className={styles.emptyState}>
              <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p className={styles.emptyTitle}>No activities recorded yet</p>
              <p className={styles.emptyText}>
                Your resume analyses, job matches, internship applications, and quizzes will appear here automatically.
              </p>
            </div>
          ) : (
            <div className={styles.timelineList}>
              {activities.map((act) => {
                const conf = CATEGORY_CONFIG[act.category] || CATEGORY_CONFIG.ai
                return (
                  <div key={act._id} className={styles.timelineItem}>
                    <div className={styles.timelineConnector}></div>
                    <div className={styles.timelineDot} style={{ background: conf.bg, color: conf.color }}>
                      {conf.icon}
                    </div>
                    <div className={styles.timelineContent}>
                      <h4 className={styles.timelineTitle}>{act.title}</h4>
                      <p className={styles.timelineDesc}>{act.description}</p>
                    </div>
                    <span className={styles.timelineTime}>{formatRelativeTime(act.createdAt)}</span>
                    <button
                      type="button"
                      className={styles.deleteItemBtn}
                      title="Remove from history"
                      onClick={(e) => handleDeleteActivity(act._id, e)}
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {hasMore && (
            <button
              type="button"
              className={styles.viewAllBtn}
              onClick={handleLoadMore}
              disabled={loading}
            >
              {loading ? 'Loading More...' : 'View All Activity'}
            </button>
          )}
        </div>

        {/* Right: Breakdown & Top Activities */}
        <div className={styles.rightColumn}>
          {/* Donut Card */}
          <div className={styles.sideCard}>
            <h3 className={styles.sideCardTitle}>Activity Breakdown</h3>

            <div className={styles.donutContainer}>
              <div className={styles.donutSvgWrap}>
                <svg width="150" height="150" viewBox="0 0 140 140">
                  <circle
                    cx="70"
                    cy="70"
                    r="54"
                    fill="transparent"
                    stroke="#F5EFE6"
                    strokeWidth="14"
                  />
                  {donutSegments.map((seg) => (
                    <circle
                      key={seg.id}
                      cx="70"
                      cy="70"
                      r="54"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="14"
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      transform="rotate(-90 70 70)"
                      style={{ transition: 'stroke-dasharray 0.5s ease' }}
                    />
                  ))}
                </svg>

                <div className={styles.donutCenterLabel}>
                  <span className={styles.donutCenterTotal}>
                    {summary?.totalActivities ?? 0}
                  </span>
                  <span className={styles.donutCenterSub}>Total Activities</span>
                </div>
              </div>

              {/* Legend */}
              <div className={styles.donutLegend}>
                {summary?.breakdown?.map((item) => (
                  <div key={item.id} className={styles.legendItem}>
                    <div className={styles.legendLeft}>
                      <span className={styles.legendDot} style={{ background: item.color }} />
                      <span className={styles.legendLabel}>{item.label}</span>
                    </div>
                    <span className={styles.legendValue}>
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Activities Frequency Card */}
          <div className={styles.sideCard}>
            <h3 className={styles.sideCardTitle}>Top Activities</h3>

            <div className={styles.topActivitiesList}>
              {summary?.topActivities?.length > 0 ? (
                summary.topActivities.map((act, idx) => (
                  <div key={idx} className={styles.topActivityItem}>
                    <div className={styles.topActivityLeft}>
                      <span className={styles.topActivityIcon}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </span>
                      <span className={styles.topActivityTitle}>{act.title}</span>
                    </div>
                    <span className={styles.topActivityCount}>{act.count} times</span>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '0.86rem', color: '#8C939F', margin: '8px 0' }}>
                  No top activities recorded for this period yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
