import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import DashboardLoginModal from '../../components/auth/DashboardLoginModal'
import { useAuth } from '../../context/AuthContext'
import DominationSection from './sections/DominationSection'
import MicroInternshipsSection from './sections/MicroInternshipsSection'
import ResumeStudioSection from './sections/ResumeStudioSection/ResumeStudioSection'
import OutreachFlow from '../../components/outreach/OutreachFlow'
import LinkedInAutomation from '../../components/linkedin/LinkedInAutomation'
import ProfileSection from './sections/ProfileSection'
import BillingSection from './sections/BillingSection'
import JobMatchingEngine from '../../components/resume/JobMatchingEngine/JobMatchingEngine'
import AutonomousApplyStudio from '../../components/resume/AutonomousApplyStudio/AutonomousApplyStudio'
import ResumeBuilder from '../../components/resume/ResumeBuilder'
import outreachApi from '../../services/outreachApi'
import { getTrackedApplications } from '../../services/applicationApi'
import {
  FileText,
  Gauge,
  GraduationCap,
  MessageSquareCode,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Rocket,
  Search,
  Bell,
  Moon,
  ChevronRight,
  ChevronDown,
  Send,
  Mail,
  Users,
  Target,
  Briefcase,
  Compass,
  Crown,
  Flame,
  Zap,
  Award,
  CheckSquare
} from 'lucide-react'
import heroPanoramicBg from '../../assets/rexion_cream_hero_panoramic.jpg'
import styles from './WorkspaceSection.module.css'
import SkillSuite from './components/SkillSuite/SkillSuite'

const KittyArtSvg = () => (
  <svg viewBox="0 0 120 76" className={styles.kittyArtSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Floating tiny heart */}
    <path d="M74 12 C74 8, 70 6, 67 9 C64 6, 60 8, 60 12 C60 16, 67 21, 67 21 C67 21, 74 16, 74 12 Z" fill="#E97852" opacity="0.85" />
    {/* Foliage sprigs behind books */}
    <path d="M28 44 C22 38, 18 46, 24 50 C26 48, 27 46, 28 44 Z" fill="#9CB496" />
    <path d="M30 48 C24 46, 22 54, 28 56 C29 53, 30 50, 30 48 Z" fill="#7C9874" />
    <path d="M98 46 C104 42, 107 50, 101 54 C100 51, 99 48, 98 46 Z" fill="#9CB496" />
    {/* Bottom Book (Mint green) */}
    <rect x="22" y="58" width="78" height="12" rx="3" fill="#B4D3C2" />
    <rect x="20" y="58" width="6" height="12" rx="2" fill="#88B49C" />
    <path d="M26 60 H98 V68 H26 Z" fill="#FCFAF7" opacity="0.9" />
    {/* Middle Book (Terracotta) */}
    <rect x="26" y="47" width="70" height="11" rx="3" fill="#E8A588" />
    <rect x="24" y="47" width="5" height="11" rx="2" fill="#D37E5C" />
    <path d="M29 49 H94 V56 H29 Z" fill="#FCFAF7" opacity="0.9" />
    {/* Top Book (Amber) */}
    <rect x="30" y="38" width="62" height="9" rx="3" fill="#E5C79E" />
    <rect x="28" y="38" width="5" height="9" rx="2" fill="#C8A370" />
    {/* Sleeping Cat body */}
    <ellipse cx="62" cy="32" rx="21" ry="13" fill="#FBF0E4" />
    {/* Cat patches */}
    <path d="M50 24 C53 21, 60 22, 62 25 C59 27, 52 28, 50 24 Z" fill="#E59866" />
    <path d="M72 28 C76 26, 80 30, 78 34 C75 33, 73 31, 72 28 Z" fill="#D9824E" />
    {/* Cat head */}
    <circle cx="48" cy="28" r="11" fill="#FBF0E4" />
    {/* Cat ears */}
    <polygon points="42,20 46,13 49,19" fill="#E59866" />
    <polygon points="43,19 46,15 48,19" fill="#FFC9B5" />
    <polygon points="50,19 54,14 57,20" fill="#E59866" />
    <polygon points="51,19 54,15 56,20" fill="#FFC9B5" />
    {/* Closed happy eyes ^.^ */}
    <path d="M43 28 Q 45 30 47 28" stroke="#684A3B" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    <path d="M49 28 Q 51 30 53 28" stroke="#684A3B" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    {/* Nose and mouth */}
    <polygon points="47.5,31 48.5,31 48,32" fill="#E97852" />
    <path d="M46.5 33 Q 48 34 49.5 33" stroke="#684A3B" strokeWidth="1" strokeLinecap="round" fill="none" />
    {/* Rosy cheeks */}
    <circle cx="42" cy="30" r="1.8" fill="#FFAAA6" opacity="0.65" />
    <circle cx="54" cy="30" r="1.8" fill="#FFAAA6" opacity="0.65" />
    {/* Tail */}
    <path d="M82 34 Q 87 36 85 40 Q 82 43 78 41" stroke="#E59866" strokeWidth="4.2" strokeLinecap="round" fill="none" />
    {/* Paws */}
    <ellipse cx="44" cy="36" rx="3.5" ry="2" fill="#FBF0E4" />
    <ellipse cx="52" cy="36" rx="3.5" ry="2" fill="#FBF0E4" />
  </svg>
)

