import React, { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Home, GraduationCap, BookOpen, Target, Layers, Flame, Code2, Sparkles,
  Network, Trophy, Clock, Settings, Headphones, Search, Bell,
  ChevronRight, ChevronDown, Check, Star, Award, ArrowRight,
  Filter, Grid, List, ExternalLink, Zap, Terminal, Database,
  Cpu, Lock, CheckCircle2, Bookmark, RefreshCw
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { getStoredUser } from "../../utils/authSession"
import { fetchChallengesList } from "../../services/challengesApi"
import careerMountainsAsset from "../../assets/career_hero_mountains.jpg"
import challengesHeroDesk from "../../assets/challenges_hero_desk.jpg"
import styles from "./ChallengesPage.module.css"

const MAIN_NAV = [
  { id: "home", label: "Home", icon: Home, route: "/" },
  { id: "career", label: "Career", icon: GraduationCap, route: "/career" },
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
  { id: "all", label: "All Challenges" },
  { id: "python", label: "Python" },
  { id: "javascript", label: "JavaScript" },
  { id: "dsa", label: "DSA" },
  { id: "sql", label: "SQL" },
  { id: "rag", label: "RAG" },
  { id: "system-design", label: "System Design" },
  { id: "devops", label: "DevOps" }
]

const CATEGORY_SIDEBAR = [
  { id: "all", label: "All Challenges", count: 78, icon: Target },
  { id: "python", label: "Python", count: 15, icon: Terminal },
  { id: "javascript", label: "JavaScript", count: 12, icon: Code2 },
  { id: "dsa", label: "DSA", count: 14, icon: Zap },
  { id: "sql", label: "SQL", count: 8, icon: Database },
  { id: "rag", label: "RAG", count: 6, icon: Sparkles },
  { id: "system-design", label: "System Design", count: 5, icon: Network },
  { id: "devops", label: "DevOps", count: 4, icon: Layers },
  { id: "web-dev", label: "Web Development", count: 6, icon: Code2 },
  { id: "other", label: "Other", count: 8, icon: BookOpen }
]

const CHALLENGES_DATA = [
  {
    id: "ch-1",
    title: "Reverse a String",
    desc: "Write a function to reverse a given string.",
    category: "python",
    tags: ["Python", "Strings"],
    difficulty: "Easy",
    xp: 50,
    isNew: true,
    locked: false,
    icon: "python",
    codeArenaId: "reverse-string"
  },
  {
    id: "ch-2",
    title: "Debounce Function",
    desc: "Implement a debounce function in JavaScript.",
    category: "javascript",
    tags: ["JavaScript", "Functions"],
    difficulty: "Medium",
    xp: 75,
    isNew: false,
    locked: false,
    icon: "javascript",
    codeArenaId: "debounce-function"
  },
  {
    id: "ch-3",
    title: "Valid Anagram",
    desc: "Check if two strings are anagrams.",
    category: "dsa",
    tags: ["DSA", "Strings"],
    difficulty: "Medium",
    xp: 75,
    isNew: true,
    locked: false,
    icon: "dsa",
    codeArenaId: "valid-anagram"
  },
  {
    id: "ch-4",
    title: "Find Duplicate Records",
    desc: "Write a query to find duplicate records in a table.",
    category: "sql",
    tags: ["SQL", "Joins"],
    difficulty: "Easy",
    xp: 50,
    isNew: false,
    locked: false,
    icon: "sql",
    codeArenaId: "find-duplicate-records"
  },
  {
    id: "ch-5",
    title: "RAG Pipeline",
    desc: "Build a simple RAG system using OpenAI.",
    category: "rag",
    tags: ["RAG", "LLMs"],
    difficulty: "Hard",
    xp: 150,
    isNew: false,
    locked: true,
    icon: "rag",
    codeArenaId: "rag-pipeline"
  },
  {
    id: "ch-6",
    title: "Design Twitter",
    desc: "Design a scalable architecture for Twitter.",
    category: "system-design",
    tags: ["System Design", "Architecture"],
    difficulty: "Hard",
    xp: 200,
    isNew: false,
    locked: false,
    icon: "system-design",
    codeArenaId: "design-twitter"
  },
  {
    id: "ch-7",
    title: "Data Analysis with Pandas",
    desc: "Analyze the given dataset and answer questions.",
    category: "python",
    tags: ["Python", "Pandas"],
    difficulty: "Medium",
    xp: 75,
    isNew: false,
    locked: false,
    icon: "python",
    codeArenaId: "data-analysis-pandas"
  },
  {
    id: "ch-8",
    title: "Dockerfile Optimization",
    desc: "Optimize the given Dockerfile for better build time.",
    category: "devops",
    tags: ["DevOps", "Docker"],
    difficulty: "Medium",
    xp: 75,
    isNew: false,
    locked: false,
    icon: "devops",
    codeArenaId: "dockerfile-optimization"
  },
  {
    id: "ch-9",
    title: "Build a Responsive Navbar",
    desc: "Create a responsive navigation bar using HTML & CSS.",
    category: "web-dev",
    tags: ["Web Development", "HTML/CSS"],
    difficulty: "Easy",
    xp: 50,
    isNew: false,
    locked: false,
    icon: "web-dev",
    codeArenaId: "responsive-navbar"
  }
]

// Render specific icon based on challenge type
const ChallengeIcon = ({ type }) => {
  switch (type) {
    case "python":
      return (
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "#FEF7E6", display: "grid", placeItems: "center" }}>
          <span style={{ fontSize: "1.25rem" }}>🐍</span>
        </div>
      )
    case "javascript":
      return (
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "#FEF9C3", display: "grid", placeItems: "center", color: "#854D0E", fontWeight: 800, fontSize: "0.85rem" }}>
          JS
        </div>
      )
    case "dsa":
      return (
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "#EDE9FE", display: "grid", placeItems: "center", color: "#6D28D9" }}>
          <Zap size={20} />
        </div>
      )
    case "sql":
      return (
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "#E0F2FE", display: "grid", placeItems: "center", color: "#0369A1" }}>
          <Database size={20} />
        </div>
      )
    case "rag":
      return (
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "#EFF6FF", display: "grid", placeItems: "center", color: "#2563EB" }}>
          <Sparkles size={20} />
        </div>
      )
    case "system-design":
      return (
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "#F1F5F9", display: "grid", placeItems: "center", color: "#334155" }}>
          <Network size={20} />
        </div>
      )
    case "devops":
      return (
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "#E0F2FE", display: "grid", placeItems: "center", color: "#0284C7" }}>
          <Layers size={20} />
        </div>
      )
    default:
      return (
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "#FFEDD5", display: "grid", placeItems: "center", color: "#EA580C" }}>
          <Code2 size={20} />
        </div>
      )
  }
}

