import React, { useState, useEffect, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Home, GraduationCap, BookOpen, Target, Layers, Flame, Code2, Sparkles,
  Network, Trophy, Clock, Settings, Headphones, Search, Bell,
  ChevronRight, ChevronDown, Check, ArrowRight, Play, RotateCcw,
  Maximize2, Bookmark, Share2, ThumbsUp, ThumbsDown, Lightbulb,
  CheckCircle2, XCircle, Calendar, Eye, HelpCircle, Filter, Award, AlertCircle
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { getStoredUser } from "../../utils/authSession"
import { INDUSTRY_PROBLEMS } from "../../data/codeArenaProblems"
import { fetchProblems, runProblemCode, submitProblemCode } from "../../services/codeArenaApi"
import careerMountainsAsset from "../../assets/career_hero_mountains.jpg"
import codeArenaMountains from "../../assets/code_arena_mountains.jpg"
import styles from "./CodeArenaPage.module.css"

const MAIN_NAV = [
  { id: "home", label: "Home", icon: Home, route: "/" },
  { id: "career", label: "Career", icon: GraduationCap, route: "/career", hasChevron: true },
  { id: "learn", label: "Learn", icon: BookOpen, route: "/career" },
  { id: "challenges", label: "Challenges", icon: Target, route: "/challenges" },
  { id: "projects", label: "Projects", icon: Layers, route: "/workspace" },
  { id: "quizzes", label: "Quizzes", icon: Flame, route: "/quizzes" },
  { id: "code-arena", label: "Code Arena", icon: Code2, route: "/code-arena" },
  { id: "ai-tutor", label: "AI Tutor", icon: Sparkles, route: "/ai-tutor" }
]

const PROGRESS_NAV = [
  { id: "skill-graph", label: "Skill Graph", icon: Network, route: "/skill-graph" },
  { id: "my-skills", label: "My Skills", icon: Layers, route: "/my-skills" },
  { id: "achievements", label: "Achievements", icon: Trophy, route: "/career" },
  { id: "learning-history", label: "Learning History", icon: Clock, route: "/challenges" }
]

const MORE_NAV = [
  { id: "settings", label: "Settings", icon: Settings, route: "/profile" },
  { id: "help", label: "Help & Support", icon: Headphones, route: "/ai-tutor" }
]

const TOPIC_FILTERS = [
  { id: "all", label: "All Problems" },
  { id: "array", label: "Arrays & Two Pointers", keywords: ["array", "two pointers", "intervals"] },
  { id: "dp", label: "Dynamic Programming", keywords: ["dynamic programming"] },
  { id: "strings", label: "Strings & Sliding Window", keywords: ["string", "sliding window"] },
  { id: "binary-search", label: "Binary Search", keywords: ["binary search"] },
  { id: "stack", label: "Stack & Queue", keywords: ["stack", "monotonic stack"] },
  { id: "hash-table", label: "Hash Table", keywords: ["hash table", "counting"] },
  { id: "math", label: "Math & Bit Manipulation", keywords: ["math", "bit manipulation", "sieve", "combinatorics"] },
  { id: "greedy", label: "Greedy & Sorting", keywords: ["greedy", "sorting", "heap"] }
]

const LEADERBOARD_USERS = [
  { rank: 1, name: "CodeMaster", time: "12:34", isUser: false },
  { rank: 2, name: "dev_raj", time: "14:26", isUser: false },
  { rank: 3, name: "you (Anshu Pal)", time: "15:42", isUser: true },
  { rank: 4, name: "neha_codes", time: "16:03", isUser: false },
  { rank: 5, name: "alpha_tech", time: "17:21", isUser: false }
]

export default function CodeArenaPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialProblemSlug = searchParams.get("problem")

  const { user } = useAuth()
  const sessionUser = getStoredUser()

  const [problemsList, setProblemsList] = useState(INDUSTRY_PROBLEMS)
  const [activeTopic, setActiveTopic] = useState("all")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProblemSlug, setSelectedProblemSlug] = useState(
    initialProblemSlug || "two-sum"
  )
  const [activeTab, setActiveTab] = useState("description") // 'description' | 'submissions' | 'discussion'
  const [selectedLanguage, setSelectedLanguage] = useState("python")
  const [showHint, setShowHint] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [leaderboardTab, setLeaderboardTab] = useState("daily")
  const [toast, setToast] = useState(null)
  
  // Execution states
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testResults, setTestResults] = useState(null) // Run code results
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0)
  const [submissionModal, setSubmissionModal] = useState(null) // Submit modal

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const currentUser = {
    name: user?.name || sessionUser?.name || "Anshu Pal",
    role: "Student",
    avatar: user?.avatar || sessionUser?.avatar || null,
    targetRoleName: "AI Engineer",
    overallProgress: 68
  }

  // Synchronize live problems from backend API on mount
  useEffect(() => {
    let isMounted = true
    fetchProblems({ limit: 100 })
      .then((data) => {
        if (isMounted && data?.items && data.items.length > 0) {
          // Merge server data with fallback dataset
          const merged = data.items.map((item, idx) => {
            const fallback = INDUSTRY_PROBLEMS.find(p => p.slug === item.slug) || {}
            return {
              ...fallback,
              ...item,
              id: item.slug,
              slug: item.slug,
              num: item.number || idx + 1,
              title: item.title,
              difficulty: item.difficulty,
              acceptance: item.difficulty === "Easy" ? "65%" : item.difficulty === "Hard" ? "38%" : "48%",
              topics: item.topics || fallback.topics || ["General"],
              likes: fallback.likes || "11.2k",
              dislikes: fallback.dislikes || "140",
              statement: item.statement || fallback.statement || "",
              desc: (item.statement || fallback.statement || "").split("\n\nExample")[0],
              constraints: item.constraints || fallback.constraints || "",
              hint: item.hint || fallback.hint || "",
              starterCode: item.starterCode || fallback.starterCode || {},
              sampleTests: item.sampleTests || fallback.sampleTests || []
            }
          })
          setProblemsList(merged)
        }
      })
      .catch((err) => {
        console.warn("[CodeArena] Backend fetch notice, using bundled dataset:", err.message)
      })

    return () => { isMounted = false }
  }, [])

  // Sync selected problem if URL query parameter changes
  useEffect(() => {
    const slug = searchParams.get("problem")
    if (slug) {
      setSelectedProblemSlug(slug)
    }
  }, [searchParams])

  // Active problem object
  const activeProblem = useMemo(() => {
    return problemsList.find(p => p.slug === selectedProblemSlug || p.id === selectedProblemSlug) || problemsList[0]
  }, [problemsList, selectedProblemSlug])

  // Code editor state
  const [code, setCode] = useState(() => {
    return activeProblem?.starterCode?.[selectedLanguage] || ""
  })

  // Update starter code when active problem or language changes
  useEffect(() => {
    if (activeProblem?.starterCode) {
      const newCode = activeProblem.starterCode[selectedLanguage] || 
        (selectedLanguage === "python" ? `def ${activeProblem.functionName || "solution"}():\n    pass\n` : `function ${activeProblem.functionName || "solution"}() {\n  // your code\n}\n`)
      setCode(newCode)
      setTestResults(null)
      setSelectedCaseIdx(0)
    }
  }, [activeProblem, selectedLanguage])

  const handleSelectProblem = (slug) => {
    setSelectedProblemSlug(slug)
    setTestResults(null)
    setSelectedCaseIdx(0)
  }

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang)
    if (activeProblem?.starterCode) {
      setCode(activeProblem.starterCode[lang] || activeProblem.starterCode.python || "")
    }
  }

  const handleResetCode = () => {
    if (activeProblem?.starterCode) {
      setCode(activeProblem.starterCode[selectedLanguage] || "")
      showToast("Code reset to starter template.")
    }
  }

  // Production Run Code: Executes against sample test cases
  const handleRunCode = async () => {
    if (!code.trim()) {
      showToast("Please write code before running test cases.")
      return
    }

    setIsRunning(true)
    showToast("Running tests in sandbox...")

    try {
      const res = await runProblemCode(activeProblem.slug, {
        language: selectedLanguage,
        code
      })

      if (res && res.success) {
        setTestResults(res.cases || [])
        setSelectedCaseIdx(0)
        if (res.verdict === "ACCEPTED") {
          showToast(`Passed all sample tests (${res.passed}/${res.total}) in ${res.runtimeMs}ms!`)
        } else {
          showToast(`Test failed: ${res.verdict} (${res.passed}/${res.total} passed)`)
        }
      } else {
        showToast(res?.error || "Execution error encountered.")
      }
    } catch (err) {
      showToast(`Execution error: ${err.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  // Production Submit Code: Evaluates against all 100% test cases (including stress tests)
  const handleSubmitCode = async () => {
    if (!code.trim()) {
      showToast("Please write code before submitting.")
      return
    }

    setIsSubmitting(true)
    showToast("Submitting solution to Judge...")

    try {
      const res = await submitProblemCode(activeProblem.slug, {
        language: selectedLanguage,
        code,
        userId: user?._id || user?.id || "guest"
      })

      if (res && res.success) {
        setSubmissionModal(res)
        if (res.verdict === "ACCEPTED") {
          try {
            const solved = JSON.parse(localStorage.getItem("rexionSolvedChallenges") || "[]")
            const pId = activeProblem?.slug || activeProblem?.id || "arena-problem"
            if (!solved.includes(pId)) {
              solved.push(pId)
              localStorage.setItem("rexionSolvedChallenges", JSON.stringify(solved))
            }
            const awardXp = res.xpAwarded || 50
            const currentXP = parseInt(localStorage.getItem("rexionCareerXP") || "4280", 10)
            localStorage.setItem("rexionCareerXP", (currentXP + awardXp).toString())
            window.dispatchEvent(new CustomEvent("rexion-quiz-completed", {
              detail: { type: "code-arena", problemSlug: pId, xpAwarded: awardXp }
            }))
          } catch (e) {
            console.warn("Could not sync solved problem state", e)
          }
          showToast(`ACCEPTED! +${res.xpAwarded} XP awarded!`)
        } else {
          showToast(`Verdict: ${res.verdict} (${res.passed}/${res.total} passed)`)
        }
      } else {
        showToast(res?.error || "Submission failed.")
      }
    } catch (err) {
      showToast(`Submission error: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter problems by topic, difficulty, and search query
  const filteredProblems = useMemo(() => {
    return problemsList.filter(p => {
      // Topic filter
      if (activeTopic !== "all") {
        const currentFilter = TOPIC_FILTERS.find(f => f.id === activeTopic)
        if (currentFilter?.keywords) {
          const match = p.topics?.some(t => 
            currentFilter.keywords.some(k => t.toLowerCase().includes(k))
          )
          if (!match && p.category !== activeTopic) return false
        }
      }

      // Difficulty filter
      if (difficultyFilter !== "all") {
        if (p.difficulty.toLowerCase() !== difficultyFilter.toLowerCase()) return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = p.title.toLowerCase().includes(q)
        const matchSlug = p.slug.toLowerCase().includes(q)
        const matchTopic = p.topics?.some(t => t.toLowerCase().includes(q))
        if (!matchTitle && !matchSlug && !matchTopic) return false
      }

      return true
    })
  }, [problemsList, activeTopic, difficultyFilter, searchQuery])

  // Sample tests for current problem
  const sampleCases = useMemo(() => {
    if (testResults && testResults.length > 0) return testResults
    return (activeProblem?.sampleTests || []).map((t, i) => ({
      input: t.input,
      expected: t.expected,
      got: null,
      pass: null,
      runtimeMs: null,
      error: null
    }))
  }, [activeProblem, testResults])

  const currentCase = sampleCases[selectedCaseIdx] || sampleCases[0]

  return (
    <div className={styles.shell}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={styles.toast}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═════════════════════════════════════════════════════════
          SUBMISSION RESULT MODAL
          ═════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {submissionModal && (
          <div className={styles.submissionModalOverlay} onClick={() => setSubmissionModal(null)}>
            <div className={styles.submissionModal} onClick={(e) => e.stopPropagation()}>
              {submissionModal.verdict === "ACCEPTED" ? (
                <>
                  <div className={styles.modalVerdictBadgeAccepted}>
                    <CheckCircle2 size={18} />
                    <span>ACCEPTED</span>
                  </div>
                  <h3 className={styles.modalTitle}>Outstanding Solution! 🎉</h3>
                  <p className={styles.modalSubtitle}>
                    All test cases passed successfully inside the execution engine sandbox.
                  </p>
                </>
              ) : submissionModal.verdict === "TIME_LIMIT" ? (
                <>
                  <div className={styles.modalVerdictBadgeTle}>
                    <Clock size={18} />
                    <span>TIME LIMIT EXCEEDED</span>
                  </div>
                  <h3 className={styles.modalTitle}>Execution Timed Out</h3>
                  <p className={styles.modalSubtitle}>
                    Your solution exceeded the time limit on large stress test cases. Try optimizing time complexity.
                  </p>
                </>
              ) : (
                <>
                  <div className={styles.modalVerdictBadgeFailed}>
                    <XCircle size={18} />
                    <span>{submissionModal.verdict.replace(/_/g, " ")}</span>
                  </div>
                  <h3 className={styles.modalTitle}>Test Case Mismatch</h3>
                  <p className={styles.modalSubtitle}>
                    {submissionModal.failedCase?.message || "Your output did not match the expected result for all test cases."}
                  </p>
                </>
              )}

              <div className={styles.modalStatsGrid}>
                <div className={styles.modalStatCard}>
                  <div className={styles.modalStatNum}>{submissionModal.passed} / {submissionModal.total}</div>
                  <div className={styles.modalStatLabel}>Tests Passed</div>
                </div>
                <div className={styles.modalStatCard}>
                  <div className={styles.modalStatNum}>{submissionModal.runtimeMs} ms</div>
                  <div className={styles.modalStatLabel}>Runtime</div>
                </div>
                <div className={styles.modalStatCard}>
                  <div className={styles.modalStatNum} style={{ color: "#D96B43" }}>+{submissionModal.xpAwarded || 0} XP</div>
                  <div className={styles.modalStatLabel}>XP Earned</div>
                </div>
              </div>

              <button className={styles.modalCloseBtn} onClick={() => setSubmissionModal(null)}>
                Continue Coding
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ═════════════════════════════════════════════════════════
          LEFT SIDEBAR (Restored Previous Full Size, Smooth Scroll)
          ═════════════════════════════════════════════════════════ */}
      <aside className={styles.sidebar}>
        {/* Logo */}
        <div className={styles.brand} onClick={() => navigate("/workspace")}>
          <div className={styles.brandMark}>R</div>
          <div>
            <div className={styles.brandName}>REXION</div>
            <div className={styles.brandSub}>AI CAREER PLATFORM</div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className={styles.navSection}>
          <nav className={styles.navMenu}>
            {MAIN_NAV.map((item) => {
              const Icon = item.icon
              const isActive = item.id === "code-arena"
              return (
                <button
                  key={item.id}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                  onClick={() => item.route ? navigate(item.route) : showToast(`${item.label} coming soon`)}
                >
                  <div className={styles.navItemLeft}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                  {item.hasChevron && <ChevronRight size={14} className={styles.navArrow} />}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Progress Navigation */}
        <div className={styles.navSection}>
          <div className={styles.navSectionLabel}>Progress</div>
          <nav className={styles.navMenu}>
            {PROGRESS_NAV.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  className={styles.navItem}
                  onClick={() => item.route ? navigate(item.route) : showToast(`Viewing ${item.label}`)}
                >
                  <div className={styles.navItemLeft}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        {/* More Navigation */}
        <div className={styles.navSection}>
          <div className={styles.navSectionLabel}>More</div>
          <nav className={styles.navMenu}>
            {MORE_NAV.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  className={styles.navItem}
                  onClick={() => item.route ? navigate(item.route) : showToast(`Opening ${item.label}`)}
                >
                  <div className={styles.navItemLeft}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Journey Card */}
        <div
          className={styles.journeyWidget}
          onClick={() => navigate("/career")}
          style={{
            backgroundImage: `linear-gradient(rgba(18, 22, 28, 0.45), rgba(12, 15, 20, 0.88)), url(${careerMountainsAsset})`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          {/* YOUR CURRENT PATH Capsule Pill */}
          <div className={styles.currentPathCapsule}>
            <span className={styles.currentPathText}>YOUR CURRENT PATH</span>
            <ChevronRight size={13} className={styles.currentPathArrow} />
          </div>

          <div className={styles.journeyTitle}>{currentUser.targetRoleName}</div>

          <div className={styles.journeyBar}>
            <div className={styles.journeyBarFill} style={{ width: `${currentUser.overallProgress}%` }} />
          </div>

          <div className={styles.journeyPercent}>{currentUser.overallProgress}% complete</div>

          <button
            className={styles.switchPathBtn}
            onClick={(e) => {
              e.stopPropagation()
              navigate("/career")
            }}
          >
            <span>Switch Path</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Bottom spacer for clean scrolling breathing room */}
        <div className={styles.sidebarBottomSpacer} />
      </aside>

      {/* ═════════════════════════════════════════════════════════
          MAIN CONTENT AREA
          ═════════════════════════════════════════════════════════ */}
      <main className={styles.main}>
        {/* Top Header Bar */}
        <header className={styles.topBar}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search problems, topics, or numbers..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className={styles.shortcut}>Ctrl + K</span>
          </div>

          <div className={styles.topActions}>
            <button className={styles.iconBtn} onClick={() => showToast("Daily Contest starting in 3 hours!")}>
              <Bell size={18} />
              <span className={styles.notifDot} />
            </button>

            <div className={styles.profileBadge} onClick={() => navigate("/career")}>
              <div className={styles.avatarWrap}>
                <span className={styles.avatarText}>{currentUser.name.charAt(0)}</span>
              </div>
              <div className={styles.profileMeta}>
                <span className={styles.userName}>{currentUser.name}</span>
                <span className={styles.userRole}>{currentUser.role}</span>
              </div>
              <ChevronDown size={14} color="#8E7E70" />
            </div>
          </div>
        </header>

        {/* Content Body Area */}
        <div className={styles.contentArea}>
          {/* Top Row: Hero Banner + Daily Challenge Card */}
          <div className={styles.topHeroRow}>
            {/* Hero Banner with Mountains Backdrop */}
            <div
              className={styles.heroBanner}
              style={{
                backgroundImage: `linear-gradient(90deg, rgba(251, 248, 244, 0.98) 0%, rgba(251, 248, 244, 0.88) 55%, rgba(251, 248, 244, 0.2) 100%), url(${codeArenaMountains})`,
                backgroundSize: "cover",
                backgroundPosition: "right center"
              }}
            >
              <div className={styles.heroLeft}>
                <div className={styles.heroTagBadge}>
                  <Code2 size={12} color="#D96B43" />
                  <span>CODE ARENA</span>
                </div>
                <h1 className={styles.heroTitle}>Sharpen Your Coding Skills</h1>
                <p className={styles.heroSubtitle}>
                  37 Industry-grade interview problems with real-time Judge execution, stress tests, and automated grading.
                </p>

                {/* Stats Row */}
                <div className={styles.statsRow}>
                  <div className={styles.statPill}>
                    <span className={styles.statIcon}>🧩</span>
                    <div>
                      <div className={styles.statNum}>37</div>
                      <div className={styles.statLabel}>Live Problems</div>
                    </div>
                  </div>

                  <div className={styles.statPill}>
                    <span className={styles.statIcon}>🧪</span>
                    <div>
                      <div className={styles.statNum}>625+</div>
                      <div className={styles.statLabel}>Test Cases</div>
                    </div>
                  </div>

                  <div className={styles.statPill}>
                    <span className={styles.statIcon}>👥</span>
                    <div>
                      <div className={styles.statNum}>12K+</div>
                      <div className={styles.statLabel}>Active Learners</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.heroRightArt}>
                <div className={styles.heroMntFloatingTag}>
                  <span>Live Sandbox Active</span>
                  <div className={styles.pulseDot} />
                </div>
              </div>
            </div>

            {/* Daily Challenge Card */}
            <div
              className={styles.dailyChallengeCard}
              style={{
                backgroundImage: `linear-gradient(135deg, rgba(28, 32, 40, 0.88) 0%, rgba(18, 22, 28, 0.95) 100%), url(${careerMountainsAsset})`,
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            >
              <div className={styles.dailyHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Calendar size={14} color="#F97316" />
                  <span className={styles.dailyLabel}>FEATURED INTERVIEW PROBLEM</span>
                </div>
                <span className={styles.dailyCountdown}>LeetCode #1</span>
              </div>

              <div className={styles.dailyTitle}>Two Sum</div>

              <div className={styles.dailyBottomRow}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className={styles.dailyBadgeEasy}>Easy</span>
                  <span className={styles.dailyTag}>Hash Table</span>
                  <span className={styles.dailyXp}>+30 XP</span>
                </div>
                <button className={styles.dailyArrowBtn} onClick={() => handleSelectProblem("two-sum")}>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Topic Filter Pills Bar */}
          <div className={styles.filterRow}>
            <div className={styles.filterPillsScroll}>
              {TOPIC_FILTERS.map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.filterPill} ${activeTopic === tab.id ? styles.filterPillActive : ""}`}
                  onClick={() => setActiveTopic(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className={styles.filterSearch}>
              <Search size={14} color="#8E7E70" />
              <input
                type="text"
                placeholder="Search problems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#5C4D40",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════
              3-COLUMN WORKSTATION GRID
              ═══════════════════════════════════════════════════════ */}
          <div className={styles.arenaGrid}>
            {/* Column 1: Problems List */}
            <div className={styles.problemsCol}>
              <div className={styles.problemsHeader}>
                <span className={styles.colTitle}>Problems ({filteredProblems.length})</span>
                <span style={{ fontSize: "0.72rem", color: "#8E7E70", fontWeight: 600 }}>
                  Live API
                </span>
              </div>

              <div className={styles.problemsListScroll}>
                {filteredProblems.map((prob) => {
                  const isSel = prob.slug === activeProblem?.slug || prob.id === activeProblem?.slug
                  const isEasy = prob.difficulty === "Easy"
                  const isHard = prob.difficulty === "Hard"
                  const diffColor = isEasy ? "#10B981" : isHard ? "#EF4444" : "#F59E0B"

                  return (
                    <div
                      key={prob.slug || prob.id}
                      className={`${styles.problemItem} ${isSel ? styles.problemItemActive : ""}`}
                      onClick={() => handleSelectProblem(prob.slug || prob.id)}
                    >
                      <div className={styles.probItemLeft}>
                        <span className={styles.probNum}>{prob.num}</span>
                        <div>
                          <div className={styles.probItemTitle}>{prob.title}</div>
                          <div className={styles.probMeta}>
                            <span className={styles.probDiffBadge} style={{ color: diffColor }}>
                              {prob.difficulty}
                            </span>
                            <span className={styles.probAcceptance}>
                              {prob.topics?.[0] || "Algorithms"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={14} color={isSel ? "#D96B43" : "#CBD5E1"} />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Column 2: Center Workspace (Problem Description + Code Editor) */}
            <div className={styles.centerWorkspaceCol}>
              {/* Problem Description Panel */}
              <div className={styles.descCol}>
                <div className={styles.descHeader}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h2 className={styles.probMainTitle}>
                      {activeProblem.num}. {activeProblem.title}
                    </h2>
                    <span 
                      className={styles.easyBadge}
                      style={{
                        color: activeProblem.difficulty === "Easy" ? "#10B981" : activeProblem.difficulty === "Hard" ? "#EF4444" : "#F59E0B",
                        backgroundColor: activeProblem.difficulty === "Easy" ? "#E6F7F0" : activeProblem.difficulty === "Hard" ? "#FEE2E2" : "#FEF3C7"
                      }}
                    >
                      {activeProblem.difficulty}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "#8E7E70", fontWeight: 700 }}>
                      +{activeProblem.xp || 50} XP
                    </span>
                  </div>

                  <div className={styles.descActions}>
                    <button
                      className={`${styles.actionIconBtn} ${isBookmarked ? styles.bookmarked : ""}`}
                      onClick={() => {
                        setIsBookmarked(!isBookmarked)
                        showToast(isBookmarked ? "Removed from bookmarks" : "Bookmarked problem!")
                      }}
                      title="Bookmark"
                    >
                      <Bookmark size={15} />
                      <span>Bookmark</span>
                    </button>
                    <button
                      className={styles.actionIconBtn}
                      onClick={() => {
                        navigator.clipboard?.writeText(window.location.href)
                        showToast("Problem link copied!")
                      }}
                      title="Share"
                    >
                      <Share2 size={15} />
                      <span>Share</span>
                    </button>
                  </div>
                </div>

                {/* Tabs: Description / Submissions / Discussion */}
                <div className={styles.descTabsRow}>
                  <button
                    className={`${styles.descTab} ${activeTab === "description" ? styles.descTabActive : ""}`}
                    onClick={() => setActiveTab("description")}
                  >
                    Description
                  </button>
                  <button
                    className={`${styles.descTab} ${activeTab === "submissions" ? styles.descTabActive : ""}`}
                    onClick={() => setActiveTab("submissions")}
                  >
                    Submissions
                  </button>
                  <button
                    className={`${styles.descTab} ${activeTab === "discussion" ? styles.descTabActive : ""}`}
                    onClick={() => setActiveTab("discussion")}
                  >
                    Discussion
                  </button>
                </div>

                {/* Tab Content */}
                <div className={styles.descBodyScroll}>
                  {activeTab === "description" ? (
                    <>
                      <div className={styles.descText}>
                        {activeProblem.statement || activeProblem.desc}
                      </div>

                      {/* Constraints */}
                      {activeProblem.constraints && (
                        <div className={styles.exampleBox} style={{ borderLeft: "3px solid #D96B43" }}>
                          <div className={styles.exampleTitle}>Constraints:</div>
                          <pre style={{ margin: 0, fontFamily: "'Fira Code', monospace", fontSize: "0.75rem", color: "#5C4D40", whiteSpace: "pre-wrap" }}>
                            {activeProblem.constraints}
                          </pre>
                        </div>
                      )}

                      {/* Topics Row */}
                      <div className={styles.topicsRow}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#8E7E70" }}>Topics:</span>
                        {(activeProblem.topics || []).map((t, idx) => (
                          <span key={idx} className={styles.topicPill}>{t}</span>
                        ))}
                      </div>

                      {/* Feedback Likes / Dislikes */}
                      <div className={styles.probFeedbackRow}>
                        <button className={styles.feedbackChip} onClick={() => showToast("Liked problem!")}>
                          <ThumbsUp size={13} />
                          <span>Likes {activeProblem.likes || "8.4k"}</span>
                        </button>
                        <button className={styles.feedbackChip} onClick={() => showToast("Feedback recorded.")}>
                          <ThumbsDown size={13} />
                          <span>Dislikes {activeProblem.dislikes || "110"}</span>
                        </button>
                      </div>

                      {/* Collapsible Algorithmic Hint */}
                      <div style={{ marginTop: 14 }}>
                        <button
                          onClick={() => setShowHint(!showHint)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 12px",
                            borderRadius: 8,
                            background: "#FEF3C7",
                            color: "#B45309",
                            border: "1px solid #FDE68A",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            cursor: "pointer"
                          }}
                        >
                          <Lightbulb size={14} color="#D97706" />
                          <span>{showHint ? "Hide Hint" : "Show Algorithmic Hint"}</span>
                          <ChevronDown size={14} style={{ transform: showHint ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />
                        </button>
                        {showHint && (
                          <div style={{
                            marginTop: 8,
                            padding: "10px 14px",
                            borderRadius: 8,
                            background: "#FFFBEB",
                            border: "1px solid #FDE68A",
                            color: "#92400E",
                            fontSize: "0.78rem",
                            lineHeight: 1.5
                          }}>
                            {activeProblem.hint || "Review the time complexity of your approach and consider hash maps or two pointers."}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: "20px 0", color: "#8E7E70", fontSize: "0.85rem" }}>
                      Run your code or click Submit to view verified runtime verdicts.
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive Code Editor */}
              <div className={styles.editorCol}>
                {/* Editor Top Bar with Run and Submit Buttons */}
                <div className={styles.editorTopBar}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <select
                      className={styles.langSelect}
                      value={selectedLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                    >
                      <option value="python">Python 3 (Live Sandbox)</option>
                      <option value="javascript">JavaScript / Node (Live Sandbox)</option>
                    </select>

                    <button className={styles.resetBtn} onClick={handleResetCode} title="Reset Code">
                      <RotateCcw size={13} />
                      <span>Reset</span>
                    </button>
                  </div>

                  <div className={styles.editorControlsRight}>
                    <button
                      className={styles.runBtn}
                      onClick={handleRunCode}
                      disabled={isRunning || isSubmitting}
                      title="Run code against sample test cases"
                    >
                      {isRunning ? (
                        <>
                          <span className={styles.spinner} />
                          <span>Running...</span>
                        </>
                      ) : (
                        <>
                          <Play size={13} fill="#10B981" color="#10B981" />
                          <span>Run</span>
                        </>
                      )}
                    </button>
                    <button
                      className={styles.submitBtn}
                      onClick={handleSubmitCode}
                      disabled={isRunning || isSubmitting}
                      title="Submit solution to Judge"
                    >
                      {isSubmitting ? (
                        <>
                          <span className={styles.spinner} />
                          <span>Grading...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} />
                          <span>Submit</span>
                        </>
                      )}
                    </button>

                    <div style={{ width: 1, height: 18, backgroundColor: "#282C34", margin: "0 2px" }} />

                    <button className={styles.editorMiniBtn} title="Settings">
                      <Settings size={14} />
                    </button>
                    <button className={styles.editorMiniBtn} title="Fullscreen">
                      <Maximize2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Code Textarea Area with line numbers */}
                <div className={styles.editorMainArea}>
                  <div className={styles.lineNumbers}>
                    {code.split("\n").map((_, i) => (
                      <div key={i} className={styles.lineNum}>{i + 1}</div>
                    ))}
                  </div>
                  <textarea
                    className={styles.codeTextarea}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    spellCheck="false"
                  />
                </div>

                {/* Integrated Test Cases Console (Placed Below Editor) */}
                <div className={styles.editorTestCasesPanel}>
                  <div className={styles.editorTestCasesHeader}>
                    <div className={styles.editorTestCasesTitle}>
                      <CheckCircle2 size={16} color="#10B981" />
                      <span>Sample Test Cases</span>
                    </div>

                    {/* Case Tabs */}
                    <div className={styles.editorTestTabs}>
                      {sampleCases.map((tc, idx) => (
                        <button
                          key={idx}
                          className={`${styles.editorTcTab} ${selectedCaseIdx === idx ? styles.editorTcTabActive : ""}`}
                          onClick={() => setSelectedCaseIdx(idx)}
                        >
                          <span>Case {idx + 1}</span>
                          {tc.pass === true ? (
                            <div className={styles.tcTabDotPass} title="Passed" />
                          ) : tc.pass === false ? (
                            <div className={styles.tcTabDotFail} title="Failed" />
                          ) : null}
                        </button>
                      ))}
                    </div>

                    <span className={styles.runAllLink} onClick={handleRunCode} style={{ marginLeft: "auto", cursor: "pointer" }}>
                      Run Sample →
                    </span>
                  </div>

                  {/* Case Details Box */}
                  {currentCase && (
                    <div className={styles.editorTestDetailBox}>
                      <div className={styles.editorTestDetailGrid}>
                        <div className={styles.editorTestDetailRow}>
                          <span className={styles.editorTestDetailLabel}>Input</span>
                          <div className={styles.editorTestDetailCode}>
                            {JSON.stringify(currentCase.input)}
                          </div>
                        </div>

                        <div className={styles.editorTestDetailRow}>
                          <span className={styles.editorTestDetailLabel}>Expected</span>
                          <div className={styles.editorTestDetailCode}>
                            {JSON.stringify(currentCase.expected)}
                          </div>
                        </div>
                      </div>

                      {currentCase.got !== undefined && currentCase.got !== null && (
                        <div className={styles.editorTestDetailRow}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span className={styles.editorTestDetailLabel}>Output</span>
                            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: currentCase.pass ? "#10B981" : "#EF4444" }}>
                              {currentCase.pass ? `Passed (${currentCase.runtimeMs || 0}ms)` : "Mismatch"}
                            </span>
                          </div>
                          <div className={`${styles.editorTestDetailCode} ${currentCase.pass ? styles.editorTestDetailGotPass : styles.editorTestDetailGotFail}`}>
                            {String(currentCase.got)}
                          </div>
                        </div>
                      )}

                      {currentCase.error && (
                        <div className={styles.editorConsoleErrorBox}>
                          {currentCase.error}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footer Banner */}
          <div className={styles.bottomBanner}>
            <div className={styles.quoteWrap}>
              <div className={styles.quoteText}>"Small steps every day lead to big results."</div>
              <div className={styles.quoteAuthor}>— REXION</div>
            </div>

            <div className={styles.bannerPillsRow}>
              <div className={styles.bannerPill}>
                <span className={styles.bannerPillIcon}>💡</span>
                <div>
                  <div className={styles.bannerPillTitle}>37 Industry Problems</div>
                  <div className={styles.bannerPillSub}>Amazon, Meta, Google vetted</div>
                </div>
              </div>

              <div className={styles.bannerPill}>
                <span className={styles.bannerPillIcon}>🏆</span>
                <div>
                  <div className={styles.bannerPillTitle}>625+ Automated Tests</div>
                  <div className={styles.bannerPillSub}>Hidden stress cases included</div>
                </div>
              </div>

              <div className={styles.bannerPill}>
                <span className={styles.bannerPillIcon}>🎯</span>
                <div>
                  <div className={styles.bannerPillTitle}>Judge Execution</div>
                  <div className={styles.bannerPillSub}>Sub-second runtime grading</div>
                </div>
              </div>
            </div>

            <button
              className={styles.nextChallengeBtn}
              onClick={() => {
                const currentIdx = filteredProblems.findIndex(p => p.slug === activeProblem.slug)
                const nextProblem = filteredProblems[(currentIdx + 1) % filteredProblems.length]
                if (nextProblem) {
                  handleSelectProblem(nextProblem.slug)
                  showToast(`Switched to: ${nextProblem.title}`)
                }
              }}
            >
              <span>Next Challenge</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
