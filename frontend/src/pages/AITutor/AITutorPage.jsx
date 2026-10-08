import React, { useState, useRef, useEffect, useCallback } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import {
  Home, GraduationCap, BookOpen, Target, Layers, Flame, Code2, Sparkles,
  Network, Trophy, Clock, Settings, Headphones, Search, Bell,
  ChevronRight, ChevronDown, ArrowRight, Send, ThumbsUp,
  ThumbsDown, Copy, Bot, Lightbulb, BarChart3, RefreshCw, Cpu,
  CheckCircle2, XCircle, X, RotateCcw
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { getStoredUser } from "../../utils/authSession"
import { useTutorChat } from "../../hooks/useTutorChat"
import { fetchTutorSessions, fetchTutorSession, createTutorQuiz, submitTutorQuiz } from "../../services/aiTutorApi"
import careerMountainsAsset from "../../assets/career_hero_mountains.jpg"
import aiTutorRobotAsset from "../../assets/ai_tutor_robot.jpg"
import styles from "./AITutorPage.module.css"

// ── Navigation config ────────────────────────────────────────────────────────
const MAIN_NAV = [
  { id: "home",       label: "Home",       icon: Home,          route: "/" },
  { id: "career",     label: "Career",     icon: GraduationCap, route: "/career",     hasChevron: true },
  { id: "learn",      label: "Learn",      icon: BookOpen,      route: "/career",     hasChevron: true },
  { id: "challenges", label: "Challenges", icon: Target,        route: "/challenges" },
  { id: "projects",   label: "Projects",   icon: Layers,        route: "/workspace" },
  { id: "quizzes",    label: "Quizzes",    icon: Flame,         route: "/quizzes" },
  { id: "code-arena", label: "Code Arena", icon: Code2,         route: "/code-arena" },
  { id: "ai-tutor",   label: "AI Tutor",   icon: Sparkles,      route: "/ai-tutor" },
]
const PROGRESS_NAV = [
  { id: "skill-graph",       label: "Skill Graph",       icon: Network, route: "/skill-graph" },
  { id: "my-skills",         label: "My Skills",         icon: Layers, route: "/my-skills" },
  { id: "achievements",      label: "Achievements",      icon: Trophy, route: "/career" },
  { id: "learning-history",  label: "Learning History",  icon: Clock, route: "/challenges" },
]
const MORE_NAV = [
  { id: "settings", label: "Settings",    icon: Settings,  route: "/profile" },
  { id: "help",     label: "Help & Support", icon: Headphones, route: "/ai-tutor" },
]

// ── Tutor mode chips ─────────────────────────────────────────────────────────
const MODES = [
  { id: "ask",        label: "Ask Question",   icon: "💬", prompt: "Can you explain how attention mechanisms work in Transformers?" },
  { id: "explain",    label: "Explain Concept",icon: "📖", prompt: "Explain RAG in simple terms with an everyday analogy." },
  { id: "solve_code", label: "Debug Code",     icon: "</>", prompt: "How do I optimize a Python function that processes large JSON datasets?" },
  { id: "study_plan", label: "Study Plan",     icon: "📅", prompt: "Generate a 4-week roadmap to become an AI Engineer." },
  { id: "practice",   label: "Practice Quiz",  icon: "🎯", prompt: null },
]

const QUICK_TOPICS = [
  { id: "rag",    title: "RAG & Vector Stores",  sub: "Embeddings, chunking, retrieval", icon: "✨", color: "#EC4899", prompt: "Explain RAG in simple terms with an analogy and check my understanding." },
  { id: "python", title: "Python Deep Dive",     sub: "Generators, async, dict lookups", icon: "🐍", color: "#3B82F6", prompt: "Explain how Python dictionaries achieve O(1) lookups and check my understanding." },
  { id: "ml",     title: "Machine Learning",     sub: "Attention, loss, transformers",   icon: "🧠", color: "#8B5CF6", prompt: "Explain the Attention mechanism in Transformers with an everyday analogy." },
  { id: "react",  title: "React & Hooks",        sub: "useState, re-renders, lifecycle", icon: "🌐", color: "#06B6D4", prompt: "Explain how React useState works under the hood." },
  { id: "system", title: "System Design",        sub: "Caching, scaling, microservices", icon: "☁️", color: "#F59E0B", prompt: "Explain caching strategies like Redis in system design with trade-offs." },
]

// ── Markdown renderer ─────────────────────────────────────────────────────────
function InlineText({ text }) {
  if (!text) return null
  const tokens = text.split(/(\*\*.*?\*\*|`.*?`)/g)
  return (
    <>
      {tokens.map((tok, i) => {
        if (tok.startsWith("**") && tok.endsWith("**"))
          return <strong key={i}>{tok.slice(2, -2)}</strong>
        if (tok.startsWith("`") && tok.endsWith("`"))
          return (
            <code key={i} style={{ background: "#FAF6F0", padding: "2px 5px", borderRadius: 4, fontFamily: "monospace", fontSize: "0.85em", color: "#BA542E" }}>
              {tok.slice(1, -1)}
            </code>
          )
        return tok
      })}
    </>
  )
}

function MarkdownMessage({ content, onCopy }) {
  if (!content) return null
  const blocks = content.split(/(```[\s\S]*?```)/g)
  return (
    <div className={styles.markdownContent}>
      {blocks.map((block, bi) => {
        if (block.startsWith("```")) {
          const lang = (block.match(/^```(\w*)/) || [])[1] || "code"
          const code = block.replace(/^```\w*\n?/, "").replace(/```$/, "").trim()
          return (
            <div key={bi} className={styles.codeBlockWrap}>
              <div className={styles.codeBlockHeader}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8E7E70", textTransform: "uppercase" }}>{lang}</span>
                <button className={styles.copyBtn} onClick={() => onCopy(code)}>
                  <Copy size={12} /><span>Copy</span>
                </button>
              </div>
              <pre className={styles.codePre}><code>{code}</code></pre>
            </div>
          )
        }
        return (
          <React.Fragment key={bi}>
            {block.split("\n").map((line, li) => {
              const t = line.trim()
              if (!t) return <div key={li} style={{ height: 7 }} />
              if (t.startsWith("## "))  return <h2 key={li}><InlineText text={t.slice(3)} /></h2>
              if (t.startsWith("### ")) return <h3 key={li}><InlineText text={t.slice(4)} /></h3>
              if (t.startsWith("#### ")) return <h4 key={li} style={{ margin: "8px 0 4px", fontWeight: 700, fontSize: "0.9rem", color: "#3C2B1E" }}><InlineText text={t.slice(5)} /></h4>
              const numMatch = t.match(/^(\d+)\.\s+(.*)/)
              if (numMatch) return (
                <div key={li} className={styles.stepItem}>
                  <span className={styles.stepBadge}>{numMatch[1]}</span>
                  <div><InlineText text={numMatch[2]} /></div>
                </div>
              )
              if (t.startsWith("- ") || t.startsWith("* ")) return (
                <div key={li} style={{ display: "flex", gap: 8, margin: "4px 0 4px 12px" }}>
                  <span style={{ color: "#D96B43", fontWeight: 800 }}>•</span>
                  <div><InlineText text={t.slice(2)} /></div>
                </div>
              )
              if (t.startsWith("> ")) return (
                <blockquote key={li} style={{ borderLeft: "3px solid #D96B43", paddingLeft: 12, margin: "8px 0", color: "#5C4D40", fontStyle: "italic" }}>
                  <InlineText text={t.slice(2)} />
                </blockquote>
              )
              return <p key={li}><InlineText text={t} /></p>
            })}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ── Streaming cursor ──────────────────────────────────────────────────────────
function StreamCursor() {
  return (
    <span style={{ display: "inline-block", width: 10, height: "1em", background: "#D96B43", borderRadius: 2, marginLeft: 2, animation: "blink 0.8s step-end infinite" }} />
  )
}

// ── Quiz Modal ─────────────────────────────────────────────────────────────────
function QuizModal({ quizData, onClose }) {
  const [answers, setAnswers] = useState({})
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const questions = quizData.quiz?.questions || quizData.questions || []
  const quizId    = quizData.quiz?.id || quizData.quizId

  const handleSubmit = async () => {
    const unanswered = questions.filter(q => q.type === "mcq" && answers[q.id] === undefined)
    if (unanswered.length > 0) { showToast(`Please answer all ${unanswered.length} remaining question(s).`); return }
    setLoading(true)
    try {
      const payload = questions.map(q => {
        if (q.type === "mcq")   return { id: q.id, choice: answers[q.id] ?? -1 }
        return { id: q.id, text: answers[q.id] || "" }
      })
      const res = await submitTutorQuiz(quizId, payload)
      if (res?.success) {
        setResults(res)
        showToast(`Quiz graded! Score: ${res.score}%`)
      } else {
        showToast("Grading failed — please try again.")
      }
    } catch (e) {
      showToast(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const passed = results?.passed || (results?.score >= 70)

  return (
    <div className={styles.quizModalOverlay} onClick={onClose}>
      <motion.div
        className={styles.quizModal}
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.25 }}
      >
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div className={styles.quizToast} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className={styles.quizModalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.5rem" }}>🎯</span>
            <div>
              <h3 className={styles.quizModalTitle}>
                Practice Quiz: {quizData.quiz?.topic || quizData.topic}
              </h3>
              <span style={{ fontSize: "0.77rem", color: "#8E7E70" }}>
                {quizData.difficulty?.toUpperCase() || "MEDIUM"} • {questions.length} Questions
              </span>
            </div>
          </div>
          <button className={styles.quizCloseBtn} onClick={onClose}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className={styles.quizBody}>
          {results ? (
            <div>
              {/* Score Banner */}
              <div className={`${styles.quizResultBanner} ${passed ? styles.quizPass : styles.quizFail}`}>
                <div className={styles.quizScoreNum}>{results.score}%</div>
                <div className={styles.quizScoreLabel}>
                  {passed ? "🎉 Passed!" : "📚 Keep Practicing"} · Topic Mastery: {Math.round((results.mastery || results.topicMastery || 0) * 100)}%
                </div>
              </div>

              {/* Per-question feedback */}
              {(results.results || []).map((r, idx) => (
                <div key={idx} className={styles.quizQuestionCard}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    {r.correct ? <CheckCircle2 size={17} color="#10B981" /> : <XCircle size={17} color="#EF4444" />}
                    <span style={{ fontWeight: 700, fontSize: "0.88rem", color: r.correct ? "#10B981" : "#EF4444" }}>
                      Q{idx + 1}: {r.correct ? "Correct" : "Incorrect"}
                    </span>
                    <span style={{ marginLeft: "auto", fontSize: "0.77rem", color: "#8E7E70" }}>
                      Score: {Math.round(r.score * 100)}%
                    </span>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "#5C4D40", margin: 0, lineHeight: 1.5 }}>
                    {r.feedback || r.explanation}
                  </p>
                </div>
              ))}

              <button className={styles.quizSubmitBtn} onClick={onClose}>
                Done — Return to Tutor
              </button>
            </div>
          ) : (
            <div>
              {questions.map((q, idx) => (
                <div key={q.id} className={styles.quizQuestionCard}>
                  <div className={styles.quizQPrompt}>
                    <span className={styles.quizQNum}>Q{idx + 1}</span>
                    {q.prompt}
                  </div>

                  {q.type === "mcq" ? (
                    <div className={styles.quizOptionsList}>
                      {q.options.map((opt, oi) => {
                        const sel = answers[q.id] === oi
                        return (
                          <button
                            key={oi}
                            className={`${styles.quizOptionBtn} ${sel ? styles.quizOptionSelected : ""}`}
                            onClick={() => setAnswers(prev => ({ ...prev, [q.id]: oi }))}
                          >
                            <span className={styles.quizOptionLetter}>{String.fromCharCode(65 + oi)}</span>
                            <span>{opt}</span>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <textarea
                      className={styles.quizShortInput}
                      rows={3}
                      placeholder="Write your explanation here (1–3 sentences)..."
                      value={answers[q.id] || ""}
                      onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    />
                  )}
                </div>
              ))}

              <button
                className={styles.quizSubmitBtn}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <><RefreshCw size={14} className={styles.spinIcon} /> Grading...</>
                ) : "Submit Answers →"}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AITutorPage() {
  const navigate  = useNavigate()
  const [searchParams] = useSearchParams()
  const topicParam = searchParams.get('topic')
  const { user }  = useAuth()
  const sessionUser = getStoredUser()

  const [activeMode,   setActiveMode]   = useState("ask")
  const [activeLevel,  setActiveLevel]  = useState("beginner")
  const [inputMessage, setInputMessage] = useState("")
  const [toast,        setToast]        = useState(null)
  const [sessionsList, setSessionsList] = useState([])
  const [quizData,     setQuizData]     = useState(null)
  const [quizLoading,  setQuizLoading]  = useState(false)

  // Auto-fill prompt if navigated with a specific skill/topic from Skill Graph
  useEffect(() => {
    if (topicParam) {
      setInputMessage(`Can you explain ${topicParam} in depth, how it works in production, and test my understanding with an interactive example?`)
      showToast(`AI Tutor loaded for: ${topicParam}`)
    }
  }, [topicParam])

  const messagesEndRef = useRef(null)
  const textareaRef    = useRef(null)

  const currentUser = {
    name:           user?.name || sessionUser?.name || "Student",
    role:           "Student",
    avatar:         user?.avatar || sessionUser?.avatar || null,
    targetRoleName: "AI Engineer",
  }

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3200)
  }, [])

  // AI Tutor hook
  const { messages, followups, busy, error, send, rate, reset, setMessages } = useTutorChat({
    level: activeLevel,
    path:  currentUser.targetRoleName,
  })

  // Load recent sessions
  useEffect(() => {
    fetchTutorSessions()
      .then(res => { if (res?.length) setSessionsList(res) })
      .catch(() => {}) // silently ignore — sessions are supplementary
  }, [])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, busy])

  // Focus textarea on mount
  useEffect(() => { textareaRef.current?.focus() }, [])

  // ── Message send ────────────────────────────────────────────────────────
  const handleSend = useCallback((textOverride) => {
    const text = (textOverride || inputMessage).trim()
    if (!text || busy) return
    send(text, activeMode, activeLevel)
    if (!textOverride) setInputMessage("")
    textareaRef.current?.focus()
  }, [inputMessage, busy, activeMode, activeLevel, send])

  // ── Mode chip click ─────────────────────────────────────────────────────
  const handleModeClick = useCallback((mode) => {
    setActiveMode(mode.id)
    if (mode.id === "practice") {
      handleOpenQuiz("Python & RAG Systems")
    } else if (mode.prompt) {
      handleSend(mode.prompt)
    }
  }, [handleSend])

  // ── Code copy ───────────────────────────────────────────────────────────
  const handleCopyCode = useCallback((code) => {
    navigator.clipboard?.writeText(code)
    showToast("Copied to clipboard!")
  }, [showToast])

  // ── Practice Quiz ───────────────────────────────────────────────────────
  const handleOpenQuiz = async (topic = "Python") => {
    setQuizLoading(true)
    showToast(`Generating quiz on "${topic}"...`)
    try {
      const diff = activeLevel === "advanced" ? "hard" : activeLevel === "intermediate" ? "medium" : "easy"
      const res  = await createTutorQuiz({ topic, difficulty: diff, count: 3 })
      if (res?.success) {
        setQuizData(res)
      } else {
        showToast("Could not generate quiz — please try again.")
      }
    } catch (e) {
      showToast(`Quiz error: ${e.message}`)
    } finally {
      setQuizLoading(false)
    }
  }

  // ── Load past session ───────────────────────────────────────────────────
  const handleLoadSession = async (sessId) => {
    try {
      const sess = await fetchTutorSession(sessId)
      if (sess?.messages) {
        setMessages(sess.messages.map(m => ({
          ...m,
          id:      m.id || m._id || `r-${Math.random()}`,
          time:    m.time || new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        })))
        showToast(`Loaded: "${sess.title}"`)
      }
    } catch { showToast("Could not load session.") }
  }

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className={styles.shell}>
      {/* Global toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={styles.toast}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz modal */}
      <AnimatePresence>
        {quizData && <QuizModal quizData={quizData} onClose={() => setQuizData(null)} />}
      </AnimatePresence>

      {/* ═══ LEFT SIDEBAR ═══════════════════════════════════════════════════ */}
      <aside className={styles.sidebar}>
        <div className={styles.brand} onClick={() => navigate("/workspace")} role="button" tabIndex={0}>
          <div className={styles.brandMark}>R</div>
          <div>
            <div className={styles.brandName}>REXION</div>
            <div className={styles.brandSub}>AI CAREER PLATFORM</div>
          </div>
        </div>

        <div className={styles.navSection}>
          <nav className={styles.navMenu}>
            {MAIN_NAV.map(item => {
              const Icon = item.icon
              const isActive = item.id === "ai-tutor"
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

        <div className={styles.navSection}>
          <div className={styles.navSectionLabel}>Progress</div>
          <nav className={styles.navMenu}>
            {PROGRESS_NAV.map(item => {
              const Icon = item.icon
              return (
                <button key={item.id} className={styles.navItem}
                  onClick={() => item.route ? navigate(item.route) : showToast(`${item.label} coming soon`)}>
                  <div className={styles.navItemLeft}><Icon size={18} /><span>{item.label}</span></div>
                </button>
              )
            })}
          </nav>
        </div>

        <div className={styles.navSection}>
          <div className={styles.navSectionLabel}>More</div>
          <nav className={styles.navMenu}>
            {MORE_NAV.map(item => {
              const Icon = item.icon
              return (
                <button key={item.id} className={styles.navItem}
                  onClick={() => item.route ? navigate(item.route) : showToast(`Opening ${item.label}`)}>
                  <div className={styles.navItemLeft}><Icon size={18} /><span>{item.label}</span></div>
                </button>
              )
            })}
          </nav>
        </div>

        <div
          className={styles.journeyWidget}
          onClick={() => navigate("/career")}
          style={{
            backgroundImage: `linear-gradient(rgba(18,22,28,0.45),rgba(12,15,20,0.88)),url(${careerMountainsAsset})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className={styles.journeyIconBadge}><Cpu size={16} color="#10B981" /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className={styles.journeyLabel}>Your Current Path</span>
                <ChevronRight size={13} color="#94A3B8" />
              </div>
              <div className={styles.journeyTitle}>{currentUser.targetRoleName}</div>
            </div>
          </div>
          <div className={styles.journeyBar}>
            <div className={styles.journeyBarFill} style={{ width: "65%" }} />
          </div>
          <div className={styles.journeyPercent}>65% complete</div>
          <button className={styles.switchPathBtn} onClick={e => { e.stopPropagation(); navigate("/career") }}>
            <span>Switch Path</span><ArrowRight size={12} />
          </button>
        </div>

        <div className={styles.sidebarBottomSpacer} />
      </aside>

      {/* ═══ MAIN ═══════════════════════════════════════════════════════════ */}
      <main className={styles.main}>
        {/* Top bar */}
        <header className={styles.topBar}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search concepts, questions, past answers..."
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
            />
            <span className={styles.shortcut}>⌘ K</span>
          </div>

          <div className={styles.topActions}>
            <select
              className={styles.levelSelect}
              value={activeLevel}
              onChange={e => { setActiveLevel(e.target.value); showToast(`Level: ${e.target.value.toUpperCase()}`) }}
              title="Explanation difficulty"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <button className={styles.iconBtn} title="Notifications">
              <Bell size={18} />
              <span className={styles.notifDot} />
            </button>

            <div className={styles.profileBadge} onClick={() => navigate("/workspace")} role="button">
              <div className={styles.avatarWrap}>
                <span className={styles.avatarText}>{currentUser.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className={styles.profileMeta}>
                <span className={styles.userName}>{currentUser.name}</span>
                <span className={styles.userRole}>{currentUser.role}</span>
              </div>
              <ChevronDown size={14} color="#8E7E70" />
            </div>
          </div>
        </header>

        {/* Body 2-column grid */}
        <div className={styles.bodyGrid}>
          {/* ── Chat column ──────────────────────────────────────────────── */}
          <div className={styles.chatColumn}>
            {/* Hero banner */}
            <div className={styles.heroBanner}>
              <div className={styles.heroLeft}>
                <div className={styles.heroBadge}>
                  <Sparkles size={12} color="#D96B43" />
                  <span>SOCRATIC AI TUTOR</span>
                </div>
                <h1 className={styles.heroTitle}>Master Concepts, Simply</h1>
                <p className={styles.heroSubtitle}>
                  I teach through everyday analogies, step-by-step breakdowns, and check-your-understanding questions.
                </p>
              </div>
              <div className={styles.heroIllustration}>
                <div className={styles.cursiveNote}>Ask. Learn. Grow.</div>
                <img src={aiTutorRobotAsset} alt="AI Tutor" className={styles.robotImg} />
              </div>
            </div>

            {/* Mode chips */}
            <div className={styles.promptChipsRow}>
              {MODES.map(m => (
                <button
                  key={m.id}
                  className={`${styles.promptChip} ${activeMode === m.id ? styles.promptChipActive : ""}`}
                  onClick={() => handleModeClick(m)}
                >
                  <span style={{ fontSize: "0.9rem" }}>{m.icon}</span>
                  <span>{m.label}</span>
                  {m.id === "practice" && quizLoading && (
                    <RefreshCw size={12} className={styles.spinIcon} />
                  )}
                </button>
              ))}
            </div>

            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className={styles.errorBanner}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <span>⚠️ {error}</span>
                  <button onClick={reset} className={styles.errorResetBtn}>
                    <RotateCcw size={13} /> New Session
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat stream */}
            <div className={styles.chatStream}>
              {messages.map(msg => {
                if (msg.role === "user") {
                  return (
                    <motion.div
                      key={msg.id}
                      className={styles.userMessageRow}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className={styles.userMessageBubble}>
                        <div className={styles.userMessageText}>{msg.content}</div>
                        <div className={styles.userMessageMeta}>
                          <span>{msg.time || "Just now"}</span>
                          <span style={{ color: "#10B981" }}>✓✓</span>
                        </div>
                      </div>
                      <div className={styles.userBubbleAvatar}>
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                    </motion.div>
                  )
                }

                // ── Bot message ──
                const isError = msg.isError
                return (
                  <motion.div
                    key={msg.id}
                    className={styles.botMessageRow}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className={`${styles.botAvatar} ${isError ? styles.botAvatarError : ""}`}>
                      <Bot size={18} color="#FFFFFF" />
                    </div>

                    <div className={`${styles.botContentCard} ${isError ? styles.botContentCardError : ""}`}>
                      {msg.content ? (
                        <MarkdownMessage content={msg.content} onCopy={handleCopyCode} />
                      ) : msg.isStreaming ? (
                        <div className={styles.thinkingRow}>
                          <div className={styles.thinkingDots}>
                            <span /><span /><span />
                          </div>
                          <span style={{ fontSize: "0.78rem", color: "#8E7E70", marginLeft: 8 }}>Thinking...</span>
                        </div>
                      ) : null}

                      {/* Streaming cursor */}
                      {msg.isStreaming && msg.content && <StreamCursor />}

                      {/* Follow-up chips */}
                      {!msg.isStreaming && msg.followups?.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                          <div className={styles.followUpText}>
                            <Lightbulb size={12} /> Suggested follow-ups:
                          </div>
                          <div className={styles.suggestionChips}>
                            {msg.followups.map((chip, ci) => (
                              <button
                                key={ci}
                                className={styles.suggChip}
                                onClick={() => handleSend(chip)}
                                disabled={busy}
                              >
                                {chip}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Thumbs rating */}
                      {!msg.isStreaming && !isError && msg.id !== "welcome" && (
                        <div className={styles.feedbackRow}>
                          <button
                            className={`${styles.feedbackBtn} ${msg.userRating === "up" ? styles.feedbackBtnActive : ""}`}
                            onClick={() => { rate(msg.id, "up"); showToast("Thanks for the feedback!") }}
                            title="Helpful"
                          >
                            <ThumbsUp size={13} />
                          </button>
                          <button
                            className={`${styles.feedbackBtn} ${msg.userRating === "down" ? styles.feedbackBtnActive : ""}`}
                            onClick={() => { rate(msg.id, "down"); showToast("Feedback recorded — we'll improve.") }}
                            title="Needs work"
                          >
                            <ThumbsDown size={13} />
                          </button>
                          <span style={{ fontSize: "0.72rem", color: "#8E7E70", marginLeft: 4 }}>
                            Was this helpful?
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className={styles.chatInputCard}>
              <div className={styles.chatInputTopRow}>
                <Sparkles size={18} className={styles.inputWandIcon} />
                <textarea
                  ref={textareaRef}
                  className={styles.chatTextarea}
                  rows={2}
                  placeholder={`Ask anything about ${currentUser.targetRoleName}, architecture, algorithms, or code...`}
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
                  }}
                  disabled={busy}
                />
                <button
                  className={styles.sendBtn}
                  onClick={() => handleSend()}
                  disabled={busy || !inputMessage.trim()}
                  title="Send (Enter)"
                >
                  {busy ? <RefreshCw size={15} className={styles.spinIcon} /> : <Send size={15} />}
                </button>
              </div>
              <div className={styles.chatInputHint}>
                <span>AI explanations may contain errors — always verify important technical details</span>
                <span>Shift+Enter for new line • Enter to send</span>
              </div>
            </div>
          </div>

          {/* ── Right rail ────────────────────────────────────────────────── */}
          <div className={styles.railColumn}>
            {/* Practice Quiz CTA */}
            <div className={styles.railCard} style={{ background: "linear-gradient(135deg, #FFF9F3 0%, #FAF6F0 100%)", border: "1px solid #ECE5DC" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: "1.3rem" }}>🎯</span>
                <span className={styles.railCardTitle} style={{ color: "#D96B43" }}>Interactive Practice Quiz</span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "#5C4D40", margin: "0 0 12px" }}>
                Test your knowledge with instant AI grading — updates your Skill Graph mastery score.
              </p>
              <button
                className={styles.quizSubmitBtn}
                style={{ padding: "10px 14px", fontSize: "0.85rem" }}
                onClick={() => handleOpenQuiz("Python & RAG Systems")}
                disabled={quizLoading}
              >
                {quizLoading ? <><RefreshCw size={13} className={styles.spinIcon} /> Generating...</> : "Start Practice Quiz →"}
              </button>
            </div>

            {/* Quick Topics */}
            <div className={styles.railCard}>
              <div className={styles.railCardHeader}>
                <span className={styles.railCardTitle}>Quick Topics</span>
                <span style={{ fontSize: "0.72rem", color: "#8E7E70", fontWeight: 700 }}>{QUICK_TOPICS.length} Topics</span>
              </div>
              <div className={styles.topicList}>
                {QUICK_TOPICS.map(top => (
                  <button
                    key={top.id}
                    className={styles.topicItem}
                    onClick={() => handleSend(top.prompt)}
                    disabled={busy}
                  >
                    <div className={styles.topicIconWrap} style={{ backgroundColor: `${top.color}18`, color: top.color }}>
                      <span>{top.icon}</span>
                    </div>
                    <div className={styles.topicMeta}>
                      <div className={styles.topicItemTitle}>{top.title}</div>
                      <div className={styles.topicItemSub}>{top.sub}</div>
                    </div>
                    <ChevronRight size={13} color="#CBD5E1" />
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Sessions */}
            <div className={styles.railCard}>
              <div className={styles.railCardHeader}>
                <span className={styles.railCardTitle}>Recent Sessions</span>
                <button
                  style={{ fontSize: "0.72rem", color: "#D96B43", fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  onClick={() => { reset(); showToast("New session started.") }}
                >
                  + New
                </button>
              </div>
              <div className={styles.sessionList}>
                {sessionsList.length > 0 ? (
                  sessionsList.slice(0, 5).map(s => (
                    <button key={s.id || s._id} className={styles.sessionItem} onClick={() => handleLoadSession(s.id || s._id)}>
                      <div className={styles.sessionIconWrap}><Bot size={14} color="#D96B43" /></div>
                      <div className={styles.sessionMeta}>
                        <div className={styles.sessionTitle}>{s.title}</div>
                        <div className={styles.sessionTime}>{s.time || "Today"}</div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div style={{ fontSize: "0.8rem", color: "#8E7E70", padding: "8px 0" }}>
                    Your session history will appear here.
                  </div>
                )}
              </div>
            </div>

            {/* Mastery tracker placeholder */}
            <div className={styles.railCard}>
              <div className={styles.railCardHeader}>
                <span className={styles.railCardTitle}>Topic Mastery</span>
                <BarChart3 size={14} color="#D96B43" />
              </div>
              {[
                { label: "RAG Systems", pct: 72 },
                { label: "Python", pct: 85 },
                { label: "React Hooks", pct: 60 },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: 4, color: "#5C4D40", fontWeight: 600 }}>
                    <span>{item.label}</span><span>{item.pct}%</span>
                  </div>
                  <div style={{ height: 5, background: "#ECE5DC", borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${item.pct}%`, background: "linear-gradient(90deg, #D96B43, #E8906A)", borderRadius: 4, transition: "width 0.8s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}
