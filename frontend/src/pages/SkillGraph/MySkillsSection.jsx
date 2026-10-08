import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart2, CheckCircle2, Clock, Lock, ChevronRight, Search,
  ArrowRight, Sparkles, AlertTriangle, Lightbulb, ExternalLink,
  Code2, Database, Brain, Globe, Layers, Server, Cloud, Shield,
  Terminal, Compass, Star, Target, FastForward, Settings, Play, BookOpen,
  Cpu, Zap, X, RefreshCw
} from 'lucide-react'
import skillGraphApi from '../../services/skillGraphApi'
import deskIllustration from '../../assets/skills_header_desk.jpg'
import styles from './MySkillsSection.module.css'

// ── CUSTOM LOGOS & ICONS ─────────────────────────────────────
const SkillLogo = ({ name, category, color, size = 22 }) => {
  const norm = (name || '').toLowerCase()

  if (norm.includes('python')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M11.9 2C6.7 2 7 4.3 7 4.3L7.02 6.6H12V7.4H4.5C2.3 7.4 2 9.7 2 11.9C2 14.1 3.2 14.2 4.1 14.2H5.6V12.1C5.6 9.7 7.5 9.7 7.5 9.7H12.4C14.3 9.7 14.7 8.2 14.7 7.4V4.3C14.7 2.4 13.1 2 11.9 2ZM9.6 3.6C10.2 3.6 10.6 4.1 10.6 4.6C10.6 5.2 10.1 5.6 9.6 5.6C9 5.6 8.6 5.1 8.6 4.6C8.6 4 9 3.6 9.6 3.6Z" fill="#387EB8"/>
        <path d="M12.1 22C17.3 22 17 19.7 17 19.7L16.98 17.4H12V16.6H19.5C21.7 16.6 22 14.3 22 12.1C22 9.9 20.8 9.8 19.9 9.8H18.4V11.9C18.4 14.3 16.5 14.3 16.5 14.3H11.6C9.7 14.3 9.3 15.8 9.3 16.6V19.7C9.3 21.6 10.9 22 12.1 22ZM14.4 20.4C13.8 20.4 13.4 19.9 13.4 19.4C13.4 18.8 13.9 18.4 14.4 18.4C15 18.4 15.4 18.9 15.4 19.4C15.4 20 15 20.4 14.4 20.4Z" fill="#FFE052"/>
      </svg>
    )
  }

  if (norm.includes('react')) {
    return (
      <svg width={size} height={size} viewBox="-11.5 -10.23174 23 20.46348">
        <circle cx="0" cy="0" r="2.05" fill="#61DAFB"/>
        <g stroke="#61DAFB" strokeWidth="1" fill="none">
          <ellipse rx="11" ry="4.2"/>
          <ellipse rx="11" ry="4.2" transform="rotate(60)"/>
          <ellipse rx="11" ry="4.2" transform="rotate(120)"/>
        </g>
      </svg>
    )
  }

  if (norm.includes('javascript') || norm === 'js') {
    return (
      <div style={{
        background: '#F7DF1E',
        color: '#000000',
        fontWeight: 800,
        fontSize: '11px',
        padding: '2px 4px',
        borderRadius: 4,
        lineHeight: 1,
        fontFamily: 'sans-serif'
      }}>
        JS
      </div>
    )
  }

  if (norm.includes('docker')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#2496ED">
        <path d="M13.98 11.08h-2.1V8.98h2.1v2.1zm-2.48 0H9.4V8.98h2.1v2.1zm-2.48 0H6.92V8.98h2.1v2.1zm-2.48 0H4.44V8.98h2.1v2.1zm7.44-2.48h-2.1V6.5h2.1v2.1zm-2.48 0H9.4V6.5h2.1v2.1zm-2.48 0H6.92V6.5h2.1v2.1zm4.96-2.48h-2.1V4.02h2.1v2.1zm8.38 7.32c-.34-.23-1.09-.32-1.74-.08-.18-.89-.78-1.57-1.47-1.92-.09-.05-.18-.09-.27-.13-.37-.17-.79-.26-1.22-.26-.14 0-.28.01-.42.04v.01c-.13.03-.26.07-.39.12-.13-.19-.3-.36-.49-.5-.49-.36-1.12-.55-1.79-.55H2.43c-.24 0-.43.19-.43.43v5.1c0 2.8 1.95 5.25 4.67 5.86 1.48.33 3.03.26 4.54-.2 1.63-.5 3.09-1.48 4.19-2.82.68.04 1.37-.11 1.98-.44.75-.41 1.34-1.07 1.68-1.89.28-.69.34-1.44.17-2.18-.08-.34-.25-.65-.48-.89z" />
      </svg>
    )
  }

  if (norm.includes('sql') || norm.includes('database')) {
    return <Database size={size} color="#336791" />
  }

  if (norm.includes('machine learning') || norm.includes('ml') || norm.includes('deep learning')) {
    return <Brain size={size} color="#8B5CF6" />
  }

  if (norm.includes('rag') || norm.includes('retrieval') || norm.includes('vector')) {
    return <Search size={size} color="#0D9488" />
  }

  if (norm.includes('dsa') || norm.includes('algorithm')) {
    return <Code2 size={size} color="#D96B43" />
  }

  if (norm.includes('system design')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="6" height="5" rx="1"/>
        <rect x="16" y="3" width="6" height="5" rx="1"/>
        <rect x="9" y="16" width="6" height="5" rx="1"/>
        <path d="M5 8v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/>
        <path d="M12 13v3"/>
      </svg>
    )
  }

  if (category === 'Cybersecurity') return <Shield size={size} color="#E11D48" />
  if (category === 'Cloud & DevOps') return <Cloud size={size} color="#0284C7" />
  if (category === 'Data Science') return <BarChart2 size={size} color="#F59E0B" />

  return <Terminal size={size} color={color || '#D96B43'} />
}

