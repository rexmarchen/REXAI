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
  CheckCircle2,
  Search
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
import {
  fetchConnectionStatus,
  saveSocialConnection,
  toggleSocialAutopilot,
  getMetaOAuthUrl
} from '../../services/socialConnectionsApi'
import { reschedulePausedPosts } from '../../services/billingApi'
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
  const userName = user?.fullName || user?.name || 'User'
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
  const [instaAppIdInput, setInstaAppIdInput] = useState('')
  const [instaAppSecretInput, setInstaAppSecretInput] = useState('')
  const [instaContentType, setInstaContentType] = useState('topic') // 'topic' | 'github'
  const [instaGithubRepoInput, setInstaGithubRepoInput] = useState('')
  const [isDiscoveringInstaAccount, setIsDiscoveringInstaAccount] = useState(false)
  const [discoveredInstaAccount, setDiscoveredInstaAccount] = useState(null)
  const [linkedinTokenInput, setLinkedinTokenInput] = useState('')
  const [linkedinClientIdInput, setLinkedinClientIdInput] = useState('')
  const [linkedinClientSecretInput, setLinkedinClientSecretInput] = useState('')
  const [isConnectingAccount, setIsConnectingAccount] = useState(false)
  const [isDiscoveringAccount, setIsDiscoveringAccount] = useState(false)
  const [discoveredAccount, setDiscoveredAccount] = useState(null)
  const [isDisconnectingLinkedIn, setIsDisconnectingLinkedIn] = useState(false)
  const [isTestingInsta, setIsTestingInsta] = useState(false)
  const [linkedinStatus, setLinkedinStatus] = useState(null)

  // SQLite Multi-User Live Telemetry State
  const [connectionStatus, setConnectionStatus] = useState(null)

  // LinkedIn Autonomous Poster & Content Studio State
  const [linkedinTopic, setLinkedinTopic] = useState(
    'System Design & Distributed Systems: How database connection pooling prevents cascading microservice failures under 100k req/sec load.'
  )
  const [linkedinPosterStyle, setLinkedinPosterStyle] = useState('architectural')
  const [linkedinScheduleTimes, setLinkedinScheduleTimes] = useState('09:00 & 18:00 IST')
  const [linkedinApprovalMode, setLinkedinApprovalMode] = useState('auto_publish')
  const [linkedinHandleInput, setLinkedinHandleInput] = useState('')
  const [linkedinAutopilot, setLinkedinAutopilot] = useState(true)
  const [isGeneratingLinkedInPost, setIsGeneratingLinkedInPost] = useState(false)
  const [linkedinStep, setLinkedinStep] = useState(1)
  const [showReconnectInputs, setShowReconnectInputs] = useState(false)

  const isLinkedInConnected = Boolean(connectionStatus?.linkedin?.connected || linkedinStatus?.linkedin?.connected)
  const linkedInAccountName = connectionStatus?.linkedin?.accountName || connectionStatus?.linkedin?.handle || linkedinStatus?.linkedin?.accountName || ''
  const [instaReelPrompt, setInstaReelPrompt] = useState(
    'FLUX.1 cinematic developer showcase + FFmpeg auto-subtitles: Focus on clean code, system architecture, and modern tech stack'
  )
  const [instaScheduleTimes, setInstaScheduleTimes] = useState('17:00 & 19:00 IST')
  const [instaTelegramId, setInstaTelegramId] = useState('8652000706')
  const [instaAutopilot, setInstaAutopilot] = useState(true)
  const [isConnectingMeta, setIsConnectingMeta] = useState(false)
  const [isSavingConnection, setIsSavingConnection] = useState(false)

  // Automation Form Config
  const [dailyTarget, setDailyTarget] = useState(25)
  const [safeJitter, setSafeJitter] = useState(true)
  const [promptNotes, setPromptNotes] = useState(LINKEDIN_TONES[0].template)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Load Live Telemetry from SQLite (/api/connections/status)
  const refreshTelemetry = async () => {
    try {
      const status = await fetchConnectionStatus()
      if (status?.success) {
        setConnectionStatus(status)
        if (status.linkedin?.connected) {
          if (status.linkedin.handle) setLinkedinHandleInput(status.linkedin.handle)
          if (status.linkedin.reelPrompt) setLinkedinTopic(status.linkedin.reelPrompt)
          if (status.linkedin.scheduleTimes) setLinkedinScheduleTimes(status.linkedin.scheduleTimes)
          setLinkedinAutopilot(Boolean(status.linkedin.autopilot))
        }
        if (status.instagram?.connected) {
          if (status.instagram.username) setInstaUsernameInput(status.instagram.username)
          if (status.instagram.accessToken) setInstaTokenInput(status.instagram.accessToken)
          if (status.instagram.appId) setInstaAppIdInput(status.instagram.appId)
          if (status.instagram.appSecret) setInstaAppSecretInput(status.instagram.appSecret)
          if (status.instagram.githubRepo) setInstaGithubRepoInput(status.instagram.githubRepo)
          if (status.instagram.contentType) setInstaContentType(status.instagram.contentType)
          if (status.instagram.reelPrompt) setInstaReelPrompt(status.instagram.reelPrompt)
          if (status.instagram.scheduleTimes) setInstaScheduleTimes(status.instagram.scheduleTimes)
          if (status.instagram.telegramChatId) setInstaTelegramId(status.instagram.telegramChatId)
          setInstaAutopilot(Boolean(status.instagram.autopilot))
        }
      }
    } catch (e) {
      console.warn('[ConnectionsPage] Could not load live telemetry from SQLite:', e.message)
    }
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
    refreshTelemetry()
    refreshInstaData()
    refreshLinkedInData()

    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      if (searchParams.get('instagram_connected') === 'true') {
        const username = searchParams.get('username') || 'creator'
        showToast(`🎉 Instagram Business connected successfully: @${username}`)
        refreshTelemetry()
        refreshInstaData()
        window.history.replaceState({}, document.title, window.location.pathname)
      } else if (searchParams.get('linkedin_connected') === 'true') {
        const account = searchParams.get('account') || 'LinkedIn Member'
        showToast(`🎉 LinkedIn account connected successfully: ${account}`)
        refreshTelemetry()
        refreshLinkedInData()
        window.history.replaceState({}, document.title, window.location.pathname)
      } else if (searchParams.get('error')) {
        showToast(`⚠️ OAuth Notice: ${searchParams.get('error')}`)
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
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

  const handleDiscoverLinkedInAccount = async () => {
    if (!linkedinTokenInput.trim()) {
      showToast('⚠️ Please enter the Access Token of LinkedIn')
      return
    }
    setIsDiscoveringAccount(true)
    try {
      const res = await apiClient.post('/linkedin-automation/discover-account', {
        linkedinAccessToken: linkedinTokenInput.trim(),
        clientId: linkedinClientIdInput.trim(),
        clientSecret: linkedinClientSecretInput.trim()
      })
      if (res?.success && res?.account) {
        setDiscoveredAccount(res.account)
        showToast(res.message || `✓ Account Found: ${res.account.name}`)
      } else {
        showToast(res?.message || 'Could not verify LinkedIn account.')
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Verification error'
      showToast(`❌ ${errorMsg}`)
    } finally {
      setIsDiscoveringAccount(false)
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
        linkedinAccessToken: linkedinTokenInput.trim(),
        clientId: linkedinClientIdInput.trim(),
        clientSecret: linkedinClientSecretInput.trim()
      })
      if (res?.success) {
        showToast(res.message || '🎉 LinkedIn account connected successfully!')
        setShowReconnectInputs(false)
        setDiscoveredAccount(null)
        await refreshLinkedInData()
        await refreshTelemetry()
        setLinkedinStep(2)
      } else {
        showToast(res?.message || 'Save failed')
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Connection error'
      showToast(`❌ Error: ${errorMsg}`)
    } finally {
      setIsConnectingAccount(false)
    }
  }

  const handleDisconnectLinkedIn = async () => {
    setIsDisconnectingLinkedIn(true)
    try {
      const res = await apiClient.post('/linkedin-automation/disconnect')
      if (res?.success) {
        showToast('LinkedIn disconnected. You can now connect a new account.')
        setLinkedinTokenInput('')
        setLinkedinClientIdInput('')
        setLinkedinClientSecretInput('')
        setDiscoveredAccount(null)
        setShowReconnectInputs(true)
        await refreshLinkedInData()
        await refreshTelemetry()
      }
    } catch (err) {
      showToast(`❌ Error: ${err.message}`)
    } finally {
      setIsDisconnectingLinkedIn(false)
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

  const handleConfirmDeploy = async () => {
    if (activeModal === 'linkedin') {
      await handleSaveLinkedInConnection()
    } else if (activeModal === 'instagram') {
      await handleSaveInstagramConnection()
    } else {
      setActiveModal(null)
    }
  }

  const handleGenerateInstaAI = async () => {
    setIsGeneratingInsta(true)
    showToast('✨ Agent is synthesizing Reel, scenes, captions & visual assets...')
    try {
      const chosenTopic = instaContentType === 'github'
        ? (instaGithubRepoInput.trim() || instaTopic)
        : (instaReelPrompt.trim() || instaTopic)

      const res = await apiClient.post('/insta-automation/generate', {
        topic: chosenTopic,
        githubRepo: instaContentType === 'github' ? instaGithubRepoInput.trim() : null,
        kind: 'REEL',
        tone: selectedTone
      })
      if (res?.data?.success || res?.success) {
        showToast('🎉 New Instagram Reel generated and placed in queue!')
        await refreshInstaData()
        await refreshTelemetry()
        setModalTab('queue')
      } else {
        showToast(`❌ Generation notice: ${res?.data?.message || res?.message || 'Check logs'}`)
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

  const handleConnectMetaOAuth = async () => {
    setIsConnectingMeta(true)
    showToast('🔗 Connecting with Meta OAuth...')
    try {
      const res = await getMetaOAuthUrl()
      if (res?.authUrl) {
        const width = 600, height = 700
        const left = window.screen.width / 2 - width / 2
        const top = window.screen.height / 2 - height / 2
        window.open(res.authUrl, 'MetaOAuth', `width=${width},height=${height},top=${top},left=${left}`)
        showToast('🚀 Meta OAuth window opened. Complete authorization to link account.')
      } else {
        showToast('⚠️ Could not generate Meta OAuth URL')
      }
    } catch (err) {
      showToast(`❌ Meta OAuth error: ${err.message}`)
    } finally {
      setIsConnectingMeta(false)
    }
  }

  const handleConnectLinkedInOAuth = async () => {
    const width = 600, height = 700
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2
    try {
      const res = await apiClient.get('/auth/linkedin')
      if (res?.authUrl) {
        window.open(res.authUrl, 'LinkedInOAuth', `width=${width},height=${height},top=${top},left=${left}`)
        showToast('🚀 Official LinkedIn authorization opened. Complete authorization to link account.')
        return
      }
    } catch {
      // Fallback to direct path
    }
    window.open('/api/auth/linkedin', 'LinkedInOAuth', `width=${width},height=${height},top=${top},left=${left}`)
    showToast('🚀 Official LinkedIn authorization opened. Complete authorization to link account.')
  }

  const handleGenerateLinkedInPost = async () => {
    setIsGeneratingLinkedInPost(true)
    showToast('✨ Synthesizing LinkedIn post & generating branded reference visual poster...')
    try {
      const res = await apiClient.post('/linkedin-automation/post-now', {
        topic: linkedinTopic
      })
      if (res?.draft || res?.success) {
        showToast('🎉 Branded LinkedIn post and poster synthesized and published to feed!')
        await refreshLinkedInData()
        await refreshTelemetry()
      } else {
        showToast(res?.message || 'Generated post successfully!')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message
      showToast(`❌ Generation error: ${msg}`)
    } finally {
      setIsGeneratingLinkedInPost(false)
    }
  }

  const handleSaveLinkedInConnection = async () => {
    setIsSavingConnection(true)
    try {
      const handle = linkedinHandleInput.trim() || linkedinStatus?.linkedin?.accountName || userName.toLowerCase().replace(/\s+/g, '-') || 'linkedin_user'
      const res = await saveSocialConnection({
        platform: 'linkedin',
        account_handle: handle,
        access_token: linkedinTokenInput.trim() || 'official_linkedin_session',
        reel_prompt: linkedinTopic.trim(),
        schedule_times: linkedinScheduleTimes.trim(),
        autopilot_enabled: Boolean(linkedinAutopilot)
      })

      // Update backend scheduler settings
      await apiClient.patch('/linkedin-automation/settings', {
        scheduleEnabled: Boolean(linkedinAutopilot),
        approvalMode: linkedinApprovalMode,
        cronTime: '09:00'
      }).catch((e) => console.warn('[LinkedInSettings]', e.message))

      if (res?.success) {
        showToast(`🎉 Saved LinkedIn Poster Agent for @${res.connection?.account_handle || handle} successfully!`)
        await refreshTelemetry()
        await refreshLinkedInData()
        setActiveModal(null)
      } else {
        showToast(res?.message || 'Failed to save LinkedIn connection')
      }
    } catch (err) {
      showToast(`❌ Error saving LinkedIn connection: ${err.message}`)
    } finally {
      setIsSavingConnection(false)
    }
  }

  const handleDiscoverInstaAccount = async () => {
    const token = instaTokenInput.trim()
    if (!token) {
      showToast('⚠️ Please enter your Meta Graph Access Token first')
      return
    }

    setIsDiscoveringInstaAccount(true)
    showToast('🔍 Finding Instagram Business account via Meta Graph API...')
    try {
      const res = await apiClient.post('/insta-automation/discover-account', {
        accessToken: token,
        appId: instaAppIdInput.trim(),
        appSecret: instaAppSecretInput.trim()
      })

      const acc = res?.data?.account || res?.account
      if ((res?.data?.success || res?.success) && acc) {
        setDiscoveredInstaAccount(acc)
        if (acc.username) {
          setInstaUsernameInput(acc.username)
        }
        showToast(res?.data?.message || res?.message || `✓ Verified Instagram Profile: @${acc.username}`)
      } else {
        showToast(res?.data?.message || res?.message || 'Account discovery failed. Please check your token.')
      }
    } catch (err) {
      showToast(`❌ Discovery error: ${err.message}`)
    } finally {
      setIsDiscoveringInstaAccount(false)
    }
  }

  const handleSaveInstagramConnection = async () => {
    setIsSavingConnection(true)
    try {
      const handle = instaUsernameInput.trim().replace(/^@/, '') || 'creator_ig'
      const chosenTopic = instaContentType === 'github'
        ? (instaGithubRepoInput.trim() || instaReelPrompt.trim())
        : instaReelPrompt.trim()

      const res = await saveSocialConnection({
        platform: 'instagram',
        account_handle: handle,
        access_token: instaTokenInput.trim(),
        target_job_titles: discoveredInstaAccount?.igUserId || connectionStatus?.instagram?.igUserId || '',
        reel_prompt: chosenTopic,
        schedule_times: instaScheduleTimes.trim(),
        telegram_chat_id: instaTelegramId.trim(),
        autopilot_enabled: Boolean(instaAutopilot),
        config: {
          appId: instaAppIdInput.trim(),
          appSecret: instaAppSecretInput.trim(),
          igUserId: discoveredInstaAccount?.igUserId || connectionStatus?.instagram?.igUserId || '',
          githubRepo: instaGithubRepoInput.trim(),
          contentType: instaContentType
        }
      })

      if (res?.success) {
        showToast(`🎉 Saved Instagram Agent for @${res.connection.account_handle} to SQLite!`)
        await refreshTelemetry()
        await refreshInstaData()
        setActiveModal(null)
      } else {
        showToast(res?.message || 'Failed to save Instagram connection')
      }
    } catch (err) {
      showToast(`❌ Error saving Instagram connection: ${err.message}`)
    } finally {
      setIsSavingConnection(false)
    }
  }

  const handleToggleAutopilot = async (platform = 'instagram') => {
    const isCurrentlyOn = platform === 'instagram'
      ? Boolean(connectionStatus?.instagram?.autopilot ?? instaStatus?.autopilot)
      : Boolean(connectionStatus?.linkedin?.autopilot)
    const nextState = !isCurrentlyOn

    if (platform === 'linkedin' && linkedinStatus?.subscription && !linkedinStatus.subscription.canPublish && nextState) {
      showToast(`⚠️ Cannot enable autopilot: ${linkedinStatus.subscription.denialReason || 'Active Pro or Elite plan required'}`)
      return
    }

    // Optimistic UI update
    setConnectionStatus(prev => {
      if (!prev) return prev
      return {
        ...prev,
        [platform]: {
          ...prev[platform],
          autopilot: nextState
        }
      }
    })
    if (platform === 'instagram') {
      setInstaStatus(prev => prev ? ({ ...prev, autopilot: nextState }) : prev)
    }

    try {
      let res
      if (platform === 'linkedin') {
        res = nextState ? await apiClient.post('/linkedin-automation/enable') : await apiClient.post('/linkedin-automation/disable')
      } else {
        res = await toggleSocialAutopilot({
          platform,
          autopilot_enabled: nextState
        })
      }
      if (res?.success) {
        showToast(`⚡ ${platform === 'instagram' ? 'Instagram' : 'LinkedIn'} Autopilot: ${nextState ? 'ENABLED' : 'PAUSED'}`)
      }
      await refreshTelemetry()
      if (platform === 'instagram') {
        await refreshInstaData()
      } else {
        await refreshLinkedInData()
      }
    } catch (e) {
      const errMsg = e.response?.data?.message || e.message
      showToast(`Notice: ${errMsg}`)
      await refreshTelemetry()
      await refreshLinkedInData()
    }
  }

  const handleReschedulePausedPosts = async () => {
    try {
      showToast('🔄 Reactivating and rescheduling paused posts...')
      const res = await reschedulePausedPosts()
      if (res?.success) {
        showToast(`🎉 ${res.message || 'Posts reactivated and rescheduled!'}`)
        await refreshLinkedInData()
      } else {
        showToast(res?.message || 'Could not reschedule posts')
      }
    } catch (e) {
      showToast(`Notice: ${e.response?.data?.message || e.message}`)
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

            {user?.role === 'admin' && (
              <button 
                type="button" 
                className={styles.navItem}
                style={{
                  background: 'rgba(224, 122, 95, 0.12)',
                  color: '#E07A5F',
                  fontWeight: 700,
                  border: '1px solid rgba(224, 122, 95, 0.35)',
                  marginTop: '8px'
                }}
                onClick={() => navigate('/admin')}
              >
                <ShieldCheck className={styles.navItemIcon} style={{ color: '#E07A5F' }} />
                <span>Admin Control</span>
              </button>
            )}
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
                {user?.role === 'admin' && (
                  <button 
                    onClick={() => {
                      setProfileMenuOpen(false)
                      navigate('/admin')
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      textAlign: 'left',
                      background: 'rgba(224, 122, 95, 0.12)',
                      border: '1px solid rgba(224, 122, 95, 0.35)',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      color: '#E07A5F',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginBottom: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>🛡️</span>
                    <span>Admin Control Center</span>
                  </button>
                )}
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
                  <strong style={{ color: (connectionStatus?.instagram?.connected || instaStatus?.account?.connected) ? '#E07A5F' : '#78716C' }}>
                    {connectionStatus?.instagram?.connected 
                      ? `@${connectionStatus.instagram.username}` 
                      : (instaStatus?.account?.username ? `@${instaStatus.account.username}` : 'Awaiting Link')}
                  </strong>
                  {(connectionStatus?.instagram?.connected || instaStatus?.account?.connected) && (
                    <span style={{ color: '#059669', marginLeft: '5px', fontWeight: 700 }}>
                      ({connectionStatus?.instagram?.queueCount ?? (instaStatus?.postCounts?.total ?? 32)} assets, {instaStatus?.postCounts?.published ?? 4} live)
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.76rem' }}>
                  <span style={{ color: '#78716C' }}>Queue Buffer: </span>
                  <strong style={{ color: '#18181B' }}>
                    {connectionStatus?.instagram?.queueCount ?? (instaQueue.length || instaStatus?.postCounts?.approved || 10)} ready
                  </strong>
                  <span style={{ color: '#78716C', marginLeft: '4px' }}>
                    [{connectionStatus?.instagram?.scheduleTimes || '17:00 & 19:00 IST'}]
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem' }}>
                  <span style={{ color: '#78716C' }}>Telegram Control: </span>
                  <strong style={{ color: connectionStatus?.instagram?.telegramChatId ? '#059669' : '#78716C' }}>
                    {connectionStatus?.instagram?.telegramChatId 
                      ? `Connected (@${connectionStatus.instagram.telegramChatId})` 
                      : (instaStatus?.account?.connected ? 'Connected (@8652000706)' : 'Awaiting Link')}
                  </strong>
                </div>
                <div style={{ fontSize: '0.76rem' }}>
                  <span style={{ color: '#78716C' }}>LinkedIn Radar: </span>
                  <strong data-testid="linkedin-radar-badge" style={{ color: (connectionStatus?.linkedin?.connected || linkedinStatus?.linkedin?.connected) ? '#0A66C2' : '#78716C' }}>
                    {connectionStatus?.linkedin?.connected 
                      ? `Connected (@${connectionStatus.linkedin.handle || connectionStatus.linkedin.accountName || 'Active'})` 
                      : (linkedinStatus?.linkedin?.connected ? `Connected (${linkedinStatus.linkedin.accountName})` : 'Awaiting Link')}
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
                  {(connectionStatus?.linkedin?.connected || linkedinStatus?.linkedin?.connected) ? (
                    <span className={styles.cardBadgePopular} style={{ background: '#E8F2FC', color: '#0A66C2' }}>
                      @{connectionStatus?.linkedin?.handle || connectionStatus?.linkedin?.accountName || linkedinStatus?.linkedin?.accountName || 'Active'} • {(connectionStatus?.linkedin?.autopilot ?? linkedinStatus?.settings?.scheduleEnabled) ? 'Autopilot ON' : 'Paused'}
                    </span>
                  ) : (
                    <span className={styles.cardBadgePopular}>POSTER ENGINE</span>
                  )}
                </div>

                <h3 className={styles.cardTitle}>LinkedIn Automation</h3>
                <p className={styles.cardSubtitle}>
                  Automated technical articles and architecture infographics published directly to your LinkedIn feed.
                </p>

                {/* Subscription & Entitlement Status Pill / Banner */}
                {linkedinStatus?.subscription && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    margin: '10px 0 14px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: linkedinStatus.subscription.canPublish ? '#F0FDF4' : '#FEF2F2',
                    border: `1px solid ${linkedinStatus.subscription.canPublish ? '#BBF7D0' : '#FECACA'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={15} color={linkedinStatus.subscription.canPublish ? '#16A34A' : '#DC2626'} />
                        <span style={{ fontWeight: 800, fontSize: '0.78rem', color: linkedinStatus.subscription.canPublish ? '#166534' : '#991B1B' }}>
                          {linkedinStatus.subscription.planName || 'Plan'} Tier
                        </span>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: linkedinStatus.subscription.canPublish ? '#DCFCE7' : '#FEE2E2',
                          color: linkedinStatus.subscription.canPublish ? '#15803D' : '#B91C1C',
                          textTransform: 'uppercase'
                        }}>
                          {linkedinStatus.subscription.canPublish ? 'Eligible' : (linkedinStatus.subscription.entitlementStatus || 'Suspended')}
                        </span>
                      </div>
                      <div>
                        {linkedinStatus.subscription.canPublish ? (
                          <span style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 600 }}>
                            {linkedinStatus.subscription.limitRemaining} of {linkedinStatus.subscription.dailyPostLimit} posts left today
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate('/workspace?tab=billing')}
                            style={{
                              background: '#DC2626',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Upgrade to Pro
                          </button>
                        )}
                      </div>
                    </div>

                    {!linkedinStatus.subscription.canPublish && (
                      <div style={{ fontSize: '0.73rem', color: '#991B1B', lineHeight: 1.35 }}>
                        ⚠️ Publishing suspended: {linkedinStatus.subscription.denialReason || 'Active Pro or Elite plan required.'}
                      </div>
                    )}

                    {Boolean(linkedinStatus.subscription.pausedPostsCount > 0) && (
                      <div style={{
                        marginTop: '4px',
                        padding: '6px 8px',
                        background: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.72rem',
                        color: '#92400E'
                      }}>
                        <span>⏸️ {linkedinStatus.subscription.pausedPostsCount} queued posts paused</span>
                        <button
                          type="button"
                          onClick={handleReschedulePausedPosts}
                          style={{
                            background: '#D97706',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '2px 8px',
                            fontSize: '0.70rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Reschedule All
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Features & Visual Floating Mockup */}
                <div className={styles.cardSplitArea}>
                  
                  {/* Left: 4 Features */}
                  <div className={styles.featureList}>
                    <div className={styles.featureItem}>
                      <Film className={styles.featureIcon} />
                      <span>Architecture & Infographic Posters</span>
                    </div>
                    <div className={styles.featureItem}>
                      <Zap className={styles.featureIcon} />
                      <span>Technical System Design Content</span>
                    </div>
                    <div className={styles.featureItem}>
                      <Calendar className={styles.featureIcon} />
                      <span>Scheduled Publishing (09:00 & 18:00 IST)</span>
                    </div>
                    <div className={styles.featureItem}>
                      <ShieldCheck className={styles.featureIcon} />
                      <span>Custom Topics & Approval Controls</span>
                    </div>
                  </div>

                  {/* Right: Floating LinkedIn Post Mockup */}
                  <div className={styles.mockupContainerLinkedIn}>
                    <div className={styles.blobLinkedIn} />
                    
                    <div 
                      className={styles.mockupCardLinkedIn}
                      onClick={() => handleStartAutomation('linkedin')}
                      style={{ cursor: 'pointer' }}
                      title="Click to open LinkedIn Poster Studio"
                    >
                      <div className={styles.mockupTopLinkedIn}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className={styles.mockupLogoText}>LinkedIn</span>
                          <span style={{ fontSize: '0.62rem', color: '#6B7280' }}>• Feed Post</span>
                        </div>
                        <span className={styles.mockupDots}>•••</span>
                      </div>

                      <div className={styles.mockupProfileRow}>
                        <img 
                          src={linkedinStatus?.linkedin?.avatar || userAvatar} 
                          alt="Profile Avatar" 
                          className={styles.mockupAvatar}
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
                          }}
                        />
                        <div className={styles.mockupProfileMeta}>
                          <strong>{isLinkedInConnected ? linkedInAccountName : (userName || 'LinkedIn Member')}</strong>
                          <span>Software Engineer • System Design & AI</span>
                        </div>
                      </div>

                      {/* Branded Visual Architecture Card Preview */}
                      <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #DCE6F1', background: 'linear-gradient(135deg, #0A66C2 0%, #003666 100%)', color: '#FFFFFF', padding: '10px 12px', marginBottom: '8px' }}>
                        <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#93C5FD', fontWeight: 800 }}>
                          ⚡ ARCHITECTURE REFERENCE POSTER
                        </div>
                        <div style={{ fontSize: '0.74rem', fontWeight: 700, margin: '4px 0 6px', color: '#FFFFFF', lineHeight: 1.25 }}>
                          High-Throughput Microservice Resiliency & Database Connection Pooling
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <span style={{ background: 'rgba(255,255,255,0.18)', borderRadius: '4px', padding: '2px 5px', fontSize: '0.58rem' }}>#SystemDesign</span>
                          <span style={{ background: 'rgba(255,255,255,0.18)', borderRadius: '4px', padding: '2px 5px', fontSize: '0.58rem' }}>#Backend</span>
                          <span style={{ background: 'rgba(255,255,255,0.18)', borderRadius: '4px', padding: '2px 5px', fontSize: '0.58rem' }}>#CleanCode</span>
                        </div>
                      </div>

                      {/* Feed Interaction Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.64rem', color: '#6B7280', paddingTop: '4px', borderTop: '1px solid #F3F4F6' }}>
                        <span>👍 142 Likes</span>
                        <span>💬 28 Comments • 12 Reposts</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Bottom Section: Primary Button & Autopilot Toggle */}
              <div className={styles.cardBottomSection}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <button 
                    type="button" 
                    className={styles.startAutomationBtn}
                    onClick={() => handleStartAutomation('linkedin')}
                  >
                    <span>Configure LinkedIn</span>
                    <ArrowRight size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleAutopilot('linkedin')}
                    style={{
                      background: (connectionStatus?.linkedin?.autopilot ?? linkedinStatus?.settings?.scheduleEnabled) ? '#E8F2FC' : '#F4F4F5',
                      border: `1px solid ${(connectionStatus?.linkedin?.autopilot ?? linkedinStatus?.settings?.scheduleEnabled) ? '#0A66C2' : '#D4D4D8'}`,
                      color: (connectionStatus?.linkedin?.autopilot ?? linkedinStatus?.settings?.scheduleEnabled) ? '#0A66C2' : '#71717A',
                      padding: '9px 14px',
                      borderRadius: '12px',
                      fontSize: '0.80rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <RefreshCw size={13} style={{ animation: (connectionStatus?.linkedin?.autopilot ?? linkedinStatus?.settings?.scheduleEnabled) ? 'spin 3s linear infinite' : 'none' }} />
                    <span>Autopilot: {(connectionStatus?.linkedin?.autopilot ?? linkedinStatus?.settings?.scheduleEnabled) ? 'ON' : 'PAUSED'}</span>
                  </button>
                </div>

                <div className={styles.socialProofRow}>
                  <span className={styles.socialProofText}>
                    {isLinkedInConnected
                      ? `Connected: ${linkedInAccountName} • Scheduled for 09:00 & 18:00 IST`
                      : 'Connect your LinkedIn account to enable automated publishing'}
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
                    {(connectionStatus?.instagram?.connected || instaStatus?.account?.connected) ? (
                      <span className={`${styles.instaLiveStatusBadge} ${(connectionStatus?.instagram?.autopilot ?? instaStatus?.autopilot) ? styles.instaLiveStatusBadgeActive : ''}`}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                        @{connectionStatus?.instagram?.username || instaStatus?.account?.username || 'anshu._io'} • {(connectionStatus?.instagram?.autopilot ?? instaStatus?.autopilot) ? 'Autopilot ON' : 'Paused'}
                      </span>
                    ) : (
                      <span className={styles.cardBadgeNew}>READY TO CONNECT</span>
                    )}
                  </div>
                </div>

                <h3 className={styles.cardTitle}>Instagram Automation</h3>
                <p className={styles.cardSubtitle}>
                  Automated developer Reels and project showcase videos synthesized and published to Instagram.
                </p>

                {/* Features & Visual Floating Mockup */}
                <div className={styles.cardSplitArea}>
                  
                  {/* Left: 4 Features */}
                  <div className={styles.featureList}>
                    <div className={styles.featureItem}>
                      <Film className={styles.featureIcon} />
                      <span>Developer Video Reels & Demos</span>
                    </div>
                    <div className={styles.featureItem}>
                      <Calendar className={styles.featureIcon} />
                      <span>Scheduled Publishing (17:00 & 19:00 IST)</span>
                    </div>
                    <div className={styles.featureItem}>
                      <TrendingUp className={styles.featureIcon} />
                      <span>GitHub Repos & Custom Topics</span>
                    </div>
                    <div className={styles.featureItem}>
                      <Heart className={styles.featureIcon} />
                      <span>Telegram Updates & Direct Controls</span>
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
                    <span>Configure Instagram</span>
                    <ArrowRight size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleAutopilot('instagram')}
                    style={{
                      padding: '9px 16px',
                      borderRadius: '999px',
                      background: (connectionStatus?.instagram?.autopilot ?? instaStatus?.autopilot) ? '#ECFDF5' : '#FEF2F2',
                      color: (connectionStatus?.instagram?.autopilot ?? instaStatus?.autopilot) ? '#059669' : '#DC2626',
                      border: `1px solid ${(connectionStatus?.instagram?.autopilot ?? instaStatus?.autopilot) ? '#A7F3D0' : '#FECACA'}`,
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
                    <span>Autopilot: {(connectionStatus?.instagram?.autopilot ?? instaStatus?.autopilot) ? 'ON' : 'PAUSED'}</span>
                  </button>
                </div>

                <div className={styles.socialProofRow}>
                  <span className={styles.socialProofText}>
                    {(connectionStatus?.instagram?.connected || instaStatus?.account?.connected)
                      ? `Connected: @${connectionStatus?.instagram?.username || instaStatus?.account?.username || 'anshu._io'} • Scheduled for 17:00 & 19:00 IST`
                      : 'Connect your Meta credentials to enable automated Reel publishing'}
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
                    {activeModal === 'linkedin' ? 'LinkedIn Automation' : 'Instagram Automation'}
                  </h3>
                  <p className={styles.modalSubtitle}>
                    {activeModal === 'instagram' 
                      ? 'Configure Meta API credentials, Reel sources, and publishing schedule.'
                      : 'Configure account credentials, technical topics, and publishing schedule.'}
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
                    <strong>{activeModal === 'instagram' ? (connectionStatus?.instagram?.username ? `@${connectionStatus.instagram.username}` : userName) : linkedInAccountName}</strong>
                    <span>{activeModal === 'instagram' ? 'Instagram Profile' : (isLinkedInConnected ? 'Connected Account' : 'LinkedIn Profile')}</span>
                  </div>
                </div>

                {/* Central Laser Beam & AI Matching */}
                <div className={styles.centerBeam}>
                  <div className={styles.laserLine}>
                    <div className={`${styles.laserPulse} ${activeModal === 'instagram' ? styles.laserPulseInsta : ''}`} />
                  </div>
                  <div className={`${styles.aiBadgePill} ${activeModal === 'instagram' ? styles.aiBadgePillInsta : ''}`}>
                    <Cpu size={11} />
                    <span>{activeModal === 'instagram' ? 'REEL PIPELINE' : 'POST PIPELINE'}</span>
                  </div>
                </div>

                {/* Node 2: Feed Target */}
                <div className={styles.nodeBox}>
                  <div className={`${styles.nodeAvatarWrap} ${activeModal === 'instagram' ? styles.nodeAvatarWrapInsta : ''}`}>
                    <img 
                      src={activeModal === 'linkedin' 
                        ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80' 
                        : targetProfile.avatar} 
                      alt="Target"
                      className={styles.nodeAvatar}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80'
                      }}
                    />
                  </div>
                  <div className={styles.nodeMeta}>
                    <strong>{activeModal === 'linkedin' ? 'LinkedIn Feed' : 'Instagram Feed'}</strong>
                    <span>Direct Publisher</span>
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
                  <span>Configuration</span>
                </button>

                {activeModal === 'instagram' && (
                  <>
                    <button
                      type="button"
                      className={`${styles.modalTabBtn} ${modalTab === 'queue' ? styles.modalTabBtnActive : ''}`}
                      onClick={() => setModalTab('queue')}
                    >
                      <Film size={13} />
                      <span>Queue ({instaQueue.length || instaStatus?.postCounts?.approved || 10})</span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.modalTabBtn} ${modalTab === 'history' ? styles.modalTabBtnActive : ''}`}
                      onClick={() => setModalTab('history')}
                    >
                      <CheckCircle2 size={13} />
                      <span>Published ({instaHistory.length || instaStatus?.postCounts?.published || 4})</span>
                    </button>
                  </>
                )}

                {activeModal === 'linkedin' && (
                  <button
                    type="button"
                    className={`${styles.modalTabBtn} ${modalTab === 'queue' ? styles.modalTabBtnActive : ''}`}
                    onClick={() => setModalTab('queue')}
                  >
                    <Film size={13} />
                    <span>Queue & Drafts ({linkedinStatus?.drafts?.length || 0})</span>
                  </button>
                )}
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
                    {activeModal === 'linkedin' ? (
                      /* ==================== LINKEDIN STEP-BY-STEP AUTONOMOUS SETUP WIZARD ==================== */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        
                        {/* Step Progress Stepper Bar */}
                        <div className={styles.stepProgressBar} style={{ margin: '-16px -24px 4px', borderTop: 'none' }}>
                          <button
                            type="button"
                            className={styles.stepProgressItem}
                            onClick={() => setLinkedinStep(1)}
                          >
                            <span className={`${styles.stepNumberCircle} ${linkedinStep === 1 ? styles.stepNumberActive : (isLinkedInConnected ? styles.stepNumberDone : '')}`}>
                              {isLinkedInConnected ? '✓' : '1'}
                            </span>
                            <div className={styles.stepTextWrapper}>
                              <span className={styles.stepTextTitle}>Step 1: Link Account</span>
                              <span className={styles.stepTextSubtitle}>
                                {isLinkedInConnected ? 'Linked' : 'OAuth / Token'}
                              </span>
                            </div>
                          </button>

                          <div className={styles.stepDivider} />

                          <button
                            type="button"
                            className={styles.stepProgressItem}
                            onClick={() => setLinkedinStep(2)}
                          >
                            <span className={`${styles.stepNumberCircle} ${linkedinStep === 2 ? styles.stepNumberActive : (linkedinStep > 2 ? styles.stepNumberDone : '')}`}>
                              {linkedinStep > 2 ? '✓' : '2'}
                            </span>
                            <div className={styles.stepTextWrapper}>
                              <span className={styles.stepTextTitle}>Step 2: Topic & Poster</span>
                              <span className={styles.stepTextSubtitle}>Style & Prompts</span>
                            </div>
                          </button>

                          <div className={styles.stepDivider} />

                          <button
                            type="button"
                            className={styles.stepProgressItem}
                            onClick={() => setLinkedinStep(3)}
                          >
                            <span className={`${styles.stepNumberCircle} ${linkedinStep === 3 ? styles.stepNumberActive : ''}`}>
                              3
                            </span>
                            <div className={styles.stepTextWrapper}>
                              <span className={styles.stepTextTitle}>Step 3: Schedule & Deploy</span>
                              <span className={styles.stepTextSubtitle}>Autopilot: {linkedinAutopilot ? 'ON' : 'OFF'}</span>
                            </div>
                          </button>
                        </div>

                        {/* ================= STEP 1: LINK ACCOUNT ================= */}
                        {linkedinStep === 1 && (
                          <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={styles.wizardStepCard}
                          >
                            <div className={styles.wizardStepHeader}>
                              <span className={styles.wizardStepBadge}>Step 1 of 3</span>
                              <div>
                                <h4 className={styles.wizardStepTitle}>Connect Your LinkedIn Account</h4>
                                <p className={styles.wizardStepSubtitle}>
                                  Authorize REXION to publish AI-synthesized technical articles and branded reference posters directly to your profile.
                                </p>
                              </div>
                            </div>

                            {/* Verified Active Connection Card */}
                            {isLinkedInConnected && !showReconnectInputs ? (
                              <div style={{
                                padding: '18px 20px',
                                borderRadius: '14px',
                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(10, 102, 194, 0.05) 100%)',
                                border: '1.5px solid rgba(16, 185, 129, 0.4)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '14px'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{
                                      width: '46px',
                                      height: '46px',
                                      borderRadius: '12px',
                                      background: '#0A66C2',
                                      color: '#FFFFFF',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '1.25rem',
                                      fontWeight: 800,
                                      boxShadow: '0 4px 12px rgba(10,102,194,0.3)'
                                    }}>
                                      in
                                    </div>
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <strong style={{ fontSize: '0.96rem', color: '#18181B' }}>{linkedInAccountName || 'LinkedIn Account'}</strong>
                                        <span style={{
                                          background: '#DCFCE7',
                                          color: '#15803D',
                                          fontSize: '0.66rem',
                                          fontWeight: 800,
                                          padding: '2px 8px',
                                          borderRadius: '999px',
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.04em'
                                        }}>
                                          ✓ Active & Linked
                                        </span>
                                      </div>
                                      <span style={{ fontSize: '0.74rem', color: '#57534E', display: 'block', marginTop: '2px' }}>
                                        Person URN: {linkedinStatus?.linkedin?.personUrn || connectionStatus?.linkedin?.targetJobTitles || 'Active'} • Token Active in Vault
                                      </span>
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button
                                      type="button"
                                      onClick={() => setLinkedinStep(2)}
                                      style={{
                                        background: 'linear-gradient(135deg, #0A66C2 0%, #004182 100%)',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        borderRadius: '999px',
                                        padding: '10px 22px',
                                        fontSize: '0.84rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        boxShadow: '0 4px 14px rgba(10,102,194,0.3)'
                                      }}
                                    >
                                      <span>Continue to Step 2: Topics & Style</span>
                                      <ArrowRight size={15} />
                                    </button>
                                  </div>
                                </div>

                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '8px 12px',
                                  background: 'rgba(255, 255, 255, 0.85)',
                                  borderRadius: '8px',
                                  fontSize: '0.74rem',
                                  border: '1px solid rgba(0, 0, 0, 0.06)'
                                }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803D', fontWeight: 600 }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                                    Status: {linkedinStatus?.agentHealth?.online ? 'Connected & Active' : 'Ready'}
                                  </span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button
                                      type="button"
                                      onClick={() => setShowReconnectInputs(true)}
                                      style={{ background: 'none', border: 'none', color: '#0A66C2', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.72rem', fontWeight: 600 }}
                                    >
                                      Update Token / Credentials
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleDisconnectLinkedIn}
                                      disabled={isDisconnectingLinkedIn}
                                      style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.72rem', fontWeight: 600 }}
                                    >
                                      {isDisconnectingLinkedIn ? 'Disconnecting...' : 'Disconnect Account'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {/* 3-Field Credentials Box */}
                                <div style={{
                                  padding: '18px 20px',
                                  borderRadius: '14px',
                                  background: '#FFFFFF',
                                  border: '1.5px solid #E2E8F0',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '12px'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                                    <div>
                                      <strong style={{ fontSize: '0.90rem', color: '#0F172A', display: 'block' }}>
                                        LinkedIn Developer Credentials
                                      </strong>
                                      <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                                        Enter your LinkedIn Access Token and OAuth App credentials.
                                      </span>
                                    </div>
                                    {showReconnectInputs && isLinkedInConnected && (
                                      <button
                                        type="button"
                                        onClick={() => setShowReconnectInputs(false)}
                                        style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline' }}
                                      >
                                        ← Back to connected account
                                      </button>
                                    )}
                                  </div>

                                  {/* Field 1: Access token of Linkdin */}
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>
                                      LinkedIn Access Token <span style={{ color: '#DC2626' }}>*</span>
                                    </label>
                                    <input
                                      type="password"
                                      value={linkedinTokenInput}
                                      onChange={(e) => {
                                        setLinkedinTokenInput(e.target.value)
                                        setDiscoveredAccount(null)
                                      }}
                                      placeholder="AQE... or AQX... access token (w_member_social)"
                                      style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.80rem', background: '#F8FAFC' }}
                                    />
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    {/* Field 2: Client ID */}
                                    <div>
                                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>
                                        Client ID
                                      </label>
                                      <input
                                        type="text"
                                        value={linkedinClientIdInput}
                                        onChange={(e) => setLinkedinClientIdInput(e.target.value)}
                                        placeholder="e.g. 78xxxxxxxxxxxx"
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.80rem', background: '#F8FAFC' }}
                                      />
                                    </div>

                                    {/* Field 3: Primary Client Secret */}
                                    <div>
                                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>
                                        Client Secret
                                      </label>
                                      <input
                                        type="password"
                                        value={linkedinClientSecretInput}
                                        onChange={(e) => setLinkedinClientSecretInput(e.target.value)}
                                        placeholder="e.g. WPL_AP1_xxxxxxxxxxxx"
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.80rem', background: '#F8FAFC' }}
                                      />
                                    </div>
                                  </div>

                                  {/* Discovery Button */}
                                  <div style={{ display: 'flex', gap: '10px', marginTop: '2px', flexWrap: 'wrap' }}>
                                    <button
                                      type="button"
                                      onClick={handleDiscoverLinkedInAccount}
                                      disabled={isDiscoveringAccount || !linkedinTokenInput.trim()}
                                      style={{
                                        padding: '10px 18px',
                                        borderRadius: '10px',
                                        background: 'linear-gradient(135deg, #0A66C2 0%, #004182 100%)',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        fontSize: '0.82rem',
                                        fontWeight: 700,
                                        cursor: linkedinTokenInput.trim() ? 'pointer' : 'not-allowed',
                                        opacity: linkedinTokenInput.trim() ? 1 : 0.6,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        boxShadow: '0 4px 12px rgba(10,102,194,0.25)'
                                      }}
                                    >
                                      <Search size={15} />
                                      <span>{isDiscoveringAccount ? 'Verifying Account...' : 'Verify Account'}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={handleConnectLinkedInOAuth}
                                      style={{
                                        padding: '10px 16px',
                                        borderRadius: '10px',
                                        background: '#F1F5F9',
                                        color: '#0A66C2',
                                        border: '1px solid #CBD5E1',
                                        fontSize: '0.80rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                      }}
                                    >
                                      <Zap size={14} />
                                      <span>Connect with OAuth</span>
                                    </button>
                                  </div>

                                  {/* Discovered Account Display Card */}
                                  {discoveredAccount && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 6 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      style={{
                                        marginTop: '8px',
                                        padding: '14px 16px',
                                        borderRadius: '12px',
                                        background: '#F0FDF4',
                                        border: '1.5px solid #86EFAC',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '12px'
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                          width: '44px',
                                          height: '44px',
                                          borderRadius: '50%',
                                          background: '#0A66C2',
                                          color: '#FFFFFF',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '1.1rem',
                                          fontWeight: 800,
                                          overflow: 'hidden'
                                        }}>
                                          {discoveredAccount.picture ? (
                                            <img src={discoveredAccount.picture} alt={discoveredAccount.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                          ) : (
                                            'in'
                                          )}
                                        </div>
                                        <div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <strong style={{ fontSize: '0.94rem', color: '#14532D' }}>{discoveredAccount.name}</strong>
                                            <span style={{
                                              background: '#DCFCE7',
                                              color: '#15803D',
                                              fontSize: '0.65rem',
                                              fontWeight: 800,
                                              padding: '2px 8px',
                                              borderRadius: '999px',
                                              textTransform: 'uppercase'
                                            }}>
                                              Account Identified
                                            </span>
                                          </div>
                                          <span style={{ fontSize: '0.72rem', color: '#166534', display: 'block', marginTop: '2px' }}>
                                            Person URN: {discoveredAccount.personUrn} • Verified via LinkedIn API
                                          </span>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={handleSaveLinkedInToken}
                                        disabled={isConnectingAccount}
                                        style={{
                                          padding: '9px 18px',
                                          borderRadius: '999px',
                                          background: '#16A34A',
                                          color: '#FFFFFF',
                                          border: 'none',
                                          fontSize: '0.82rem',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                                        }}
                                      >
                                        <CheckCircle2 size={15} />
                                        <span>{isConnectingAccount ? 'Linking...' : 'Connect This Account & Continue to Step 2 →'}</span>
                                      </button>
                                    </motion.div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Bottom Navigation */}
                            <div className={styles.wizardBottomNav}>
                              <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 600 }}>
                                {isLinkedInConnected ? '✓ Profile Connected to Vault' : 'ℹ️ You can also proceed and test generation first'}
                              </span>
                              <button
                                type="button"
                                className={styles.btnWizardNext}
                                onClick={() => setLinkedinStep(2)}
                              >
                                <span>Continue to Step 2</span>
                                <ArrowRight size={14} />
                              </button>
                            </div>
                          </motion.div>
                        )}

                        {/* ================= STEP 2: TOPIC & POSTER STYLE ================= */}
                        {linkedinStep === 2 && (
                          <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={styles.wizardStepCard}
                          >
                            <div className={styles.wizardStepHeader}>
                              <span className={styles.wizardStepBadge}>Step 2 of 3</span>
                              <div>
                                <h4 className={styles.wizardStepTitle}>Topic & Poster Style</h4>
                                <p className={styles.wizardStepSubtitle}>
                                  Select your engineering focus and visual layout for automated posts.
                                </p>
                              </div>
                            </div>

                            {/* Post Topic & Prompt */}
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#18181B' }}>
                                  Topic & Technical Focus
                                </label>
                                <span style={{ fontSize: '0.70rem', color: '#78716C' }}>Markdown & code supported</span>
                              </div>
                              <textarea
                                value={linkedinTopic}
                                onChange={(e) => setLinkedinTopic(e.target.value)}
                                rows={2}
                                placeholder="e.g. System Design: How connection pooling prevents cascading microservice failures under high load."
                                style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '0.82rem', background: '#FFFFFF', resize: 'vertical' }}
                              />
                              {/* Popular Quick Topics */}
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                                <span style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>Tap to insert:</span>
                                {[
                                  'Distributed Systems',
                                  'AI Agents & LoRA',
                                  'Database Performance',
                                  'Backend Scalability'
                                ].map((topic) => (
                                  <button
                                    key={topic}
                                    type="button"
                                    onClick={() => setLinkedinTopic(topic)}
                                    style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '2px 8px', fontSize: '0.68rem', cursor: 'pointer', color: '#374151' }}
                                  >
                                    + {topic}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Visual Poster Composition Style */}
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#18181B', marginBottom: '6px' }}>
                                Poster Visual Style
                              </label>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {[
                                  { id: 'architectural', name: '📐 System Architecture', desc: 'Architecture diagrams and technical blueprints' },
                                  { id: 'minimalist', name: '⚡ Tech Minimalist', desc: 'Clean dark layout with high contrast' },
                                  { id: 'flowchart', name: '💻 Code & Flowchart', desc: 'Data flow schemas and logic flowcharts' },
                                  { id: 'insights', name: '🎯 Key Takeaways', desc: 'Engineering metrics and key takeaways' }
                                ].map((style) => (
                                  <div
                                    key={style.id}
                                    onClick={() => setLinkedinPosterStyle(style.id)}
                                    style={{
                                      border: `1.5px solid ${linkedinPosterStyle === style.id ? '#0A66C2' : '#E5E7EB'}`,
                                      background: linkedinPosterStyle === style.id ? '#F0F7FF' : '#FFFFFF',
                                      borderRadius: '10px',
                                      padding: '8px 10px',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    <strong style={{ fontSize: '0.74rem', color: '#18181B', display: 'block' }}>{style.name}</strong>
                                    <span style={{ fontSize: '0.65rem', color: '#6B7280' }}>{style.desc}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Bottom Navigation */}
                            <div className={styles.wizardBottomNav}>
                              <button
                                type="button"
                                className={styles.btnWizardBack}
                                onClick={() => setLinkedinStep(1)}
                              >
                                ← Back to Step 1
                              </button>
                              <button
                                type="button"
                                className={styles.btnWizardNext}
                                onClick={() => setLinkedinStep(3)}
                              >
                                <span>Next: Schedule & Publish</span>
                                <ArrowRight size={14} />
                              </button>
                            </div>
                          </motion.div>
                        )}

                        {/* ================= STEP 3: SCHEDULE & ACTIVATE AUTOPILOT ================= */}
                        {linkedinStep === 3 && (
                          <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={styles.wizardStepCard}
                          >
                            <div className={styles.wizardStepHeader}>
                              <span className={styles.wizardStepBadge}>Step 3 of 3</span>
                              <div>
                                <h4 className={styles.wizardStepTitle}>Schedule & Publishing Settings</h4>
                                <p className={styles.wizardStepSubtitle}>
                                  Configure your posting times and automation preferences.
                                </p>
                              </div>
                            </div>

                            {/* Schedule & Approval Mode Controls */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px', alignItems: 'center' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#18181B', marginBottom: '4px' }}>
                                  Publishing Schedule (IST)
                                </label>
                                <input
                                  type="text"
                                  value={linkedinScheduleTimes}
                                  onChange={(e) => setLinkedinScheduleTimes(e.target.value)}
                                  placeholder="09:00 & 18:00 IST"
                                  style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '0.80rem', background: '#FFFFFF' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#18181B', marginBottom: '4px' }}>
                                  Approval Mode
                                </label>
                                <select
                                  value={linkedinApprovalMode}
                                  onChange={(e) => setLinkedinApprovalMode(e.target.value)}
                                  style={{ width: '100%', padding: '9px 10px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '0.80rem', background: '#FFFFFF' }}
                                >
                                  <option value="auto_publish">Auto-Publish to Feed</option>
                                  <option value="draft_approve">Save Draft for Review</option>
                                </select>
                              </div>
                            </div>

                            {/* Autopilot Box */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 14px',
                              borderRadius: '12px',
                              background: linkedinAutopilot ? 'rgba(16,185,129,0.06)' : '#FAF8F5',
                              border: `1.5px solid ${linkedinAutopilot ? '#10B981' : '#EBE4D8'}`,
                              flexWrap: 'wrap',
                              gap: '8px'
                            }}>
                              <div>
                                <strong style={{ fontSize: '0.82rem', color: '#18181B', display: 'block' }}>
                                  {linkedinAutopilot ? 'Autopilot Active' : 'Autopilot Paused'}
                                </strong>
                                <span style={{ fontSize: '0.72rem', color: '#78716C' }}>
                                  Generates technical posts and diagrams on your schedule.
                                </span>
                              </div>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: '#18181B' }}>
                                <input
                                  type="checkbox"
                                  checked={linkedinAutopilot}
                                  onChange={(e) => setLinkedinAutopilot(e.target.checked)}
                                  style={{ width: '18px', height: '18px', accentColor: '#0A66C2' }}
                                />
                                <span>Daily Autopilot: {linkedinAutopilot ? 'ON' : 'OFF'}</span>
                              </label>
                            </div>

                            {/* Instant Live Test Generator Button */}
                            <div style={{ marginTop: '2px' }}>
                              <button
                                type="button"
                                onClick={handleGenerateLinkedInPost}
                                disabled={isGeneratingLinkedInPost}
                                style={{
                                  width: '100%',
                                  background: 'linear-gradient(135deg, #0A66C2 0%, #004182 100%)',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '10px',
                                  padding: '11px 16px',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  cursor: isGeneratingLinkedInPost ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  boxShadow: '0 4px 12px rgba(10,102,194,0.25)',
                                  opacity: isGeneratingLinkedInPost ? 0.7 : 1
                                }}
                              >
                                {isGeneratingLinkedInPost ? (
                                  <>
                                    <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                    <span>Generating Post...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles size={14} />
                                    <span>Generate & Post Now</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Bottom Navigation */}
                            <div className={styles.wizardBottomNav}>
                              <button
                                type="button"
                                className={styles.btnWizardBack}
                                onClick={() => setLinkedinStep(2)}
                              >
                                ← Back to Step 2
                              </button>
                              <button
                                type="button"
                                className={styles.btnWizardNext}
                                onClick={handleConfirmDeploy}
                                disabled={isSavingConnection}
                              >
                                <CheckCircle2 size={14} />
                                <span>{isSavingConnection ? 'Saving...' : 'Save Configuration'}</span>
                              </button>
                            </div>
                          </motion.div>
                        )}

                      </div>
                    ) : (
                      /* ==================== INSTAGRAM CONFIGURATION MODAL ==================== */
                      <>
                        {/* 1. Meta Developer & Graph API Credentials Card */}
                        <div style={{ padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(224,122,95,0.06) 0%, rgba(198,78,46,0.03) 100%)', border: '1px solid rgba(224,122,95,0.22)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div>
                              <strong style={{ fontSize: '0.86rem', color: '#C64E2E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Zap size={14} /> Meta Graph API & Instagram Credentials
                              </strong>
                              <span style={{ fontSize: '0.72rem', color: '#78716C' }}>Requires IG_APP_ID, IG_APP_SECRET & Meta Graph User/Page Access Token</span>
                            </div>
                            <button
                              type="button"
                              onClick={handleDiscoverInstaAccount}
                              disabled={isDiscoveringInstaAccount || !instaTokenInput}
                              style={{
                                padding: '7px 14px',
                                borderRadius: '8px',
                                background: discoveredInstaAccount ? '#10B981' : 'linear-gradient(135deg, #E07A5F 0%, #C64E2E 100%)',
                                color: '#FFFFFF',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '0.76rem',
                                cursor: isDiscoveringInstaAccount || !instaTokenInput ? 'not-allowed' : 'pointer',
                                opacity: !instaTokenInput ? 0.6 : 1,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 2px 8px rgba(224, 122, 95, 0.25)'
                              }}
                            >
                              {isDiscoveringInstaAccount ? (
                                <>
                                  <RefreshCw size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                                  <span>Verifying...</span>
                                </>
                              ) : discoveredInstaAccount ? (
                                <>
                                  <CheckCircle2 size={13} />
                                  <span>@{discoveredInstaAccount.username || instaUsernameInput} Verified</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles size={13} />
                                  <span>Verify Account</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#18181B', marginBottom: '3px' }}>
                                Meta App ID
                              </label>
                              <input
                                type="text"
                                value={instaAppIdInput}
                                onChange={(e) => setInstaAppIdInput(e.target.value)}
                                placeholder="e.g. 1152066846985442"
                                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.78rem', background: '#FFFFFF' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#18181B', marginBottom: '3px' }}>
                                Meta App Secret
                              </label>
                              <input
                                type="password"
                                value={instaAppSecretInput}
                                onChange={(e) => setInstaAppSecretInput(e.target.value)}
                                placeholder="e.g. 40b10f878f8..."
                                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.78rem', background: '#FFFFFF' }}
                              />
                            </div>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#18181B', marginBottom: '3px' }}>
                              Access Token (User or Page Token)
                            </label>
                            <input
                              type="password"
                              value={instaTokenInput}
                              onChange={(e) => setInstaTokenInput(e.target.value)}
                              placeholder="IG... or EAAG... token"
                              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.78rem', background: '#FFFFFF' }}
                            />
                          </div>

                          {discoveredInstaAccount && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', background: '#ECFDF5', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 600, color: '#065F46' }}>
                                <CheckCircle2 size={14} color="#059669" />
                                <span>@{discoveredInstaAccount.username} ({discoveredInstaAccount.name || 'Account'})</span>
                              </div>
                              <span style={{ fontSize: '0.68rem', color: '#047857', fontFamily: 'monospace' }}>
                                ID: {discoveredInstaAccount.id}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 2. Video Reel Source: Custom Topic OR GitHub Repo */}
                        <div style={{ padding: '14px', borderRadius: '12px', background: '#FAF8F5', border: '1px solid #EBE4D8', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '0.84rem', color: '#18181B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Sparkles size={14} color="#E07A5F" /> Content Source
                            </strong>
                            <div style={{ display: 'flex', background: '#EAE5DC', borderRadius: '8px', padding: '2px' }}>
                              <button
                                type="button"
                                onClick={() => setInstaContentType('topic')}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  background: instaContentType === 'topic' ? '#FFFFFF' : 'transparent',
                                  color: instaContentType === 'topic' ? '#C64E2E' : '#78716C',
                                  boxShadow: instaContentType === 'topic' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                }}
                              >
                                💡 Topic
                              </button>
                              <button
                                type="button"
                                onClick={() => setInstaContentType('github')}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  background: instaContentType === 'github' ? '#FFFFFF' : 'transparent',
                                  color: instaContentType === 'github' ? '#C64E2E' : '#78716C',
                                  boxShadow: instaContentType === 'github' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                }}
                              >
                                🐙 GitHub Repo
                              </button>
                            </div>
                          </div>

                          {instaContentType === 'github' ? (
                            <div>
                              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#18181B', marginBottom: '4px' }}>
                                GitHub Repository URL
                              </label>
                              <input
                                type="text"
                                value={instaGithubRepoInput}
                                onChange={(e) => setInstaGithubRepoInput(e.target.value)}
                                placeholder="https://github.com/owner/repository"
                                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.80rem', background: '#FFFFFF' }}
                              />
                              <span style={{ fontSize: '0.70rem', color: '#78716C', marginTop: '4px', display: 'block' }}>
                                Agent analyzes repository architecture and code to create a project showcase Reel.
                              </span>
                            </div>
                          ) : (
                            <div>
                              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#18181B', marginBottom: '4px' }}>
                                Topic or Theme
                              </label>
                              <textarea 
                                className={styles.liveMessageTextarea}
                                value={instaReelPrompt}
                                onChange={(e) => setInstaReelPrompt(e.target.value)}
                                rows={2}
                                placeholder="e.g. Distributed caching, microservices, high performance databases, clean architecture"
                              />
                            </div>
                          )}
                        </div>

                        {/* 3. Schedule Times & Telegram Control ID */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#18181B', marginBottom: '3px' }}>
                              Schedule (IST)
                            </label>
                            <input
                              type="text"
                              value={instaScheduleTimes}
                              onChange={(e) => setInstaScheduleTimes(e.target.value)}
                              placeholder="17:00 & 19:00 IST"
                              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.78rem', background: '#FFFFFF' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#18181B', marginBottom: '3px' }}>
                              Telegram Chat ID
                            </label>
                            <input
                              type="text"
                              value={instaTelegramId}
                              onChange={(e) => setInstaTelegramId(e.target.value)}
                              placeholder="8652000706"
                              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.78rem', background: '#FFFFFF' }}
                            />
                          </div>
                        </div>

                        {/* 4. Autopilot Publisher Switch */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: '#FAF8F5', border: '1px solid #EBE4D8', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <strong style={{ fontSize: '0.80rem', color: '#18181B', display: 'block' }}>Daily Autopilot</strong>
                            <span style={{ fontSize: '0.70rem', color: '#78716C' }}>Automatically produce and schedule Reels on cadence</span>
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.80rem', fontWeight: 700, color: '#18181B' }}>
                            <input
                              type="checkbox"
                              checked={instaAutopilot}
                              onChange={(e) => setInstaAutopilot(e.target.checked)}
                              style={{ width: '16px', height: '16px', accentColor: '#E07A5F' }}
                            />
                            <span>Autopilot: {instaAutopilot ? 'ON' : 'OFF'}</span>
                          </label>
                        </div>

                        {/* 5. Generator Button & Save & Launch */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                          <button
                            type="button"
                            className={styles.instaGenBtn}
                            onClick={handleGenerateInstaAI}
                            disabled={isGeneratingInsta}
                          >
                            {isGeneratingInsta ? (
                              <>
                                <RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                                <span>Generating Reel...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles size={14} />
                                <span>Generate Reel Now</span>
                              </>
                            )}
                          </button>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                            <button
                              type="button"
                              onClick={() => setActiveModal(null)}
                              className={styles.modalCancelBtn}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveInstagramConnection}
                              disabled={isSavingConnection}
                              className={styles.modalSaveBtn}
                            >
                              <CheckCircle2 size={14} />
                              <span>{isSavingConnection ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {/* TAB: LINKEDIN FEED QUEUE & DRAFTS */}
                {modalTab === 'queue' && activeModal === 'linkedin' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                  >
                    {/* Status Banner */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(10,102,194,0.08) 0%, rgba(0,65,130,0.03) 100%)',
                      border: '1px solid rgba(10,102,194,0.25)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={16} color="#0A66C2" />
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.78rem', color: '#004182' }}>
                            Automated LinkedIn Queue
                          </strong>
                          <span style={{ fontSize: '0.70rem', color: '#1D4ED8' }}>
                            {linkedinStatus?.drafts?.length || 0} drafts queued • Schedule: {linkedinScheduleTimes}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateLinkedInPost}
                        disabled={isGeneratingLinkedInPost}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '10px',
                          background: '#0A66C2',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: isGeneratingLinkedInPost ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Sparkles size={11} />
                        <span>Generate Post</span>
                      </button>
                    </div>

                    {/* Draft List */}
                    {(!linkedinStatus?.drafts || linkedinStatus.drafts.length === 0) ? (
                      <div style={{ textAlign: 'center', padding: '24px 16px', background: '#FAF8F5', borderRadius: '12px', border: '1px dashed #D1D5DB' }}>
                        <Film size={28} color="#9CA3AF" style={{ margin: '0 auto 8px' }} />
                        <strong style={{ display: 'block', fontSize: '0.84rem', color: '#18181B' }}>No queued drafts pending review</strong>
                        <p style={{ fontSize: '0.74rem', color: '#6B7280', margin: '4px 0 12px' }}>
                          Your agent will automatically synthesize new branded technical posts and posters at {linkedinScheduleTimes}.
                        </p>
                        <button
                          type="button"
                          onClick={handleGenerateLinkedInPost}
                          disabled={isGeneratingLinkedInPost}
                          style={{ background: '#0A66C2', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          + Generate Post Now
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {linkedinStatus.drafts.map((draft, idx) => (
                          <div
                            key={draft.id || idx}
                            style={{
                              padding: '12px 14px',
                              borderRadius: '12px',
                              background: '#FFFFFF',
                              border: '1px solid #EBE4D8',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '12px'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                <span style={{ background: '#E8F2FC', color: '#0A66C2', fontSize: '0.62rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                                  📐 POSTER READY
                                </span>
                                <span style={{ fontSize: '0.68rem', color: '#6B7280' }}>
                                  {draft.created_at ? new Date(draft.created_at).toLocaleDateString() : 'Today'}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#18181B', lineHeight: 1.3 }}>
                                {draft.title || draft.topic || 'System Design & High-Performance Architecture'}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={async () => {
                                showToast('🚀 Publishing draft directly to LinkedIn live...')
                                try {
                                  await apiClient.post(`/linkedin-automation/drafts/${draft.id}/approve`)
                                  showToast('✅ Published live to LinkedIn!')
                                  await refreshLinkedInData()
                                } catch (e) {
                                  showToast(`Error: ${e.message}`)
                                }
                              }}
                              style={{ background: '#0A66C2', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                            >
                              Publish Live
                            </button>
                          </div>
                        ))}
                      </div>
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
                            Automated Reel Queue
                          </strong>
                          <span style={{ fontSize: '0.70rem', color: '#047857' }}>
                            {instaQueue.length} scheduled reels • Daily 7:00 PM IST
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
                        <span>{isReplenishingBuffer ? 'Generating...' : 'Generate Batch Queue'}</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.80rem', fontWeight: 700, color: '#18181B' }}>
                        Scheduled Reels ({instaQueue.length})
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
                        <p style={{ margin: 0, fontSize: '0.82rem' }}>No pending drafts. Click &ldquo;Generate Batch Queue&rdquo; to auto-fill the upcoming week!</p>
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
                            Live on @{discoveredInstaAccount?.username || instaUsernameInput || 'Instagram'}
                          </strong>
                          <span style={{ fontSize: '0.70rem', color: '#78716C' }}>
                            {instaHistory.length || instaStatus?.postCounts?.published || 4} posts published • {instaStatus?.metrics?.totalReach || 29} total reach • {instaStatus?.metrics?.totalLikes || 3} likes
                          </span>
                        </div>
                      </div>
                      <a
                        href={discoveredInstaAccount?.username || instaUsernameInput ? `https://www.instagram.com/${discoveredInstaAccount?.username || instaUsernameInput}/` : "https://www.instagram.com/"}
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
              </div>

              {/* Modal Footer */}
              <div className={styles.modalFooter}>
                <div className={styles.modalFooterLeft}>
                  <ShieldCheck size={16} />
                  <span>{activeModal === 'instagram' ? 'Meta Graph API & Instagram Cloud' : 'LinkedIn Community Management API'}</span>
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
                    disabled={isSavingConnection}
                  >
                    <span>
                      {isSavingConnection 
                        ? 'Saving...' 
                        : (activeModal === 'instagram' ? 'Save & Deploy Instagram' : 'Save & Deploy LinkedIn')}
                    </span>
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
