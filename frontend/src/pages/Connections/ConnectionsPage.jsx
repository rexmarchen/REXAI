import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Home, 
  Zap, 
  BarChart2, 
  Send, 
  Settings, 
  Lightbulb, 
  Bell, 
  ChevronDown, 
  User, 
  MessageSquare, 
  TrendingUp, 
  ArrowUpRight, 
  Heart, 
  Calendar, 
  Bookmark, 
  ArrowRight, 
  Sparkles, 
  X,
  Check,
  ShieldCheck,
  Sliders,
  Cpu,
  Clock,
  Radio,
  Users,
  RefreshCw,
  Play,
  Film,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  fetchInstaStatus,
  fetchInstaQueue,
  fetchInstaHistory,
  generateInstaContent,
  publishInstaNow,
  toggleInstaAutopilot,
  connectInstaAccount,
  disconnectInstaAccount,
  testInstaConnection,
  replenishContinuousBuffer,
  exchangeInstaToken
} from '../../services/instaAutomationApi'
import apiClient from '../../services/apiClient'
import styles from './ConnectionsPage.module.css'

const LINKEDIN_TONES = [
  {
    id: 'warm',
    name: 'Warm & Value-First',
    desc: 'Empathetic and genuine peer hook',
    template: "Hi {firstName}! I came across your profile and I'm really impressed by your engineering work at Google. I'd love to connect and follow your journey!"
  },
  {
    id: 'peer',
    name: 'Technical Peer',
    desc: 'Engineer-to-engineer builder style',
    template: "Hey {firstName}, noticed you're active in the cloud & AI infrastructure space at Google. Always looking to exchange insights with fellow builders—let's connect!"
  },
  {
    id: 'direct',
    name: 'Direct & High Signal',
    desc: 'Respectful of busy schedules',
    template: "Hi {firstName}, loved your recent work on system scalability. What we're building at REXOIN aligns closely with your tech stack. Would be great to connect!"
  },
  {
    id: 'thoughtLeader',
    name: 'Executive & Founder',
    desc: 'High-level strategic network',
    template: "{firstName}, your contributions to the tech ecosystem stand out. I'm scaling high-velocity AI platforms and would be delighted to have you in my network."
  }
]

const INSTA_TONES = [
  {
    id: 'creator',
    name: 'Creator Collab',
    desc: 'High-energy visual collaboration',
    template: "Hey! Absolutely love your recent visual series. Your aesthetic matches our creator spotlight—would love to collaborate on an upcoming drop!"
  },
  {
    id: 'community',
    name: 'Community Supporter',
    desc: 'Organic engagement on target niches',
    template: "Your content on creative growth is always top tier! Dropping in to show support and connect with your creator circle."
  },
  {
    id: 'story',
    name: 'Story Auto-Reply',
    desc: 'Instant lead magnet delivery',
    template: "Thanks for checking out the story! Here's the insider link to our growth blueprint: rexion.ai/growth"
  },
  {
    id: 'careerTips',
    name: 'Career Tips & Growth',
    desc: 'High-signal tech advice & portfolio tips',
    template: "Sending 100 applications with 0 callbacks? Check your resume score and match predictions live before you apply on rexion.ai"
  }
]

