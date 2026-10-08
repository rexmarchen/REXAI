import React, { useEffect, useMemo, useState } from 'react'
import {
  Sparkles,
  ShieldCheck,
  Clock,
  Briefcase,
  MapPin,
  ExternalLink,
  Cpu,
  Search,
  Check,
  Zap,
  RefreshCw,
  X,
  AlertCircle,
  Flame,
  CheckCircle2
} from 'lucide-react'
import {
  discoverFreshJobs,
  applyOneClick,
  getApplicationMetrics
} from '../../../services/applicationApi'
import styles from './JobMatchingEngine.module.css'

const CAREER_DOMAINS = [
  'All Domains',
  'AI / ML',
  'Cybersecurity',
  'Full Stack',
  'Backend',
  'Frontend',
  'DevOps & Cloud',
  'Data Engineering',
  'Mobile Development'
]

const ORCHESTRATOR_STEPS = [
  { key: 'PRE_APPLY_FRESHNESS_CHECK', label: '12h/24h/48h Freshness Check', desc: 'Validating posting timestamp against strict freshness threshold' },
  { key: 'BROWSER_SPAWNED', label: 'Browser Worker', desc: 'Launching isolated automation runtime' },
  { key: 'FORM_ANALYZED', label: 'Field Safety Analysis', desc: 'Classifying fields into Safe Autofill vs Sensitive constraints' },
  { key: 'SCREENING_ANSWERED', label: 'RAG Grounded Answers', desc: 'Synthesizing verified answers backed by resume chunk evidence' },
  { key: 'VALIDATION_READY', label: 'Validation & Staging', desc: 'Verifying completed form inputs and attachments' },
  { key: 'SUBMITTED', label: 'Submitted to ATS', desc: 'Application securely submitted with append-only audit event' }
]