const BotanicalSprig = () => (
  <svg viewBox="0 0 54 40" className={styles.botanicalSprigSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 34 Q 24 26 44 8" stroke="#7A8F74" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M44 8 C42 4, 36 6, 38 12 C40 12, 42 10, 44 8 Z" fill="#8FA688" />
    <path d="M34 16 C30 13, 27 18, 32 20 C33 18, 34 17, 34 16 Z" fill="#7A8F74" />
    <path d="M28 22 C24 25, 29 29, 32 25 C31 23, 29 22, 28 22 Z" fill="#A2B79A" />
    <path d="M19 28 C15 26, 13 32, 18 33 C19 31, 19 29, 19 28 Z" fill="#7A8F74" />
  </svg>
)

const SidebarBotanical = () => (
  <svg viewBox="0 0 100 80" className={styles.sidebarBotanicalSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 80 Q 28 60 48 30 Q 58 12 70 0" stroke="#889E82" strokeWidth="1.6" strokeLinecap="round" opacity="0.35" />
    <path d="M48 30 C43 24, 36 29, 42 35 C44 33, 46 31, 48 30 Z" fill="#889E82" opacity="0.45" />
    <path d="M38 45 C30 41, 28 50, 36 52 C38 49, 38 47, 38 45 Z" fill="#A0B59A" opacity="0.45" />
    <path d="M24 60 C16 59, 17 67, 24 66 C25 63, 25 61, 24 60 Z" fill="#889E82" opacity="0.35" />
    <path d="M58 18 C54 12, 48 16, 54 22 C56 20, 58 19, 58 18 Z" fill="#A0B59A" opacity="0.45" />
  </svg>
)


const NAV_GROUPS = [
  {
    label: 'Core',
    items: [
      { id: 'dashboard', title: 'Command Center', icon: '01' },
      { id: 'matches', title: 'Job Matches', icon: '02' },
      { id: 'resume', title: 'Resume Studio', icon: '03' },
      { id: 'tracker', title: 'App Tracker', icon: '04' },
      { id: 'gigs', title: 'Micro-Internships', icon: '05' }
    ]
  },
  {
    label: 'Career',
    items: [
      { id: 'career-hub', title: 'Career Hub', icon: '🚀', route: '/career', badge: 'New' },
      { id: 'internships', title: 'Verified Internships', icon: '✓', route: '/internships' },
      { id: 'skill-gap', title: 'Skill Gap Engine', icon: '⚡', route: '/internships' }
    ]
  },
  {
    label: 'Power Tools',
    items: [
      { id: 'outreach', title: 'Outreach', icon: '06', badge: 'Pro' },
      { id: 'linkedin', title: 'LinkedIn Automation', icon: '07', badge: 'Pro' },
      { id: 'domination', title: '1-Click Mode', icon: '08', badge: 'Elite' }
    ]
  },
  {
    label: 'Account',
    items: [
      { id: 'profile', title: 'Profile', icon: '09' },
      { id: 'billing', title: 'Billing', icon: '10' },
      { id: 'settings', title: 'Settings', icon: '11' }
    ]
  }
]

const dashboardStats = [
  { label: 'Applications Sent', value: '16', detail: '+5 today' },
  { label: 'Emails Delivered', value: '41', detail: '94% open trend' },
  { label: 'Interview Invites', value: '4', detail: 'Strongest signal right now', highlight: true },
  { label: 'Gigs Applied', value: '7', detail: '2 closing soon' }
]

const liveTicker = [
  '84 jobs matched today',
  '26 outreach emails queued',
  '7 micro-gig matches',
  '3 recruiter opens in the last hour'
]

const velocityMetrics = [
  { label: 'Jobs matched today', value: '84', note: 'Fit-scored by role, stack, and hiring heat' },
  { label: 'Outreach queued', value: '26', note: 'Clean send windows ready for execution' },
  { label: 'Micro-gig matches', value: '7', note: 'Proof-of-work lanes with hiring upside' },
  { label: 'Follow-ups due', value: '12', note: 'Signals already warm enough to revisit' }
]

const quickActions = [
  {
    label: '🚀 Career Hub',
    desc: 'Daily challenges, quizzes, skill progress, code arena and more.',
    route: '/career',
    badge: 'New'
  },
  {
    label: 'Launch Outreach',
    desc: 'Find hiring contacts and queue a sharper outbound sequence.',
    target: 'outreach',
    badge: 'Pro'
  },
  {
    label: 'Browse Gigs',
    desc: 'Turn short proof-of-work into interview leverage.',
    target: 'gigs',
    badge: 'Pro'
  },
  {
    label: 'Open Resume Builder',
    desc: 'Tighten your story before the next application wave.',
    target: 'resume'
  },
  {
    label: 'Autonomous Apply Studio',
    desc: 'Upload resume, view ATS score, and 1-click apply with AI agent.',
    route: '/resume-predictor',
    badge: 'Elite'
  }
]

const activityFeed = [
  { title: 'Queued outreach for Razorpay hiring manager', meta: '10 min ago', badge: 'Outreach' },
  { title: 'Resume score improved after product rewrite', meta: '32 min ago', badge: 'Resume' },
  { title: 'Matched to Zepto landing-page micro-gig', meta: '58 min ago', badge: 'Gig' },
  { title: 'Follow-up scheduled for Frontend Engineer at Cred', meta: '2 hr ago', badge: 'Tracker' }
]

const jobMatches = [
  { company: 'Razorpay', role: 'Frontend Engineer', fit: '94%', signal: 'Active hiring and strong stack overlap' },
  { company: 'Zepto', role: 'Product Design Intern', fit: '91%', signal: 'Micro-gig opened by the same team' },
  { company: 'Meesho', role: 'Software Development Intern', fit: '88%', signal: 'Recruiter recently active' },
  { company: 'Cred', role: 'Growth Designer', fit: '84%', signal: 'High domain fit and follow-up still open' }
]

const trackerColumns = [
  { title: 'Applied', cards: ['Frontend Engineer @ Razorpay', 'SDE Intern @ Meesho'] },
  { title: 'Outreach', cards: ['Recruiter contact @ Cred', 'Founder intro @ Zepto', 'Ashis Lead @ Google'] },
  { title: 'Interview', cards: ['Product round @ Slice', 'Screening @ Groww'] },
  { title: 'Offer', cards: ['PPO follow-up @ previous gig'] }
]

const outreachSteps = [
  'Search target company and hiring signal',
  'Select HR, recruiter, or founder contacts',
  'Generate personalized cold email',
  'Queue send, tracking, and follow-up'
]

const outreachCampaigns = [
  { company: 'Razorpay', contacts: 4, status: 'Sent', opens: 3, replies: 1 },
  { company: 'Zepto', contacts: 3, status: 'Queued', opens: 0, replies: 0 },
  { company: 'Meesho', contacts: 5, status: 'Partial', opens: 2, replies: 0 }
]

const pipelineStages = [
  { title: 'Queued', value: '8', note: 'Fresh recruiter and founder targets identified.' },
  { title: 'Sending', value: '3', note: 'High-intent sequences moving through your safe window.' },
  { title: 'Delivered', value: '19', note: 'Messages landed cleanly with low bounce risk.' },
  { title: 'Opened', value: '7', note: 'Warm signals ready for fast follow-up.' },
  { title: 'Replied', value: '2', note: 'Conversations moving toward resume review.' }
]

const microGigs = [
  {
    company: 'Zepto',
    title: 'Build a high-converting landing page',
    pay: 'Rs 15,000',
    duration: '10 days',
    match: '96%',
    note: 'Pre-hiring signal and live frontend work'
  },
  {
    company: 'Sprinto',
    title: 'Redesign onboarding dashboard',
    pay: 'Rs 18,000',
    duration: '14 days',
    match: '92%',
    note: 'Dashboard craft with strong portfolio upside'
  },
  {
    company: 'Laminar',
    title: 'Create recruiter outreach assets',
    pay: 'Rs 12,000',
    duration: '7 days',
    match: '89%',
    note: 'Fast delivery lane with visible growth impact'
  }
]

const billingPlans = [
  { name: 'Free', price: 'Rs 0', note: '5 matches/day, baseline tracker access' },
  { name: 'Pro', price: 'Rs 999', note: 'Outreach + micro-gigs + unlimited analysis' },
  { name: 'Elite', price: 'Rs 2,499', note: 'Full automation, higher limits, onboarding call' }
]

const settingsRows = [
  { label: 'Daily summary email', value: 'Enabled' },
  { label: 'Open tracking', value: 'Enabled for Pro plans' },
  { label: 'Default outreach tone', value: 'Professional' },
  { label: 'Preferred role lane', value: 'Frontend + Product' }
]

const sectionMeta = {
  dashboard: {
    title: 'Command Center',
    subtitle: 'A cleaner control room for matching, outreach, gigs, and follow-up velocity.'
  },
  matches: { title: 'Job Matches', subtitle: 'Prioritized roles ranked by actual fit and hiring signal.' },
  resume: { title: 'Resume Studio', subtitle: 'Positioning, rewrite prompts, and readiness improvements.' },
  tracker: { title: 'Application Tracker', subtitle: 'Every stage, every follow-up, and no silent pipeline.' },
  outreach: { title: 'Outreach Automation', subtitle: 'Company search, contact discovery, personalization, and send review.' },
  linkedin: { title: 'LinkedIn Automation', subtitle: 'Personalized connection requests and follow-ups, sent at a human pace.' },
  gigs: { title: 'Micro-Internship Arena', subtitle: 'Proof-of-work opportunities that can become offers.' },
  domination: {
    title: '1-Click Domination',
    subtitle: 'Secure Elite execution rail for resume parsing, role alignment, and webhook handoff.'
  },
  profile: { title: 'Profile', subtitle: 'Candidate summary, focus lane, and execution preferences.' },
  billing: { title: 'Billing', subtitle: 'Plan, usage, and upgrade pathways.' },
  settings: { title: 'Settings', subtitle: 'Workspace defaults for your search cadence.' }
}

const pageMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.24, ease: 'easeOut' }
}

const getPlanName = (user) => {
  const rawPlan = user?.plan || user?.subscription?.plan || 'free'
  return String(rawPlan).toLowerCase()
}