// Complete Catalog of 32 Standard Industry Skills (with base progress = 0)
const MASTER_CATALOG = [
  // ── Development ──
  { id: 'skill-python', name: 'Python', category: 'Development', subTopics: ['Syntax', 'OOP', 'Functions', 'AsyncIO'], themeColor: '#387EB8', desc: 'Core language for AI engineering, backend APIs, data pipelines, and automation.' },
  { id: 'skill-javascript', name: 'JavaScript', category: 'Development', subTopics: ['ES6+', 'DOM', 'Async', 'Event Loop'], themeColor: '#D97706', desc: 'The ubiquitous language of the web, powering interactive frontend applications and Node runtimes.' },
  { id: 'skill-typescript', name: 'TypeScript', category: 'Development', subTopics: ['Generics', 'Interfaces', 'Union Types', 'Strict Mode'], themeColor: '#3178C6', desc: 'Strongly typed superset of JavaScript enhancing code safety and maintainability at enterprise scale.' },
  { id: 'skill-react', name: 'React', category: 'Development', subTopics: ['Hooks', 'State', 'Context', 'Performance'], themeColor: '#0284C7', desc: 'Industry-standard declarative UI library for crafting scalable component-driven interfaces.' },
  { id: 'skill-nextjs', name: 'Next.js', category: 'Development', subTopics: ['App Router', 'Server Components', 'SSR / SSG', 'API Handlers'], themeColor: '#000000', desc: 'Production React framework featuring server-side rendering and edge routing.' },
  { id: 'skill-nodejs', name: 'Node.js', category: 'Development', subTopics: ['Event Loop', 'Streams', 'Express', 'Middleware'], themeColor: '#16A34A', desc: 'Asynchronous event-driven JavaScript backend runtime for scalable networked services.' },
  { id: 'skill-fastapi', name: 'FastAPI', category: 'Development', categoryLabel: 'Backend Architecture', subTopics: ['Pydantic', 'Async Endpoints', 'Dependency Injection', 'OpenAPI'], themeColor: '#059669', desc: 'High-performance Python web framework for building production RESTful APIs.' },
  { id: 'skill-system-design', name: 'System Design', category: 'Development', categoryLabel: 'System Design', subTopics: ['Scalability', 'Caching', 'Load Balancing', 'Microservices'], themeColor: '#EF4444', desc: 'Distributed systems architecture, high availability trade-offs, and horizontal scaling.' },
  { id: 'skill-git', name: 'Git & GitHub', category: 'Development', subTopics: ['Branching', 'Rebase', 'Pull Requests', 'Merge Resolution'], themeColor: '#F05032', desc: 'Distributed version control standard for tracking source code and collaborating across teams.' },

  // ── AI / ML ──
  { id: 'skill-machine-learning', name: 'Machine Learning', category: 'AI / ML', subTopics: ['Regression', 'Classification', 'Evaluation', 'Scikit-Learn'], themeColor: '#8B5CF6', desc: 'Supervised and unsupervised models, cross-validation, and production inference pipelines.' },
  { id: 'skill-deep-learning', name: 'Deep Learning', category: 'AI / ML', subTopics: ['Neural Networks', 'Backprop', 'PyTorch', 'Transformers'], themeColor: '#A855F7', desc: 'Multi-layer neural architectures, tensor computations, and transformer models.' },
  { id: 'skill-llms', name: 'LLMs & GenAI', category: 'AI / ML', categoryLabel: 'Generative AI', subTopics: ['Prompting', 'Tokenization', 'Fine-Tuning', 'API Integrations'], themeColor: '#E27D60', desc: 'Generative language models, contextual embeddings, and foundation model tooling.' },
  { id: 'skill-rag', name: 'RAG', category: 'AI / ML', categoryLabel: 'Generative AI', subTopics: ['Embeddings', 'Vector DB', 'Retrieval', 'Reranking'], themeColor: '#0D9488', desc: 'Retrieval Augmented Generation combining vector search with LLM prompt context.' },
  { id: 'skill-prompt-engineering', name: 'Prompt Engineering', category: 'AI / ML', subTopics: ['Few-Shot', 'Chain-of-Thought', 'System Design', 'Guardrails'], themeColor: '#EC4899', desc: 'Methodologies to elicit reliable, structured reasoning from large language models.' },
  { id: 'skill-vector-db', name: 'Vector Databases', category: 'AI / ML', subTopics: ['Pinecone', 'ChromaDB', 'Similarity Metrics', 'HNSW'], themeColor: '#06B6D4', desc: 'High-dimensional vector storage, semantic search indexing, and nearest neighbor search.' },

  // ── Data Science ──
  { id: 'skill-pandas', name: 'Pandas & Analytics', category: 'Data Science', subTopics: ['DataFrames', 'Cleaning', 'Aggregation', 'Pivot Tables'], themeColor: '#10B981', desc: 'Tabular data wrangling, missing data imputation, and exploratory data workflows.' },
  { id: 'skill-numpy', name: 'NumPy', category: 'Data Science', subTopics: ['Arrays', 'Vectorization', 'Broadcasting', 'Linear Algebra'], themeColor: '#0EA5E9', desc: 'N-dimensional arrays, vectorized mathematical computation, and matrix operations.' },
  { id: 'skill-statistics', name: 'Statistics & Probability', category: 'Data Science', subTopics: ['Distributions', 'Hypothesis Testing', 'P-Values', 'Inference'], themeColor: '#6366F1', desc: 'Statistical inference, sampling distributions, and significance hypothesis testing.' },
  { id: 'skill-data-viz', name: 'Data Visualization', category: 'Data Science', subTopics: ['Matplotlib', 'Seaborn', 'Interactive Charts', 'Dashboards'], themeColor: '#F59E0B', desc: 'Visual analytics, chart styling, and data distribution storytelling.' },

  // ── DSA ──
  { id: 'skill-dsa', name: 'DSA', category: 'DSA', categoryLabel: 'Algorithm & Logic', subTopics: ['Arrays', 'Strings', 'Graphs', 'Trees', 'Two Pointers'], themeColor: '#D96B43', desc: 'Core data structures and algorithms solving software bottlenecks and technical interviews.' },
  { id: 'skill-dynamic-programming', name: 'Dynamic Programming', category: 'DSA', subTopics: ['Memoization', 'Tabulation', 'Subproblems', 'Optimization'], themeColor: '#DC2626', desc: 'Recursive state decomposition with caching to eliminate exponential complexity.' },
  { id: 'skill-tree-graphs', name: 'Trees & Graphs', category: 'DSA', subTopics: ['BFS / DFS', 'BST Validation', 'Dijkstra', 'Topological Sort'], themeColor: '#059669', desc: 'Graph traversals, binary search trees, and topological ordering.' },
  { id: 'skill-big-o', name: 'Big-O & Complexity', category: 'DSA', subTopics: ['Time Complexity', 'Space Bounds', 'Amortized Analysis'], themeColor: '#475569', desc: 'Asymptotic performance bounds for runtime and memory consumption under scale.' },

  // ── Database ──
  { id: 'skill-sql', name: 'SQL', category: 'Database', subTopics: ['Joins', 'Aggregation', 'Window Functions', 'Indexing'], themeColor: '#2563EB', desc: 'Relational data query mastery, relational schemas, indexing, and query optimization.' },
  { id: 'skill-mongodb', name: 'MongoDB', category: 'Database', subTopics: ['Aggregation Pipeline', 'Documents', 'Indexes', 'Replica Sets'], themeColor: '#10B981', desc: 'Flexible JSON document database architecture, embedded schemas, and pipelines.' },
  { id: 'skill-redis', name: 'Redis', category: 'Database', subTopics: ['Caching', 'Pub/Sub', 'TTL Expiry', 'Session Storage'], themeColor: '#DC2626', desc: 'In-memory key-value data store for low-latency caching, sessions, and pub/sub.' },

  // ── Cloud & DevOps ──
  { id: 'skill-docker', name: 'Docker', category: 'Cloud & DevOps', subTopics: ['Containers', 'Images', 'Volumes', 'Dockerfile'], themeColor: '#2496ED', desc: 'Containerization, reproducible multi-stage Docker builds, and compose environments.' },
  { id: 'skill-kubernetes', name: 'Kubernetes', category: 'Cloud & DevOps', subTopics: ['Pods', 'Deployments', 'Services', 'Ingress'], themeColor: '#326CE5', desc: 'Container orchestration, declarative deployments, service discovery, and rolling updates.' },
  { id: 'skill-aws', name: 'AWS Cloud', category: 'Cloud & DevOps', subTopics: ['S3', 'EC2', 'Lambda', 'IAM Roles'], themeColor: '#FF9900', desc: 'Cloud provisioning, serverless Lambda compute, S3 storage, and IAM authentication.' },
  { id: 'skill-cicd', name: 'CI/CD Pipelines', category: 'Cloud & DevOps', subTopics: ['GitHub Actions', 'Test Automation', 'Deployments', 'Secrets'], themeColor: '#2088FF', desc: 'Automated continuous integration build checks, test suites, and deploy pipelines.' },
  { id: 'skill-linux', name: 'Linux & Bash', category: 'Cloud & DevOps', subTopics: ['Bash Scripts', 'Permissions', 'Processes', 'SSH'], themeColor: '#FCC624', desc: 'UNIX operating system fundamentals, POSIX shell automation, and process management.' },

  // ── Cybersecurity ──
  { id: 'skill-cybersec-owasp', name: 'OWASP & Web Security', category: 'Cybersecurity', subTopics: ['XSS', 'CSRF', 'SQL Injection', 'JWT Security'], themeColor: '#E11D48', desc: 'Identification and mitigation of critical web application vulnerabilities and threat modeling.' }
]