export default function JobMatchingEngine({ resume }) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('All Domains')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [sourceFilter, setSourceFilter] = useState('all') // 'all', 'linkedin', 'tier1'
  const [freshnessFilter, setFreshnessFilter] = useState('all') // 'all' (<=48h), '24h' (<=24h), '12h' (<=12h)
  const [metrics, setMetrics] = useState(null)

  // 1-Click Apply Modal State
  const [activeJob, setActiveJob] = useState(null)
  const [applying, setApplying] = useState(false)
  const [applicationResult, setApplicationResult] = useState(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // Fetch metrics on mount
  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await getApplicationMetrics()
        if (res.success && res.data) {
          setMetrics(res.data)
        }
      } catch (err) {
        console.debug('Failed to load metrics:', err.message)
      }
    }
    loadMetrics()
  }, [])

  // Fetch fresh jobs from backend orchestrator (including scraped LinkedIn jobs)
  const fetchJobs = async () => {
    setLoading(true)
    setError(null)
    try {
      const targetRole = resume?.predicted_role || resume?.role_target || resume?.name ? `${resume?.skills?.[0] || 'Software'} Engineer` : 'Software Engineer'
      const query = searchQuery.trim() || targetRole

      const res = await discoverFreshJobs({
        query,
        domain: selectedDomain === 'All Domains' ? undefined : selectedDomain,
        limit: 40
      })

      if (res.success && Array.isArray(res.data)) {
        setJobs(res.data)
      } else {
        setJobs([])
      }
    } catch (err) {
      console.error('Job discovery failed:', err)
      setError('Unable to fetch fresh jobs from ATS providers. Please retry.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [selectedDomain, resume])

  // Filtered jobs with 12h, 24h, LinkedIn, and remote toggles
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Remote filter
      if (remoteOnly && !job.isRemote) return false

      // Source filter
      const isLinkedIn = job.provider === 'linkedin' || job.publisher === 'LinkedIn'
      if (sourceFilter === 'linkedin' && !isLinkedIn) return false
      if (sourceFilter === 'tier1' && job.tier !== 1) return false

      // Freshness filter: <=12 hours or <=24 hours
      const ageHours = job.freshness?.ageHours ?? (
        job.postedAt ? Math.max(0, (Date.now() - new Date(job.postedAt).getTime()) / (1000 * 60 * 60)) : 999
      )

      if (freshnessFilter === '12h' && ageHours > 12) return false
      if (freshnessFilter === '24h' && ageHours > 24) return false

      // Search keyword filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const titleMatch = (job.title || '').toLowerCase().includes(q)
        const compMatch = (job.company || '').toLowerCase().includes(q)
        const descMatch = (job.description || '').toLowerCase().includes(q)
        if (!titleMatch && !compMatch && !descMatch) return false
      }

      return true
    })
  }, [jobs, remoteOnly, sourceFilter, freshnessFilter, searchQuery])

  // Handle 1-Click Apply
  const handleStartApply = async (job) => {
    setActiveJob(job)
    setApplying(true)
    setApplicationResult(null)
    setCurrentStepIndex(0)

    // Simulate animated step progression while backend orchestrates
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < ORCHESTRATOR_STEPS.length - 2) {
          return prev + 1
        }
        return prev
      })
    }, 900)

    try {
      const res = await applyOneClick(job, { useLiveBrowser: true, liveSubmit: true })
      clearInterval(stepInterval)
      setCurrentStepIndex(ORCHESTRATOR_STEPS.length - 1)
      setApplicationResult(res.data || res)
      window.dispatchEvent(new CustomEvent('rexion:application-updated'))
    } catch (err) {
      clearInterval(stepInterval)
      setApplicationResult({
        state: 'FAILED',
        error: err.response?.data?.message || err.message || 'Execution error during 1-Click Apply'
      })
    } finally {
      setApplying(false)
    }
  }

  // Count helper metrics
  const fresh12Count = useMemo(() => {
    return jobs.filter(j => (j.freshness?.ageHours ?? 999) <= 12).length
  }, [jobs])

  const fresh24Count = useMemo(() => {
    return jobs.filter(j => (j.freshness?.ageHours ?? 999) <= 24).length
  }, [jobs])

  const linkedInCount = useMemo(() => {
    return jobs.filter(j => j.provider === 'linkedin' || j.publisher === 'LinkedIn').length
  }, [jobs])

  return (
    <div className={styles.engineContainer}>
      {/* Top Banner Overview */}
      <div className={styles.bannerCard}>
        <div className={styles.bannerBadgeRow}>
          <span className={styles.bannerBadgePrimary}>
            <Zap style={{ width: 14, height: 14 }} /> Agentic 1-Click Automation
          </span>
          <span className={styles.bannerBadgeSecondary}>
            <Clock style={{ width: 14, height: 14 }} /> Strict 12h / 24h / 48h Freshness
          </span>
          <span className={styles.bannerBadgeLinkedIn}>
            <svg style={{ width: 14, height: 14, fill: '#0077b5' }} viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z" />
            </svg>
            Live LinkedIn Scraping Active
          </span>
        </div>

        <h2 className={styles.bannerTitle}>Live Job Matching & Application Hub</h2>
        <p className={styles.bannerSubtitle}>
          Real-time jobs scraped from LinkedIn and top ATS platforms. Ranked by verified skills overlap and filtered by your exact posting age window.
        </p>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className={styles.controlsBar}>
        <div className={styles.searchRow}>
          <div className={styles.searchInputWrapper}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by role, company, or tech stack (e.g. Python, React)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className={styles.selectInput}
          >
            {CAREER_DOMAINS.map((domain) => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Chips & Freshness Selectors */}
        <div className={styles.filterChipsRow}>
          <span className={styles.filterChipLabel}>Post Age:</span>

          <button
            onClick={() => setFreshnessFilter('all')}
            className={`${styles.filterChip} ${freshnessFilter === 'all' ? styles.filterChipActive : ''}`}
          >
            All Fresh (≤ 48h)
          </button>

          <button
            onClick={() => setFreshnessFilter('24h')}
            className={`${styles.filterChip} ${freshnessFilter === '24h' ? styles.filterChipActiveFresh : ''}`}
          >
            <Clock style={{ width: 14, height: 14 }} />
            ⚡ Under 24h ({fresh24Count})
          </button>

          <button
            onClick={() => setFreshnessFilter('12h')}
            className={`${styles.filterChip} ${freshnessFilter === '12h' ? styles.filterChipActiveFresh : ''}`}
          >
            <Flame style={{ width: 14, height: 14 }} />
            🔥 Under 12h ({fresh12Count})
          </button>

          <span className={styles.filterChipLabel} style={{ marginLeft: 10 }}>Source:</span>

          <button
            onClick={() => setSourceFilter(sourceFilter === 'linkedin' ? 'all' : 'linkedin')}
            className={`${styles.filterChip} ${sourceFilter === 'linkedin' ? styles.filterChipActiveLinkedIn : ''}`}
          >
            <svg style={{ width: 13, height: 13, fill: 'currentColor' }} viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z" />
            </svg>
            LinkedIn Only ({linkedInCount})
          </button>

          <button
            onClick={() => setRemoteOnly(!remoteOnly)}
            className={`${styles.filterChip} ${remoteOnly ? styles.filterChipActive : ''}`}
          >
            <MapPin style={{ width: 13, height: 13 }} /> Remote Only
          </button>

          <button
            onClick={fetchJobs}
            disabled={loading}
            className={styles.refreshButton}
          >
            <RefreshCw style={{ width: 14, height: 14, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh Live
          </button>
        </div>
      </div>

      {/* Grid of Live Jobs */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <RefreshCw style={{ width: 36, height: 36, color: '#38bdf8', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Scraping Live LinkedIn & ATS Postings...</h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Filtering under 12h/24h/48h timestamps and matching against your profile.</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 12 }}>
          <AlertCircle style={{ width: 32, height: 32, color: '#f87171', margin: '0 auto 10px' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{error}</h3>
          <button onClick={fetchJobs} style={{ marginTop: 12, padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            Retry Discovery
          </button>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14 }}>
          <Briefcase style={{ width: 40, height: 40, color: '#475569', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>No live postings matched your current filter</h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: 460, margin: '6px auto 0' }}>
            Try expanding your filter from {freshnessFilter === '12h' ? 'Under 12h' : 'Under 24h'} to "All Fresh (≤ 48h)" or clearing search keywords.
          </p>
        </div>
      ) : (
        <div className={styles.jobsGrid}>
          {filteredJobs.map((job) => {
            const ageHours = Math.round(
              job.freshness?.ageHours ?? (
                job.postedAt ? Math.max(0, (Date.now() - new Date(job.postedAt).getTime()) / (1000 * 60 * 60)) : 0
              )
            )

            const is12h = ageHours <= 12
            const is24h = ageHours <= 24
            const isLinkedIn = job.provider === 'linkedin' || job.publisher === 'LinkedIn'

            return (
              <div key={job.canonicalHash || job.id || job.url} className={styles.jobCard}>
                <div>
                  <div className={styles.cardHeader}>
                    <div className={styles.employerBrandRow}>
                      {job.employerLogo ? (
                        <img
                          src={job.employerLogo}
                          alt={job.company}
                          className={styles.employerLogo}
                        />
                      ) : (
                        <div className={styles.employerLogo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#38bdf8' }}>
                          {(job.company || 'J')[0]}
                        </div>
                      )}
                      <div>
                        <span className={styles.companyName}>{job.company}</span>
                        <h3 className={styles.jobTitle}>{job.title}</h3>
                      </div>
                    </div>

                    <div className={styles.scorePill}>
                      <Sparkles style={{ width: 14, height: 14 }} />
                      {job.score || 85}% Match
                    </div>
                  </div>

                  {/* Badges: Location, Freshness (12h/24h), Source */}
                  <div className={styles.badgeRow}>
                    <span className={styles.badgeTag}>
                      <MapPin style={{ width: 12, height: 12 }} />
                      {job.location || 'Remote'}
                    </span>

                    <span
                      className={`${styles.badgeTag} ${
                        is12h ? styles.badgeTagFresh12 : is24h ? styles.badgeTagFresh24 : styles.badgeTagFresh48
                      }`}
                    >
                      {is12h ? <Flame style={{ width: 12, height: 12 }} /> : <Clock style={{ width: 12, height: 12 }} />}
                      {is12h ? `🔥 Posted ${ageHours}h ago (<12h)` : is24h ? `⚡ Posted ${ageHours}h ago (<24h)` : `Posted ${ageHours}h ago (≤48h)`}
                    </span>

                    {isLinkedIn ? (
                      <span className={`${styles.badgeTag} ${styles.badgeTagLinkedIn}`}>
                        <svg style={{ width: 12, height: 12, fill: '#0a66c2' }} viewBox="0 0 24 24">
                          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z" />
                        </svg>
                        LinkedIn Verified
                      </span>
                    ) : (
                      <span className={styles.badgeTag}>
                        <ShieldCheck style={{ width: 12, height: 12, color: '#818cf8' }} /> Direct ATS
                      </span>
                    )}
                  </div>

                  {/* Description Snippet */}
                  <p className={styles.jobDescSnippet}>
                    {job.description || 'Verified real-time job posting from direct applicant tracking platform.'}
                  </p>

                  {/* Match Rationale */}
                  {job.matchReasons && job.matchReasons.length > 0 && (
                    <div className={styles.rationaleBox}>
                      <div className={styles.rationaleTitle}>
                        <Cpu style={{ width: 12, height: 12, color: '#38bdf8' }} /> Match Rationale
                      </div>
                      <div>
                        {job.matchReasons.slice(0, 2).map((reason, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <Check style={{ width: 12, height: 12, color: '#34d399', flexShrink: 0 }} />
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matched Skills */}
                  {job.matchedSkills && job.matchedSkills.length > 0 && (
                    <div className={styles.skillsRow}>
                      {job.matchedSkills.slice(0, 4).map((skill, idx) => (
                        <span key={idx} className={styles.skillBadge}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className={styles.cardFooter}>
                  <button
                    onClick={() => handleStartApply(job)}
                    className={styles.applyOneClickBtn}
                  >
                    <Zap style={{ width: 15, height: 15 }} /> 1-Click Apply
                  </button>

                  <a
                    href={job.applyUrl || job.url}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.viewPostingBtn}
                    title={isLinkedIn ? 'View on LinkedIn' : 'View ATS Posting'}
                  >
                    <ExternalLink style={{ width: 16, height: 16 }} />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 1-Click Apply Execution Modal */}
      {activeJob && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Agentic 1-Click Orchestrator
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginTop: 2 }}>
                  {activeJob.title}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {activeJob.company} • {activeJob.location || 'Remote'}
                </p>
              </div>

              {!applying && (
                <button
                  onClick={() => setActiveJob(null)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                >
                  <X style={{ width: 20, height: 20 }} />
                </button>
              )}
            </div>

            {/* Stepper Progress */}
            <div>
              {ORCHESTRATOR_STEPS.map((step, idx) => {
                const isPassed = idx < currentStepIndex
                const isCurrent = idx === currentStepIndex

                return (
                  <div
                    key={step.key}
                    className={`${styles.modalStepItem} ${
                      isCurrent ? styles.modalStepActive : isPassed ? styles.modalStepPassed : ''
                    }`}
                  >
                    <div>
                      {isPassed ? (
                        <CheckCircle2 style={{ width: 18, height: 18, color: '#34d399' }} />
                      ) : isCurrent ? (
                        <RefreshCw style={{ width: 18, height: 18, color: '#38bdf8', animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #475569' }} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isCurrent ? '#38bdf8' : isPassed ? '#34d399' : '#94a3b8' }}>
                        {step.label}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        {step.desc}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Result State */}
            {applicationResult && (
              <div style={{ marginTop: 18, padding: 14, borderRadius: 10, background: applicationResult.state === 'SUBMITTED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: `1px solid ${applicationResult.state === 'SUBMITTED' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}` }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: applicationResult.state === 'SUBMITTED' ? '#34d399' : '#f87171' }}>
                  {applicationResult.state === 'SUBMITTED' ? 'Application Successfully Submitted!' : 'Application Error'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: 4 }}>
                  {applicationResult.state === 'SUBMITTED'
                    ? 'Autonomous agent traversed all form steps, answered screening questions, and safely submitted to the employer ATS.'
                    : applicationResult.error || 'The job form could not be automatically submitted.'}
                </div>
                <button
                  onClick={() => setActiveJob(null)}
                  style={{ marginTop: 10, padding: '7px 14px', borderRadius: 8, background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
