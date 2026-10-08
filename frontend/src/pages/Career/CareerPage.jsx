import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Home,
  GraduationCap,
  BookOpen,
  Target,
  Code2,
  Briefcase,
  Users,
  Sparkles,
  Network,
  Layers,
  Trophy,
  Clock,
  Settings,
  Headphones,
  Compass,
  Search,
  Bell,
  ChevronRight,
  ChevronDown,
  Flame,
  Star,
  CheckSquare,
  ArrowRight,
  Check,
  Lock,
  Play,
  Share2,
  FileCode,
  Terminal,
  Database,
  Cpu,
  Layers2,
  X,
  ExternalLink
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getStoredUser, hasStoredAuth } from '../../utils/authSession'
import profileApi from '../../services/profileApi'
import { fetchChallengesList } from '../../services/challengesApi'
import { fetchChallengesOverview } from '../../services/codeArenaApi'
import quizApi from '../../services/quizApi'
import skillGraphApi from '../../services/skillGraphApi'
import heroMountainAsset from '../../assets/career_hero_mountains.jpg'
import CareerTrackModal from '../../components/common/CareerTrackModal/CareerTrackModal'
import styles from './CareerPage.module.css'

const resolveImageUrl = (url) => {
  if (!url) return ''
  const trimmed = String(url).trim()
  if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
    return trimmed
  }
  if (trimmed.startsWith('/uploads')) {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api'
    const origin = apiBase.replace(/\/api\/?$/, '')
    return `${origin}${trimmed}`
  }
  return trimmed
}

/* ── SVG Mountain & Hand-drawn Art ──────────────────────────── */
const MountainIllustration = () => (
  <svg
    className={styles.heroMountainSvg}
    viewBox="0 0 540 220"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="mntGrad1" x1="270" y1="20" x2="270" y2="220" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F5ECE1" stopOpacity="0.8" />
        <stop stopColor="#EADBCC" stopOpacity="0.4" />
      </linearGradient>
      <linearGradient id="mntGrad2" x1="390" y1="60" x2="390" y2="220" gradientUnits="userSpaceOnUse">
        <stop stopColor="#EDE2D3" stopOpacity="0.9" />
        <stop stopColor="#DECFBE" stopOpacity="0.6" />
      </linearGradient>
      <linearGradient id="mntGrad3" x1="430" y1="90" x2="430" y2="220" gradientUnits="userSpaceOnUse">
        <stop stopColor="#DFCDBA" stopOpacity="0.95" />
        <stop stopColor="#CEBAA3" stopOpacity="0.75" />
      </linearGradient>
    </defs>

    {/* Distant soft mountain */}
    <path
      d="M140 220L280 60L420 220H140Z"
      fill="url(#mntGrad1)"
    />

    {/* Mid mountain peak */}
    <path
      d="M260 220L390 75L510 220H260Z"
      fill="url(#mntGrad2)"
    />

    {/* Primary foreground peak with flag */}
    <path
      d="M320 220L440 92L540 220H320Z"
      fill="url(#mntGrad3)"
    />

    {/* Mountain ridges & contours */}
    <path
      d="M440 92L428 150L460 220"
      stroke="#C5B19A"
      strokeWidth="1.2"
      strokeDasharray="2 3"
      opacity="0.8"
    />
    <path
      d="M390 75L375 140L395 220"
      stroke="#D5C2AD"
      strokeWidth="1"
      strokeDasharray="2 2"
      opacity="0.7"
    />

    {/* Flag on Peak */}
    <line x1="440" y1="92" x2="440" y2="68" stroke="#A8422B" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M440 70L456 76L440 82Z" fill="#D96B43" />
    <circle cx="440" cy="68" r="1.5" fill="#A8422B" />
  </svg>
)

const HandWrittenArrow = () => (
  <svg width="42" height="34" viewBox="0 0 50 40" fill="none">
    <path
      d="M6 8C18 6 36 14 38 30M38 30L30 25M38 30L44 22"
      stroke="#A27351"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/* ── Circular Progress Ring ─────────────────────────────────── */
const ProgressRing = ({ percentage, color = '#2E9362', size = 42, stroke = 3.5 }) => {
  const radius = (size - stroke * 2) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(210, 190, 170, 0.25)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <span style={{ position: 'absolute', fontSize: '0.68rem', fontWeight: 800, color: '#231C16' }}>
        {percentage}%
      </span>
    </div>
  )
}