const getFirstName = (user) => {
  const fullName = user?.fullName || user?.name || 'Operator'
  return String(fullName).trim().split(/\s+/)[0]
}

const planClassName = (plan) => {
  if (plan === 'elite') {
    return styles.planBadgeElite
  }

  if (plan === 'pro') {
    return styles.planBadgePro
  }

  return styles.planBadgeFree
}

const WorkspaceSection = () => {
  const navigate = useNavigate()
  const { isAuthenticated, isReady, logout, user } = useAuth()
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('section') || new URLSearchParams(window.location.search).get('tab')
      if (p) return p
    }
    return 'dashboard'
  })
  const [collapsed, setCollapsed] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false)
      }
    }
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileMenuOpen])

  // Live App Tracker and Analytics State
  const [trackerStats, setTrackerStats] = useState({
    totalApplications: 0,
    totalSent: 0,
    totalQueued: 0,
    totalOpened: 0,
    openRate: 0,
    totalReplied: 0,
    replyRate: 0,
    totalBounced: 0,
    bounceRate: 0,
    interviewInvites: 0
  })
  const [dateWiseStats, setDateWiseStats] = useState([])
  const [activityTimeline, setActivityTimeline] = useState([])
  const [campaignsList, setCampaignsList] = useState([])
  const [loadingStats, setLoadingStats] = useState(false)
  const [liveMongoApplications, setLiveMongoApplications] = useState([])
  const [trackerFilterQuery, setTrackerFilterQuery] = useState('')

  const loadLiveStats = async () => {
    setLoadingStats(true)
    try {
      const [resResult, appResult] = await Promise.allSettled([
        outreachApi.getStats(),
        getTrackedApplications()
      ])

      if (resResult.status === 'fulfilled') {
        const data = resResult.value?.data || resResult.value || {}
        if (data.aggregate) setTrackerStats(data.aggregate)
        if (data.dateWiseStats) setDateWiseStats(data.dateWiseStats)
        if (data.activityTimeline) setActivityTimeline(data.activityTimeline)
        if (data.campaigns) setCampaignsList(data.campaigns)
      }

      if (appResult.status === 'fulfilled') {
        const appPayload = appResult.value?.data || appResult.value || []
        if (Array.isArray(appPayload)) {
          setLiveMongoApplications(appPayload)
          const subCount = typeof appResult.value?.submittedCount === 'number'
            ? appResult.value.submittedCount
            : appPayload.filter(a => a.status === 'applied' || a.status === 'submitted').length
          if (subCount > 0) {
            setTrackerStats(prev => ({
              ...prev,
              totalApplications: Math.max(prev.totalApplications || 0, subCount)
            }))
          }
        }
      }
    } catch (e) {
      console.warn('Stats fetch error:', e.message)
    } finally {
      setLoadingStats(false)
    }
  }

  useEffect(() => {
    loadLiveStats()
    // Real-time automatic polling every 5s
    const interval = setInterval(loadLiveStats, 5000)

    const handleRefreshEvent = () => {
      loadLiveStats()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadLiveStats()
      }
    }

    window.addEventListener('focus', handleRefreshEvent)
    window.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('rexion:application-updated', handleRefreshEvent)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleRefreshEvent)
      window.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('rexion:application-updated', handleRefreshEvent)
    }
  }, [])

  // Immediate refresh whenever user clicks into App Tracker or Command Center
  useEffect(() => {
    if (activeSection === 'tracker' || activeSection === 'dashboard') {
      loadLiveStats()
    }
  }, [activeSection])

  const firstName = getFirstName(user)
  const [activePlan, setActivePlan] = useState(() => {
    return localStorage.getItem('rexion_user_plan') || getPlanName(user)
  })

  useEffect(() => {
    if (user) {
      const p = getPlanName(user)
      if (p && !localStorage.getItem('rexion_user_plan')) {
        setActivePlan(p)
      }
    }
  }, [user])

  const plan = (activePlan || getPlanName(user) || 'free').toLowerCase()

  const handlePlanChange = (newPlan) => {
    setActivePlan(newPlan)
    localStorage.setItem('rexion_user_plan', newPlan)
  }
  const meta = sectionMeta[activeSection] || sectionMeta.dashboard
  const canAccessPrivateRoutes = isReady && isAuthenticated

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      setShowLoginModal(true)
    }

    if (isAuthenticated) {
      setShowLoginModal(false)
    }
  }, [isAuthenticated, isReady])

  const handleQuickAction = (action) => {
    if (action.route) {
      if (!canAccessPrivateRoutes) {
        setShowLoginModal(true)
        return
      }

      navigate(action.route)
      return
    }

    setActiveSection(action.target)
  }

  const handleSignOut = () => {
    logout()
    navigate('/')
  }

  const renderUpgradeGate = (requiredPlan, copy) => (
    <div className={styles.upgradeGate}>
      <span className={styles.gateBadge}>{requiredPlan.toUpperCase()} feature</span>
      <h3>Upgrade to unlock this workflow.</h3>
      <p>{copy}</p>
      <button type="button" className={styles.upgradeButton} onClick={() => setActiveSection('billing')}>
        Review Plans
      </button>
    </div>
  )

  const liveDashboardStats = [
    { 
      label: 'Applications Sent', 
      value: String(trackerStats.totalApplications), 
      detail: trackerStats.totalApplications > 0 ? `+${trackerStats.totalApplications} tracked in DB` : '0 tracked submissions' 
    },
    { 
      label: 'Emails Delivered', 
      value: String(trackerStats.totalSent), 
      detail: trackerStats.openRate > 0 ? `${trackerStats.openRate}% open trend` : 'Real-time telemetry' 
    },
    { 
      label: 'Interview Invites', 
      value: String(trackerStats.interviewInvites), 
      detail: trackerStats.interviewInvites > 0 ? 'Active recruiting signals' : 'Awaiting recruiter reply', 
      highlight: true 
    },
    { 
      label: 'Gigs / Follow-ups', 
      value: String(trackerStats.totalReplied || 7), 
      detail: trackerStats.totalReplied > 0 ? `${trackerStats.totalReplied} replies in pipeline` : '2 active closing soon' 
    }
  ]

  const liveVelocityMetrics = [
    { label: 'Jobs matched today', value: String(trackerStats.totalApplications > 0 ? (trackerStats.totalApplications * 3 + 24) : 84), note: 'Fit-scored by role, stack, and hiring heat' },
    { label: 'Outreach queued', value: String(trackerStats.totalQueued || (trackerStats.totalSent > 0 ? trackerStats.totalSent : 26)), note: 'Clean send windows ready for execution' },
    { label: 'Micro-gig matches', value: String(trackerStats.interviewInvites > 0 ? (trackerStats.interviewInvites + 5) : 7), note: 'Proof-of-work lanes with hiring upside' },
    { label: 'Follow-ups due', value: String(trackerStats.totalReplied > 0 ? trackerStats.totalReplied : 4), note: 'Signals already warm enough to revisit' }
  ]

  const livePipelineStages = [
    { title: 'Queued', value: String(trackerStats.totalQueued || 0), note: 'Fresh recruiter and founder targets identified.' },
    { title: 'Sending', value: String(trackerStats.totalQueued > 0 ? 1 : 0), note: 'High-intent sequences moving through safe window.' },
    { title: 'Delivered', value: String(trackerStats.totalSent || 0), note: 'Messages landed cleanly with low bounce risk.' },
    { title: 'Opened', value: String(trackerStats.totalOpened || 0), note: 'Warm read signals ready for follow-up.' },
    { title: 'Replied', value: String(trackerStats.totalReplied || 0), note: 'Conversations moving toward interview rounds.' }
  ]

  const displayActivities = activityTimeline && activityTimeline.length > 0 
    ? activityTimeline.slice(0, 4).map(a => ({
        title: a.title,
        meta: a.date ? new Date(a.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' today' : 'Just now',
        badge: a.type === 'job_applied' ? 'Applied' : (a.type === 'linkedin_invite' ? 'LinkedIn' : 'Outreach')
      }))
    : activityFeed

  const renderDashboard = () => (
    <motion.div className={styles.stack} {...pageMotion}>
      {/* 1. DASHBOARD HEADER ROW WITH KITTY NOTE & ACTION BUTTONS */}
      <section className={styles.dashboardHeaderRow}>
        <div className={styles.dashboardHeaderLeft}>
          <span className={styles.dashboardBreadcrumb}>DASHBOARD / COMMAND CENTER</span>
          <h1 className={styles.dashboardTitle}>Command Center</h1>
          <p className={styles.dashboardSubtitle}>
            A cleaner control room for matching, outreach, gigs, and follow-up velocity.
          </p>
        </div>

        <div className={styles.dashboardHeaderRight}>
          <div className={styles.kittyIllustrationWrap}>
            <span className={styles.kittyScript}>Better Career<br />Ahead ♡</span>
            <KittyArtSvg />
            <div className={styles.kittySpeechPill}>
              <span>Small steps ☀️ every day lead to big dreams.</span>
            </div>
          </div>

          <div className={styles.dashboardHeaderButtons}>
            <button
              type="button"
              className={styles.topbarButtonSecondary}
              onClick={() => navigate('/')}
            >
              Landing
            </button>
            <button
              type="button"
              className={styles.topbarButtonPrimary}
              onClick={() => (isAuthenticated ? setActiveSection('profile') : setShowLoginModal(true))}
            >
              {isAuthenticated ? firstName : 'Log In'}
            </button>
          </div>
        </div>
      </section>

      {/* 2. COMPOSITE HERO (PROGRESS HERO CARD + COMPANION LIVE STATS) */}
      <section className={styles.heroCompositeGrid}>
        <div className={styles.progressHeroCard}>
          <div className={styles.progressHeroContent}>
            <span className={styles.progressBadge}>YOUR PROGRESS</span>
            <h2 className={styles.progressHeroHeadline}>
              Good morning, {firstName}.<br />Your career OS is running.
            </h2>
            <p className={styles.progressHeroCopy}>
              Track your applications, check new opportunities, and keep building the skills you need for what's next.
            </p>
            <div className={styles.progressHeroSocial}>
              <div className={styles.socialAvatars}>
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                  alt="Student"
                  className={styles.socialAvatarImg}
                />
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80"
                  alt="Student"
                  className={styles.socialAvatarImg}
                />
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80"
                  alt="Student"
                  className={styles.socialAvatarImg}
                />
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80"
                  alt="Student"
                  className={styles.socialAvatarImg}
                />
              </div>
              <div className={styles.socialTextWrap}>
                <strong>Join 10,000+ students</strong>
                <span>Building better careers with REXION</span>
              </div>
            </div>
          </div>
          <div
            className={styles.progressHeroBackdrop}
            style={{ backgroundImage: `url(${heroPanoramicBg})` }}
          />
        </div>

        <div className={styles.liveStatsCard}>
          <div className={styles.liveStatsHeader}>
            <h3>Live Stats</h3>
            <span className={styles.liveIndicatorPill}>
              <span className={styles.liveDotPulsing} />
              Live
            </span>
          </div>

          <div className={styles.liveStatsRows}>
            <button
              type="button"
              className={styles.liveStatRow}
              onClick={() => setActiveSection('tracker')}
            >
              <div className={styles.liveStatIconBox} style={{ background: '#FFEDE5', color: '#E97852' }}>
                <CheckSquare size={17} />
              </div>
              <div className={styles.liveStatContent}>
                <strong>Applications</strong>
                <span>{trackerStats.totalApplications > 0 ? `${trackerStats.totalApplications} applied` : '0 applied'}</span>
              </div>
              <ChevronRight size={15} className={styles.liveStatArrow} />
            </button>

            <button
              type="button"
              className={styles.liveStatRow}
              onClick={() => navigate('/interview-support')}
            >
              <div className={styles.liveStatIconBox} style={{ background: '#ECFDF5', color: '#10B981' }}>
                <MessageSquareCode size={17} />
              </div>
              <div className={styles.liveStatContent}>
                <strong>Interviews</strong>
                <span>{trackerStats.interviewInvites > 0 ? `${trackerStats.interviewInvites} scheduled` : '3 scheduled'}</span>
              </div>
              <ChevronRight size={15} className={styles.liveStatArrow} />
            </button>

            <button
              type="button"
              className={styles.liveStatRow}
              onClick={() => setActiveSection('tracker')}
            >
              <div className={styles.liveStatIconBox} style={{ background: '#F5F3FF', color: '#8B5CF6' }}>
                <Award size={17} />
              </div>
              <div className={styles.liveStatContent}>
                <strong>Offers</strong>
                <span>1 offer</span>
              </div>
              <ChevronRight size={15} className={styles.liveStatArrow} />
            </button>
          </div>
        </div>
      </section>

      {/* 3. LATEST UPDATES TICKER BAR */}
      <section className={styles.latestUpdatesBar}>
        <span className={styles.updatesBadge}>
          <Flame size={14} /> Latest Updates
        </span>
        <div className={styles.updatesTrack}>
          <div className={styles.updateItem}>
            <Mail size={14} color="#E97852" />
            <span>26 outreach emails queued</span>
          </div>
          <div className={styles.updateItem}>
            <Users size={14} color="#8B5CF6" />
            <span>7 micro-gig matches</span>
          </div>
          <div className={styles.updateItem}>
            <FileText size={14} color="#3B82F6" />
            <span>3 recruiter opens in the last hour</span>
          </div>
          <div className={styles.updateItem}>
            <Briefcase size={14} color="#F97316" />
            <span>84 jobs matched today</span>
          </div>
          <div className={styles.updateItem}>
            <Mail size={14} color="#E97852" />
            <span>26 outreach emails queued</span>
          </div>
        </div>
        <ChevronRight size={16} className={styles.updatesArrow} />
      </section>

      {/* 4. 5 WHITE METRIC CARDS (SINGLE ROW) */}
      <section className={styles.fiveMetricsGrid}>
        {/* Card 1: Applications Sent */}
        <article className={styles.metricCardWhite}>
          <div className={styles.metricCardTop}>
            <div className={styles.metricBadgeIcon} style={{ background: '#FFEDE5', color: '#E97852' }}>
              <Send size={18} />
            </div>
          </div>
          <p className={styles.metricCardLabel}>Applications Sent</p>
          <strong className={styles.metricCardValue}>
            {trackerStats.totalApplications}
          </strong>
          <span className={styles.metricDeltaGreen}>
            ↑ +{trackerStats.totalApplications} tracked in DB
          </span>
          <svg viewBox="0 0 100 28" className={styles.sparklineSvg} preserveAspectRatio="none">
            <path
              d="M0 24 Q 25 22, 50 16 T 85 10 T 100 4"
              fill="none"
              stroke="#E97852"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </article>

        {/* Card 2: Emails Delivered */}
        <article className={styles.metricCardWhite}>
          <div className={styles.metricCardTop}>
            <div className={styles.metricBadgeIcon} style={{ background: '#ECFDF5', color: '#10B981' }}>
              <Mail size={18} />
            </div>
          </div>
          <p className={styles.metricCardLabel}>Emails Delivered</p>
          <strong className={styles.metricCardValue}>
            {trackerStats.totalSent > 0 ? trackerStats.totalSent : '3'}
          </strong>
          <span className={styles.metricDeltaGreen}>
            ↑ 100% delivery rate
          </span>
          <svg viewBox="0 0 100 28" className={styles.sparklineSvg} preserveAspectRatio="none">
            <path
              d="M0 26 Q 30 24, 55 14 T 85 8 T 100 4"
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </article>

        {/* Card 3: Interview Invites */}
        <article className={styles.metricCardWhite}>
          <div className={styles.metricCardTop}>
            <div className={styles.metricBadgeIcon} style={{ background: '#F5F3FF', color: '#8B5CF6' }}>
              <Users size={18} />
            </div>
          </div>
          <p className={styles.metricCardLabel}>Interview Invites</p>
          <strong className={styles.metricCardValue}>
            {trackerStats.interviewInvites > 0 ? trackerStats.interviewInvites : '0'}
          </strong>
          <span className={styles.metricDeltaMuted}>
            Awaiting recruiter reply
          </span>
          <svg viewBox="0 0 100 28" className={styles.sparklineSvg} preserveAspectRatio="none">
            <path
              d="M0 26 Q 35 25, 60 22 T 85 16 T 100 12"
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </article>

        {/* Card 4: Gigs / Follow-ups */}
        <article className={styles.metricCardWhite}>
          <div className={styles.metricCardTop}>
            <div className={styles.metricBadgeIcon} style={{ background: '#FFF7ED', color: '#F97316' }}>
              <Users size={18} />
            </div>
          </div>
          <p className={styles.metricCardLabel}>Gigs / Follow-ups</p>
          <strong className={styles.metricCardValue}>
            {trackerStats.totalReplied > 0 ? trackerStats.totalReplied : '7'}
          </strong>
          <span className={styles.metricDeltaMuted}>
            2 active closing soon
          </span>
          <svg viewBox="0 0 100 28" className={styles.sparklineSvg} preserveAspectRatio="none">
            <path
              d="M0 24 Q 30 22, 55 15 T 80 12 T 100 6"
              fill="none"
              stroke="#F97316"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </article>

        {/* Card 5: Success Rate */}
        <article className={styles.metricCardWhite}>
          <div className={styles.metricCardTop}>
            <div className={styles.metricBadgeIcon} style={{ background: '#F0FDFA', color: '#14B8A6' }}>
              <Target size={18} />
            </div>
          </div>
          <p className={styles.metricCardLabel}>Success Rate</p>
          <strong className={styles.metricCardValue}>92%</strong>
          <span className={styles.metricDeltaGreen}>
            ↑ +12% this week
          </span>
          <svg viewBox="0 0 100 28" className={styles.sparklineSvg} preserveAspectRatio="none">
            <path
              d="M0 26 Q 30 22, 60 12 T 85 6 T 100 2"
              fill="none"
              stroke="#14B8A6"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </article>
      </section>

      {/* 5. QUICK ACCESS STRIP */}
      <section className={styles.quickAccessStrip}>
        <div className={styles.quickAccessLeft}>
          <div className={styles.quickAccessIconBox}>
            <Zap size={18} />
          </div>
          <div className={styles.quickAccessTitleWrap}>
            <strong>Quick Access</strong>
            <span>Jump into your most important tools</span>
          </div>
        </div>

        <div className={styles.quickAccessCardsRow}>
          <button
            type="button"
            className={styles.quickToolCard}
            onClick={() => navigate('/resume-analyser')}
          >
            <span className={styles.quickToolIconBox} style={{ background: '#FFEDE5', color: '#E97852' }}>
              <FileText size={14} />
            </span>
            <span>Resume Analysis</span>
            <ArrowRight size={13} className={styles.quickToolArrow} />
          </button>

          <button
            type="button"
            className={styles.quickToolCard}
            onClick={() => setActiveSection('matches')}
          >
            <span className={styles.quickToolIconBox} style={{ background: '#FFF7ED', color: '#F97316' }}>
              <Briefcase size={14} />
            </span>
            <span>Job Matches</span>
            <ArrowRight size={13} className={styles.quickToolArrow} />
          </button>

          <button
            type="button"
            className={styles.quickToolCard}
            onClick={() => navigate('/career')}
          >
            <span className={styles.quickToolIconBox} style={{ background: '#F5F3FF', color: '#8B5CF6' }}>
              <GraduationCap size={14} />
            </span>
            <span>Skill Development</span>
            <ArrowRight size={13} className={styles.quickToolArrow} />
          </button>

          <button
            type="button"
            className={styles.quickToolCard}
            onClick={() => navigate('/career')}
          >
            <span className={styles.quickToolIconBox} style={{ background: '#ECFDF5', color: '#10B981' }}>
              <Compass size={14} />
            </span>
            <span>Career Paths</span>
            <ArrowRight size={13} className={styles.quickToolArrow} />
          </button>
        </div>

        <div className={styles.keepGoingWrap}>
          <span className={styles.keepGoingScript}>Keep<br />going! ♡</span>
          <BotanicalSprig />
        </div>
      </section>

      {/* 6. INTERACTIVE SKILL SUITE (Retaining all habit & challenge modules) */}
      <SkillSuite />
    </motion.div>
  )

  const renderMatches = () => (
    <motion.div className={styles.stack} {...pageMotion}>
      <AutonomousApplyStudio />
    </motion.div>
  )

  const renderResume = () => (
    <motion.div className={styles.stack} {...pageMotion}>
      <ResumeStudioSection navigate={navigate} />
    </motion.div>
  )

  const renderTracker = () => (
    <motion.div className={styles.stack} {...pageMotion}>
      {/* 1. Real-time KPI summary (High-Energy Electric Green with subtle Cyan accents) */}
      <div className={styles.commandStatsGrid}>
        <article className={`${styles.statCard} ${styles.statCardGreen}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f8fafc', fontWeight: 700 }}>
              Jobs Applied
            </span>
            <span style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '999px', background: 'rgba(0, 255, 136, 0.14)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.4)', fontWeight: 700, boxShadow: '0 0 10px rgba(0, 255, 136, 0.2)' }}>
              Live DB
            </span>
          </div>
          <strong style={{ color: '#00ff88', fontSize: '2.6rem', margin: '0.4rem 0 0.2rem', fontWeight: 900, textShadow: '0 0 24px rgba(0, 255, 136, 0.5)' }}>
            {trackerStats.totalApplications}
          </strong>
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>
            {trackerStats.totalApplications === 0 ? 'No tracked submissions yet' : `${trackerStats.totalApplications} tracked job submissions`}
          </span>
          <div style={{ width: '100%', height: '4px', background: 'rgba(0, 255, 136, 0.12)', borderRadius: '2px', marginTop: '10px', overflow: 'hidden' }}>
            <div style={{ width: trackerStats.totalApplications > 0 ? `${Math.min(100, trackerStats.totalApplications * 10)}%` : '0%', height: '100%', background: 'linear-gradient(90deg, #00ff88 85%, #38bdf8 100%)', borderRadius: '2px', boxShadow: '0 0 10px rgba(0, 255, 136, 0.5)' }} />
          </div>
        </article>

        <article className={`${styles.statCard} ${styles.statCardGreen}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f8fafc', fontWeight: 700 }}>
              Direct Outreach Sent
            </span>
            <span style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '999px', background: 'rgba(0, 255, 136, 0.14)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.4)', fontWeight: 700, boxShadow: '0 0 10px rgba(0, 255, 136, 0.2)' }}>
              Paced
            </span>
          </div>
          <strong style={{ color: '#00ff88', fontSize: '2.6rem', margin: '0.4rem 0 0.2rem', fontWeight: 900, textShadow: '0 0 24px rgba(0, 255, 136, 0.5)' }}>
            {trackerStats.totalSent}
          </strong>
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>
            {trackerStats.totalSent === 0 ? 'No outreach sent yet' : `${trackerStats.totalSent} cold emails & LinkedIn invites sent`}
          </span>
          <div style={{ width: '100%', height: '4px', background: 'rgba(0, 255, 136, 0.12)', borderRadius: '2px', marginTop: '10px', overflow: 'hidden' }}>
            <div style={{ width: trackerStats.totalSent > 0 ? `${Math.min(100, trackerStats.totalSent * 12.5)}%` : '0%', height: '100%', background: 'linear-gradient(90deg, #00ff88 85%, #38bdf8 100%)', borderRadius: '2px', boxShadow: '0 0 10px rgba(0, 255, 136, 0.5)' }} />
          </div>
        </article>

        <article className={`${styles.statCard} ${styles.statCardGreen}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f8fafc', fontWeight: 700 }}>
              Open Rate
            </span>
            <span style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '999px', background: 'rgba(0, 255, 136, 0.14)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.4)', fontWeight: 700, boxShadow: '0 0 10px rgba(0, 255, 136, 0.2)' }}>
              Read Signal
            </span>
          </div>
          <strong style={{ color: '#00ff88', fontSize: '2.6rem', margin: '0.4rem 0 0.2rem', fontWeight: 900, textShadow: '0 0 24px rgba(0, 255, 136, 0.5)' }}>
            {trackerStats.openRate}%
          </strong>
          <span style={{ color: '#94a3b8', fontSize: '12px', display: 'block' }}>
            {trackerStats.totalOpened === 0 ? 'No read signals recorded' : `${trackerStats.totalOpened} recruiter opens verified`}
          </span>
          <div style={{ width: '100%', height: '4px', background: 'rgba(0, 255, 136, 0.12)', borderRadius: '2px', marginTop: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${trackerStats.openRate}%`, height: '100%', background: 'linear-gradient(90deg, #00ff88 85%, #38bdf8 100%)', borderRadius: '2px', boxShadow: '0 0 10px rgba(0, 255, 136, 0.5)' }} />
          </div>
        </article>

        <article className={`${styles.statCard} ${styles.statCardGreen}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f8fafc', fontWeight: 700 }}>
              Reply Rate
            </span>
            <span style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '999px', background: 'rgba(0, 255, 136, 0.14)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.4)', fontWeight: 700, boxShadow: '0 0 10px rgba(0, 255, 136, 0.2)' }}>
              Replies
            </span>
          </div>
          <strong style={{ color: '#00ff88', fontSize: '2.6rem', margin: '0.4rem 0 0.2rem', fontWeight: 900, textShadow: '0 0 24px rgba(0, 255, 136, 0.5)' }}>
            {trackerStats.replyRate}%
          </strong>
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>
            {trackerStats.totalReplied === 0 ? 'No conversations started' : `${trackerStats.totalReplied} replies received`}
          </span>
          <div style={{ width: '100%', height: '4px', background: 'rgba(0, 255, 136, 0.12)', borderRadius: '2px', marginTop: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${trackerStats.replyRate}%`, height: '100%', background: 'linear-gradient(90deg, #00ff88 85%, #38bdf8 100%)', borderRadius: '2px', boxShadow: '0 0 10px rgba(0, 255, 136, 0.5)' }} />
          </div>
        </article>

        <article className={`${styles.statCard} ${styles.statCardGreen}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f8fafc', fontWeight: 700 }}>
              Interview Invites
            </span>
            <span style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '999px', background: 'rgba(0, 255, 136, 0.14)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.4)', fontWeight: 700, boxShadow: '0 0 10px rgba(0, 255, 136, 0.2)' }}>
              Pipeline
            </span>
          </div>
          <strong style={{ color: '#00ff88', fontSize: '2.6rem', margin: '0.4rem 0 0.2rem', fontWeight: 900, textShadow: '0 0 24px rgba(0, 255, 136, 0.5)' }}>
            {trackerStats.interviewInvites}
          </strong>
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>
            {trackerStats.interviewInvites === 0 ? 'No interview invites yet' : `${trackerStats.interviewInvites} interview & screening signals`}
          </span>
          <div style={{ width: '100%', height: '4px', background: 'rgba(0, 255, 136, 0.12)', borderRadius: '2px', marginTop: '10px', overflow: 'hidden' }}>
            <div style={{ width: trackerStats.interviewInvites > 0 ? `${Math.min(100, trackerStats.interviewInvites * 25)}%` : '0%', height: '100%', background: 'linear-gradient(90deg, #00ff88 85%, #38bdf8 100%)', borderRadius: '2px', boxShadow: '0 0 10px rgba(0, 255, 136, 0.5)' }} />
          </div>
        </article>
      </div>

      {/* 2. LIVE APPLICATION LEDGER (CONNECTED TO MONGODB ATLAS) */}
      <section className={styles.panel} style={{ background: '#0a0a0c', border: '1px solid rgba(0, 255, 136, 0.25)', borderRadius: '16px', overflow: 'hidden' }}>
        <div className={styles.panelHeader} style={{ flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 10px #00ff88' }} />
              <span className={styles.panelEyebrow} style={{ color: '#00ff88', fontWeight: 700, margin: 0 }}>
                Live Database Stream &bull; MongoDB Atlas
              </span>
            </div>
            <h3 style={{ fontSize: '1.35rem', color: '#fff', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Successfully Applied Applications
              <span style={{ fontSize: '12px', background: 'rgba(0, 255, 136, 0.15)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.35)', padding: '2px 10px', borderRadius: '999px', fontWeight: 700 }}>
                {liveMongoApplications.length} Recorded
              </span>
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative', minWidth: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search by company or role..."
                value={trackerFilterQuery}
                onChange={(e) => setTrackerFilterQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 30px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12.5px',
                  outline: 'none'
                }}
              />
            </div>
            <button
              type="button"
              className={styles.inlineButtonSecondary}
              onClick={loadLiveStats}
              style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', background: 'rgba(0, 255, 136, 0.1)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.3)', cursor: 'pointer' }}
            >
              {loadingStats ? 'Syncing...' : '↻ Live Sync'}
            </button>
          </div>
        </div>

        {liveMongoApplications.length === 0 ? (
          <div style={{ padding: '36px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
            <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>📂</span>
            No applications found in database yet.
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Launch 1-Click apply on matched roles to stream verified submissions here in real time.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 600 }}>Company & Role</th>
                  <th style={{ padding: '12px 14px', color: '#94a3b8', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 14px', color: '#94a3b8', fontWeight: 600 }}>Submitted At</th>
                  <th style={{ padding: '12px 14px', color: '#94a3b8', fontWeight: 600 }}>Audit Tracking ID</th>
                  <th style={{ padding: '12px 14px', color: '#94a3b8', fontWeight: 600 }}>Channel</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {liveMongoApplications
                  .filter((app) => {
                    if (!trackerFilterQuery.trim()) return true
                    const q = trackerFilterQuery.toLowerCase()
                    return String(app.company || '').toLowerCase().includes(q) ||
                           String(app.role || '').toLowerCase().includes(q)
                  })
                  .map((app) => (
                    <tr
                      key={app.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: '#fff',
                            fontSize: '13px'
                          }}>
                            {String(app.company || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ color: '#ffffff', display: 'block', fontSize: '13.5px' }}>{app.company}</strong>
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>{app.role}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 10px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: app.status === 'applied' || app.status === 'submitted' ? 'rgba(0, 255, 136, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: app.status === 'applied' || app.status === 'submitted' ? '#00ff88' : '#f59e0b',
                          border: app.status === 'applied' || app.status === 'submitted' ? '1px solid rgba(0, 255, 136, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)'
                        }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: app.status === 'applied' || app.status === 'submitted' ? '#00ff88' : '#f59e0b' }} />
                          {app.statusLabel || (app.status === 'applied' ? 'Applied' : app.status)}
                        </span>
                      </td>
                      <td style={{ padding: '14px', color: '#cbd5e1', fontSize: '12px' }}>
                        {app.appliedAt ? new Date(app.appliedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '11.5px',
                          color: '#38bdf8',
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          {app.trackingId || `APP-${String(app.id).slice(-6).toUpperCase()}`}
                        </span>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span style={{ fontSize: '11.5px', color: '#94a3b8', textTransform: 'capitalize' }}>
                          {app.platform || '1-Click Direct'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {app.url ? (
                          <a
                            href={app.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11.5px',
                              color: '#ffffff',
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              textDecoration: 'none'
                            }}
                          >
                            <span>View Job</span>
                            <span style={{ fontSize: '10px' }}>↗</span>
                          </a>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: '#64748b' }}>Verified</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 3. Date-wise Analytics Table (Black and White) */}
      <section className={styles.panel} style={{ background: '#000000', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.panelEyebrow} style={{ color: '#94a3b8' }}>Daily Execution Matrix</span>
            <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: '4px 0 0' }}>Date-wise Activity & Conversion</h3>
          </div>
          <button
            type="button"
            className={styles.inlineButtonSecondary}
            onClick={loadLiveStats}
            style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' }}
          >
            {loadingStats ? 'Refreshing...' : '↻ Refresh Log'}
          </button>
        </div>

        {dateWiseStats.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
            <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>📊</span>
            No outreach or application events logged yet today.
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Launch a LinkedIn sequence or send cold emails to stream daily conversion data here automatically.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                  <th style={{ padding: '12px 14px', color: '#94a3b8', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', color: '#ffffff', fontWeight: 600 }}>Jobs Applied</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', color: '#ffffff', fontWeight: 600 }}>Outreach Sent</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', color: '#ffffff', fontWeight: 600 }}>Opens</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', color: '#ffffff', fontWeight: 600 }}>Replies</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>Pipeline State</th>
                </tr>
              </thead>
              <tbody>
                {dateWiseStats.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '14px', fontWeight: 700, color: '#f8fafc' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: (d.emailsSent > 0 || d.jobsApplied > 0) ? '#ffffff' : '#64748b' }} />
                        {d.date}
                      </span>
                    </td>
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', fontWeight: 700, border: '1px solid rgba(255, 255, 255, 0.16)' }}>
                        {d.jobsApplied}
                      </span>
                    </td>
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', fontWeight: 700, border: '1px solid rgba(255, 255, 255, 0.16)' }}>
                        {d.emailsSent}
                      </span>
                    </td>
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', fontWeight: 700, border: '1px solid rgba(255, 255, 255, 0.16)' }}>
                        {d.emailsOpened}
                      </span>
                    </td>
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', fontWeight: 700, border: '1px solid rgba(255, 255, 255, 0.16)' }}>
                        {d.replies}
                      </span>
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: (d.emailsSent > 0 || d.jobsApplied > 0) ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                        color: (d.emailsSent > 0 || d.jobsApplied > 0) ? '#ffffff' : '#94a3b8',
                        border: (d.emailsSent > 0 || d.jobsApplied > 0) ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: (d.emailsSent > 0 || d.jobsApplied > 0) ? '#ffffff' : '#64748b' }} />
                        {(d.emailsSent > 0 || d.jobsApplied > 0) ? 'Active' : 'Standby'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 3. Live Date-Wise Activity Feed (Black and White) */}
      <section className={styles.panel} style={{ background: '#000000', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.panelEyebrow} style={{ color: '#94a3b8' }}>Live Real-Time Telemetry</span>
            <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: '4px 0 0' }}>Recent Outreach & Pipeline Events</h3>
          </div>
        </div>

        {activityTimeline.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
            <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>⚡</span>
            No recent activity recorded.
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Your sent emails, safe LinkedIn invitations, and job applications will stream here live.
            </p>
          </div>
        ) : (
          <div className={styles.activityList}>
            {activityTimeline.map((item) => (
              <article key={item.id} className={styles.activityCard} style={{ borderLeft: '3px solid #ffffff', background: '#000000', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div className={styles.activityCardTop}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffffff', boxShadow: '0 0 10px rgba(255, 255, 255, 0.6)' }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                      {item.status ? item.status.toUpperCase() : 'EVENT'}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {item.date ? `${new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Just now'}
                  </span>
                </div>
                <strong style={{ fontSize: '14px', color: '#fff' }}>{item.title}</strong>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  {item.company} {item.role ? `· ${item.role}` : ''}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  )

  const renderOutreach = () => (
    <motion.div className={styles.stack} {...pageMotion}>
      <OutreachFlow />
    </motion.div>
  )

  const renderLinkedIn = () => (
    <motion.div className={styles.stack} {...pageMotion}>
      {plan === 'free' ? (
        renderUpgradeGate('pro', 'LinkedIn Automation uses human-paced connection sequences to reach decision-makers with zero account risk.')
      ) : (
        <LinkedInAutomation />
      )}
    </motion.div>
  )

  const renderGigs = () => (
    <motion.div className={styles.stack} {...pageMotion}>
      <MicroInternshipsSection
        onSelectOutreach={(internship) => {
          setActiveSection('outreach')
        }}
      />
    </motion.div>
  )

  const renderDomination = () => (
    <motion.div className={styles.stack} {...pageMotion}>
      <DominationSection
        isAuthenticated={canAccessPrivateRoutes}
        plan={plan}
        user={user}
        onRequireLogin={() => setShowLoginModal(true)}
        onReviewPlans={() => setActiveSection('billing')}
      />
    </motion.div>
  )

  const renderProfile = () => (
    <motion.div className={styles.stack} {...pageMotion}>
      <ProfileSection />
    </motion.div>
  )

  const renderBilling = () => (
    <motion.div className={styles.stack} {...pageMotion}>
      <BillingSection
        plan={plan}
        onPlanChange={handlePlanChange}
        user={user}
      />
    </motion.div>
  )

  const renderSettings = () => (
    <motion.div className={styles.stack} {...pageMotion}>
      <section className={styles.panel}>
        <span className={styles.panelEyebrow}>Workspace defaults</span>
        <div className={styles.settingsList}>
          {settingsRows.map((item) => (
            <article key={item.label} className={styles.settingRow}>
              <strong>{item.label}</strong>
              <span>{item.value}</span>
            </article>
          ))}
        </div>
      </section>
    </motion.div>
  )

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'matches':
        return renderMatches()
      case 'resume':
        return renderResume()
      case 'tracker':
        return renderTracker()
      case 'outreach':
        return renderOutreach()
      case 'linkedin':
        return renderLinkedIn()
      case 'gigs':
        return renderGigs()
      case 'domination':
        return renderDomination()
      case 'profile':
        return renderProfile()
      case 'billing':
        return renderBilling()
      case 'settings':
        return renderSettings()
      case 'dashboard':
      default:
        return renderDashboard()
    }
  }

  return (
    <div className={`${styles.workspaceShell} ${collapsed ? styles.workspaceShellCollapsed : ''}`}>
      <motion.aside layout className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.brandRow}>
            <div className={styles.brandMark}>Rx</div>
            {!collapsed && (
              <div className={styles.brandTextWrap}>
                <strong>REXION</strong>
                <span>Career OS</span>
              </div>
            )}
          </div>
          <button type="button" className={styles.collapseButton} onClick={() => setCollapsed((prev) => !prev)}>
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>

        <div className={styles.navGroups}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className={styles.navGroup}>
              {!collapsed && <p className={styles.navGroupLabel}>{group.label}</p>}
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.navItem} ${activeSection === item.id ? styles.navItemActive : ''}`}
                  onClick={() => {
                    if (item.route) {
                      navigate(item.route)
                    } else {
                      setActiveSection(item.id)
                    }
                  }}
                  title={collapsed ? item.title : undefined}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {!collapsed && <span className={styles.navTitle}>{item.title}</span>}
                  {!collapsed && item.badge && (
                    <span className={`${styles.navBadge} ${item.badge === 'Elite' ? styles.navBadgeElite : (item.badge === 'New' ? styles.navBadgePro : (item.badge === 'Free' ? styles.navBadgeFree : styles.navBadgePro))}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className={styles.sidebarBottom}>
          {!collapsed ? (
            <div className={styles.premiumCard}>
              <div className={styles.premiumCardTop}>
                <span>👑</span>
                <strong>Go Premium</strong>
              </div>
              <p className={styles.premiumCardText}>
                Unlock advanced features, more jobs and personalized guidance.
              </p>
              <button
                type="button"
                className={styles.premiumCardBtn}
                onClick={() => setActiveSection('billing')}
              >
                <span>Upgrade Now</span>
                <ArrowRight size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.collapseButton}
              onClick={() => setActiveSection('billing')}
              title="Go Premium"
            >
              👑
            </button>
          )}
          <SidebarBotanical />
        </div>
      </motion.aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          {/* Topbar Search Bar */}
          <div className={styles.topSearchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search jobs, skills, courses..."
              className={styles.topSearchInput}
            />
            <kbd className={styles.searchKbd}>⌘ K</kbd>
          </div>

          {/* Topbar Right Controls: Bell, Moon, User Dropdown */}
          <div className={styles.topRightControls}>
            <button
              type="button"
              className={styles.topIconButton}
              title="Notifications"
            >
              <Bell size={16} />
              <span className={styles.notificationBadge} />
            </button>

            <button
              type="button"
              className={styles.topIconButton}
              title="Toggle theme"
            >
              <Moon size={16} />
            </button>

            {canAccessPrivateRoutes ? (
              <div className={styles.profileDropdownWrap} ref={profileMenuRef}>
                <button
                  type="button"
                  className={styles.userPillTrigger}
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  title="Profile & Settings"
                  aria-label="Profile and Settings Menu"
                >
                  {user?.avatar || user?.avatarUrl ? (
                    <img
                      src={user.avatar || user.avatarUrl}
                      alt={firstName}
                      className={styles.userPillAvatar}
                    />
                  ) : (
                    <div className={styles.userPillAvatar}>
                      {firstName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <span className={styles.userPillName}>Hi, {firstName}</span>
                  <ChevronDown size={14} color="#8C847A" />
                </button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      className={styles.profilePopover}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.16, ease: 'easeOut' }}
                    >
                      <div className={styles.popoverHeader}>
                        <div className={styles.popoverAvatarWrap}>
                          {user?.avatar || user?.avatarUrl ? (
                            <img
                              src={user.avatar || user.avatarUrl}
                              alt={firstName}
                              className={styles.popoverAvatarImg}
                            />
                          ) : (
                            <div className={styles.popoverAvatarInitials}>
                              {firstName.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className={styles.popoverMeta}>
                          <strong>{user?.fullName || user?.name || 'Operator'}</strong>
                          <span className={styles.popoverEmail}>{user?.email || 'operator@rexion.ai'}</span>
                          <span className={`${styles.planBadge} ${planClassName(plan)}`}>
                            {plan.toUpperCase()} PLAN
                          </span>
                        </div>
                      </div>

                      <div className={styles.popoverMenu}>
                        <button
                          type="button"
                          className={styles.popoverMenuItem}
                          onClick={() => {
                            setActiveSection('resume')
                            setProfileMenuOpen(false)
                          }}
                        >
                          <span className={styles.menuIcon}>📄</span>
                          <div className={styles.menuText}>
                            <strong>Resume Builder</strong>
                            <small>Build & tailor resume</small>
                          </div>
                        </button>

                        <button
                          type="button"
                          className={styles.popoverMenuItem}
                          onClick={() => {
                            navigate('/resume-predictor')
                            setProfileMenuOpen(false)
                          }}
                        >
                          <span className={styles.menuIcon}>📊</span>
                          <div className={styles.menuText}>
                            <strong>Resume Analyser</strong>
                            <small>ATS scoring & keyword predictor</small>
                          </div>
                        </button>

                        <button
                          type="button"
                          className={styles.popoverMenuItem}
                          onClick={() => {
                            setActiveSection('profile')
                            setProfileMenuOpen(false)
                          }}
                        >
                          <span className={styles.menuIcon}>👤</span>
                          <div className={styles.menuText}>
                            <strong>Profile Details</strong>
                            <small>Candidate bio, skills & experience</small>
                          </div>
                        </button>

                        {/* Upgrade plan if not already subscribed or on free */}
                        {plan === 'free' && (
                          <button
                            type="button"
                            className={styles.popoverMenuItem}
                            style={{ background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                            onClick={() => {
                              setActiveSection('billing')
                              setProfileMenuOpen(false)
                            }}
                          >
                            <span className={styles.menuIcon}>⚡</span>
                            <div className={styles.menuText}>
                              <strong style={{ color: '#60a5fa' }}>Upgrade Plan</strong>
                              <small>Unlock full Pro & Elite tools</small>
                            </div>
                          </button>
                        )}

                        <button
                          type="button"
                          className={styles.popoverMenuItem}
                          onClick={() => {
                            setActiveSection('settings')
                            setProfileMenuOpen(false)
                          }}
                        >
                          <span className={styles.menuIcon}>⚙️</span>
                          <div className={styles.menuText}>
                            <strong>Workspace Settings</strong>
                            <small>Preferences & outbound tone</small>
                          </div>
                        </button>

                        <button
                          type="button"
                          className={styles.popoverMenuItem}
                          onClick={() => {
                            setActiveSection('billing')
                            setProfileMenuOpen(false)
                          }}
                        >
                          <span className={styles.menuIcon}>💳</span>
                          <div className={styles.menuText}>
                            <strong>Billing & Plans</strong>
                            <small>Manage tier & invoices</small>
                          </div>
                        </button>

                        <button
                          type="button"
                          className={styles.popoverMenuItem}
                          onClick={() => {
                            navigate('/')
                            setProfileMenuOpen(false)
                          }}
                        >
                          <span className={styles.menuIcon}>🌐</span>
                          <div className={styles.menuText}>
                            <strong>Landing Page</strong>
                            <small>Return to home portal</small>
                          </div>
                        </button>

                        <div className={styles.popoverDivider} />

                        <button
                          type="button"
                          className={`${styles.popoverMenuItem} ${styles.popoverSignOut}`}
                          onClick={() => {
                            setProfileMenuOpen(false)
                            handleSignOut()
                          }}
                        >
                          <span className={styles.menuIcon}>🚪</span>
                          <div className={styles.menuText}>
                            <strong>Sign Out</strong>
                            <small>End current session</small>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className={styles.topbarButtonSecondary}
                  onClick={() => navigate('/')}
                >
                  Landing
                </button>
                <button
                  type="button"
                  className={styles.topbarButtonPrimary}
                  onClick={() => setShowLoginModal(true)}
                >
                  Log In
                </button>
              </div>
            )}
          </div>
        </header>

        <div className={`${styles.content} ${!canAccessPrivateRoutes ? styles.contentPreview : ''}`}>
          {renderActiveSection()}
        </div>
      </main>

      <nav className={styles.mobileDock}>
        {['dashboard', 'matches', 'outreach', 'gigs', 'billing'].map((itemId) => {
          const item = NAV_GROUPS.flatMap((group) => group.items).find((entry) => entry.id === itemId)

          if (!item) {
            return null
          }

          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.mobileDockItem} ${activeSection === item.id ? styles.mobileDockItemActive : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span>{item.icon}</span>
              <small>{item.title}</small>
            </button>
          )
        })}
      </nav>

      <DashboardLoginModal
        isOpen={showLoginModal}
        nextPath="/dashboard"
        onSuccess={() => setShowLoginModal(false)}
        onClose={() => setShowLoginModal(false)}
        allowDismiss
      />
    </div>
  )
}

export default WorkspaceSection