export default function MySkillsSection({
  profile = {},
  graphData = null,
  targetRoleTitle = 'AI Engineer',
  onViewFullGraph = () => {},
  onOpenTrackModal = () => {},
  showToast = () => {}
}) {
  const navigate = useNavigate()

  // State
  const [activeCategory, setActiveCategory] = useState('All Skills')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('progress') // 'progress' | 'name' | 'practice'
  const [selectedSkillModal, setSelectedSkillModal] = useState(null)
  const [kpiFilter, setKpiFilter] = useState(null) // null | 'strong' | 'progress' | 'practice'
  const [backendData, setBackendData] = useState(null)
  const [loadingRealStats, setLoadingRealStats] = useState(true)

  // Categories list matching UI screenshot
  const CATEGORIES = [
    'All Skills',
    'Development',
    'AI / ML',
    'Data Science',
    'DSA',
    'Database',
    'Cloud & DevOps',
    'Cybersecurity'
  ]

  // Fetch strictly REAL calculated statistics from backend MongoDB API
  const fetchRealStats = useCallback(async () => {
    setLoadingRealStats(true)
    try {
      const roleSlug = targetRoleTitle ? targetRoleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'ai-engineer'
      const res = await skillGraphApi.getUserSkillsSummary(roleSlug)
      if (res && res.kpi && Array.isArray(res.skills)) {
        setBackendData(res)
      }
    } catch (err) {
      console.warn('Real skills summary backend fetch notice:', err?.message)
    } finally {
      setLoadingRealStats(false)
    }
  }, [targetRoleTitle])

  useEffect(() => {
    fetchRealStats()

    // Real-time synchronization whenever user solves a quiz or challenge
    const onQuizDone = () => fetchRealStats()
    const onChallengeDone = () => fetchRealStats()
    const onRoleChange = () => fetchRealStats()

    window.addEventListener('rexion-quiz-completed', onQuizDone)
    window.addEventListener('rexion-challenge-solved', onChallengeDone)
    window.addEventListener('rexion-target-role-changed', onRoleChange)

    return () => {
      window.removeEventListener('rexion-quiz-completed', onQuizDone)
      window.removeEventListener('rexion-challenge-solved', onChallengeDone)
      window.removeEventListener('rexion-target-role-changed', onRoleChange)
    }
  }, [fetchRealStats])

  // Compute strictly REAL progression from backend records or client activity (0% base, NO fake numbers)
  const processedSkills = useMemo(() => {
    // If backend returned real calculated skills, use them directly
    if (backendData?.skills && backendData.skills.length > 0) {
      return backendData.skills.map(s => {
        let statusClass = styles.statusNotStarted
        let barColor = '#CBD5E1'

        if (s.status === 'Strong') {
          statusClass = styles.statusStrong
          barColor = '#10B981'
        } else if (s.status === 'In Progress') {
          statusClass = styles.statusInProgress
          barColor = '#F59E0B'
        } else if (s.status === 'Needs Practice') {
          statusClass = styles.statusNeedsPractice
          barColor = '#EF4444'
        }

        return {
          ...s,
          statusClass,
          barColor
        }
      })
    }

    // Local strict real calculation fallback (strictly 0% base, no mocks)
    let quizScoresMap = {}
    let solvedSlugs = new Set()

    try {
      const rawScores = window.localStorage.getItem('rexionQuizScores')
      if (rawScores) quizScoresMap = JSON.parse(rawScores)
      const rawSolves = window.localStorage.getItem('rexionSolvedChallenges') || window.localStorage.getItem('rexion_solved_challenges')
      if (rawSolves) {
        String(rawSolves).split(',').forEach(s => solvedSlugs.add(s.trim().toLowerCase()))
      }
    } catch (_) {}

    const profileSkills = Array.isArray(profile?.skills) ? profile.skills.map(s => s.toLowerCase().trim()) : []

    return MASTER_CATALOG.map(skill => {
      const skillNameLower = skill.name.toLowerCase()
      let progress = 0

      // 1. Profile presence: declared verified skill adds 25%
      const inProfile = profileSkills.some(ps => ps.includes(skillNameLower) || skillNameLower.includes(ps))
      if (inProfile) {
        progress += 25
      }

      // 2. Real quiz scores: adds up to 45% based strictly on test marks
      for (const [slug, qScore] of Object.entries(quizScoresMap)) {
        if (slug.includes(skillNameLower) || skillNameLower.includes(slug.replace(/-basics|-fundamentals|-wrangling/g, ''))) {
          const numScore = Number(qScore) || 0
          if (numScore > 0) {
            progress += Math.round((numScore / 100) * 45)
            break
          }
        }
      }

      // 3. Solved challenge count: 15% per solved challenge (up to 30%)
      const hasSolved = Array.from(solvedSlugs).filter(slug => slug.includes(skillNameLower)).length
      if (hasSolved > 0) {
        progress += Math.min(30, hasSolved * 15)
      }

      // Strict boundary [0, 100]
      progress = Math.min(100, Math.max(0, progress))

      // Strict status assignment
      let status = 'Not Started'
      let statusClass = styles.statusNotStarted
      let barColor = '#CBD5E1'
      let footerIcon = 'play'
      let footerText = 'Begin with basics'

      if (progress >= 70) {
        status = 'Strong'
        statusClass = styles.statusStrong
        barColor = '#10B981'
        footerIcon = 'star'
        footerText = 'Career relevant'
      } else if (progress >= 30) {
        status = 'In Progress'
        statusClass = styles.statusInProgress
        barColor = '#F59E0B'
        footerIcon = 'forward'
        footerText = 'Continue practice'
      } else if (progress > 0) {
        status = 'Needs Practice'
        statusClass = styles.statusNeedsPractice
        barColor = '#EF4444'
        footerIcon = 'target'
        footerText = 'Practice recommended'
      }

      return {
        ...skill,
        progress,
        status,
        statusClass,
        barColor,
        footerIcon,
        footerText,
        actionUrl: `/challenges?search=${encodeURIComponent(skill.name.toLowerCase())}`
      }
    })
  }, [backendData, profile])

  // Real KPI statistics strictly matching computed values (no mock floors)
  const kpiStats = useMemo(() => {
    if (backendData?.kpi) {
      return backendData.kpi
    }

    const total = processedSkills.length
    const strong = processedSkills.filter(s => s.status === 'Strong').length
    const inProgress = processedSkills.filter(s => s.status === 'In Progress').length
    const needPractice = processedSkills.filter(s => s.status === 'Needs Practice' || s.status === 'Not Started').length

    return {
      totalSkills: total,
      strongSkills: strong,
      inProgressSkills: inProgress,
      needPracticeSkills: needPractice
    }
  }, [backendData, processedSkills])

  // Real overall average progress
  const overallAverage = useMemo(() => {
    if (backendData?.overallProgress !== undefined) {
      return backendData.overallProgress
    }
    const sum = processedSkills.reduce((acc, curr) => acc + curr.progress, 0)
    return processedSkills.length > 0 ? Math.round(sum / processedSkills.length) : 0
  }, [backendData, processedSkills])

  // Identify real weakest skill from user's data
  const weakestSkill = useMemo(() => {
    if (backendData?.weakestSkill) {
      return backendData.weakestSkill
    }
    const withProgress = [...processedSkills].filter(s => s.progress > 0).sort((a, b) => a.progress - b.progress)
    return withProgress[0] || processedSkills[0] || { name: 'Python', category: 'Development', progress: 0 }
  }, [backendData, processedSkills])

  // Filter and sort skills
  const filteredSkills = useMemo(() => {
    let list = [...processedSkills]

    // Category filter
    if (activeCategory !== 'All Skills') {
      list = list.filter(s => s.category.toLowerCase() === activeCategory.toLowerCase())
    }

    // KPI card quick filter
    if (kpiFilter === 'strong') {
      list = list.filter(s => s.status === 'Strong')
    } else if (kpiFilter === 'progress') {
      list = list.filter(s => s.status === 'In Progress')
    } else if (kpiFilter === 'practice') {
      list = list.filter(s => s.status === 'Needs Practice' || s.status === 'Not Started')
    }

    // Live Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.categoryLabel && s.categoryLabel.toLowerCase().includes(q)) ||
        (s.subTopics && s.subTopics.some(t => t.toLowerCase().includes(q)))
      )
    }

    // Sorting
    if (sortBy === 'progress') {
      list.sort((a, b) => b.progress - a.progress)
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'practice') {
      list.sort((a, b) => a.progress - b.progress)
    }

    return list
  }, [processedSkills, activeCategory, searchQuery, sortBy, kpiFilter])

  // Footer icon renderer
  const renderFooterIcon = (iconName) => {
    switch (iconName) {
      case 'star': return <Star size={14} color="#D96B43" fill="#D96B43" />
      case 'target': return <Target size={14} color="#D96B43" />
      case 'forward': return <FastForward size={14} color="#D97706" />
      case 'settings': return <Settings size={14} color="#0284C7" />
      case 'bulb': return <Lightbulb size={14} color="#F59E0B" />
      case 'search': return <Search size={14} color="#0D9488" />
      case 'play': return <Play size={14} color="#64748B" fill="#64748B" />
      case 'book': return <BookOpen size={14} color="#EF4444" />
      default: return <Sparkles size={14} color="#D96B43" />
    }
  }

  // Key skills for target role
  const keySkillsForPath = [
    'Python', 'Machine Learning', 'LLMs', 'RAG', 'Docker', 'System Design'
  ]

  // Donut chart calculations (circumference = 2 * PI * 40 = 251.32)
  const totalTracked = kpiStats.totalSkills || 1
  const strongRatio = (kpiStats.strongSkills || 0) / totalTracked
  const progressRatio = (kpiStats.inProgressSkills || 0) / totalTracked
  const practiceRatio = (kpiStats.needPracticeSkills || 0) / totalTracked

  const circ = 251.32
  const strongStroke = circ * strongRatio
  const progressStroke = circ * progressRatio
  const practiceStroke = circ * practiceRatio

  return (
    <div className={styles.skillsContainer}>
      {/* ── TOP HEADER BANNER ────────────────────────────────── */}
      <div className={styles.headerBanner}>
        <div className={styles.headerLeft}>
          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbLink} onClick={() => navigate('/career')}>Career</span>
            <ChevronRight size={13} />
            <span className={styles.breadcrumbCurrent}>My Skills</span>
          </div>

          <h1 className={styles.pageTitle}>My Skills</h1>
          <p className={styles.pageSubtitle}>
            Track your skill progress, see your strengths and areas of improvement, and get personalized recommendations to level up.
          </p>
        </div>

        {/* Study desk artwork with cursive script */}
        <div className={styles.headerIllustrationWrap}>
          <div className={styles.headerIllustrationText}>
            Better skills.<br />Bigger opportunities.
          </div>
          <img
            src={deskIllustration}
            alt="Study desk watercolor illustration"
            className={styles.headerIllustrationImg}
          />
        </div>
      </div>

      {/* ── 4 KPI SUMMARY CARDS (100% REAL STATISTICS) ──────── */}
      <div className={styles.kpiGrid}>
        {/* Card 1: Total Skills */}
        <div
          className={`${styles.kpiCard} ${kpiFilter === null ? styles.kpiCardActive : ''}`}
          onClick={() => setKpiFilter(null)}
          title="Click to view all skills"
        >
          <div className={styles.kpiIconBox} style={{ background: '#FBECE4', color: '#D96B43' }}>
            <BarChart2 size={22} />
          </div>
          <div>
            <div className={styles.kpiNumber}>{kpiStats.totalSkills}</div>
            <div className={styles.kpiLabel}>Total Skills</div>
          </div>
        </div>

        {/* Card 2: Strong Skills */}
        <div
          className={`${styles.kpiCard} ${kpiFilter === 'strong' ? styles.kpiCardActive : ''}`}
          onClick={() => setKpiFilter(kpiFilter === 'strong' ? null : 'strong')}
          title="Click to filter verified strong skills (70%+)"
        >
          <div className={styles.kpiIconBox} style={{ background: '#E6F9F0', color: '#10B981' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className={styles.kpiNumber}>{kpiStats.strongSkills}</div>
            <div className={styles.kpiLabel}>Strong Skills<br /><span style={{ fontSize: '0.74rem' }}>(70%+)</span></div>
          </div>
        </div>

        {/* Card 3: In Progress */}
        <div
          className={`${styles.kpiCard} ${kpiFilter === 'progress' ? styles.kpiCardActive : ''}`}
          onClick={() => setKpiFilter(kpiFilter === 'progress' ? null : 'progress')}
          title="Click to filter active in-progress skills (30-69%)"
        >
          <div className={styles.kpiIconBox} style={{ background: '#FEF3C7', color: '#F59E0B' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className={styles.kpiNumber}>{kpiStats.inProgressSkills}</div>
            <div className={styles.kpiLabel}>In Progress<br /><span style={{ fontSize: '0.74rem' }}>(30-69%)</span></div>
          </div>
        </div>

        {/* Card 4: Need Practice */}
        <div
          className={`${styles.kpiCard} ${kpiFilter === 'practice' ? styles.kpiCardActive : ''}`}
          onClick={() => setKpiFilter(kpiFilter === 'practice' ? null : 'practice')}
          title="Click to filter skills needing practice (<30%)"
        >
          <div className={styles.kpiIconBox} style={{ background: '#FEE2E2', color: '#EF4444' }}>
            <Lock size={22} />
          </div>
          <div>
            <div className={styles.kpiNumber}>{kpiStats.needPracticeSkills}</div>
            <div className={styles.kpiLabel}>Need Practice<br /><span style={{ fontSize: '0.74rem' }}>(&lt;30%)</span></div>
          </div>
        </div>
      </div>

      {/* ── CATEGORY FILTER PILLS ────────────────────────────── */}
      <div className={styles.categoryPillsRow}>
        {CATEGORIES.map(category => (
          <button
            key={category}
            className={`${styles.categoryPill} ${activeCategory === category ? styles.categoryPillActive : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
        <button
          className={styles.categoryScrollArrow}
          onClick={() => {
            const el = document.querySelector(`.${styles.categoryPillsRow}`)
            if (el) el.scrollBy({ left: 160, behavior: 'smooth' })
          }}
          title="Scroll more categories"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ── MAIN CONTENT: SKILL OVERVIEW + RIGHT WIDGETS ────── */}
      <div className={styles.mainLayout}>
        {/* Left Column: Skill Cards Grid */}
        <div className={styles.skillsSection}>
          <div className={styles.skillsHeaderBar}>
            <h2 className={styles.sectionHeading}>Skill Overview</h2>

            <div className={styles.skillsControls}>
              {/* Refresh button */}
              <button
                className={styles.sortSelectWrap}
                onClick={fetchRealStats}
                title="Refresh real statistics from MongoDB"
                style={{ cursor: 'pointer', background: 'transparent' }}
              >
                <RefreshCw size={13} className={loadingRealStats ? 'animate-spin' : ''} />
                <span>Sync</span>
              </button>

              {/* Sort by dropdown */}
              <div className={styles.sortSelectWrap}>
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={styles.sortSelect}
                >
                  <option value="progress">Progress</option>
                  <option value="practice">Needs Practice</option>
                  <option value="name">Name</option>
                </select>
              </div>

              {/* Search input */}
              <div className={styles.searchBoxWrap}>
                <Search size={15} color="#8F8174" />
                <input
                  type="text"
                  placeholder="Search skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchBoxInput}
                />
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className={styles.skillGrid}>
            {filteredSkills.map(skill => {
              const visibleTags = (skill.subTopics || []).slice(0, 3)
              const remainingCount = (skill.subTopics || []).length - visibleTags.length

              return (
                <div
                  key={skill.id}
                  className={styles.skillCard}
                  onClick={() => setSelectedSkillModal(skill)}
                >
                  <div className={styles.skillCardTop}>
                    <div className={styles.skillInfoWrap}>
                      <div className={styles.skillIconBox} style={{ background: '#FAF6F0' }}>
                        <SkillLogo
                          name={skill.name}
                          category={skill.category}
                          color={skill.themeColor}
                          size={24}
                        />
                      </div>
                      <div>
                        <div className={styles.skillTitle}>{skill.name}</div>
                        <div className={styles.skillCategory}>
                          {skill.categoryLabel || skill.category}
                        </div>
                      </div>
                    </div>

                    <div className={styles.skillStatsRight}>
                      <span className={styles.skillPercent}>{skill.progress}%</span>
                      <span className={`${styles.skillStatusPill} ${skill.statusClass}`}>
                        {skill.status}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className={styles.progressBarTrack}>
                    <div
                      className={styles.progressBarFill}
                      style={{
                        width: `${skill.progress}%`,
                        background: skill.barColor
                      }}
                    />
                  </div>

                  {/* Sub-Topic Tags */}
                  <div className={styles.tagsRow}>
                    {visibleTags.map(tag => (
                      <span key={tag} className={styles.subTag}>{tag}</span>
                    ))}
                    {remainingCount > 0 && (
                      <span className={styles.subTagMore}>+{remainingCount}</span>
                    )}
                  </div>

                  {/* Footer Action Link */}
                  <div
                    className={styles.cardFooterAction}
                    onClick={(e) => {
                      e.stopPropagation()
                      showToast(`Navigating to ${skill.name} practice`)
                      navigate(skill.actionUrl || `/challenges?search=${encodeURIComponent(skill.name.toLowerCase())}`)
                    }}
                  >
                    <div className={styles.cardFooterLeft}>
                      {renderFooterIcon(skill.footerIcon)}
                      <span>{skill.footerText}</span>
                    </div>
                    <ChevronRight size={14} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: 3 Widgets matching design */}
        <div className={styles.rightWidgetsCol}>
          {/* Widget 1: Skill Graph */}
          <div className={styles.widgetCard}>
            <div className={styles.widgetHeader}>
              <div className={styles.widgetTitleWrap}>
                <Layers size={18} color="#D96B43" />
                <span>Skill Graph</span>
              </div>
              <button
                className={styles.widgetActionLink}
                onClick={onViewFullGraph}
                title="Open interactive mindmap canvas"
              >
                <span>View Full Graph</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Donut Progress & Real Legend */}
            <div className={styles.donutSection}>
              <div className={styles.donutSvgWrap}>
                <svg width="90" height="90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#EFE8E1"
                    strokeWidth="9"
                  />
                  {/* Real Strong Arc (Green) */}
                  {strongStroke > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="9"
                      strokeDasharray={`${strongStroke} ${circ - strongStroke}`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  )}
                  {/* Real In-Progress Arc (Amber) */}
                  {progressStroke > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="9"
                      strokeDasharray={`${progressStroke} ${circ - progressStroke}`}
                      strokeLinecap="round"
                      transform={`rotate(${-90 + (strongRatio * 360)} 50 50)`}
                    />
                  )}
                  {/* Real Needs Practice Arc (Red) */}
                  {practiceStroke > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="9"
                      strokeDasharray={`${practiceStroke} ${circ - practiceStroke}`}
                      strokeLinecap="round"
                      transform={`rotate(${-90 + ((strongRatio + progressRatio) * 360)} 50 50)`}
                    />
                  )}
                </svg>
                <div className={styles.donutCenterText}>
                  <span className={styles.donutCenterPercent}>{overallAverage}%</span>
                  <span className={styles.donutCenterSub}>Overall Progress</span>
                </div>
              </div>

              {/* Legend with Strictly Real Counts */}
              <div className={styles.donutLegend}>
                <div className={styles.donutLegendRow}>
                  <div className={styles.legendDotLabel}>
                    <span className={styles.legendDot} style={{ background: '#10B981' }} />
                    <span>Strong</span>
                  </div>
                  <span className={styles.legendCount}>{kpiStats.strongSkills}</span>
                </div>

                <div className={styles.donutLegendRow}>
                  <div className={styles.legendDotLabel}>
                    <span className={styles.legendDot} style={{ background: '#F59E0B' }} />
                    <span>In Progress</span>
                  </div>
                  <span className={styles.legendCount}>{kpiStats.inProgressSkills}</span>
                </div>

                <div className={styles.donutLegendRow}>
                  <div className={styles.legendDotLabel}>
                    <span className={styles.legendDot} style={{ background: '#EF4444' }} />
                    <span>Needs Practice</span>
                  </div>
                  <span className={styles.legendCount}>{kpiStats.needPracticeSkills}</span>
                </div>
              </div>
            </div>

            {/* Mini Connected Network Node Graph SVG (Dynamically bound to real user skills) */}
            <div
              className={styles.miniNetworkWrap}
              onClick={onViewFullGraph}
              title="Click to view full interactive graph"
            >
              {(() => {
                const topSorted = [...processedSkills].sort((a, b) => b.progress - a.progress)
                const centerNode = topSorted[0] || { name: 'Python', progress: 0, themeColor: '#10B981' }
                const orbital1 = topSorted[1] || { name: 'DSA', progress: 0, themeColor: '#F59E0B' }
                const orbital2 = topSorted[2] || { name: 'Machine Learning', progress: 0, themeColor: '#8B5CF6' }
                const orbital3 = topSorted[3] || { name: 'SQL', progress: 0, themeColor: '#3B82F6' }
                const orbital4 = topSorted[4] || { name: 'RAG', progress: 0, themeColor: '#0D9488' }
                const orbital5 = topSorted[5] || { name: 'Docker', progress: 0, themeColor: '#D96B43' }
                const orbital6 = topSorted[6] || { name: 'System Design', progress: 0, themeColor: '#EF4444' }

                const getStatusColor = (prog) => {
                  if (prog >= 70) return '#10B981'
                  if (prog >= 30) return '#F59E0B'
                  if (prog > 0) return '#EF4444'
                  return '#94A3B8'
                }

                return (
                  <svg className={styles.miniNetworkSvg} viewBox="0 0 300 160">
                    {/* Connecting Edges */}
                    <line x1="150" y1="80" x2="150" y2="30" stroke="#E2D7CC" strokeWidth="1.6" strokeDasharray="3 3" />
                    <line x1="150" y1="80" x2="240" y2="45" stroke="#E2D7CC" strokeWidth="1.6" />
                    <line x1="150" y1="80" x2="245" y2="105" stroke="#E2D7CC" strokeWidth="1.6" />
                    <line x1="150" y1="80" x2="195" y2="140" stroke="#E2D7CC" strokeWidth="1.6" />
                    <line x1="150" y1="80" x2="90" y2="135" stroke="#E2D7CC" strokeWidth="1.6" />
                    <line x1="150" y1="80" x2="60" y2="65" stroke="#E2D7CC" strokeWidth="1.6" />

                    {/* Central Hub */}
                    <circle cx="150" cy="80" r="22" fill="#E6F9F0" stroke={getStatusColor(centerNode.progress)} strokeWidth="2.5" />
                    <circle cx="150" cy="80" r="16" fill={getStatusColor(centerNode.progress)} />
                    <text x="150" y="83" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="800">
                      {(centerNode.name || 'Py').slice(0, 2).toUpperCase()}
                    </text>
                    <text x="150" y="112" textAnchor="middle" fill="#221B16" fontSize="9" fontWeight="700">
                      {centerNode.name}
                    </text>

                    {/* Orbital Node 1 */}
                    <g transform="translate(150, 30)">
                      <circle r="4" fill={getStatusColor(orbital1.progress)} />
                      <text x="8" y="3" fill="#6A5B4D" fontSize="8" fontWeight="600">{orbital1.name}</text>
                    </g>

                    {/* Orbital Node 2 */}
                    <g transform="translate(240, 45)">
                      <circle r="10" fill="#FEF2F2" stroke={getStatusColor(orbital2.progress)} strokeWidth="1.5" />
                      <circle r="3.5" fill={getStatusColor(orbital2.progress)} />
                      <text x="0" y="20" textAnchor="middle" fill="#6A5B4D" fontSize="7.5" fontWeight="600">
                        {orbital2.name.length > 12 ? orbital2.name.slice(0, 10) + '..' : orbital2.name}
                      </text>
                    </g>

                    {/* Orbital Node 3 */}
                    <g transform="translate(245, 105)">
                      <circle r="9" fill="#EFF6FF" stroke={getStatusColor(orbital3.progress)} strokeWidth="1.5" />
                      <circle r="3" fill={getStatusColor(orbital3.progress)} />
                      <text x="0" y="18" textAnchor="middle" fill="#6A5B4D" fontSize="7.5" fontWeight="600">{orbital3.name}</text>
                    </g>

                    {/* Orbital Node 4 */}
                    <g transform="translate(195, 140)">
                      <circle r="4" fill={getStatusColor(orbital4.progress)} />
                      <text x="8" y="3" fill="#6A5B4D" fontSize="7.5" fontWeight="600">{orbital4.name}</text>
                    </g>

                    {/* Orbital Node 5 */}
                    <g transform="translate(90, 135)">
                      <circle r="9" fill="#FEF3EB" stroke={getStatusColor(orbital5.progress)} strokeWidth="1.5" />
                      <circle r="3" fill={getStatusColor(orbital5.progress)} />
                      <text x="0" y="18" textAnchor="middle" fill="#6A5B4D" fontSize="7.5" fontWeight="600">{orbital5.name}</text>
                    </g>

                    {/* Orbital Node 6 */}
                    <g transform="translate(60, 65)">
                      <text x="0" y="-8" textAnchor="middle" fill="#6A5B4D" fontSize="7.5" fontWeight="600">
                        {orbital6.name.length > 13 ? orbital6.name.slice(0, 11) + '..' : orbital6.name}
                      </text>
                      <circle r="4" fill={getStatusColor(orbital6.progress)} />
                    </g>
                  </svg>
                )
              })()}
            </div>
          </div>

          {/* Widget 2: Your Career Path */}
          <div className={styles.widgetCard}>
            <div className={styles.widgetHeader}>
              <div className={styles.widgetTitleWrap}>
                <Sparkles size={18} color="#D96B43" />
                <span>Your Career Path</span>
              </div>
              <button
                className={styles.widgetActionLink}
                onClick={onOpenTrackModal}
                title="Change or customize career path"
              >
                <span>Edit</span>
              </button>
            </div>

            <div className={styles.careerPathCardRow}>
              <div className={styles.careerPathIconBox}>
                <BookOpen size={20} />
              </div>
              <div className={styles.careerPathDetails}>
                <div className={styles.careerPathTitle}>{targetRoleTitle}</div>
                <div className={styles.careerPathProgressText}>{overallAverage}% complete</div>
              </div>
            </div>

            <div className={styles.careerPathBarTrack}>
              <div
                className={styles.careerPathBarFill}
                style={{ width: `${overallAverage}%` }}
              />
            </div>

            <div className={styles.keySkillsLabel}>Key Skills for this path</div>
            <div className={styles.keySkillsPills}>
              {keySkillsForPath.map(k => {
                const found = processedSkills.find(s => s.name.toLowerCase() === k.toLowerCase())
                const isStrong = found && found.status === 'Strong'
                return (
                  <span
                    key={k}
                    className={styles.keySkillPill}
                    style={isStrong ? { background: '#E6F9F0', borderColor: '#10B981', color: '#059669' } : {}}
                  >
                    {k}
                  </span>
                )
              })}
              <span className={styles.keySkillPill} style={{ color: '#D96B43', fontWeight: 700 }}>+2</span>
            </div>
          </div>

          {/* Widget 3: Real Skill Insights */}
          <div className={styles.widgetCard}>
            <div className={styles.widgetHeader}>
              <div className={styles.widgetTitleWrap}>
                <Lightbulb size={18} color="#D96B43" />
                <span>Skill Insights</span>
              </div>
            </div>

            <div className={styles.insightAlertBox}>
              <AlertTriangle size={18} className={styles.insightAlertIcon} />
              <div className={styles.insightAlertText}>
                {weakestSkill.progress === 0 ? (
                  <>You haven't started practicing <strong>{weakestSkill.name}</strong> yet. Complete challenges or quizzes in this skill to raise your {targetRoleTitle} progress.</>
                ) : (
                  <><strong>{weakestSkill.name}</strong> is currently your lowest-scoring skill ({weakestSkill.progress}%). Focus on it to improve your overall {targetRoleTitle} path progress.</>
                )}
              </div>
            </div>

            <button
              className={styles.insightBtn}
              onClick={() => {
                showToast(`Opening practice for ${weakestSkill.name}`)
                navigate(`/challenges?search=${encodeURIComponent(weakestSkill.name.toLowerCase())}`)
              }}
            >
              <span>View Recommendations</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── SKILL BREAKDOWN MODAL ────────────────────────────── */}
      <AnimatePresence>
        {selectedSkillModal && (
          <div
            className={styles.modalBackdrop}
            onClick={() => setSelectedSkillModal(null)}
          >
            <motion.div
              className={styles.modalCard}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.modalCloseBtn}
                onClick={() => setSelectedSkillModal(null)}
              >
                <X size={16} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div className={styles.skillIconBox} style={{ background: '#FAF6F0', width: 50, height: 50 }}>
                  <SkillLogo
                    name={selectedSkillModal.name}
                    category={selectedSkillModal.category}
                    color={selectedSkillModal.themeColor}
                    size={30}
                  />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#221B16' }}>{selectedSkillModal.name}</h3>
                  <span style={{ fontSize: '0.85rem', color: '#8F8174' }}>{selectedSkillModal.category}</span>
                </div>
              </div>

              <p style={{ fontSize: '0.9rem', color: '#574B40', lineHeight: 1.5, marginBottom: 20 }}>
                {selectedSkillModal.desc}
              </p>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#221B16' }}>Mastery Progress (Real)</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: selectedSkillModal.barColor }}>
                    {selectedSkillModal.progress}% ({selectedSkillModal.status})
                  </span>
                </div>
                <div className={styles.progressBarTrack} style={{ height: 8 }}>
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${selectedSkillModal.progress}%`, background: selectedSkillModal.barColor }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#8F8174', textTransform: 'uppercase' }}>Sub-Topics & Modules</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {(selectedSkillModal.subTopics || []).map(sub => (
                    <span
                      key={sub}
                      style={{
                        background: '#FAF7F2',
                        border: '1px solid #ECE4DA',
                        padding: '5px 12px',
                        borderRadius: 8,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#55473B'
                      }}
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  className={styles.insightBtn}
                  onClick={() => {
                    setSelectedSkillModal(null)
                    navigate(`/challenges?search=${encodeURIComponent(selectedSkillModal.name.toLowerCase())}`)
                  }}
                >
                  <Code2 size={16} />
                  <span>Solve {selectedSkillModal.name} Challenge</span>
                </button>
                <button
                  style={{
                    background: '#FAF7F2',
                    border: '1px solid #ECE4DA',
                    borderRadius: 999,
                    padding: '10px 18px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#221B16',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                  onClick={() => {
                    setSelectedSkillModal(null)
                    navigate(`/ai-tutor?topic=${encodeURIComponent(selectedSkillModal.name)}`)
                  }}
                >
                  <Brain size={16} color="#8B5CF6" />
                  <span>Ask AI Tutor About {selectedSkillModal.name}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