export default function ChallengesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const sessionUser = getStoredUser()

  const [activeTab, setActiveTab] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [sortOption, setSortOption] = useState("recently-added")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState("grid") // 'grid' | 'list'
  const [toast, setToast] = useState(null)
  const [overviewData, setOverviewData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

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

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      try {
        const data = await fetchChallengesList(user?.id || sessionUser?.id || sessionUser?._id)
        if (isMounted && data) {
          setOverviewData(data)
        }
      } catch (err) {
        console.warn("[ChallengesPage] Overview load notice:", err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadData()
    return () => { isMounted = false }
  }, [user, sessionUser])

  const handleSyncDailyQuestion = async () => {
    showToast("Synchronizing daily challenge pool...")
    const fresh = await fetchChallengesList(user?.id || sessionUser?.id)
    if (fresh) setOverviewData(fresh)
    showToast("Active challenge pool is up to date!")
  }

  // Real dynamic categories synced from backend
  const dynamicCategories = useMemo(() => {
    const counts = overviewData?.categoryCounts || {}
    return CATEGORY_SIDEBAR.map(cat => ({
      ...cat,
      count: counts[cat.id] !== undefined ? counts[cat.id] : cat.count
    }))
  }, [overviewData])

  // Dedicated 12 production-level challenges
  const activeChallengesPool = useMemo(() => {
    if (overviewData?.challenges && overviewData.challenges.length > 0) {
      return overviewData.challenges
    }
    return CHALLENGES_DATA
  }, [overviewData])

  // Filter challenges based on active tab, selected category, difficulty, search
  const filteredChallenges = useMemo(() => {
    return activeChallengesPool.filter(ch => {
      // Tab filter
      if (activeTab !== "all" && ch.category !== activeTab) return false
      // Category sidebar filter
      if (selectedCategory !== "all" && ch.category !== selectedCategory) return false
      // Difficulty filter
      if (difficultyFilter !== "all" && ch.difficulty.toLowerCase() !== difficultyFilter.toLowerCase()) return false
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesTitle = ch.title.toLowerCase().includes(q)
        const matchesDesc = (ch.desc || "").toLowerCase().includes(q)
        const matchesTag = (ch.tags || []).some(t => t.toLowerCase().includes(q))
        if (!matchesTitle && !matchesDesc && !matchesTag) return false
      }
      return true
    })
  }, [activeChallengesPool, activeTab, selectedCategory, difficultyFilter, searchQuery])

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
          LEFT SIDEBAR
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
              const isActive = item.id === "challenges"
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
                  {isActive && <ChevronRight size={15} className={styles.navArrow} />}
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
            backgroundImage: `linear-gradient(rgba(24, 27, 32, 0.90), rgba(18, 20, 24, 0.95)), url(${careerMountainsAsset})`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className={styles.journeyLabel}>Your Current Path</div>
            <ChevronRight size={13} color="#94A3B8" />
          </div>
          <div className={styles.journeyTitle}>{currentUser.targetRoleName}</div>
          <div className={styles.journeyBar}>
            <div className={styles.journeyBarFill} style={{ width: `${currentUser.overallProgress}%` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            <span className={styles.journeyPercent}>{currentUser.overallProgress}% complete</span>
          </div>
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
              placeholder="Search challenges, topics or anything..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className={styles.shortcut}>Ctrl + K</span>
          </div>

          <div className={styles.topActions}>
            <button className={styles.iconBtn} onClick={() => showToast("Notifications: 2 new challenges added!")}>
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

        {/* Content Body */}
        <div className={styles.contentArea}>
          {/* Breadcrumb */}
          <div className={styles.breadcrumb}>
            <span>Career</span>
            <ChevronRight size={13} />
            <span style={{ color: "#231C16", fontWeight: 700 }}>Challenges</span>
          </div>

          {/* Hero Banner */}
          <div className={styles.heroBanner}>
            <div className={styles.heroLeft}>
              <h1 className={styles.heroTitle}>
                Sharpen Your Skills
                <Sparkles size={22} className={styles.sparkleIcon} />
              </h1>
              <p className={styles.heroSubtitle}>
                Solve real-world problems, build practical skills and level up your career.
              </p>
            </div>

            <div className={styles.heroIllustration}>
              <div className={styles.cursiveNote}>
                Small challenges.. <br />
                <span style={{ fontSize: "1.25rem", color: "#D96B43" }}>Big progress.</span>
                <svg width="40" height="24" viewBox="0 0 40 24" style={{ display: "block", marginTop: 4 }}>
                  <path d="M 5 5 Q 25 22 36 12" fill="none" stroke="#D96B43" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M 32 8 L 36 12 L 31 16" fill="none" stroke="#D96B43" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <img
                src={challengesHeroDesk}
                alt="Workspace desk with code"
                className={styles.heroImg}
              />
            </div>
          </div>

          {/* Filter Pills Bar & Search */}
          <div className={styles.filterRow}>
            <div className={styles.filterPillsScroll}>
              {TOPIC_FILTERS.map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.filterPill} ${activeTab === tab.id ? styles.filterPillActive : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.id === "all" && <Grid size={13} style={{ marginRight: 6 }} />}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className={styles.filterSearch}>
              <Search size={14} color="#8E7E70" />
              <input
                type="text"
                placeholder="Search challenges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* 4 Quick Metric / Highlight Cards */}
          <div className={styles.metricCardsGrid}>
            {/* Card 1: Weekly Challenge */}
            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <div className={`${styles.metricIconWrap} ${styles.metricTarget}`}>
                  <Target size={20} color="#EA580C" />
                </div>
                <div>
                  <div className={styles.metricCardTitle}>Weekly Sprint</div>
                  <div className={styles.metricCardSub}>Solve 12 curated challenges this week</div>
                </div>
              </div>
              <div className={styles.metricProgressWrap}>
                <div className={styles.metricProgressBar}>
                  <div
                    className={styles.metricProgressFill}
                    style={{
                      width: `${Math.min(100, Math.round(((overviewData?.stats?.userSolvedCount || 0) / 12) * 100))}%`
                    }}
                  />
                </div>
                <span className={styles.metricProgressCount}>
                  {overviewData?.stats?.userSolvedCount || 0}/12
                </span>
              </div>
            </div>

            {/* Card 2: Earn XP */}
            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <div className={`${styles.metricIconWrap} ${styles.metricTrophy}`}>
                  <Trophy size={20} color="#D97706" />
                </div>
                <div>
                  <div className={styles.metricCardTitle}>XP Earned</div>
                  <div className={styles.metricCardSub}>Real-time Sandbox Grade Rewards</div>
                </div>
              </div>
              <div className={styles.metricBadgeRow}>
                <span className={styles.xpBadge}>
                  +{overviewData?.stats?.userXpEarned || 0} XP Total
                </span>
              </div>
            </div>

            {/* Card 3: Live Problems Pool */}
            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <div className={`${styles.metricIconWrap} ${styles.metricStar}`}>
                  <Code2 size={20} color="#EAB308" />
                </div>
                <div>
                  <div className={styles.metricCardTitle}>
                    {overviewData?.stats?.totalChallenges || 37} Live Problems
                  </div>
                  <div className={styles.metricCardSub}>
                    {overviewData?.stats?.totalTestCases || 625}+ Verified Test Cases
                  </div>
                </div>
              </div>
              <div className={styles.metricActionLink} onClick={() => navigate("/code-arena")}>
                <span>Enter Code Arena</span>
                <ArrowRight size={13} />
              </div>
            </div>

            {/* Card 4: Leaderboard */}
            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <div className={`${styles.metricIconWrap} ${styles.metricCrown}`}>
                  <Award size={20} color="#D97706" />
                </div>
                <div>
                  <div className={styles.metricCardTitle}>Active Solvers</div>
                  <div className={styles.metricCardSub}>
                    {overviewData?.stats?.activeSolvers?.toLocaleString() || "12,480"} Engineers
                  </div>
                </div>
              </div>
              <div className={styles.leaderboardRank}>
                <span className={styles.rankNum}>#12</span>
                <span className={styles.rankDelta}>↑ 3</span>
              </div>
            </div>
          </div>

          {/* Available Challenges Section */}
          <div className={styles.sectionHeaderRow}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <h2 className={styles.sectionTitle}>Active Engineering Challenges</h2>
                <span style={{ fontSize: "0.72rem", background: "#FEF3C7", color: "#B45309", padding: "3px 9px", borderRadius: "12px", fontWeight: 700, letterSpacing: "0.5px" }}>
                  12 PRODUCTION CHALLENGES
                </span>
              </div>
              <p className={styles.sectionSubtitle}>
                Choose a topic and start solving. Each challenge comes with detailed instructions, live sandbox runner, and automated grading.
              </p>
            </div>

            <div className={styles.sectionControls}>
              {/* Daily Sync Button */}
              <button
                className={styles.controlSelect}
                style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", background: "#FFFFFF" }}
                onClick={handleSyncDailyQuestion}
                disabled={isSyncing}
                title="Query fresh interview questions"
              >
                <RefreshCw size={12} style={{ animation: isSyncing ? "spin 1s linear infinite" : "none" }} />
                <span>{isSyncing ? "Syncing..." : "Sync Fresh"}</span>
              </button>

              {/* Difficulty Dropdown */}
              <div className={styles.controlDropdownWrap}>
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className={styles.controlSelect}
                >
                  <option value="all">Difficulty: All</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className={styles.controlDropdownWrap}>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className={styles.controlSelect}
                >
                  <option value="recently-added">Recently Added</option>
                  <option value="most-popular">Most Popular</option>
                  <option value="xp-high">Highest XP</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className={styles.viewToggleGroup}>
                <button
                  className={`${styles.viewBtn} ${viewMode === "grid" ? styles.viewBtnActive : ""}`}
                  onClick={() => setViewMode("grid")}
                  title="Grid View"
                >
                  <Grid size={15} />
                </button>
                <button
                  className={`${styles.viewBtn} ${viewMode === "list" ? styles.viewBtnActive : ""}`}
                  onClick={() => setViewMode("list")}
                  title="List View"
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Main 2-Column Section: Category Menu on Left + Cards Grid on Right */}
          <div className={styles.challengesLayout}>
            {/* Category Sidebar with Dynamic Live Counts */}
            <div className={styles.categoryMenu}>
              {dynamicCategories.map((cat) => {
                const Icon = cat.icon
                const isSelected = selectedCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    className={`${styles.categoryMenuItem} ${isSelected ? styles.categoryMenuItemActive : ""}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Icon size={16} />
                      <span>{cat.label}</span>
                    </div>
                    <span className={styles.categoryCount}>{cat.count}</span>
                  </button>
                )
              })}
            </div>

            {/* Challenges Cards Grid */}
            <div className={viewMode === "grid" ? styles.cardsGrid : styles.cardsList}>
              {filteredChallenges.length === 0 ? (
                <div className={styles.emptyState}>
                  <Target size={42} color="#CBD5E1" />
                  <div className={styles.emptyTitle}>No challenges found</div>
                  <div className={styles.emptySub}>Try adjusting your filters or search keywords.</div>
                  <button
                    className={styles.resetFiltersBtn}
                    onClick={() => {
                      setActiveTab("all")
                      setSelectedCategory("all")
                      setDifficultyFilter("all")
                      setSearchQuery("")
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                filteredChallenges.map((ch) => {
                  const isEasy = ch.difficulty === "Easy"
                  const isMed = ch.difficulty === "Medium"
                  const diffColor = isEasy ? "#10B981" : isMed ? "#F59E0B" : "#EF4444"

                  return (
                    <motion.div
                      key={ch.id || ch.slug}
                      className={styles.challengeCard}
                      whileHover={{ y: -3, transition: { duration: 0.15 } }}
                    >
                      {/* Card Header */}
                      <div className={styles.cardHeader}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <ChallengeIcon type={ch.icon || ch.category} />
                          <div>
                            <div className={styles.cardTitle}>{ch.title}</div>
                            <div className={styles.cardDesc}>{ch.desc}</div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {ch.isCompleted && (
                            <span style={{ fontSize: "0.72rem", background: "#DCFCE7", color: "#15803D", padding: "2px 8px", borderRadius: "10px", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                              <CheckCircle2 size={11} /> Solved
                            </span>
                          )}
                          {ch.isNew && !ch.isCompleted && (
                            <span className={styles.newBadge}>New &gt;</span>
                          )}
                          {ch.locked && (
                            <span className={styles.lockedBadge}>
                              <Lock size={12} />
                              Locked
                            </span>
                          )}
                          {!ch.isNew && !ch.locked && !ch.isCompleted && (
                            <ChevronRight size={16} color="#CBD5E1" />
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      <div className={styles.tagsRow}>
                        {(ch.tags || []).map((t, idx) => (
                          <span key={idx} className={styles.tagPill}>{t}</span>
                        ))}
                      </div>

                      {/* Difficulty and XP */}
                      <div className={styles.cardMetaRow}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span className={styles.diffDot} style={{ background: diffColor }} />
                          <span className={styles.diffText}>{ch.difficulty}</span>
                        </div>
                        <span className={styles.xpText}>+{ch.xp} XP</span>
                      </div>

                      {/* Start Button */}
                      <button
                        className={`${styles.startBtn} ${ch.locked ? styles.startBtnLocked : ""}`}
                        onClick={() => {
                          if (ch.locked) {
                            showToast("Unlock this challenge by reaching 70% in AI Engineer track!")
                          } else {
                            navigate(`/challenges/${ch.slug || ch.id}`)
                          }
                        }}
                      >
                        <span>{ch.isCompleted ? "Solve Again" : "Start Challenge"}</span>
                        <ArrowRight size={14} />
                      </button>
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