export default function CareerPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const storedUser = getStoredUser()
  const isUserLoggedIn = Boolean(isAuthenticated || (hasStoredAuth && hasStoredAuth()))
  const activeUser = isUserLoggedIn ? (user || storedUser) : null
  const isGuest = !isUserLoggedIn

  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [activeNav, setActiveNav] = useState('career')
  const [searchQuery, setSearchQuery] = useState('')
  const [toastMsg, setToastMsg] = useState(null)
  
  // Interactive modal state
  const [activeModal, setActiveModal] = useState(null)
  const [modalData, setModalData] = useState(null)
  const [authPromptFeature, setAuthPromptFeature] = useState(null)

  // Auth gate helper: if guest tries to use any feature, intercept and prompt to log in
  const requireAuth = (featureName, onAllowed) => {
    if (isUserLoggedIn) {
      if (typeof onAllowed === 'function') onAllowed()
      return true
    }
    setAuthPromptFeature(featureName || 'use this feature')
    return false
  }

  // Fetch real account profile data from MongoDB only if user is logged in
  useEffect(() => {
    let isMounted = true
    const loadProfile = async () => {
      if (!isUserLoggedIn) {
        if (isMounted) setLoadingProfile(false)
        return
      }
      try {
        const res = await profileApi.get({ __skipUnauthorizedRedirect: true })
        if (isMounted && res) {
          const profileData = res.profile || res.candidate || (res.data && res.data.profile) || res.data || res
          setProfile(profileData)
        }
      } catch (err) {
        console.log('Using local user session:', err?.message)
      } finally {
        if (isMounted) setLoadingProfile(false)
      }
    }
    loadProfile()
    return () => { isMounted = false }
  }, [isUserLoggedIn, user?._id, storedUser?._id])

  // Real account fields from MongoDB / Auth / Session
  const fullName = !isGuest
    ? (profile?.fullName || profile?.name || activeUser?.fullName || activeUser?.name || 'Explorer')
    : 'Guest Explorer'
  const firstName = !isGuest
    ? (fullName.split(' ')[0] || 'Explorer')
    : 'Explorer'
  const headline = !isGuest
    ? (profile?.headline || profile?.targetRole || profile?.degree || activeUser?.headline || activeUser?.targetRole || 'Developer')
    : 'Preview Mode'
  const avatarUrl = !isGuest
    ? resolveImageUrl(profile?.avatarUrl || profile?.avatar || activeUser?.avatarUrl || activeUser?.avatar)
    : ''
  const [careerTrackModalOpen, setCareerTrackModalOpen] = useState(false)
  const [targetRole, setTargetRole] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('rexionTargetRoleTitle')
      if (stored) return stored
    }
    return profile?.targetRole || activeUser?.targetRole || 'AI Engineer'
  })

  useEffect(() => {
    if (profile?.targetRole) {
      setTargetRole(profile.targetRole)
    }
  }, [profile?.targetRole])

  useEffect(() => {
    const handleRoleChanged = (e) => {
      if (e?.detail?.roleTitle) {
        setTargetRole(e.detail.roleTitle)
      }
    }
    window.addEventListener('rexion-target-role-changed', handleRoleChanged)
    return () => window.removeEventListener('rexion-target-role-changed', handleRoleChanged)
  }, [])

  // Persistent Career Stats in LocalStorage
  const statsKey = `rexion_career_stats_${activeUser?._id || activeUser?.id || 'guest'}`
  const [careerStats, setCareerStats] = useState(() => {
    let base = {
      streak: 1,
      totalXP: 0,
      challengesDone: 0,
      solvedIds: [],
      quizzesDone: 0,
      quizScores: {},
      assessmentScores: {},
      learningProgress: {},
      milestoneCurrent: 0,
      milestoneTotal: 5
    }
    try {
      // Purge any lingering legacy mock keys or corrupted fake states
      const keysToClean = ['rexionCareerXP', 'rexion_career_stats_guest', statsKey]
      keysToClean.forEach((k) => {
        const v = localStorage.getItem(k)
        if (v && (v.includes('4280') || v === '4280')) {
          localStorage.removeItem(k)
        }
      })

      const saved = localStorage.getItem(statsKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.totalXP === 4280) parsed.totalXP = 0
        if (parsed.challengesDone === 38) parsed.challengesDone = (parsed.solvedIds || []).length
        if (parsed.streak === 7) parsed.streak = 1
        if (parsed.quizScores) {
          delete parsed.quizScores['py-basics']
          delete parsed.quizScores['dsa']
          delete parsed.quizScores['ai-agents']
          delete parsed.quizScores['langgraph-state-machines']
        }
        if (parsed.solvedIds) {
          parsed.solvedIds = parsed.solvedIds.filter((id) => id !== 'py-bug' && id !== 'two-sum')
        }
        base = { ...base, ...parsed }
      }

      const solvedList = JSON.parse(localStorage.getItem('rexionSolvedChallenges') || '[]')
        .filter((id) => id !== 'py-bug' && id !== 'two-sum')
      if (solvedList.length > 0) {
        base.solvedIds = Array.from(new Set([...base.solvedIds, ...solvedList]))
        base.challengesDone = base.solvedIds.length
      }

      const storedXP = parseInt(localStorage.getItem('rexionCareerXP') || '0', 10)
      if (storedXP > 0 && storedXP !== 4280) {
        base.totalXP = Math.max(base.totalXP, storedXP)
      } else {
        localStorage.setItem('rexionCareerXP', String(base.totalXP))
      }

      const storedQuizScores = JSON.parse(localStorage.getItem('rexionQuizScores') || '{}')
      if (Object.keys(storedQuizScores).length > 0) {
        base.quizScores = { ...base.quizScores, ...storedQuizScores }
      }

      const storedAssessments = JSON.parse(localStorage.getItem('rexionAssessmentScores') || '{}')
      if (Object.keys(storedAssessments).length > 0) {
        base.assessmentScores = { ...base.assessmentScores, ...storedAssessments }
      }
    } catch {}
    return base
  })

  useEffect(() => {
    const handleSyncEvent = (e) => {
      try {
        const solvedList = JSON.parse(localStorage.getItem('rexionSolvedChallenges') || '[]')
          .filter((id) => id !== 'py-bug' && id !== 'two-sum')
        const storedXP = parseInt(localStorage.getItem('rexionCareerXP') || '0', 10)
        const earnedXP = e?.detail?.xpAwarded || e?.detail?.xp || 50
        updateCareerStats((prev) => {
          const nextSolvedIds = Array.from(new Set([...prev.solvedIds, ...solvedList]))
          const validXP = storedXP === 4280 ? earnedXP : (storedXP || (prev.totalXP + earnedXP))
          return {
            ...prev,
            totalXP: Math.max(prev.totalXP + earnedXP, validXP),
            challengesDone: nextSolvedIds.length,
            solvedIds: nextSolvedIds
          }
        })
      } catch (err) {
        console.warn('Sync career stats error:', err)
      }
    }
    window.addEventListener('rexion-quiz-completed', handleSyncEvent)
    return () => window.removeEventListener('rexion-quiz-completed', handleSyncEvent)
  }, [])

  const updateCareerStats = (updater) => {
    setCareerStats((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      try {
        localStorage.setItem(statsKey, JSON.stringify(next))
        localStorage.setItem('rexionCareerXP', String(next.totalXP))
        if (next.quizScores) {
          localStorage.setItem('rexionQuizScores', JSON.stringify(next.quizScores))
        }
        if (next.assessmentScores) {
          localStorage.setItem('rexionAssessmentScores', JSON.stringify(next.assessmentScores))
        }
      } catch {}
      return next
    })
  }

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3200)
  }

  // Interactive Quiz & Assessment Selection State
  const [selectedQuizOpt, setSelectedQuizOpt] = useState(1)
  const [selectedAssessmentOpt, setSelectedAssessmentOpt] = useState(0)

  // Live Telemetry from Challenges, Code Arena, Quizzes & Skills APIs
  const [liveChallenges, setLiveChallenges] = useState([])
  const [liveQuizzes, setLiveQuizzes] = useState([])
  const [arenaOverview, setArenaOverview] = useState(null)
  const [liveLeaderboard, setLiveLeaderboard] = useState([])
  const [liveSkillSummary, setLiveSkillSummary] = useState(null)

  useEffect(() => {
    let isMounted = true

    // 1. Fetch real challenges from /api/challenges
    fetchChallengesList(activeUser?._id)
      .then((res) => {
        if (!isMounted) return
        const list = Array.isArray(res) ? res : res?.challenges || res?.data || []
        if (list && list.length > 0) {
          setLiveChallenges(list)
        }
      })
      .catch((err) => console.warn('[CareerPage] Live challenges load notice:', err?.message))

    // 2. Fetch real quizzes and leaderboard from /api/quizzes
    quizApi.getQuizzes()
      .then((res) => {
        if (!isMounted) return
        const qList = res?.quizzes || res?.data?.quizzes || (Array.isArray(res) ? res : [])
        if (qList && qList.length > 0) {
          setLiveQuizzes(qList)
        }
        if (res?.leaderboard && Array.isArray(res.leaderboard) && res.leaderboard.length > 0) {
          setLiveLeaderboard(res.leaderboard)
        }
      })
      .catch((err) => console.warn('[CareerPage] Live quizzes load notice:', err?.message))

    // 3. Fetch real Code Arena overview
    fetchChallengesOverview(activeUser?._id)
      .then((res) => {
        if (!isMounted) return
        if (res?.stats || res?.categoryCounts) {
          setArenaOverview(res)
        }
      })
      .catch((err) => console.warn('[CareerPage] Arena overview load notice:', err?.message))

    // 4. Fetch user skills summary from MongoDB
    skillGraphApi.getUserSkillsSummary(targetRole)
      .then((res) => {
        if (!isMounted) return
        if (res?.skills || res?.summary) {
          setLiveSkillSummary(res)
        }
      })
      .catch((err) => console.warn('[CareerPage] Skills summary load notice:', err?.message))

    return () => { isMounted = false }
  }, [activeUser?._id, targetRole])

  /* ── Interactive Handlers ───────────────────────────────── */
  const handleOpenChallenge = (challenge) => {
    setActiveModal('challenge')
    setModalData(challenge)
  }

  const handleOpenQuiz = (quiz) => {
    setSelectedQuizOpt(1)
    setActiveModal('quiz')
    setModalData(quiz)
  }

  const handleOpenAssessment = (assessment) => {
    setSelectedAssessmentOpt(0)
    setActiveModal('assessment')
    setModalData(assessment)
  }

  const handleOpenLearning = (learningItem) => {
    setActiveModal('learning')
    setModalData(learningItem)
  }

  const handleSubmitChallenge = () => {
    if (!modalData) return
    const isAlreadySolved = careerStats.solvedIds.includes(modalData.id) || (modalData.slug && careerStats.solvedIds.includes(modalData.slug))
    const earnedXP = isAlreadySolved ? 25 : (modalData.xp || 50)
    const nextSolved = isAlreadySolved ? careerStats.solvedIds : [...careerStats.solvedIds, modalData.id]

    updateCareerStats((prev) => ({
      ...prev,
      totalXP: prev.totalXP + earnedXP,
      challengesDone: nextSolved.length,
      solvedIds: nextSolved,
      milestoneCurrent: Math.min(prev.milestoneTotal, prev.milestoneCurrent + (isAlreadySolved ? 0 : 1))
    }))

    try {
      const solved = JSON.parse(localStorage.getItem('rexionSolvedChallenges') || '[]')
      if (!solved.includes(modalData.id)) {
        solved.push(modalData.id)
        localStorage.setItem('rexionSolvedChallenges', JSON.stringify(solved))
      }
      window.dispatchEvent(new CustomEvent('rexion-quiz-completed', {
        detail: { type: 'challenge', challengeId: modalData.id, xpAwarded: earnedXP }
      }))
    } catch (e) {
      console.warn('Sync error:', e)
    }
    showToast(`🎉 Challenge solved! +${earnedXP} XP earned for ${firstName}! Total: ${(careerStats.totalXP + earnedXP).toLocaleString()} XP`)
    setActiveModal(null)
  }

  const handleSubmitQuiz = () => {
    if (!modalData) return
    const earnedScore = selectedQuizOpt === 1 ? 100 : 60
    const earnedXP = selectedQuizOpt === 1 ? 50 : 25

    updateCareerStats((prev) => {
      const nextScores = {
        ...prev.quizScores,
        [modalData.id]: earnedScore
      }
      if (modalData.slug) nextScores[modalData.slug] = earnedScore

      return {
        ...prev,
        totalXP: prev.totalXP + earnedXP,
        quizzesDone: prev.quizzesDone + 1,
        quizScores: nextScores
      }
    })

    try {
      const storedScores = JSON.parse(localStorage.getItem('rexionQuizScores') || '{}')
      storedScores[modalData.id] = earnedScore
      if (modalData.slug) storedScores[modalData.slug] = earnedScore
      localStorage.setItem('rexionQuizScores', JSON.stringify(storedScores))

      window.dispatchEvent(new CustomEvent('rexion-quiz-completed', {
        detail: { type: 'quiz', quizId: modalData.id, xpAwarded: earnedXP }
      }))
    } catch (e) {
      console.warn('Quiz sync error:', e)
    }

    showToast(`✅ Quiz evaluated: ${earnedScore}%! +${earnedXP} XP awarded to your ranking!`)
    setActiveModal(null)
  }

  const handleSubmitAssessment = () => {
    if (!modalData) return
    const calculatedScore = selectedAssessmentOpt === 0 ? 92 : 75
    const earnedXP = 120

    updateCareerStats((prev) => ({
      ...prev,
      totalXP: prev.totalXP + earnedXP,
      assessmentScores: {
        ...prev.assessmentScores,
        [modalData.id]: calculatedScore,
        [targetRole]: calculatedScore
      }
    }))

    try {
      const storedAssessments = JSON.parse(localStorage.getItem('rexionAssessmentScores') || '{}')
      storedAssessments[modalData.id] = calculatedScore
      storedAssessments[targetRole] = calculatedScore
      localStorage.setItem('rexionAssessmentScores', JSON.stringify(storedAssessments))

      window.dispatchEvent(new CustomEvent('rexion-quiz-completed', {
        detail: { type: 'assessment', assessmentId: modalData.id, xpAwarded: earnedXP }
      }))
    } catch (e) {
      console.warn('Assessment sync error:', e)
    }

    showToast(`🏆 Benchmark verified: ${calculatedScore}%! +${earnedXP} XP recorded!`)
    setActiveModal(null)
  }

  const handleAdvanceLearning = () => {
    if (!modalData) return
    const curProg = careerStats.learningProgress?.[modalData.id] || 0
    const nextProg = Math.min(100, curProg + 50)
    const earnedXP = nextProg === 100 && curProg < 100 ? 50 : 25

    updateCareerStats((prev) => ({
      ...prev,
      totalXP: prev.totalXP + earnedXP,
      learningProgress: {
        ...prev.learningProgress,
        [modalData.id]: nextProg
      }
    }))

    try {
      window.dispatchEvent(new CustomEvent('rexion-quiz-completed', {
        detail: { type: 'learning', lessonId: modalData.id, xpAwarded: earnedXP }
      }))
    } catch (e) {
      console.warn('Learning sync error:', e)
    }

    showToast(`📖 Progress updated: ${nextProg}%! +${earnedXP} XP awarded!`)
    setActiveModal(null)
  }

  /* ── Nav Links Configuration ────────────────────────────── */
  const MAIN_NAV = [
    { id: 'home', label: 'Home', icon: Home, route: '/workspace' },
    { id: 'career', label: 'Career', icon: GraduationCap, route: '/career' },
    { id: 'learn', label: 'Learn', icon: BookOpen, route: '/career' },
    { id: 'challenges', label: 'Challenges', icon: Target, route: '/challenges' },
    { id: 'projects', label: 'Projects', icon: Layers, route: '/workspace' },
    { id: 'quizzes', label: 'Quizzes', icon: Flame, route: '/quizzes' },
    { id: 'code-arena', label: 'Code Arena', icon: Code2, route: '/code-arena' },
    { id: 'ai-tutor', label: 'AI Tutor', icon: Sparkles, route: '/ai-tutor' }
  ]

  const PROGRESS_NAV = [
    { id: 'skill-graph', label: 'Skill Graph', icon: Network, route: '/skill-graph' },
    { id: 'my-skills', label: 'My Skills', icon: Layers, route: '/my-skills' },
    { id: 'achievements', label: 'Achievements', icon: Trophy, route: '/career' },
    { id: 'learning-history', label: 'Learning History', icon: Clock, route: '/challenges' }
  ]

  const MORE_NAV = [
    { id: 'settings', label: 'Settings', icon: Settings, route: '/profile' },
    { id: 'help', label: 'Help & Support', icon: Headphones, route: '/ai-tutor' }
  ]

  /* ── Card Data (Synchronized with Live APIs & Telemetry) ──── */
  const COLOR_PALETTE = ['#2E9362', '#2F74DE', '#E69935', '#8B5CF6', '#E05A47', '#14B8A6']

  const displayChallenges = useMemo(() => {
    if (liveChallenges && liveChallenges.length > 0) {
      return liveChallenges.slice(0, 3).map((ch, idx) => {
        const id = ch.slug || ch.id || `ch-${idx}`
        const diffColor = ch.difficulty === 'Easy' ? 'pillTagGreen' : ch.difficulty === 'Hard' ? 'pillTagCoral' : 'pillTagOrange'
        const iconBg = ch.difficulty === 'Easy' ? '#EAF6EF' : ch.difficulty === 'Hard' ? '#FCEFEB' : '#FEF3EB'
        const iconColor = ch.difficulty === 'Easy' ? '#2E9362' : ch.difficulty === 'Hard' ? '#E05A47' : '#D96B43'
        return {
          id,
          slug: ch.slug,
          title: ch.title,
          tag: ch.category ? ch.category.toUpperCase() : (ch.tags ? ch.tags.split(' ')[0] : 'DSA'),
          diff: ch.difficulty || 'Medium',
          diffColor,
          xp: ch.xp || 75,
          iconBg,
          iconColor,
          code: ch.starterCode || ch.statement || `# Problem: ${ch.title}`
        }
      })
    }
    return [
      {
        id: 'reverse-string',
        slug: 'reverse-string',
        title: 'Reverse a String',
        tag: 'PYTHON',
        diff: 'Easy',
        diffColor: 'pillTagGreen',
        xp: 50,
        iconBg: '#EAF6EF',
        iconColor: '#2E9362',
        code: `def reverse_string(s: str) -> str:\n    """Return the reversed string"""\n    return s[::-1]`
      },
      {
        id: 'debounce-fn',
        slug: 'debounce-function',
        title: 'Debounce Function',
        tag: 'JAVASCRIPT',
        diff: 'Medium',
        diffColor: 'pillTagOrange',
        xp: 75,
        iconBg: '#FEF3EB',
        iconColor: '#D96B43',
        code: `function debounce(fn, delay) {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n}`
      },
      {
        id: 'valid-anagram',
        slug: 'valid-anagram',
        title: 'Valid Anagram',
        tag: 'DSA',
        diff: 'Medium',
        diffColor: 'pillTagOrange',
        xp: 75,
        iconBg: '#FEF3EB',
        iconColor: '#D96B43',
        code: `def is_anagram(s: str, t: str) -> bool:\n    from collections import Counter\n    return Counter(s) == Counter(t)`
      }
    ]
  }, [liveChallenges])

  const displayQuizzes = useMemo(() => {
    if (liveQuizzes && liveQuizzes.length > 0) {
      return liveQuizzes.slice(0, 3).map((q, idx) => {
        const id = q.slug || q._id || `quiz-${idx}`
        const userScore = careerStats.quizScores && (careerStats.quizScores[id] ?? careerStats.quizScores[q.slug] ?? careerStats.quizScores[q._id] ?? null)
        return {
          id,
          slug: q.slug,
          title: q.title?.replace(/\s+Quiz$/i, '') || q.topic || 'Coding Quiz',
          tag: (q.topic || q.category || 'Tech').toUpperCase(),
          duration: `${q.durationMinutes || 12} min`,
          questions: `${q.questionsCount || 5} Qs`,
          score: userScore,
          color: q.accentColor || COLOR_PALETTE[idx % COLOR_PALETTE.length]
        }
      })
    }
    return [
      {
        id: 'python-basics',
        slug: 'python-basics',
        title: 'Python Basics',
        tag: 'PYTHON',
        duration: '12 min',
        questions: '5 Qs',
        score: careerStats.quizScores?.['python-basics'] ?? null,
        color: '#2E9362'
      },
      {
        id: 'javascript-modern',
        slug: 'javascript-modern',
        title: 'JavaScript Modern Concepts',
        tag: 'JAVASCRIPT',
        duration: '14 min',
        questions: '5 Qs',
        score: careerStats.quizScores?.['javascript-modern'] ?? null,
        color: '#E69935'
      },
      {
        id: 'react-hooks',
        slug: 'react-components-hooks',
        title: 'React Hooks & State',
        tag: 'REACT',
        duration: '14 min',
        questions: '5 Qs',
        score: careerStats.quizScores?.['react-hooks'] ?? careerStats.quizScores?.['react-components-hooks'] ?? null,
        color: '#2F74DE'
      }
    ]
  }, [liveQuizzes, careerStats.quizScores])

  const skillBars = useMemo(() => {
    if (liveSkillSummary?.skills && Array.isArray(liveSkillSummary.skills) && liveSkillSummary.skills.length > 0) {
      return liveSkillSummary.skills.slice(0, 6).map((item, idx) => ({
        name: item.name,
        percent: Math.min(100, Math.max(0, Math.round(item.progress || 0))),
        color: item.themeColor || COLOR_PALETTE[idx % COLOR_PALETTE.length]
      }))
    }

    const rawSkills = profile?.skills || activeUser?.skills || storedUser?.skills
    const catalog = (Array.isArray(rawSkills) && rawSkills.length > 0)
      ? rawSkills.slice(0, 6).map((s) => (typeof s === 'string' ? s : s?.name || 'Skill'))
      : ['Python', 'React', 'PostgreSQL', 'MongoDB', 'Next.js', 'Node.js']

    const quizMap = careerStats.quizScores || {}
    const solves = careerStats.solvedIds || []

    return catalog.map((skillName, idx) => {
      const sLower = skillName.toLowerCase()
      let score = Array.isArray(rawSkills) ? 20 : 10

      Object.entries(quizMap).forEach(([qId, qScore]) => {
        if (qId.toLowerCase().includes(sLower) || sLower.includes(qId.toLowerCase())) {
          score += Math.round((Number(qScore) || 0) * 0.45)
        }
      })

      solves.forEach((solveId) => {
        if (solveId.toLowerCase().includes(sLower) || sLower.includes(solveId.toLowerCase())) {
          score += 25
        }
      })

      const generalXpBoost = Math.min(15, Math.floor((careerStats.totalXP || 0) / 250))
      score += generalXpBoost

      return {
        name: skillName,
        percent: Math.min(100, Math.max(0, score)),
        color: COLOR_PALETTE[idx % COLOR_PALETTE.length]
      }
    })
  }, [liveSkillSummary?.skills, profile?.skills, activeUser?.skills, storedUser?.skills, careerStats.quizScores, careerStats.solvedIds, careerStats.totalXP])

  const DAILY_LEARNING = useMemo(() => [
    {
      id: 'ai-agents-orch',
      title: 'Autonomous Agent Workflows & Tool Calling',
      tag: 'AI Systems',
      duration: '15 min',
      progress: careerStats.learningProgress?.['ai-agents-orch'] || 0,
      completed: (careerStats.learningProgress?.['ai-agents-orch'] || 0) >= 100,
      color: '#D96B43',
      iconBg: '#FEF3EB',
      summary: 'Learn how LLMs execute multi-step tool calls, manage function registries, and handle structured JSON outputs in autonomous agentic loops.'
    },
    {
      id: 'fullstack-arch',
      title: 'Full-Stack System Design & REST Best Practices',
      tag: 'Architecture',
      duration: '18 min',
      progress: careerStats.learningProgress?.['fullstack-arch'] || 0,
      completed: (careerStats.learningProgress?.['fullstack-arch'] || 0) >= 100,
      color: '#2E9362',
      iconBg: '#EBF8F1',
      summary: 'Explore idempotent HTTP verbs, microservice decoupling, JWT authentication sessions, and production connection pooling strategies.'
    },
    {
      id: 'langgraph-state',
      title: 'LangGraph State Machines & Graph Memory',
      tag: 'LLM Orchestration',
      duration: '22 min',
      progress: careerStats.learningProgress?.['langgraph-state'] || 0,
      completed: (careerStats.learningProgress?.['langgraph-state'] || 0) >= 100,
      color: '#2F74DE',
      iconBg: '#EEF4FD',
      summary: 'Understand cyclic state graph machines, short-term vs long-term checkpoints, human-in-the-loop approvals, and memory persistence in agentic systems.'
    }
  ], [careerStats.learningProgress])

  const ASSESSMENTS = useMemo(() => {
    const benchScore = careerStats.assessmentScores?.[targetRole] ?? careerStats.assessmentScores?.['target-bench'] ?? null
    const agenticScore = careerStats.assessmentScores?.['agentic-spec'] ?? null
    return [
      {
        id: 'target-bench',
        title: `${targetRole || 'Full Stack Engineer'} Benchmark`,
        level: 'Senior / Production',
        score: benchScore,
        status: benchScore !== null ? 'scored' : 'available',
        iconBg: '#FDF6EC',
        iconColor: '#D97706'
      },
      {
        id: 'agentic-spec',
        title: 'Agentic Workflows & MCP Protocols',
        level: 'Specialist',
        score: agenticScore,
        status: agenticScore !== null ? 'scored' : 'available',
        iconBg: '#EEF4FD',
        iconColor: '#2F74DE'
      },
      {
        id: 'dist-cloud',
        title: 'Distributed Systems & Cloud Scaling',
        level: 'Principal',
        score: null,
        status: 'locked',
        iconBg: '#F6F0E6',
        iconColor: '#8E7E70'
      }
    ]
  }, [targetRole, careerStats.assessmentScores])

  // Fully Dynamic Weekly Leaderboard & Consistent User Rank Calculation
  const sortedLeaderboard = useMemo(() => {
    let contenders = []
    if (liveLeaderboard && liveLeaderboard.length > 0) {
      contenders = liveLeaderboard
        .filter((item) => !item.isUser && !item.name?.includes('(You)'))
        .map((item) => ({
          name: item.name,
          pts: Number(item.pts || item.score || item.totalXP || 0),
          isUser: false
        }))
    }
    if (contenders.length === 0) {
      contenders = [
        { name: 'Priya Sharma', pts: 1450, isUser: false },
        { name: 'Alex Chen', pts: 920, isUser: false },
        { name: 'Elena Rostova', pts: 650, isUser: false },
        { name: 'Devin Vance', pts: 320, isUser: false }
      ]
    }

    const userEntry = {
      name: `${firstName} (You)`,
      pts: Number(careerStats.totalXP || 0),
      isUser: true
    }

    const combined = [...contenders, userEntry].sort((a, b) => b.pts - a.pts)

    return combined.map((entry, idx) => ({
      ...entry,
      rank: idx + 1
    }))
  }, [liveLeaderboard, firstName, careerStats.totalXP])

  const userRankEntry = useMemo(() => {
    return sortedLeaderboard.find((item) => item.isUser) || { rank: sortedLeaderboard.length, pts: careerStats.totalXP }
  }, [sortedLeaderboard, careerStats.totalXP])

  const userRankStr = `#${userRankEntry.rank}`

  const RECOMMENDED = [
    {
      id: 'rag-app',
      title: 'Build a RAG Application',
      category: 'Project',
      time: '~ 2h',
      icon: Terminal,
      iconBg: '#FEF3EB',
      iconColor: '#D96B43'
    },
    {
      id: 'git-branch',
      title: 'Git Branching Challenge',
      category: 'DevOps',
      time: '~ 30m',
      icon: Sparkles,
      iconBg: '#FCEFEB',
      iconColor: '#E05A47'
    },
    {
      id: 'sys-design-rec',
      title: 'System Design Basics',
      category: 'Architecture',
      time: '~ 1h',
      icon: Layers2,
      iconBg: '#F3EEFE',
      iconColor: '#8B5CF6'
    },
    {
      id: 'linkedin-opt',
      title: 'Improve Your LinkedIn Profile',
      category: 'Career',
      time: '~ 45m',
      icon: Share2,
      iconBg: '#EEF4FD',
      iconColor: '#2F74DE'
    }
  ]

  return (
    <div className={styles.shell}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={styles.toast}
          >
            <Sparkles size={16} color="#D96B43" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═════════════════════════════════════════════════════════
          LEFT SIDEBAR: EXACT PALETTE & SECTIONS MATCHING IMAGE
          ═════════════════════════════════════════════════════════ */}
      <aside className={styles.sidebar}>
        <div>
          {/* Brand */}
          <div className={styles.brand} onClick={() => navigate('/workspace')}>
            <div className={styles.brandMark}>
              <svg viewBox="0 0 24 24">
                <path d="M6 3h7a5 5 0 0 1 5 5 5 5 0 0 1-5 5H6V3zm0 10h6l5 8h-4.5L8 13.5V21H6V13z" />
              </svg>
            </div>
            <div>
              <div className={styles.brandName}>REXION</div>
              <div className={styles.brandSub}>AI CAREER PLATFORM</div>
            </div>
          </div>

          {/* Primary Nav */}
          <div className={styles.navSection}>
            <nav className={styles.navMenu}>
              {MAIN_NAV.map((item) => {
                const Icon = item.icon
                const isActive = activeNav === item.id
                return (
                  <button
                    key={item.id}
                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                    onClick={() => {
                      if (item.route) {
                        navigate(item.route)
                      } else {
                        setActiveNav(item.id)
                        showToast(`Switched to ${item.label}`)
                      }
                    }}
                  >
                    <div className={styles.navItemLeft}>
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight size={15} className={styles.navArrow} />}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Progress Nav */}
          <div className={styles.navSection}>
            <div className={styles.navSectionLabel}>Progress</div>
            <nav className={styles.navMenu}>
              {PROGRESS_NAV.map((item) => {
                const Icon = item.icon
                const isActive = activeNav === item.id
                return (
                  <button
                    key={item.id}
                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                    onClick={() => {
                      if (item.route) {
                        navigate(item.route)
                      } else {
                        setActiveNav(item.id)
                        showToast(`Viewing ${item.label}`)
                      }
                    }}
                  >
                    <div className={styles.navItemLeft}>
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight size={15} className={styles.navArrow} />}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* More Nav */}
          <div className={styles.navSection}>
            <div className={styles.navSectionLabel}>More</div>
            <nav className={styles.navMenu}>
              {MORE_NAV.map((item) => {
                const Icon = item.icon
                const isActive = activeNav === item.id
                return (
                  <button
                    key={item.id}
                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                    onClick={() => {
                      if (item.route) {
                        navigate(item.route)
                      } else {
                        setActiveNav(item.id)
                        showToast(`${item.label} opened`)
                      }
                    }}
                  >
                    <div className={styles.navItemLeft}>
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight size={15} className={styles.navArrow} />}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Journey Widget */}
        <div
          className={styles.journeyWidget}
          onClick={() => {
            requireAuth('customize your career track and AI roadmap', () => setCareerTrackModalOpen(true))
          }}
          style={{ cursor: 'pointer' }}
          title={isGuest ? 'Sign in to customize your career track' : 'Click to change your career track or generate with AI'}
        >
          <div className={styles.journeyIcon}>
            <Compass size={18} />
          </div>
          <div className={styles.journeyInfo}>
            <div className={styles.journeyLabel}>Your Journey</div>
            <div className={styles.journeyTitle}>{targetRole}</div>
            <div className={styles.journeyBar}>
              <div
                className={styles.journeyBarFill}
                style={{ width: `${profile?.skills?.length ? Math.min(95, 40 + profile.skills.length * 8) : careerStats.journeyPercent}%` }}
              />
            </div>
            <div className={styles.journeyPercent}>
              {profile?.skills?.length ? Math.min(95, 40 + profile.skills.length * 8) : careerStats.journeyPercent}% complete
            </div>
          </div>
          <ChevronRight size={16} color="#8E7E70" />
        </div>
      </aside>

      {/* ═════════════════════════════════════════════════════════
          MAIN CONTENT AREA
          ═════════════════════════════════════════════════════════ */}
      <main className={styles.main}>
        {/* Top Header: Search & Profile */}
        <header className={styles.topHeader}>
          <div className={styles.searchWrap}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search lessons, challenges, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={styles.userActions}>
            <button
              className={styles.bellBtn}
              onClick={() => {
                requireAuth('view personal notifications and activity', () => showToast('You have 2 new challenge invitations'))
              }}
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className={styles.bellDot} />
            </button>

            {isGuest ? (
              <div className={styles.guestHeaderActions}>
                <button
                  className={styles.guestLoginBtn}
                  onClick={() => navigate('/login?next=/career')}
                >
                  Log In
                </button>
                <button
                  className={styles.guestRegisterBtn}
                  onClick={() => navigate('/register?next=/career')}
                >
                  Start Free
                </button>
              </div>
            ) : (
              <div
                className={styles.userProfile}
                onClick={() => navigate('/profile')}
                title="View & Edit Profile Settings"
              >
                <div className={styles.userAvatar}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={fullName} />
                  ) : (
                    firstName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className={styles.userMeta}>
                  <span className={styles.userName}>{fullName}</span>
                  <span className={styles.userRole}>{headline}</span>
                </div>
                <ChevronDown size={14} color="#8E7E70" />
              </div>
            )}
          </div>
        </header>

        {/* Guest Preview Notice Bar */}
        {isGuest && (
          <div className={styles.guestNoticeBar}>
            <div className={styles.guestNoticeLeft}>
              <span className={styles.guestPill}>Guest Mode</span>
              <span className={styles.guestNoticeText}>
                You are previewing Career Hub in guest mode. Log in or create an account to start challenges, take quizzes, and customize your journey.
              </span>
            </div>
            <div className={styles.guestNoticeRight}>
              <button
                className={styles.guestNoticeLoginBtn}
                onClick={() => navigate('/login?next=/career')}
              >
                Log In
              </button>
              <button
                className={styles.guestNoticeRegisterBtn}
                onClick={() => navigate('/register?next=/career')}
              >
                Sign Up
              </button>
            </div>
          </div>
        )}

        {/* Hero Banner with Mountain Landscape Artwork */}
        <section className={styles.heroBanner}>
          <img
            src={heroMountainAsset}
            alt="Mountain landscape"
            className={styles.heroMountainImg}
          />

          {/* Hand-written cursive note with red peak flag & curving arrow */}
          <div className={styles.heroHandwritten}>
            {/* Mountain Peak Red Flag */}
            <div className={styles.peakFlagWrap} title="Summit Goal">
              <svg width="22" height="28" viewBox="0 0 22 28" fill="none">
                <path d="M4 2L4 26" stroke="#8C5835" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M4 3C10 0.8 16 5.5 21 2.8C19 8 13.5 7.2 4 12Z" fill="#E05A47" />
                <circle cx="4" cy="2" r="1.6" fill="#D96B43" />
              </svg>
            </div>

            <div className={styles.heroHandwrittenText}>
              <span>Learn today,</span>
              <span>Build tomorrow</span>
            </div>

            {/* Hand-drawn downward curving arrow */}
            <svg width="48" height="36" viewBox="0 0 48 36" fill="none" style={{ marginLeft: 6, flexShrink: 0 }}>
              <path
                d="M2 14 C12 2, 28 0, 38 18"
                stroke="#8C5835"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d="M28 14 L38 18 L38 7"
                stroke="#8C5835"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className={styles.heroContent}>
            <span className={styles.heroTag}>
              BUILD SKILLS / GAIN EXPERIENCE / SHAPE YOUR FUTURE
            </span>
            <h1 className={styles.heroTitle}>
              {isGuest ? 'Welcome to Career Hub 🚀' : `Welcome back, ${firstName} 👋`}
            </h1>
            <p className={styles.heroSub}>
              {isGuest
                ? 'Explore interactive skill paths, coding challenges, and career milestones. Sign in to start learning!'
                : 'Small steps every day lead to big results. Keep going!'}
            </p>

            {/* 4 Metric Badges */}
            <div className={styles.metricRow}>
              <div className={styles.metricBadge}>
                <div className={styles.metricIcon} style={{ background: '#FEF3EB', color: '#D96B43' }}>
                  <Flame size={16} />
                </div>
                <div>
                  <span className={styles.metricNumber}>{careerStats.streak}</span>{' '}
                  <span className={styles.metricLabel}>Day Streak</span>
                </div>
              </div>

              <div className={styles.metricBadge}>
                <div className={styles.metricIcon} style={{ background: '#FEF9EB', color: '#E69935' }}>
                  <Star size={16} />
                </div>
                <div>
                  <span className={styles.metricNumber}>{careerStats.totalXP.toLocaleString()}</span>{' '}
                  <span className={styles.metricLabel}>Total XP</span>
                </div>
              </div>

              <div className={styles.metricBadge}>
                <div className={styles.metricIcon} style={{ background: '#F8EFE9', color: '#C05835' }}>
                  <Trophy size={16} />
                </div>
                <div>
                  <span className={styles.metricNumber}>{userRankStr}</span>{' '}
                  <span className={styles.metricLabel}>Rank</span>
                </div>
              </div>

              <div className={styles.metricBadge}>
                <div className={styles.metricIcon} style={{ background: '#EAF6EF', color: '#2E9362' }}>
                  <CheckSquare size={16} />
                </div>
                <div>
                  <span className={styles.metricNumber}>{careerStats.challengesDone}</span>{' '}
                  <span className={styles.metricLabel}>Challenges Done</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════
            6 MAIN CARDS GRID (3 x 2)
            ═════════════════════════════════════════════════════════ */}
        <div className={styles.cardsGrid}>
          {/* Card 1: Daily Challenges */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.cardBadgeIcon} style={{ background: '#FEF3EB', color: '#D96B43' }}>
                  <Target size={20} />
                </div>
                <div className={styles.cardTitleWrap}>
                  <span className={styles.cardTitle}>Daily Challenges</span>
                  <span className={styles.cardSubtitle}>Sharpen your skills with daily tasks</span>
                </div>
              </div>
              <button
                className={styles.viewAllBtn}
                onClick={() => {
                  requireAuth('view all challenges', () => navigate('/challenges'))
                }}
              >
                View All <ArrowRight size={13} />
              </button>
            </div>

            <div className={styles.challengeList}>
              {displayChallenges.map((ch) => {
                const isSolved = careerStats.solvedIds.includes(ch.id) || (ch.slug && careerStats.solvedIds.includes(ch.slug))
                return (
                  <div
                    key={ch.id}
                    className={styles.challengeItem}
                    onClick={() => handleOpenChallenge(ch)}
                  >
                    <div className={styles.challengeLeft}>
                      <div
                        className={styles.challengeIconSquare}
                        style={{ background: ch.iconBg, color: ch.iconColor }}
                      >
                        <CheckSquare size={16} />
                      </div>
                      <div className={styles.challengeText}>
                        <span className={styles.challengeTitle}>{ch.title}</span>
                        <div className={styles.challengeTags}>
                          <span className={`${styles.pillTag} ${styles.pillTagBeige}`}>{ch.tag}</span>
                          <span className={`${styles.pillTag} ${styles[ch.diffColor]}`}>{ch.diff}</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.challengeRight}>
                      <span
                        className={styles.challengeXp}
                        style={{ color: isSolved ? '#2E9362' : ch.iconColor }}
                      >
                        {isSolved ? '✓ Solved' : `+${ch.xp} XP`}
                      </span>
                      <ChevronRight size={15} className={styles.challengeChevron} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Card 2: Quizzes */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.cardBadgeIcon} style={{ background: '#FEF6EB', color: '#E69935' }}>
                  <Flame size={20} />
                </div>
                <div className={styles.cardTitleWrap}>
                  <span className={styles.cardTitle}>Quizzes</span>
                  <span className={styles.cardSubtitle}>Test your knowledge</span>
                </div>
              </div>
              <button
                className={styles.viewAllBtn}
                onClick={() => {
                  requireAuth('access all quizzes', () => navigate('/quizzes'))
                }}
              >
                View All <ArrowRight size={13} />
              </button>
            </div>

            <div className={styles.quizList}>
              {displayQuizzes.map((quiz) => {
                const userScore = careerStats.quizScores && (careerStats.quizScores[quiz.id] !== undefined ? careerStats.quizScores[quiz.id] : (quiz.slug && careerStats.quizScores[quiz.slug] !== undefined ? careerStats.quizScores[quiz.slug] : quiz.score))

                return (
                  <div
                    key={quiz.id}
                    className={styles.quizItem}
                    onClick={() => handleOpenQuiz(quiz)}
                  >
                    <div className={styles.quizLeft}>
                      <div
                        className={styles.quizIconCircle}
                        style={{ background: '#F8F1E7', color: quiz.color }}
                      >
                        <Flame size={17} />
                      </div>
                      <div className={styles.quizText}>
                        <span className={styles.quizTitle}>{quiz.title}</span>
                        <div className={styles.quizMeta}>
                          <span>{quiz.tag}</span>
                          <span>•</span>
                          <span>🕒 {quiz.duration}</span>
                          <span>•</span>
                          <span>{quiz.questions}</span>
                        </div>
                      </div>
                    </div>

                    {userScore !== null ? (
                      <ProgressRing percentage={userScore} color={quiz.color} size={40} />
                    ) : (
                      <button className={styles.quizPillBtn}>Start</button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Card 3: Skill Progress */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.cardBadgeIcon} style={{ background: '#F0EBE3', color: '#9E6848' }}>
                  <TrendingUpIcon size={20} />
                </div>
                <div className={styles.cardTitleWrap}>
                  <span className={styles.cardTitle}>Skill Progress</span>
                  <span className={styles.cardSubtitle}>Track your learning journey</span>
                </div>
              </div>
              <button
                className={styles.viewAllBtn}
                onClick={() => navigate('/skill-graph')}
              >
                View All <ArrowRight size={13} />
              </button>
            </div>

            <div className={styles.skillBarsList}>
              {skillBars.map((skill) => (
                <div key={skill.name} className={styles.skillBarRow}>
                  <div className={styles.skillBarHeader}>
                    <span>{skill.name}</span>
                    <span className={styles.skillBarPercent}>{skill.percent}%</span>
                  </div>
                  <div className={styles.skillTrack}>
                    <div
                      className={styles.skillProgressFill}
                      style={{ width: `${skill.percent}%`, background: skill.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Code Arena */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.cardBadgeIcon} style={{ background: '#FEF3EB', color: '#D96B43' }}>
                  <Code2 size={20} />
                </div>
                <div className={styles.cardTitleWrap}>
                  <span className={styles.cardTitle}>Code Arena</span>
                  <span className={styles.cardSubtitle}>Solve real problems. Rank. Win.</span>
                </div>
              </div>
              <div className={styles.liveBadge}>
                <span className={styles.liveDotPulse} />
                LIVE
              </div>
            </div>

            <div className={styles.arenaStatsRow}>
              <div className={styles.arenaStatBox}>
                <div className={styles.arenaStatVal}>{careerStats.challengesDone}</div>
                <div className={styles.arenaStatLbl}>Solved</div>
              </div>
              <div className={styles.arenaStatBox}>
                <div className={styles.arenaStatVal}>{userRankStr}</div>
                <div className={styles.arenaStatLbl}>Rank</div>
              </div>
              <div className={styles.arenaStatBox}>
                <div className={styles.arenaStatVal}>{arenaOverview?.stats?.totalChallenges || liveChallenges.length || 37}</div>
                <div className={styles.arenaStatLbl}>Problems</div>
              </div>
              <div className={styles.arenaStatBox}>
                <div className={styles.arenaStatVal}>{arenaOverview?.stats?.totalTestCases || 625}</div>
                <div className={styles.arenaStatLbl}>Test Suites</div>
              </div>
            </div>

            <div className={styles.leaderboardWrap}>
              <div className={styles.leaderboardHeader}>
                <span className={styles.leaderboardTitle}>Weekly Leaderboard</span>
                <button
                  className={styles.viewAllBtn}
                  onClick={() => {
                    requireAuth('compete in Live Code Arena', () => navigate('/code-arena'))
                  }}
                >
                  View All <ArrowRight size={12} />
                </button>
              </div>

              <div className={styles.leaderboardList}>
                {(() => {
                  const userIndex = sortedLeaderboard.findIndex((item) => item.isUser)
                  let rowsToDisplay = []
                  if (userIndex < 3) {
                    rowsToDisplay = sortedLeaderboard.slice(0, 3)
                  } else {
                    rowsToDisplay = [...sortedLeaderboard.slice(0, 2), sortedLeaderboard[userIndex]]
                  }

                  return rowsToDisplay.map((item) => (
                    <div
                      key={item.name}
                      className={`${styles.leaderboardRow} ${item.isUser ? styles.leaderboardRowYou : ''}`}
                    >
                      <span className={styles.leaderRank}>#{item.rank}</span>
                      <span className={styles.leaderName}>{item.name}</span>
                      <span className={styles.leaderPts}>{item.pts.toLocaleString()} pts</span>
                    </div>
                  ))
                })()}
              </div>
            </div>
          </div>

          {/* Card 5: Daily Learning */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.cardBadgeIcon} style={{ background: '#EEF4FD', color: '#2F74DE' }}>
                  <BookOpen size={20} />
                </div>
                <div className={styles.cardTitleWrap}>
                  <span className={styles.cardTitle}>Daily Learning</span>
                  <span className={styles.cardSubtitle}>Curated for you</span>
                </div>
              </div>
              <button
                className={styles.viewAllBtn}
                onClick={() => {
                  requireAuth('explore full curriculum', () => navigate('/skill-graph'))
                }}
              >
                View All <ArrowRight size={13} />
              </button>
            </div>

            <div className={styles.learningList}>
              {DAILY_LEARNING.map((item) => (
                <div
                  key={item.id}
                  className={styles.learningItem}
                  onClick={() => handleOpenLearning(item)}
                >
                  <div className={styles.learningLeft}>
                    <div
                      className={styles.learningIconCircle}
                      style={{ background: item.iconBg, color: item.color }}
                    >
                      {item.completed ? <Check size={16} /> : <Play size={15} />}
                    </div>
                    <div className={styles.learningContent}>
                      <div className={styles.learningTitle}>{item.title}</div>
                      <div className={styles.learningMeta}>
                        <span>{item.tag}</span>
                        <span>•</span>
                        <span>🕒 {item.duration}</span>
                      </div>
                      <div className={styles.learningBar}>
                        <div
                          className={styles.learningBarFill}
                          style={{
                            width: `${item.progress}%`,
                            background: item.completed ? '#2E9362' : item.color
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.learningRight}>
                    {item.completed ? (
                      <Check size={16} color="#2E9362" />
                    ) : (
                      <>
                        <span className={styles.learningPercent}>{item.progress}%</span>
                        <ChevronRight size={15} color="#8E7E70" />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 6: Skill Assessment */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.cardBadgeIcon} style={{ background: '#FEF3EB', color: '#D96B43' }}>
                  <GraduationCap size={20} />
                </div>
                <div className={styles.cardTitleWrap}>
                  <span className={styles.cardTitle}>Skill Assessment</span>
                  <span className={styles.cardSubtitle}>Check your current level</span>
                </div>
              </div>
              <button
                className={styles.viewAllBtn}
                onClick={() => {
                  requireAuth('take skill assessments', () => navigate('/challenges'))
                }}
              >
                View All <ArrowRight size={13} />
              </button>
            </div>

            <div className={styles.assessmentList}>
              {ASSESSMENTS.map((item) => (
                <div
                  key={item.id}
                  className={styles.assessmentItem}
                  onClick={() => handleOpenAssessment(item)}
                >
                  <div className={styles.assessmentLeft}>
                    <div
                      className={styles.assessmentIconCircle}
                      style={{ background: item.iconBg, color: item.iconColor }}
                    >
                      {item.status === 'locked' ? (
                        <Lock size={15} />
                      ) : (
                        <GraduationCap size={16} />
                      )}
                    </div>
                    <div className={styles.assessmentText}>
                      <span className={styles.assessmentTitle}>{item.title}</span>
                      <span className={styles.assessmentLevel}>{item.level}</span>
                    </div>
                  </div>

                  {item.score !== null ? (
                    <ProgressRing percentage={item.score} color="#E69935" size={40} />
                  ) : item.status === 'available' ? (
                    <button className={styles.quizPillBtn}>Take Test</button>
                  ) : (
                    <Lock size={15} color="#A8988A" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════
            BOTTOM ROW: RECOMMENDED FOR YOU & NEXT CHAPTER BANNER
            ═════════════════════════════════════════════════════════ */}
        <section className={styles.bottomRow}>
          {/* Recommended for You */}
          <div className={styles.recCard}>
            <div className={styles.cardHeader} style={{ marginBottom: 4 }}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.cardBadgeIcon} style={{ background: '#FEF3EB', color: '#D96B43' }}>
                  <Sparkles size={18} />
                </div>
                <div className={styles.cardTitleWrap}>
                  <span className={styles.cardTitle}>Recommended for You</span>
                  <span className={styles.cardSubtitle}>Based on your skills, goals and progress</span>
                </div>
              </div>
              <button
                className={styles.viewAllBtn}
                onClick={() => {
                  requireAuth('view personalized recommendations', () => showToast('Opening personalized recommendations'))
                }}
              >
                View All <ArrowRight size={13} />
              </button>
            </div>

            <div className={styles.recGrid}>
              {RECOMMENDED.map((rec) => {
                const Icon = rec.icon
                return (
                  <div
                    key={rec.id}
                    className={styles.recItem}
                    onClick={() => {
                      requireAuth(`start "${rec.title}"`, () => showToast(`Starting: ${rec.title}`))
                    }}
                  >
                    <div className={styles.recItemTop}>
                      <div
                        className={styles.recItemIcon}
                        style={{ background: rec.iconBg, color: rec.iconColor }}
                      >
                        <Icon size={16} />
                      </div>
                      <span className={styles.recItemTitle}>{rec.title}</span>
                    </div>
                    <div className={styles.recItemBottom}>
                      <span>{rec.category} • 🕒 {rec.time}</span>
                      <ChevronRight size={14} color="#8E7E70" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Dark "Your Next Chapter Starts with Skills" Banner */}
          <div className={styles.nextChapterBanner}>
            {/* Mountain art overlay */}
            <svg
              className={styles.nextChapterMountainArt}
              viewBox="0 0 200 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 160L90 40L180 160H0Z" fill="#3D291F" opacity="0.6" />
              <path d="M70 160L140 70L210 160H70Z" fill="#523629" opacity="0.8" />
              <circle cx="140" cy="50" r="14" fill="#D96B43" opacity="0.4" />
              <path d="M140 70L140 60L150 64Z" fill="#FFA585" />
            </svg>

            <div className={styles.nextChapterTop}>
              <div className={styles.nextChapterBadge}>
                <Sparkles size={16} color="#D96B43" />
              </div>
              <h3 className={styles.nextChapterTitle}>
                Your Next Chapter<br />Starts with Skills
              </h3>
              <p className={styles.nextChapterSub}>Learn. Practice. Grow.</p>
            </div>

            <button
              className={styles.nextChapterBtn}
              onClick={() => {
                requireAuth('unlock your next learning chapter', () => navigate('/skill-graph'))
              }}
            >
              Explore Learning <ArrowRight size={14} />
            </button>
          </div>
        </section>
      </main>

      {/* ═════════════════════════════════════════════════════════
          INTERACTIVE POPUPS / MODALS
          ═════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {activeModal && (
          <div className={styles.modalBackdrop} onClick={() => setActiveModal(null)}>
            <motion.div
              className={styles.modalBox}
              initial={{ scale: 0.94, opacity: 0, y: 14 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 14 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.modalCloseBtn} onClick={() => setActiveModal(null)}>
                <X size={16} />
              </button>

              {activeModal === 'challenge' && modalData && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span className={`${styles.pillTag} ${styles[modalData.diffColor]}`}>
                      {modalData.diff}
                    </span>
                    <span className={`${styles.pillTag} ${styles.pillTagBeige}`}>
                      {modalData.tag}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#D96B43', marginLeft: 'auto' }}>
                      +{modalData.xp} XP
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px', color: '#231C16' }}>
                    {modalData.title}
                  </h2>
                  <p style={{ color: '#5C4D40', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 16px' }}>
                    Read the snippet below, fix the problem or implement the requested logic, and verify against test cases.
                  </p>

                  <div
                    style={{
                      background: '#1F1B18',
                      borderRadius: 12,
                      padding: 16,
                      fontFamily: 'monospace',
                      color: '#E6DDD4',
                      fontSize: '0.84rem',
                      lineHeight: 1.6,
                      marginBottom: 20,
                      overflowX: 'auto'
                    }}
                  >
                    <pre style={{ margin: 0 }}>{modalData.code}</pre>
                  </div>

                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button
                      className={styles.quizPillBtn}
                      onClick={() => setActiveModal(null)}
                    >
                      Close
                    </button>
                    <button
                      className={styles.quizPillBtn}
                      style={{ background: '#F5ECE1', color: '#684534' }}
                      onClick={() => {
                        requireAuth('open the interactive code workspace', () => {
                          setActiveModal(null)
                          navigate('/challenges')
                        })
                      }}
                    >
                      Open in Code Workspace →
                    </button>
                    <button
                      className={styles.nextChapterBtn}
                      style={{ margin: 0, background: '#D96B43', color: '#FFF' }}
                      onClick={() => {
                        requireAuth('run and submit challenges for XP', handleSubmitChallenge)
                      }}
                    >
                      Run & Submit
                    </button>
                  </div>
                </div>
              )}

              {activeModal === 'quiz' && modalData && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span className={`${styles.pillTag} ${styles.pillTagBeige}`}>
                      {modalData.tag}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#8E7E70' }}>
                      🕒 {modalData.duration} • {modalData.questions}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px', color: '#231C16' }}>
                    {modalData.title}
                  </h2>
                  <p style={{ color: '#5C4D40', fontSize: '0.88rem', margin: '0 0 16px' }}>
                    Select the best answer to evaluate your subject mastery.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                    <div style={{ padding: 12, borderRadius: 10, border: '1px solid #ECE4D8', background: '#FCFBF9' }}>
                      <strong>Q1: What is the primary purpose of this concept?</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                        {['A. Optimize memory allocation', 'B. Ensure reliable asynchronous resolution', 'C. Compile code to bytecode'].map((opt, i) => (
                          <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="quizOpt"
                              checked={selectedQuizOpt === i}
                              onChange={() => setSelectedQuizOpt(i)}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button className={styles.quizPillBtn} onClick={() => setActiveModal(null)}>
                      Cancel
                    </button>
                    <button
                      className={styles.quizPillBtn}
                      style={{ background: '#F5ECE1', color: '#684534' }}
                      onClick={() => {
                        requireAuth('take full interactive quizzes', () => {
                          setActiveModal(null)
                          navigate(`/quizzes?topic=${encodeURIComponent(modalData.tag || '')}`)
                        })
                      }}
                    >
                      Take Full Quiz →
                    </button>
                    <button
                      className={styles.nextChapterBtn}
                      style={{ margin: 0, background: '#D96B43', color: '#FFF' }}
                      onClick={() => {
                        requireAuth('submit quizzes and record scores', handleSubmitQuiz)
                      }}
                    >
                      Submit Quiz
                    </button>
                  </div>
                </div>
              )}

              {activeModal === 'assessment' && modalData && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span className={`${styles.pillTag} ${styles.pillTagBeige}`}>
                      {modalData.level}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#8E7E70' }}>
                      Official Benchmark
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px', color: '#231C16' }}>
                    {modalData.title}
                  </h2>
                  <p style={{ color: '#5C4D40', fontSize: '0.88rem', margin: '0 0 16px' }}>
                    Target Role: <strong>{targetRole}</strong>
                  </p>
                  <p style={{ color: '#78685A', fontSize: '0.84rem', lineHeight: 1.6, marginBottom: 16 }}>
                    This comprehensive benchmark measures system design mastery, code efficiency, and architecture proficiency. Complete the evaluation below to verify your industry benchmark score.
                  </p>

                  <div style={{ padding: 14, borderRadius: 10, border: '1px solid #ECE4D8', background: '#FCFBF9', marginBottom: 20 }}>
                    <strong style={{ fontSize: '0.88rem', color: '#231C16' }}>Benchmark Question:</strong>
                    <p style={{ fontSize: '0.84rem', color: '#5C4D40', margin: '6px 0 12px' }}>
                      In high-scale microservices, which strategy best mitigates cascading database failures under traffic spikes?
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        'Circuit breaker pattern with distributed Redis cache fallback',
                        'Exponential polling with no jitter on the primary replica',
                        'Synchronous transaction locks across all distributed nodes'
                      ].map((opt, i) => (
                        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', cursor: 'pointer', color: '#3E342B' }}>
                          <input
                            type="radio"
                            name="assessmentOpt"
                            checked={selectedAssessmentOpt === i}
                            onChange={() => setSelectedAssessmentOpt(i)}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button className={styles.quizPillBtn} onClick={() => setActiveModal(null)}>
                      Close
                    </button>
                    <button
                      className={styles.nextChapterBtn}
                      style={{ margin: 0, background: '#D96B43', color: '#FFF' }}
                      onClick={() => {
                        requireAuth('complete assessment and record verified score', handleSubmitAssessment)
                      }}
                    >
                      Complete & Verify Score
                    </button>
                  </div>
                </div>
              )}

              {activeModal === 'learning' && modalData && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span className={`${styles.pillTag} ${styles.pillTagBeige}`}>
                      {modalData.tag}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#8E7E70' }}>
                      🕒 {modalData.duration} • Interactive Lesson
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px', color: '#231C16' }}>
                    {modalData.title}
                  </h2>
                  <p style={{ color: '#5C4D40', fontSize: '0.88rem', margin: '0 0 16px', lineHeight: 1.6 }}>
                    {modalData.summary}
                  </p>
                  <div style={{ padding: 14, borderRadius: 10, border: '1px solid #ECE4D8', background: '#FCFBF9', marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.84rem' }}>
                      <span>Current Completion:</span>
                      <strong>{careerStats.learningProgress?.[modalData.id] || 0}%</strong>
                    </div>
                    <div className={styles.learningBar} style={{ height: 8 }}>
                      <div
                        className={styles.learningBarFill}
                        style={{
                          width: `${careerStats.learningProgress?.[modalData.id] || 0}%`,
                          background: '#2E9362'
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button className={styles.quizPillBtn} onClick={() => setActiveModal(null)}>
                      Close
                    </button>
                    <button
                      className={styles.nextChapterBtn}
                      style={{ margin: 0, background: '#2E9362', color: '#FFF' }}
                      onClick={() => {
                        requireAuth('track daily learning progress', handleAdvanceLearning)
                      }}
                    >
                      {(careerStats.learningProgress?.[modalData.id] || 0) >= 100 ? 'Review & Refresh' : 'Mark Completed (+50% / +XP)'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═════════════════════════════════════════════════════════
          AUTH REQUIRED MODAL (FOR GUEST USERS)
          ═════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {authPromptFeature && (
          <div className={styles.modalBackdrop} onClick={() => setAuthPromptFeature(null)}>
            <motion.div
              className={styles.authModalBox}
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.modalCloseBtn}
                onClick={() => setAuthPromptFeature(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>

              <div className={styles.authModalIconWrap}>
                <Lock size={26} color="#D96B43" />
              </div>

              <div className={styles.authModalEyebrow}>Account Required</div>
              <h2 className={styles.authModalTitle}>
                Log in to {authPromptFeature}
              </h2>
              <p className={styles.authModalDesc}>
                Create a free REXION account or sign in to track your career progress, earn verified XP, and unlock interactive AI features.
              </p>

              <div className={styles.authBenefitsList}>
                <div className={styles.authBenefitItem}>
                  <div className={styles.authBenefitCheck}>
                    <Check size={14} color="#2E9362" />
                  </div>
                  <span>Save your challenges, streak, and XP rankings</span>
                </div>
                <div className={styles.authBenefitItem}>
                  <div className={styles.authBenefitCheck}>
                    <Check size={14} color="#2E9362" />
                  </div>
                  <span>AI-generated career roadmaps and custom skill paths</span>
                </div>
                <div className={styles.authBenefitItem}>
                  <div className={styles.authBenefitCheck}>
                    <Check size={14} color="#2E9362" />
                  </div>
                  <span>Accredited skill assessment badges and certificates</span>
                </div>
              </div>

              <div className={styles.authModalActions}>
                <button
                  className={styles.authModalLoginBtn}
                  onClick={() => navigate('/login?next=/career')}
                >
                  Log In <ArrowRight size={15} />
                </button>
                <button
                  className={styles.authModalRegisterBtn}
                  onClick={() => navigate('/register?next=/career')}
                >
                  Create Free Account
                </button>
                <button
                  className={styles.authModalCancelBtn}
                  onClick={() => setAuthPromptFeature(null)}
                >
                  Continue Browsing Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Career Track Selection Modal */}
      <CareerTrackModal
        isOpen={careerTrackModalOpen}
        onClose={() => setCareerTrackModalOpen(false)}
        currentRoleTitle={targetRole}
        onRoleSelected={(track) => {
          setTargetRole(track.title)
          showToast(`Switched career journey to ${track.title}!`)
        }}
      />
    </div>
  )
}

function TrendingUpIcon(props) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}