export default function ConnectionsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // User state
  const userName = user?.fullName || user?.name || 'Anshu Pal'
  const userPlan = user?.plan ? `${String(user.plan).charAt(0).toUpperCase() + String(user.plan).slice(1)} Plan` : 'Free Plan'
  const userAvatar = user?.avatar || user?.avatarUrl || '/profile-avatar.jpg'

  // Interactive UI states
  const [activeNav, setActiveNav] = useState('automation')
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [activeModal, setActiveModal] = useState(null) // 'linkedin' | 'instagram' | null
  const [modalTab, setModalTab] = useState('personalize') // 'personalize' | 'safety' | 'sequence' | 'queue'
  const [selectedTone, setSelectedTone] = useState('warm')
  const [connectBtnState, setConnectBtnState] = useState('idle') // 'idle' | 'connecting' | 'connected'
  const [targetProfile, setTargetProfile] = useState({
    name: 'Engineering Talent & Recruiter Lead',
    role: 'Target Roles @ Google, Microsoft, Meta',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    matchScore: '98.4%',
    mutual: 'Verified Candidate Match'
  })
  const [toastMessage, setToastMessage] = useState(null)

  // Instagram Agent Live State
  const [instaStatus, setInstaStatus] = useState(null)
  const [instaQueue, setInstaQueue] = useState([])
  const [instaHistory, setInstaHistory] = useState([])
  const [instaFormat, setInstaFormat] = useState('REEL') // 'REEL' | 'IMAGE'
  const [instaTopic, setInstaTopic] = useState('Smart Job & Internship Matching Reel — Sending 100 applications with 0 callbacks? Focus on roles where your skills align.')
  const [isGeneratingInsta, setIsGeneratingInsta] = useState(false)
  const [isPublishingInsta, setIsPublishingInsta] = useState(false)

  // Account Credentials & Multi-User State
  const [instaTokenInput, setInstaTokenInput] = useState('')
  const [instaUsernameInput, setInstaUsernameInput] = useState('')
  const [linkedinTokenInput, setLinkedinTokenInput] = useState('')
  const [isConnectingAccount, setIsConnectingAccount] = useState(false)
  const [isTestingInsta, setIsTestingInsta] = useState(false)
  const [linkedinStatus, setLinkedinStatus] = useState(null)

  // Automation Form Config
  const [dailyTarget, setDailyTarget] = useState(25)
  const [safeJitter, setSafeJitter] = useState(true)
  const [promptNotes, setPromptNotes] = useState(LINKEDIN_TONES[0].template)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Load Instagram & LinkedIn Agent Live Status on mount
  const refreshInstaData = async () => {
    try {
      const status = await fetchInstaStatus()
      setInstaStatus(status)
      const qRes = await fetchInstaQueue(20)
      if (qRes?.queue) {
        setInstaQueue(qRes.queue)
      }
      const hRes = await fetchInstaHistory(15)
      if (hRes?.history) {
        setInstaHistory(hRes.history)
      }
    } catch (e) {
      console.warn('[ConnectionsPage] Could not load live Instagram Agent status:', e.message)
    }
  }

  const refreshLinkedInData = async () => {
    try {
      const res = await apiClient.get('/linkedin-automation/status')
      setLinkedinStatus(res)
    } catch (e) {
      console.warn('[ConnectionsPage] LinkedIn status notice:', e.message)
    }
  }

  useEffect(() => {
    refreshInstaData()
    refreshLinkedInData()
  }, [])

  const handleStartAutomation = (platform) => {
    if (platform === 'linkedin') {
      const accountName = linkedinStatus?.linkedin?.connected ? (linkedinStatus.linkedin.accountName || 'Your LinkedIn Account') : 'Engineering Talent & Recruiter Lead'
      const headline = linkedinStatus?.linkedin?.connected ? (linkedinStatus.linkedin.headline || 'Active Professional Network') : 'Software Engineer & Technical Hiring'
      setTargetProfile({
        name: accountName,
        role: headline,
        avatar: linkedinStatus?.linkedin?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
        matchScore: '98.4%',
        mutual: linkedinStatus?.linkedin?.connected ? 'Verified Account Linked' : 'Target Roles @ Google, Microsoft, Meta'
      })
      setSelectedTone('warm')
      setPromptNotes(LINKEDIN_TONES[0].template)
      refreshLinkedInData()
    } else {
      setTargetProfile({
        name: instaStatus?.account?.name || 'Anshu Pal',
        role: `@${instaStatus?.account?.username || 'anshu._io'} • AI Creative Director`,
        avatar: instaStatus?.account?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        matchScore: '100% Safe Score',
        mutual: `${instaStatus?.postCounts?.total || 32} Creative Assets • ${instaStatus?.postCounts?.published || 4} Published Live`
      })
      setSelectedTone('creator')
      setPromptNotes(INSTA_TONES[0].template)
      refreshInstaData()
    }
    setModalTab('personalize')
    setActiveModal(platform)
  }

  const handleSaveInstaAccount = async () => {
    if (!instaTokenInput.trim()) {
      showToast('⚠️ Please provide an Instagram Access Token')
      return
    }
    setIsConnectingAccount(true)
    try {
      const res = await connectInstaAccount({
        accessToken: instaTokenInput.trim(),
        accountUsername: instaUsernameInput.trim() || undefined
      })
      if (res?.success) {
        showToast(`🎉 ${res.message}`)
        await refreshInstaData()
        setModalTab('queue')
      } else {
        showToast(res?.message || 'Failed to connect')
      }
    } catch (err) {
      showToast(`❌ Connection error: ${err.message}`)
    } finally {
      setIsConnectingAccount(false)
    }
  }

  const handleDisconnectInsta = async () => {
    try {
      const res = await disconnectInstaAccount()
      showToast(res.message)
      await refreshInstaData()
    } catch (err) {
      showToast(`Error: ${err.message}`)
    }
  }

  const handleTestInsta = async () => {
    if (!instaTokenInput.trim()) {
      showToast('⚠️ Please provide an Instagram Access Token to test')
      return
    }
    setIsTestingInsta(true)
    showToast('🔍 Testing Instagram token against Meta Graph API...')
    try {
      const res = await testInstaConnection({ igAccessToken: instaTokenInput.trim() })
      if (res?.instagram?.ok) {
        showToast(`✅ Valid Token! Account: ${res.instagram.accountName || res.instagram.username || 'Verified'}`)
      } else {
        showToast(`❌ Test failed: ${res?.instagram?.message || 'Invalid token'}`)
      }
    } catch (err) {
      showToast(`❌ Test error: ${err.message}`)
    } finally {
      setIsTestingInsta(false)
    }
  }

  const handleSaveLinkedInToken = async () => {
    if (!linkedinTokenInput.trim()) {
      showToast('⚠️ Please enter a LinkedIn Access Token')
      return
    }
    setIsConnectingAccount(true)
    try {
      const res = await apiClient.post('/linkedin-automation/save-keys', {
        linkedinAccessToken: linkedinTokenInput.trim()
      })
      if (res?.success) {
        showToast('🎉 LinkedIn account connected successfully!')
        await refreshLinkedInData()
        setModalTab('personalize')
      } else {
        showToast(res?.message || 'Save failed')
      }
    } catch (err) {
      showToast(`❌ Error: ${err.message}`)
    } finally {
      setIsConnectingAccount(false)
    }
  }

  const handleToneChange = (toneId) => {
    setSelectedTone(toneId)
    const list = activeModal === 'instagram' ? INSTA_TONES : LINKEDIN_TONES
    const found = list.find(t => t.id === toneId)
    if (found) {
      setPromptNotes(found.template)
      if (activeModal === 'instagram') {
        setInstaTopic(found.template)
      }
    }
  }

  const handleConnectClick = () => {
    setConnectBtnState('connecting')
    setTargetProfile({
      name: 'Sarah Mitchell',
      role: 'Software Engineer @ Google',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      matchScore: '98.4%',
      mutual: '18 mutual connections'
    })
    setSelectedTone('warm')
    setPromptNotes(LINKEDIN_TONES[0].template)
    setModalTab('personalize')

    setTimeout(() => {
      setActiveModal('linkedin')
      setConnectBtnState('connected')
      showToast('✨ Initialized Neural Connection Engine for Sarah Mitchell')
    }, 280)
  }

  const handleConfirmDeploy = () => {
    const platformName = activeModal === 'linkedin' ? 'LinkedIn' : 'Instagram'
    setActiveModal(null)
    setConnectBtnState('connected')
    showToast(`🚀 ${platformName} Connection Engine active! (${dailyTarget}/day safe velocity)`)
  }

  const handleGenerateInstaAI = async () => {
    setIsGeneratingInsta(true)
    showToast('✨ Agent is synthesizing creative assets, captions & FFmpeg visual reel...')
    try {
      const res = await generateInstaContent({
        topic: instaTopic,
        kind: instaFormat,
        tone: selectedTone
      })
      if (res?.success) {
        showToast('🎉 New Instagram content generated and placed in queue!')
        await refreshInstaData()
        setModalTab('queue')
      } else {
        showToast(`❌ Generation notice: ${res?.message || 'Check logs'}`)
      }
    } catch (err) {
      showToast(`❌ Error: ${err.message}`)
    } finally {
      setIsGeneratingInsta(false)
    }
  }

  const handlePublishPostLive = async (postId = null) => {
    setIsPublishingInsta(true)
    showToast('🚀 Agent publishing directly to Instagram live via Meta Graph API...')
    try {
      const res = await publishInstaNow(postId)
      if (res?.success) {
        showToast('✅ Published live to Instagram successfully!')
        await refreshInstaData()
      } else {
        showToast(`⚠️ Publish response: ${res?.message || 'Check token'}`)
      }
    } catch (err) {
      showToast(`❌ Publish error: ${err.message}`)
    } finally {
      setIsPublishingInsta(false)
    }
  }

  const handleToggleAutopilot = async () => {
    const newState = !instaStatus?.autopilot
    try {
      const res = await toggleInstaAutopilot(newState)
      setInstaStatus(prev => ({ ...prev, autopilot: res.autopilot }))
      showToast(res.message)
    } catch (e) {
      showToast(`Error: ${e.message}`)
    }
  }

  const [isReplenishingBuffer, setIsReplenishingBuffer] = useState(false)

  const handleReplenishBuffer = async () => {
    setIsReplenishingBuffer(true)
    showToast('🛡️ Auto-generating 7-day continuous content buffer across all weekly pillars...')
    try {
      const res = await replenishContinuousBuffer(7)
      if (res?.success || res?.bufferedDays) {
        showToast(`🎉 Continuous Buffer Synced: ${res.newlyGenerated || 7} posts scheduled! Zero missed days guaranteed.`)
        await refreshInstaData()
      } else {
        showToast(res?.message || 'Buffer synced')
      }
    } catch (err) {
      showToast(`⚠️ Notice: ${err.response?.data?.message || err.message}`)
    } finally {
      setIsReplenishingBuffer(false)
    }
  }

  return (
    <div className={styles.dashboardShell}>
      
      {/* ==================== LEFT SIDEBAR ==================== */}
      <aside className={styles.sidebar}>
        <div>
          {/* Brand Logo */}
          <Link to="/" className={styles.brandLink}>
            <svg 
              className={styles.brandLogoIcon} 
              viewBox="0 0 36 36" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M18 4C10.268 4 4 10.268 4 18C4 25.732 10.268 32 18 32C25.732 32 32 25.732 32 18" 
                stroke="#3B82F6" 
                strokeWidth="4" 
                strokeLinecap="round" 
              />
              <path 
                d="M18 10C13.5817 10 10 13.5817 10 18C10 22.4183 13.5817 26 18 26C22.4183 26 26 22.4183 26 18" 
                stroke="#3B82F6" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
              />
              <circle cx="18" cy="18" r="3" fill="#3B82F6" />
            </svg>
            <span className={styles.brandTitle}>REXOIN</span>
          </Link>

          {/* Navigation Links */}
          <nav className={styles.navMenu}>
            <button 
              type="button" 
              className={`${styles.navItem} ${activeNav === 'home' ? styles.navItemActive : ''}`}
              onClick={() => navigate('/')}
            >
              <Home className={styles.navItemIcon} />
              <span>Home</span>
            </button>

            <button 
              type="button" 
              className={`${styles.navItem} ${activeNav === 'automation' ? styles.navItemActive : ''}`}
              onClick={() => setActiveNav('automation')}
            >
              <Zap className={styles.navItemIcon} />
              <span>Automation</span>
            </button>

            <button 
              type="button" 
              className={`${styles.navItem} ${activeNav === 'analytics' ? styles.navItemActive : ''}`}
              onClick={() => {
                setActiveNav('analytics')
                navigate('/dashboard')
              }}
            >
              <BarChart2 className={styles.navItemIcon} />
              <span>Analytics</span>
            </button>

            <button 
              type="button" 
              className={`${styles.navItem} ${activeNav === 'campaigns' ? styles.navItemActive : ''}`}
              onClick={() => {
                setActiveNav('campaigns')
                navigate('/dashboard')
              }}
            >
              <Send className={styles.navItemIcon} />
              <span>My Campaigns</span>
            </button>

            <button 
              type="button" 
              className={`${styles.navItem} ${activeNav === 'settings' ? styles.navItemActive : ''}`}
              onClick={() => {
                setActiveNav('settings')
                navigate('/dashboard')
              }}
            >
              <Settings className={styles.navItemIcon} />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Promo Cardlet */}
        <div className={styles.promoCardlet}>
          <div className={styles.promoIcon}>
            <Lightbulb size={16} />
          </div>
          <h4 className={styles.promoHeading}>Work Smarter,<br />Grow Faster</h4>
          <p className={styles.promoText}>Let REXOIN handle the repetitive. You focus on the bigger goals.</p>
          <div className={styles.promoDash} />
        </div>
      </aside>

      {/* ==================== MAIN WORKSPACE ==================== */}
      <main className={styles.mainContent}>
        
        {/* Topbar Header */}
        <header className={styles.topbar}>
          <button 
            type="button" 
            className={styles.bellButton}
            onClick={() => showToast('You have 2 scheduled automation workflows active.')}
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className={styles.bellBadgeDot} />
          </button>

          <div style={{ position: 'relative' }}>
            <button 
              type="button" 
              className={styles.userProfileTrigger}
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            >
              <img 
                src={userAvatar} 
                alt={userName}
                className={styles.userAvatarImg}
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
                }}
              />
              <div className={styles.userMeta}>
                <span className={styles.userName}>{userName}</span>
                <span className={styles.userPlan}>{userPlan}</span>
              </div>
              <ChevronDown size={14} color="#78716C" />
            </button>

            {/* Profile Dropdown */}
            {profileMenuOpen && (
              <div 
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  width: '210px',
                  background: '#FFFFFF',
                  border: '1px solid #ECE4D6',
                  borderRadius: '16px',
                  boxShadow: '0 16px 36px rgba(0,0,0,0.08)',
                  padding: '8px',
                  zIndex: 50
                }}
              >
                <button 
                  onClick={() => navigate('/dashboard')}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    color: '#18181B',
                    cursor: 'pointer'
                  }}
                >
                  Open Dashboard
                </button>
                <button 
                  onClick={() => navigate('/dashboard')}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    color: '#E07A5F',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Upgrade to Pro
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content Body */}
        <motion.div 
          className={styles.pageBody}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          
          {/* Hero Section */}
          <motion.div 
            className={styles.heroSection}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: 'easeOut' }}
          >
            <div className={styles.aiPillBadge}>
              <Sparkles size={13} />
              <span>AI POWERED AUTOMATION</span>
            </div>

            <h1 className={styles.heroHeadline}>
              Automate Your Social<br />
              Growth with <span className={styles.brandTerracotta}>REXOIN</span>
            </h1>

            <p className={styles.heroSubtitle}>
              Connect, engage, and grow — all on autopilot. Choose your platform, 
              set your goals, and let REXOIN handle the rest.
            </p>

            {/* Handwritten Decorative Annotation */}
            <motion.div 
              className={styles.handwrittenAnnotation}
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
            >
              {/* Radiating sunburst marks */}
              <svg 
                className={styles.handwrittenSunburst} 
                viewBox="0 0 30 18" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M4 14 L 12 4" stroke="#BE664C" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M26 14 L 18 4" stroke="#BE664C" strokeWidth="1.8" strokeLinecap="round" />
              </svg>

              <div className={styles.handwrittenText}>
                More<br />
                Connections<br />
                ( More<br />
                &nbsp;&nbsp;Opportunities
              </div>

              {/* Curved Arrow */}
              <svg 
                className={styles.handwrittenArrow} 
                viewBox="0 0 60 50" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M12 6 C 26 20, 24 34, 18 44" 
                  stroke="#BE664C" 
                  strokeWidth="1.8" 
                  strokeLinecap="round" 
                />
                <path 
                  d="M12 38 L 18 45 L 25 39" 
                  stroke="#BE664C" 
                  strokeWidth="1.8" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              </svg>
            </motion.div>

            {/* Live Real-Time Telemetry Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              padding: '12px 18px',
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #ECE4D6',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
              marginTop: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981', display: 'inline-block' }} />
                <span style={{ fontSize: '0.80rem', fontWeight: 800, color: '#18181B', letterSpacing: '0.04em' }}>LIVE AGENT TELEMETRY</span>
                <span style={{ fontSize: '0.72rem', color: '#78716C' }}>• Real SQLite & Meta Graph Pipeline</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '0.76rem' }}>
                  <span style={{ color: '#78716C' }}>Instagram: </span>
                  <strong style={{ color: '#E07A5F' }}>@{instaStatus?.account?.username || 'anshu._io'}</strong>
                  <span style={{ color: '#059669', marginLeft: '5px', fontWeight: 700 }}>
                    ({instaStatus?.postCounts?.total ?? 32} assets, {instaStatus?.postCounts?.published ?? 4} live)
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem' }}>
                  <span style={{ color: '#78716C' }}>Queue Buffer: </span>
                  <strong style={{ color: '#18181B' }}>{instaQueue.length || instaStatus?.postCounts?.approved || 10} ready</strong>
                  <span style={{ color: '#78716C', marginLeft: '4px' }}>[17:00 & 19:00 IST]</span>
                </div>
                <div style={{ fontSize: '0.76rem' }}>
                  <span style={{ color: '#78716C' }}>Telegram Control: </span>
                  <strong style={{ color: '#059669' }}>Connected (@8652000706)</strong>
                </div>
                <div style={{ fontSize: '0.76rem' }}>
                  <span style={{ color: '#78716C' }}>LinkedIn Radar: </span>
                  <strong style={{ color: linkedinStatus?.linkedin?.connected ? '#0A66C2' : '#78716C' }}>
                    {linkedinStatus?.linkedin?.connected ? `Active (${linkedinStatus.linkedin.accountName})` : 'Awaiting Link'}
                  </strong>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ==================== TWO AUTOMATION CARDS ==================== */}
          <motion.div 
            className={styles.cardsGrid}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16, ease: 'easeOut' }}
          >

            {/* CARD 1: LINKEDIN AUTOMATION */}
            <div className={styles.automationCard}>
              <div className={styles.cardTopArea}>
                <div className={styles.cardHeaderRow}>
                  <div className={`${styles.brandLogoBox} ${styles.logoLinkedIn}`}>
                    {/* LinkedIn Vector Logo */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </div>
                  <span className={styles.cardBadgePopular}>
                    {linkedinStatus?.linkedin?.connected ? 'CONNECTED' : 'POPULAR'}
                  </span>
                </div>

                <h3 className={styles.cardTitle}>LinkedIn Automation</h3>
                <p className={styles.cardSubtitle}>
                  Find the right people. Start real conversations. Build valuable connections — automatically.
                </p>

                {/* Features & Visual Floating Mockup */}
                <div className={styles.cardSplitArea}>
                  
                  {/* Left: 4 Features */}
                  <div className={styles.featureList}>
                    <div className={styles.featureItem}>
                      <User className={styles.featureIcon} />
                      <span>Auto connect with targeted profiles</span>
                    </div>
                    <div className={styles.featureItem}>
                      <MessageSquare className={styles.featureIcon} />
                      <span>Send personalized messages</span>
                    </div>
                    <div className={styles.featureItem}>
                      <TrendingUp className={styles.featureIcon} />
                      <span>Track responses & engagement</span>
                    </div>
                    <div className={styles.featureItem}>
                      <ArrowUpRight className={styles.featureIcon} />
                      <span>Grow your network & opportunities</span>
                    </div>
                  </div>

                  {/* Right: Floating LinkedIn Mockup */}
                  <div className={styles.mockupContainerLinkedIn}>
                    <div className={styles.blobLinkedIn} />
                    
                    <div 
                      className={styles.mockupCardLinkedIn}
                      onClick={handleConnectClick}
                      style={{ cursor: 'pointer' }}
                      title="Click to open Autonomous Connection Engine"
                    >
                      <div className={styles.mockupTopLinkedIn}>
                        <span className={styles.mockupLogoText}>LinkedIn</span>
                        <span className={styles.mockupDots}>•••</span>
                      </div>

                      <div className={styles.mockupProfileRow}>
                        <img 
                          src={linkedinStatus?.linkedin?.avatar || userAvatar} 
                          alt="Profile Avatar" 
                          className={styles.mockupAvatar}
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80'
                          }}
                        />
                        <div className={styles.mockupProfileMeta}>
                          <strong>{linkedinStatus?.linkedin?.connected ? (linkedinStatus.linkedin.accountName || userName) : 'Engineering Lead'}</strong>
                          <span>{linkedinStatus?.linkedin?.connected ? (linkedinStatus.linkedin.headline || 'Active Session') : 'Recruiter & Tech Lead • 2nd'}</span>
                        </div>
                        <button 
                          type="button" 
                          className={`${styles.mockupConnectBtn} ${connectBtnState === 'connecting' ? styles.mockupConnectBtnConnecting : ''} ${connectBtnState === 'connected' ? styles.mockupConnectBtnSuccess : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleConnectClick()
                          }}
                          title="Click to launch connection sequence"
                        >
                          {connectBtnState === 'connecting' ? (
                            <>
                              <RefreshCw size={9} style={{ animation: 'spin 0.8s linear infinite' }} />
                              <span>Opening...</span>
                            </>
                          ) : connectBtnState === 'connected' ? (
                            <>
                              <Check size={9} />
                              <span>Connected ✓</span>
                            </>
                          ) : (
                            <>
                              <Zap size={9} />
                              <span>Connect</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className={styles.mockupChatBubble}>
                        {connectBtnState === 'connected' ? (
                          <span style={{ color: '#0A66C2', fontWeight: 600 }}>
                            ⚡ AI Personalized Hook Prepared: &ldquo;{promptNotes.slice(0, 95)}...&rdquo;
                          </span>
                        ) : (
                          promptNotes
                        )}
                      </div>

                      <div className={styles.mockupSendRow}>
                        <div className={styles.mockupInputLines}>
                          <div className={styles.mockupLine} style={{ width: '80%' }} />
                          <div className={styles.mockupLine} style={{ width: '50%' }} />
                        </div>
                        <button type="button" className={styles.mockupSendBtn}>
                          <Send size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Diagonal resize arrow icon (↙↘) under the mockup */}
                    <svg 
                      className={styles.diagonalResizeIcon} 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  </div>

                </div>
              </div>

              {/* Bottom Section: Primary Button & Social Proof */}
              <div className={styles.cardBottomSection}>
                <button 
                  type="button" 
                  className={styles.startAutomationBtn}
                  onClick={() => handleStartAutomation('linkedin')}
                >
                  <span>Start LinkedIn Automation</span>
                  <ArrowRight size={16} />
                </button>

                <div className={styles.socialProofRow}>
                  <div className={styles.avatarStack}>
                    <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80" 
                      alt="User" 
                      className={styles.avatarStackImg}
                    />
                    <img 
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80" 
                      alt="User" 
                      className={styles.avatarStackImg}
                    />
                    <img 
                      src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=80&q=80" 
                      alt="User" 
                      className={styles.avatarStackImg}
                    />
                  </div>
                  <span className={styles.socialProofText}>
                    {linkedinStatus?.linkedin?.connected
                      ? `Connected: ${linkedinStatus.linkedin.accountName} • 25 daily safe velocity limit active`
                      : 'Autonomous Recruiter Radar • Safe 25 invites/day velocity • Zero detection safeguards'}
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 2: INSTAGRAM AUTOMATION */}
            <div className={styles.automationCard}>
              <div className={styles.cardTopArea}>
                <div className={styles.cardHeaderRow}>
                  <div className={`${styles.brandLogoBox} ${styles.logoInstagram}`}>
                    {/* Instagram Vector Logo */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.13-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {instaStatus?.account?.connected ? (
                      <span className={`${styles.instaLiveStatusBadge} ${instaStatus.autopilot ? styles.instaLiveStatusBadgeActive : ''}`}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                        @{instaStatus.account.username || 'anshu._io'} • {instaStatus.autopilot ? 'Autopilot ON' : 'Paused'}
                      </span>
                    ) : (
                      <span className={styles.cardBadgeNew}>AGENT ACTIVE</span>
                    )}
                  </div>
                </div>

                <h3 className={styles.cardTitle}>Instagram Super-Agent</h3>
                <p className={styles.cardSubtitle}>
                  Autonomous AI Creative Director: synthesizes branded video reels & photos, schedules daily at 7:00 PM IST, and connects with target creators.
                </p>

                {/* Features & Visual Floating Mockup */}
                <div className={styles.cardSplitArea}>
                  
                  {/* Left: 4 Features */}
                  <div className={styles.featureList}>
                    <div className={styles.featureItem}>
                      <Film className={styles.featureIcon} />
                      <span>Autonomous Reel Engine (FLUX.1 + FFmpeg)</span>
                    </div>
                    <div className={styles.featureItem}>
                      <Calendar className={styles.featureIcon} />
                      <span>{instaStatus?.postCounts?.approved ?? instaQueue.length ?? 10} Scheduled in Queue (17:00 & 19:00 IST)</span>
                    </div>
                    <div className={styles.featureItem}>
                      <TrendingUp className={styles.featureIcon} />
                      <span>{instaStatus?.postCounts?.published ?? 4} Live Posts ({instaStatus?.metrics?.totalReach ?? 29} Reach, {instaStatus?.metrics?.totalLikes ?? 3} Likes)</span>
                    </div>
                    <div className={styles.featureItem}>
                      <Heart className={styles.featureIcon} />
                      <span>Telegram Control Active (@8652000706)</span>
                    </div>
                  </div>

                  {/* Right: Floating Instagram Mockup */}
                  <div className={styles.mockupContainerInsta}>
                    <div className={styles.blobInsta} />
                    
                    <div 
                      className={styles.mockupCardInsta}
                      onClick={() => handleStartAutomation('instagram')}
                      style={{ cursor: 'pointer' }}
                      title="Open Instagram Autonomous Agent"
                    >
                      <div className={styles.mockupTopInsta}>
                        <div className={styles.mockupInstaUser}>
                          <img 
                            src={instaStatus?.account?.avatar || userAvatar} 
                            alt="Creator" 
                            className={styles.mockupInstaAvatar}
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
                            }}
                          />
                          <div className={styles.mockupInstaMeta}>
                            <strong>@{instaStatus?.account?.username || 'anshu._io'}</strong>
                            <span>{instaStatus?.autopilot ? 'Autopilot 5 & 7 PM' : 'Autonomous Studio'}</span>
                          </div>
                        </div>
                        <span className={styles.mockupDots}>•••</span>
                      </div>

                      {/* Real post reel preview */}
                      <div className={styles.mockupPostImgWrap}>
                        <img 
                          src={instaStatus?.lastPublished?.media_url || instaStatus?.nextScheduled?.media_url || '/cover-mountain.jpg'} 
                          alt="Instagram Creative" 
                          className={styles.mockupPostImg}
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80'
                          }}
                        />
                        <div className={styles.mockupPostOverlayText}>
                          <em>{instaStatus?.lastPublished?.hook || instaStatus?.nextScheduled?.hook || 'Sending 100 applications with 0 callbacks?'}</em>
                        </div>
                      </div>

                      {/* Interaction Bar */}
                      <div className={styles.mockupInstaActionRow}>
                        <div className={styles.mockupInstaIconsLeft}>
                          <Heart size={13} />
                          <MessageSquare size={13} />
                          <Send size={13} />
                        </div>
                        <Bookmark size={13} color="#4B5563" />
                      </div>
                    </div>

                    {/* Floating Overlay Metric Badges */}
                    <div className={styles.mockupPillFollowers}>
                      <Zap size={11} color="#E07A5F" />
                      <div className={styles.mockupPillText}>
                        <strong>{instaStatus?.postCounts?.approved ?? instaQueue.length ?? 10} Queued</strong>
                        <span>Next 7:00 PM IST</span>
                      </div>
                    </div>

                    <div className={styles.mockupPillEngagement}>
                      <TrendingUp size={11} color="#E07A5F" />
                      <div className={styles.mockupPillText}>
                        <strong>{instaStatus?.postCounts?.total ?? 32} Assets</strong>
                        <span>{instaStatus?.autopilot ? 'Autopilot ON' : 'Paused'}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Bottom Section: Primary Button & Social Proof */}
              <div className={styles.cardBottomSection}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button 
                    type="button" 
                    className={styles.startAutomationBtn}
                    onClick={() => handleStartAutomation('instagram')}
                  >
                    <span>Manage Instagram Agent</span>
                    <ArrowRight size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleAutopilot}
                    style={{
                      padding: '9px 16px',
                      borderRadius: '999px',
                      background: instaStatus?.autopilot ? '#ECFDF5' : '#FEF2F2',
                      color: instaStatus?.autopilot ? '#059669' : '#DC2626',
                      border: `1px solid ${instaStatus?.autopilot ? '#A7F3D0' : '#FECACA'}`,
                      fontSize: '0.80rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginBottom: '14px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <RefreshCw size={12} />
                    <span>Autopilot: {instaStatus?.autopilot ? 'ON' : 'PAUSED'}</span>
                  </button>
                </div>

                <div className={styles.socialProofRow}>
                  <div className={styles.avatarStack}>
                    <img 
                      src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=80&q=80" 
                      alt="Creator" 
                      className={styles.avatarStackImg}
                    />
                    <img 
                      src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=80&q=80" 
                      alt="Creator" 
                      className={styles.avatarStackImg}
                    />
                    <img 
                      src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=80&q=80" 
                      alt="Creator" 
                      className={styles.avatarStackImg}
                    />
                  </div>
                  <span className={styles.socialProofText}>
                    Live on @anshu._io &bull; {instaStatus?.postCounts?.total ?? 32} Posts Synthesized &bull; {instaStatus?.postCounts?.published ?? 4} Live on Instagram
                  </span>
                </div>
              </div>
            </div>

          </motion.div>

          {/* ==================== FOOTER ==================== */}
          <footer className={styles.pageFooter}>
            <div className={styles.footerDividerText}>
              <span className={styles.footerLine} />
              <span>AUTOMATE &nbsp;/&nbsp; ENGAGE &nbsp;/&nbsp; GROW</span>
              <span className={styles.footerLine} />
            </div>
          </footer>

        </motion.div>
      </main>

      {/* ==================== CONFIGURATION & LAUNCH MODAL WITH OPENING ANIMATION ==================== */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            onClick={() => setActiveModal(null)}
          >
            {/* Ambient Animated Glow Mesh */}
            <div className={activeModal === 'linkedin' ? styles.modalBackdropGlow1 : styles.modalBackdropGlow2} />

            <motion.div 
              className={styles.modalCard}
              initial={{ opacity: 0, scale: 0.86, y: 32, rotateX: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 290 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={styles.modalHeader}>
                <div>
                  <h3 className={styles.modalTitle}>
                    {activeModal === 'linkedin' ? 'LinkedIn' : 'Instagram'} Autonomous Connection Engine
                  </h3>
                  <p className={styles.modalSubtitle}>
                    {activeModal === 'instagram' 
                      ? 'AI content synthesis, reel creator, daily 7:00 PM IST autopilot queue, and Graph API publisher'
                      : 'Configuring personalized outreach agent & human behavior safeguards'}
                  </p>
                </div>
                <button 
                  type="button" 
                  className={styles.modalCloseBtn}
                  onClick={() => setActiveModal(null)}
                  aria-label="Close modal"
                >
                  <X size={17} />
                </button>
              </div>

              {/* Animated Neural Beam Connection Visualizer */}
              <div className={`${styles.pipelineVisualizer} ${activeModal === 'instagram' ? styles.pipelineVisualizerInsta : ''}`}>
                
                {/* Node 1: You */}
                <div className={styles.nodeBox}>
                  <div className={`${styles.nodeAvatarWrap} ${activeModal === 'instagram' ? styles.nodeAvatarWrapInsta : ''}`}>
                    <span className={styles.nodePulsePing} />
                    <img 
                      src={userAvatar} 
                      alt={userName}
                      className={styles.nodeAvatar}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
                      }}
                    />
                  </div>
                  <div className={styles.nodeMeta}>
                    <strong>{userName}</strong>
                    <span>{activeModal === 'instagram' ? '@anshu._io • Active' : 'Source Node • Active'}</span>
                  </div>
                </div>

                {/* Central Laser Beam & AI Matching */}
                <div className={styles.centerBeam}>
                  <div className={styles.laserLine}>
                    <div className={`${styles.laserPulse} ${activeModal === 'instagram' ? styles.laserPulseInsta : ''}`} />
                  </div>
                  <div className={`${styles.aiBadgePill} ${activeModal === 'instagram' ? styles.aiBadgePillInsta : ''}`}>
                    <Cpu size={11} />
                    <span>{activeModal === 'instagram' ? 'AUTONOMOUS REEL ENGINE' : `AI MATCH ${targetProfile.matchScore}`}</span>
                  </div>
                </div>

                {/* Node 2: Target Prospect */}
                <div className={styles.nodeBox}>
                  <div className={`${styles.nodeAvatarWrap} ${activeModal === 'instagram' ? styles.nodeAvatarWrapInsta : ''}`}>
                    <img 
                      src={targetProfile.avatar} 
                      alt={targetProfile.name}
                      className={styles.nodeAvatar}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80'
                      }}
                    />
                  </div>
                  <div className={styles.nodeMeta}>
                    <strong>{targetProfile.name}</strong>
                    <span>{targetProfile.role}</span>
                  </div>
                </div>

              </div>

              {/* Tab Navigation */}
              <div className={styles.modalTabs}>
                <button
                  type="button"
                  className={`${styles.modalTabBtn} ${modalTab === 'personalize' ? styles.modalTabBtnActive : ''}`}
                  onClick={() => setModalTab('personalize')}
                >
                  <Sparkles size={13} />
                  <span>{activeModal === 'instagram' ? 'AI Reel & Content Studio' : 'AI Message Hook'}</span>
                </button>

                {activeModal === 'instagram' && (
                  <>
                    <button
                      type="button"
                      className={`${styles.modalTabBtn} ${modalTab === 'queue' ? styles.modalTabBtnActive : ''}`}
                      onClick={() => setModalTab('queue')}
                    >
                      <Film size={13} />
                      <span>Scheduled Queue ({instaQueue.length || instaStatus?.postCounts?.approved || 10})</span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.modalTabBtn} ${modalTab === 'history' ? styles.modalTabBtnActive : ''}`}
                      onClick={() => setModalTab('history')}
                    >
                      <CheckCircle2 size={13} />
                      <span>Published Live ({instaHistory.length || instaStatus?.postCounts?.published || 4})</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className={`${styles.modalTabBtn} ${modalTab === 'account' ? styles.modalTabBtnActive : ''}`}
                  onClick={() => setModalTab('account')}
                >
                  <Settings size={13} />
                  <span>Link Account & API</span>
                </button>

                <button
                  type="button"
                  className={`${styles.modalTabBtn} ${modalTab === 'safety' ? styles.modalTabBtnActive : ''}`}
                  onClick={() => setModalTab('safety')}
                >
                  <ShieldCheck size={13} />
                  <span>Velocity & Autopilot</span>
                </button>

                <button
                  type="button"
                  className={`${styles.modalTabBtn} ${modalTab === 'sequence' ? styles.modalTabBtnActive : ''}`}
                  onClick={() => setModalTab('sequence')}
                >
                  <Sliders size={13} />
                  <span>Pipeline Loop</span>
                </button>
              </div>

              {/* Tab Body Contents */}
              <div className={styles.modalScrollArea}>
                
                {/* TAB 1: AI Personalization & Generation */}
                {modalTab === 'personalize' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 6 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
                  >
                    {activeModal === 'instagram' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: '#18181B', marginBottom: '6px' }}>
                          Creative Format
                        </label>
                        <div className={styles.instaFormatToggleGroup}>
                          <button
                            type="button"
                            className={`${styles.instaFormatBtn} ${instaFormat === 'REEL' ? styles.instaFormatBtnActive : ''}`}
                            onClick={() => setInstaFormat('REEL')}
                          >
                            <Film size={14} />
                            <span>🎬 Animated Tips Reel (FFmpeg)</span>
                          </button>
                          <button
                            type="button"
                            className={`${styles.instaFormatBtn} ${instaFormat === 'IMAGE' ? styles.instaFormatBtnActive : ''}`}
                            onClick={() => setInstaFormat('IMAGE')}
                          >
                            <ImageIcon size={14} />
                            <span>🖼️ Editorial Photo Post</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div>
                      <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: '#18181B' }}>
                        AI Persona & Communication Tone
                      </label>
                      <div className={styles.toneGrid}>
                        {(activeModal === 'instagram' ? INSTA_TONES : LINKEDIN_TONES).map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            className={`${styles.toneChip} ${selectedTone === t.id ? styles.toneChipActive : ''}`}
                            onClick={() => handleToneChange(t.id)}
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.liveMessageCard}>
                      <div className={styles.liveMessageHeader}>
                        <span>{activeModal === 'instagram' ? 'Topic Brief & AI Hook Directive' : 'Personalized Message Hook Preview'}</span>
                        <span>{(activeModal === 'instagram' ? instaTopic : promptNotes).length} chars</span>
                      </div>
                      <textarea 
                        className={styles.liveMessageTextarea}
                        value={activeModal === 'instagram' ? instaTopic : promptNotes}
                        onChange={(e) => {
                          if (activeModal === 'instagram') {
                            setInstaTopic(e.target.value)
                          } else {
                            setPromptNotes(e.target.value)
                          }
                        }}
                        rows={3}
                        placeholder={activeModal === 'instagram' ? "Enter topic or creative hook for the AI..." : "Enter the AI hook template..."}
                      />
                      <div className={styles.varChipsRow}>
                        <span style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>Variables:</span>
                        <span className={styles.varPill}>{'{firstName}'}</span>
                        <span className={styles.varPill}>{'{company}'}</span>
                        <span className={styles.varPill}>{'{mutualInterest}'}</span>
                        <span className={styles.varPill}>{'{recentPost}'}</span>
                      </div>
                    </div>

                    {activeModal === 'instagram' && (
                      <button
                        type="button"
                        className={styles.instaGenBtn}
                        onClick={handleGenerateInstaAI}
                        disabled={isGeneratingInsta}
                      >
                        {isGeneratingInsta ? (
                          <>
                            <RefreshCw size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                            <span>Synthesizing Reel & Captions with AI...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={15} />
                            <span>Generate AI {instaFormat === 'REEL' ? 'Reel' : 'Post'} Now</span>
                          </>
                        )}
                      </button>
                    )}
                  </motion.div>
                )}

                {/* TAB: INSTAGRAM SCHEDULED QUEUE */}
                {modalTab === 'queue' && activeModal === 'instagram' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                  >
                    {/* 7-Day Continuous Buffer Status Banner */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(5,150,105,0.03) 100%)',
                      border: '1px solid rgba(16,185,129,0.25)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={16} color="#059669" />
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.78rem', color: '#065F46' }}>
                            Zero-Missed-Days Guarantee Active
                          </strong>
                          <span style={{ fontSize: '0.70rem', color: '#047857' }}>
                            {instaQueue.length} days buffered • Daily 7:00 PM IST slot
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleReplenishBuffer}
                        disabled={isReplenishingBuffer}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '10px',
                          background: '#059669',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        {isReplenishingBuffer ? <RefreshCw size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Zap size={12} />}
                        <span>{isReplenishingBuffer ? 'Generating...' : 'Replenish 7-Day Buffer'}</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.80rem', fontWeight: 700, color: '#18181B' }}>
                        Ready Posts in Storage ({instaQueue.length})
                      </span>
                      <button
                        type="button"
                        onClick={refreshInstaData}
                        style={{ background: 'transparent', border: 'none', color: '#E07A5F', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <RefreshCw size={12} />
                        <span>Refresh</span>
                      </button>
                    </div>

                    {instaQueue.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#78716C', background: '#FAF8F5', borderRadius: '14px', border: '1px solid #EBE4D8' }}>
                        <Film size={28} color="#D1D5DB" style={{ margin: '0 auto 8px' }} />
                        <p style={{ margin: 0, fontSize: '0.82rem' }}>No pending drafts. Click &ldquo;Replenish 7-Day Buffer&rdquo; to auto-fill the upcoming week!</p>
                      </div>
                    ) : (
                      <div className={styles.instaQueueList}>
                        {instaQueue.map((item) => (
                          <div key={item.id} className={styles.instaQueueCard}>
                            <div className={styles.instaQueueLeft}>
                              <img
                                src={item.media_url || '/cover-mountain.jpg'}
                                alt="Post media"
                                className={styles.instaQueueMediaThumb}
                                onError={(e) => {
                                  e.currentTarget.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=120&q=80'
                                }}
                              />
                              <div className={styles.instaQueueMeta}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span className={`${styles.instaQueueKindBadge} ${item.kind === 'REEL' ? styles.instaBadgeReel : styles.instaBadgeImage}`}>
                                    {item.kind === 'REEL' ? '🎬 REEL' : '🖼️ IMAGE'}
                                  </span>
                                  <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 700 }}>
                                    {item.status.toUpperCase()}
                                  </span>
                                </div>
                                <span className={styles.instaQueueCaption}>
                                  {item.hook || item.caption || 'AI Generated Post for REXION'}
                                </span>
                                <span className={styles.instaQueueTime}>
                                  Slot: {item.scheduled_at ? new Date(item.scheduled_at).toLocaleString() : 'Daily 7:00 PM IST'}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              className={styles.instaPublishNowBtn}
                              onClick={() => handlePublishPostLive(item.id)}
                              disabled={isPublishingInsta}
                            >
                              <Play size={10} />
                              <span>Publish Live</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* TAB: INSTAGRAM PUBLISHED LIVE HISTORY */}
                {modalTab === 'history' && activeModal === 'instagram' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(224,122,95,0.08) 0%, rgba(224,122,95,0.02) 100%)',
                      border: '1px solid rgba(224,122,95,0.25)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={16} color="#E07A5F" />
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.78rem', color: '#9C4126' }}>
                            Live on @anshu._io
                          </strong>
                          <span style={{ fontSize: '0.70rem', color: '#78716C' }}>
                            {instaHistory.length || instaStatus?.postCounts?.published || 4} posts published • {instaStatus?.metrics?.totalReach || 29} total reach • {instaStatus?.metrics?.totalLikes || 3} likes
                          </span>
                        </div>
                      </div>
                      <a
                        href="https://www.instagram.com/anshu._io/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '6px 12px',
                          borderRadius: '10px',
                          background: '#E07A5F',
                          color: '#FFFFFF',
                          textDecoration: 'none',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <ArrowUpRight size={12} />
                        <span>Open Instagram</span>
                      </a>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.80rem', fontWeight: 700, color: '#18181B' }}>
                        Published Assets ({instaHistory.length || instaStatus?.postCounts?.published || 4})
                      </span>
                      <button
                        type="button"
                        onClick={refreshInstaData}
                        style={{ background: 'transparent', border: 'none', color: '#E07A5F', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <RefreshCw size={12} />
                        <span>Refresh</span>
                      </button>
                    </div>

                    {(instaHistory.length === 0 && (!instaStatus?.recentPosts || instaStatus.recentPosts.filter(p => p.status === 'published').length === 0)) ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#78716C', background: '#FAF8F5', borderRadius: '14px', border: '1px solid #EBE4D8' }}>
                        <p style={{ margin: 0, fontSize: '0.82rem' }}>No published history records yet.</p>
                      </div>
                    ) : (
                      <div className={styles.instaQueueList}>
                        {(instaHistory.length > 0 ? instaHistory : (instaStatus?.recentPosts?.filter(p => p.status === 'published') || [])).map((item) => (
                          <div key={item.id} className={styles.instaQueueCard}>
                            <div className={styles.instaQueueLeft}>
                              <img
                                src={item.media_url || '/cover-mountain.jpg'}
                                alt="Post media"
                                className={styles.instaQueueMediaThumb}
                                onError={(e) => {
                                  e.currentTarget.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=120&q=80'
                                }}
                              />
                              <div className={styles.instaQueueMeta}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span className={`${styles.instaQueueKindBadge} ${item.kind === 'REEL' ? styles.instaBadgeReel : styles.instaBadgeImage}`}>
                                    {item.kind === 'REEL' ? '🎬 REEL' : '🖼️ IMAGE'}
                                  </span>
                                  <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 700 }}>
                                    ✓ PUBLISHED LIVE
                                  </span>
                                </div>
                                <span className={styles.instaQueueCaption}>
                                  {item.hook || item.caption || 'Live Instagram Post'}
                                </span>
                                <span className={styles.instaQueueTime}>
                                  Published: {item.published_at ? new Date(item.published_at).toLocaleString() : 'Recent'}
                                </span>
                              </div>
                            </div>

                            {item.permalink ? (
                              <a
                                href={item.permalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.instaPublishNowBtn}
                                style={{ textDecoration: 'none', background: '#F3F4F6', color: '#18181B' }}
                              >
                                <ArrowUpRight size={11} />
                                <span>View Reel</span>
                              </a>
                            ) : (
                              <span style={{ fontSize: '0.70rem', color: '#059669', fontWeight: 600 }}>Active Live</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* TAB: ACCOUNT & CREDENTIALS LINKING */}
                {modalTab === 'account' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
                  >
                    <div style={{ padding: '14px', borderRadius: '14px', background: '#FAF8F5', border: '1px solid #EBE4D8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '0.84rem', color: '#18181B', display: 'block' }}>
                          {activeModal === 'instagram' ? 'Instagram Professional / Creator Account' : 'Personal LinkedIn Account'}
                        </strong>
                        <span style={{ fontSize: '0.74rem', color: '#78716C' }}>
                          {activeModal === 'instagram'
                            ? (instaStatus?.account?.connected ? `Connected: @${instaStatus.account.username || 'anshu._io'}` : 'Not connected yet')
                            : (linkedinStatus?.linkedin?.connected ? `Connected: ${linkedinStatus.linkedin.accountName}` : 'Not connected yet')}
                        </span>
                      </div>
                      <span className={`${styles.instaLiveStatusBadge} ${(activeModal === 'instagram' ? instaStatus?.account?.connected : linkedinStatus?.linkedin?.connected) ? styles.instaLiveStatusBadgeActive : ''}`}>
                        {(activeModal === 'instagram' ? instaStatus?.account?.connected : linkedinStatus?.linkedin?.connected) ? '✓ LINKED' : 'UNLINKED'}
                      </span>
                    </div>

                    {activeModal === 'instagram' && (
                      <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid #EBE4D8', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                        <div>
                          <span style={{ fontSize: '0.68rem', color: '#78716C', display: 'block' }}>Database Records</span>
                          <strong style={{ fontSize: '0.84rem', color: '#18181B' }}>{instaStatus?.postCounts?.total ?? 32} Posts</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.68rem', color: '#78716C', display: 'block' }}>Published Live</span>
                          <strong style={{ fontSize: '0.84rem', color: '#059669' }}>{instaStatus?.postCounts?.published ?? 4} Live Posts</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.68rem', color: '#78716C', display: 'block' }}>Total Reach</span>
                          <strong style={{ fontSize: '0.84rem', color: '#E07A5F' }}>{instaStatus?.metrics?.totalReach ?? 29} Views</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.68rem', color: '#78716C', display: 'block' }}>Telegram Bot</span>
                          <strong style={{ fontSize: '0.84rem', color: '#059669' }}>Active</strong>
                        </div>
                      </div>
                    )}

                    {activeModal === 'instagram' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#18181B', marginBottom: '4px' }}>
                            Instagram Meta Graph Access Token
                          </label>
                          <input
                            type="password"
                            value={instaTokenInput}
                            onChange={(e) => setInstaTokenInput(e.target.value)}
                            placeholder="EAAG... (Paste 60-day or system token)"
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '0.80rem', background: '#FFFFFF' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#18181B', marginBottom: '4px' }}>
                            Instagram Username / Page Handle (Optional)
                          </label>
                          <input
                            type="text"
                            value={instaUsernameInput}
                            onChange={(e) => setInstaUsernameInput(e.target.value)}
                            placeholder="e.g. anshu._io or your_handle"
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '0.80rem', background: '#FFFFFF' }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                          <button
                            type="button"
                            className={styles.instaGenBtn}
                            onClick={handleSaveInstaAccount}
                            disabled={isConnectingAccount || isTestingInsta}
                            style={{ flex: 1 }}
                          >
                            {isConnectingAccount ? 'Verifying with Meta API...' : 'Verify & Link Instagram Account'}
                          </button>
                          <button
                            type="button"
                            onClick={handleTestInsta}
                            disabled={isConnectingAccount || isTestingInsta}
                            style={{ padding: '9px 14px', borderRadius: '12px', background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', fontSize: '0.80rem', fontWeight: 600, cursor: 'pointer' }}
                          >
                            {isTestingInsta ? 'Testing...' : 'Test Token'}
                          </button>
                          {instaStatus?.account?.connected && (
                            <button
                              type="button"
                              onClick={handleDisconnectInsta}
                              style={{ padding: '9px 14px', borderRadius: '12px', background: '#FEE2E2', color: '#DC2626', border: 'none', fontSize: '0.80rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Unlink
                            </button>
                          )}
                        </div>

                        <p style={{ fontSize: '0.70rem', color: '#6B7280', margin: '4px 0 0', lineHeight: 1.4 }}>
                          💡 <em>How to connect:</em> Tokens are verified against Meta Graph API and stored in your private vault with 60-day auto-refresh.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#18181B', marginBottom: '4px' }}>
                            LinkedIn Direct Access Token / Session
                          </label>
                          <input
                            type="password"
                            value={linkedinTokenInput}
                            onChange={(e) => setLinkedinTokenInput(e.target.value)}
                            placeholder="AQE... (Paste LinkedIn OAuth or Developer Token)"
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '0.80rem', background: '#FFFFFF' }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                          <button
                            type="button"
                            className={styles.instaGenBtn}
                            onClick={handleSaveLinkedInToken}
                            disabled={isConnectingAccount}
                            style={{ flex: 1, background: 'linear-gradient(135deg, #0A66C2 0%, #004182 100%)' }}
                          >
                            {isConnectingAccount ? 'Verifying with LinkedIn...' : 'Verify & Link LinkedIn Account'}
                          </button>
                        </div>

                        <p style={{ fontSize: '0.70rem', color: '#6B7280', margin: '4px 0 0', lineHeight: 1.4 }}>
                          🔒 <em>Safety First:</em> Connection requests are dispatched with randomized human jitter (3–8 min) and strict daily velocity caps to protect your profile.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* TAB 2: Safety & Velocity */}
                {modalTab === 'safety' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 6 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
                  >
                    <div className={styles.sliderCard}>
                      <div className={styles.sliderRow}>
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.82rem', color: '#18181B' }}>
                            Daily Velocity Target
                          </strong>
                          <span style={{ fontSize: '0.72rem', color: '#78716C' }}>
                            Simulated human volume to safeguard profile reputation
                          </span>
                        </div>
                        <span className={styles.sliderValueBadge}>{dailyTarget} / day</span>
                      </div>
                      <input 
                        type="range"
                        min="10"
                        max="40"
                        value={dailyTarget}
                        onChange={(e) => setDailyTarget(Number(e.target.value))}
                        className={styles.rangeInputCustom}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                        <span style={{ fontSize: '0.70rem', color: '#10B981', fontWeight: 600 }}>
                          ✓ Recommended: 20-30/day
                        </span>
                        <span style={{ fontSize: '0.70rem', color: '#78716C' }}>
                          ~{dailyTarget * 7} connections / week
                        </span>
                      </div>
                    </div>

                    <div 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '14px',
                        background: '#FAF8F5',
                        border: '1px solid #EBE4D8'
                      }}
                    >
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.82rem', color: '#18181B' }}>
                          Organic Human Delay Jitter
                        </strong>
                        <span style={{ fontSize: '0.72rem', color: '#78716C' }}>
                          Adds 3-8 min randomized pauses between connection dispatches
                        </span>
                      </div>
                      <input 
                        type="checkbox"
                        checked={safeJitter}
                        onChange={(e) => setSafeJitter(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#E07A5F', cursor: 'pointer' }}
                      />
                    </div>

                    {activeModal === 'instagram' && (
                      <div 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: '14px',
                          background: '#FAF8F5',
                          border: '1px solid #EBE4D8'
                        }}
                      >
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.82rem', color: '#18181B' }}>
                            7:00 PM IST Autopilot Scheduler
                          </strong>
                          <span style={{ fontSize: '0.72rem', color: '#78716C' }}>
                            Automatically tops up queue & publishes daily at 7:00 PM IST
                          </span>
                        </div>
                        <input 
                          type="checkbox"
                          checked={instaStatus?.autopilot ?? true}
                          onChange={handleToggleAutopilot}
                          style={{ width: '18px', height: '18px', accentColor: '#E1306C', cursor: 'pointer' }}
                        />
                      </div>
                    )}
                  </motion.div>
                )}

                {/* TAB 3: Sequence Loop */}
                {modalTab === 'sequence' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 6 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className={styles.sequenceTimeline}
                  >
                    <div className={styles.timelineStepItem}>
                      <span className={`${styles.timelineDot} ${styles.timelineDotActive}`} />
                      <div className={styles.timelineStepTitle}>
                        <Radio size={13} color="#E07A5F" />
                        <span>Step 1: Intelligent Profile Scan</span>
                      </div>
                      <span className={styles.timelineStepDesc}>
                        REXOIN AI verifies recent activity, job role, and mutual networks before requesting.
                      </span>
                    </div>

                    <div className={styles.timelineStepItem}>
                      <span className={`${styles.timelineDot} ${styles.timelineDotActive}`} />
                      <div className={styles.timelineStepTitle}>
                        <Zap size={13} color="#E07A5F" />
                        <span>Step 2: AI Personalized Hook Sent</span>
                      </div>
                      <span className={styles.timelineStepDesc}>
                        Sends tailored invitation with dynamic context from recipient&apos;s latest accomplishments.
                      </span>
                    </div>

                    <div className={styles.timelineStepItem}>
                      <span className={styles.timelineDot} />
                      <div className={styles.timelineStepTitle}>
                        <Clock size={13} color="#78716C" />
                        <span>Step 3: Response Listener & Smart Nudge</span>
                      </div>
                      <span className={styles.timelineStepDesc}>
                        Monitors acceptance. If accepted, triggers high-value conversation starter after 48h.
                      </span>
                    </div>
                  </motion.div>
                )}

              </div>

              {/* Modal Footer */}
              <div className={styles.modalFooter}>
                <div className={styles.modalFooterLeft}>
                  <ShieldCheck size={16} />
                  <span>100% Anti-Bot Safeguards Active</span>
                </div>
                <div className={styles.modalFooterRight}>
                  <button 
                    type="button" 
                    className={styles.btnCancel}
                    onClick={() => setActiveModal(null)}
                  >
                    Close
                  </button>
                  <button 
                    type="button" 
                    className={`${styles.btnDeploy} ${activeModal === 'linkedin' ? styles.btnDeployLinkedIn : styles.btnDeployInsta}`}
                    onClick={handleConfirmDeploy}
                  >
                    <span>{activeModal === 'instagram' ? 'Launch Instagram Engine' : 'Launch Connection Agent'}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Notification Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            style={{
              position: 'fixed',
              bottom: '28px',
              right: '28px',
              zIndex: 2000,
              backgroundColor: '#111827',
              color: '#FFFFFF',
              padding: '12px 20px',
              borderRadius: '999px',
              boxShadow: '0 12px 28px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.86rem',
              fontWeight: 550
            }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
          >
            <Sparkles size={16} color="#E07A5F" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
