import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MessageSquareCode,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  ShieldCheck,
  Terminal,
  BookOpen,
  DollarSign
} from 'lucide-react'
import styles from './CareerInterviewSupportPage.module.css'

const ROLE_TRACKS = [
  { id: 'fullstack', label: 'Full Stack & Backend', tech: ['React', 'Node.js', 'PostgreSQL', 'Redis', 'Docker'] },
  { id: 'frontend', label: 'Frontend Specialist', tech: ['React', 'TypeScript', 'CSS Architecture', 'Next.js', 'Web Vitals'] },
  { id: 'campus', label: 'Campus Placement & SDE-1', tech: ['DSA', 'OOPs', 'OS', 'DBMS', 'System Basics'] },
  { id: 'ai', label: 'AI & Machine Learning', tech: ['Python', 'PyTorch', 'Vector DBs', 'LLM Fine-tuning', 'FastAPI'] },
  { id: 'devops', label: 'DevOps & Cloud', tech: ['Kubernetes', 'AWS', 'Terraform', 'CI/CD Pipelines', 'Prometheus'] }
]

const MOCK_QUESTIONS = {
  fullstack: [
    {
      id: 'fs-1',
      category: 'System Design & High Concurrency',
      difficulty: 'Hard',
      title: 'How would you architect a distributed rate limiter handling 100,000 requests/sec across microservices?',
      guide: 'Interviewers look for: Token Bucket or Leaky Bucket algorithms, Redis cluster sliding-window log, atomic Lua scripts, fallback circuit breakers, and clock drift handling.'
    },
    {
      id: 'fs-2',
      category: 'Database & Data Consistency',
      difficulty: 'Medium',
      title: 'Explain the difference between optimistic and pessimistic locking with a real checkout/inventory use-case.',
      guide: 'Interviewers look for: Isolation levels (Read Committed vs Serializable), version number columns for optimistic concurrency, deadlocks in pessimistic SELECT FOR UPDATE, and UX trade-offs.'
    },
    {
      id: 'fs-3',
      category: 'API Latency & Event Loop',
      difficulty: 'Medium',
      title: 'How do you prevent CPU-bound tasks from blocking the Node.js event loop in production?',
      guide: 'Interviewers look for: Worker threads (worker_threads), child processes, offloading to Redis BullMQ / RabbitMQ queues, and setImmediate chunking.'
    }
  ],
  campus: [
    {
      id: 'camp-1',
      category: 'Operating Systems',
      difficulty: 'Medium',
      title: 'What happens under the hood when a process context switch occurs, and how does it differ from a thread switch?',
      guide: 'Interviewers look for: Saving PCB registers, program counter, updating MMU page table pointers (TLB flush penalty for processes), whereas threads share the same virtual address space and avoid TLB invalidation.'
    },
    {
      id: 'camp-2',
      category: 'DBMS & Query Optimization',
      difficulty: 'Medium',
      title: 'Why do B+ Trees outperform binary search trees for disk-based database indexes?',
      guide: 'Interviewers look for: High branching factor, minimizing random disk I/O, cache line locality, and sequential leaf node traversal linked lists for range queries.'
    },
    {
      id: 'camp-3',
      category: 'Computer Networks',
      difficulty: 'Hard',
      title: 'Trace a packet from typing "https://google.com" in the browser to the rendered page.',
      guide: 'Interviewers look for: Browser cache, DNS resolution (local/ISP/root), TCP 3-way handshake, TLS 1.3 key exchange, HTTP GET request, reverse proxy, DOM tree parsing, and Critical Rendering Path.'
    }
  ],
  frontend: [
    {
      id: 'fe-1',
      category: 'Rendering & Performance',
      difficulty: 'Hard',
      title: 'How does React 18 Concurrent Mode and Fiber tree reconciliation prevent UI thread blocking?',
      guide: 'Interviewers look for: Time-slicing via MessageChannel, interruptible work loops, priority lanes (SyncLane, DefaultLane, IdleLane), and useTransition/useDeferredValue mechanics.'
    },
    {
      id: 'fe-2',
      category: 'Browser Architecture',
      difficulty: 'Medium',
      title: 'Explain the difference between Layout, Paint, and Composite browser render phases.',
      guide: 'Interviewers look for: Reflow triggers (width, font-size), repaint triggers (background-color), GPU compositor layers (transform, opacity), and avoiding layout thrashing.'
    }
  ]
}

const CAMPUS_FUNDAMENTALS = [
  {
    subject: 'Operating Systems (OS)',
    topics: [
      'Process vs Thread & Context Switching costs',
      'Deadlock prevention (Banker’s Algorithm, Coffman conditions)',
      'Virtual Memory, Paging, Page Fault handling, and TLB',
      'CPU Scheduling Algorithms (Round Robin, Multilevel Feedback)'
    ]
  },
  {
    subject: 'Database Management Systems (DBMS)',
    topics: [
      'ACID Properties & Transaction Isolation Levels',
      'Indexing internals (B+ Tree vs Hash Index)',
      'Normalization (1NF, 2NF, 3NF, BCNF) vs Denormalization',
      'JOIN types (Hash Join, Merge Join, Nested Loops)'
    ]
  },
  {
    subject: 'Computer Networks (CN)',
    topics: [
      'OSI 7 Layers vs TCP/IP Protocol Stack',
      'TCP 3-Way Handshake & 4-Way Connection Teardown',
      'Flow Control (Sliding Window) vs Congestion Control',
      'DNS recursive lookup & HTTP/2 vs HTTP/3 (QUIC)'
    ]
  },
  {
    subject: 'Object-Oriented Programming (OOPs)',
    topics: [
      '4 Pillars: Encapsulation, Abstraction, Inheritance, Polymorphism',
      'SOLID Principles with real code examples',
      'Design Patterns: Singleton, Factory, Observer, Strategy',
      'Composition over Inheritance architectural patterns'
    ]
  }
]

const STAR_TEMPLATES = [
  {
    title: 'Conflict Resolution / Technical Disagreement',
    question: 'Tell me about a time you strongly disagreed with a team decision or technical architecture choice.',
    situation: 'During our payment service migration, a senior engineer proposed MongoDB, but transaction consistency was critical.',
    task: 'I needed to advocate for PostgreSQL ACID guarantees without causing team friction or delaying sprint velocity.',
    action: 'I set up a benchmark proof-of-concept simulating 5,000 concurrent transactions, documenting rollback failures on uncommitted writes.',
    result: 'The team adopted PostgreSQL with JSONB columns, preventing financial sync bugs and saving ~20 engineer-hours in reconciliation scripts.'
  },
  {
    title: 'Production Incident & Deployment Outage',
    question: 'Describe the hardest bug or system outage you resolved in your recent work.',
    situation: 'At peak morning traffic, our microservices latency spiked from 45ms to 3.8s, causing 504 Gateway Timeouts.',
    task: 'I was on-call lead responsible for restoring service availability within our 15-minute SLA.',
    action: 'Identified unindexed foreign keys causing full table locks in our DB connection pool. I killed hanging locks and created a concurrent index concurrently.',
    result: 'Reduced database CPU load from 98% to 14% and restored 99.95% API uptime within 11 minutes.'
  }
]

const CareerInterviewSupportPage = () => {
  const navigate = useNavigate()
  const [selectedTrack, setSelectedTrack] = useState('fullstack')
  const [activeModule, setActiveModule] = useState('qa') // 'qa' | 'campus' | 'star' | 'negotiate'
  const [revealedGuides, setRevealedGuides] = useState({})

  const toggleReveal = (id) => {
    setRevealedGuides((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const currentQuestions = MOCK_QUESTIONS[selectedTrack] || MOCK_QUESTIONS.fullstack

  return (
    <div className={styles.pageWrapper}>
      {/* Top Navbar */}
      <header className={styles.topNavbar}>
        <div className={styles.navLeft}>
          <button type="button" className={styles.backBtn} onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <div className={styles.pageTitleGroup}>
            <h1 className={styles.pageTitle}>
              <MessageSquareCode size={20} style={{ color: '#f59e0b' }} />
              Career & Interview Support Hub
            </h1>
            <p className={styles.pageSubtitle}>
              Predictive Mock Interviews &bull; Campus Placement Sprints &bull; STAR Response Framework
            </p>
          </div>
        </div>
        <div className={styles.statusPill}>
          <Sparkles size={14} /> AI Interview Copilot Ready
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Track Selector */}
        <div className={styles.trackSelector}>
          {ROLE_TRACKS.map((track) => (
            <button
              key={track.id}
              type="button"
              className={`${styles.trackBtn} ${selectedTrack === track.id ? styles.trackBtnActive : ''}`}
              onClick={() => setSelectedTrack(track.id)}
            >
              <span>{track.label}</span>
            </button>
          ))}
        </div>

        {/* Module Navigation */}
        <div className={styles.moduleNav}>
          <button
            type="button"
            className={`${styles.moduleTabBtn} ${activeModule === 'qa' ? styles.moduleTabBtnActive : ''}`}
            onClick={() => setActiveModule('qa')}
          >
            <Terminal size={16} />
            Technical Mock Q&A ({currentQuestions.length})
          </button>
          <button
            type="button"
            className={`${styles.moduleTabBtn} ${activeModule === 'campus' ? styles.moduleTabBtnActive : ''}`}
            onClick={() => setActiveModule('campus')}
          >
            <GraduationCap size={16} />
            Campus Placement & Core CS
          </button>
          <button
            type="button"
            className={`${styles.moduleTabBtn} ${activeModule === 'star' ? styles.moduleTabBtnActive : ''}`}
            onClick={() => setActiveModule('star')}
          >
            <Award size={16} />
            STAR Behavioral Framework
          </button>
          <button
            type="button"
            className={`${styles.moduleTabBtn} ${activeModule === 'negotiate' ? styles.moduleTabBtnActive : ''}`}
            onClick={() => setActiveModule('negotiate')}
          >
            <DollarSign size={16} />
            Salary & Offer Negotiation
          </button>
        </div>

        {/* MODULE 1: TECHNICAL MOCK Q&A */}
        {activeModule === 'qa' && (
          <div className={styles.cardGrid}>
            {currentQuestions.map((q) => {
              const isRevealed = Boolean(revealedGuides[q.id])
              return (
                <div key={q.id} className={styles.contentCard}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardCategory}>{q.category}</span>
                    <span
                      className={`${styles.difficultyBadge} ${
                        q.difficulty === 'Hard' ? styles.diffHard : styles.diffMedium
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  </div>

                  <h3 className={styles.cardTitle}>{q.title}</h3>

                  <button
                    type="button"
                    className={styles.revealToggle}
                    onClick={() => toggleReveal(q.id)}
                  >
                    {isRevealed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {isRevealed ? 'Hide Interviewer Rubric' : 'Reveal What Interviewers Look For'}
                  </button>

                  <AnimatePresence>
                    {isRevealed && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={styles.answerBox}
                      >
                        <strong>Scoring Rubric & Key Talking Points:</strong>
                        <div style={{ marginTop: '0.35rem' }}>{q.guide}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}

        {/* MODULE 2: CAMPUS PLACEMENT & CORE CS */}
        {activeModule === 'campus' && (
          <div className={styles.cardGrid}>
            {CAMPUS_FUNDAMENTALS.map((cat, idx) => (
              <div key={idx} className={styles.contentCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardCategory}>Core Subject Master Checklist</span>
                  <span className={styles.difficultyBadge} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                    Campus Vital
                  </span>
                </div>

                <h3 className={styles.cardTitle}>{cat.subject}</h3>

                <ul className={styles.checklist}>
                  {cat.topics.map((t, i) => (
                    <li key={i} className={styles.checklistItem}>
                      <CheckCircle2 size={16} className={styles.checkIcon} />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* MODULE 3: BEHAVIORAL STAR-METHOD */}
        {activeModule === 'star' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.5 }}>
              Top tech companies (FAANG, Unicorns) use the <strong>STAR Method</strong> (Situation, Task, Action, Result)
              to evaluate ownership, emotional intelligence, and cross-functional leadership.
            </div>

            {STAR_TEMPLATES.map((item, idx) => (
              <div key={idx} className={styles.contentCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardCategory}>{item.title}</span>
                  <span className={styles.difficultyBadge} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                    STAR Framework
                  </span>
                </div>

                <h3 className={styles.cardTitle}>"{item.question}"</h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                  <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', borderLeft: '2px solid #38bdf8' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 700 }}>
                      Situation (Context)
                    </div>
                    <div style={{ fontSize: '0.82rem', marginTop: '0.3rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                      {item.situation}
                    </div>
                  </div>

                  <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', borderLeft: '2px solid #f59e0b' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#f59e0b', fontWeight: 700 }}>
                      Task (Objective)
                    </div>
                    <div style={{ fontSize: '0.82rem', marginTop: '0.3rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                      {item.task}
                    </div>
                  </div>

                  <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', borderLeft: '2px solid #a855f7' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#a855f7', fontWeight: 700 }}>
                      Action (Execution)
                    </div>
                    <div style={{ fontSize: '0.82rem', marginTop: '0.3rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                      {item.action}
                    </div>
                  </div>

                  <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', borderLeft: '2px solid #10b981' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#10b981', fontWeight: 700 }}>
                      Result (Impact)
                    </div>
                    <div style={{ fontSize: '0.82rem', marginTop: '0.3rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                      {item.result}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODULE 4: SALARY & OFFER NEGOTIATION */}
        {activeModule === 'negotiate' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <div className={styles.contentCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardCategory}>Rule #1: First Number Avoidance</span>
              </div>
              <h3 className={styles.cardTitle}>When asked "What are your salary expectations?"</h3>
              <div className={styles.answerBox}>
                <em>
                  "Right now I'm primarily focused on finding the right role where I can ship high-impact features. I am confident that once we determine mutual fit, your team makes competitive offers aligned with market benchmarks."
                </em>
              </div>
            </div>

            <div className={styles.contentCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardCategory}>Rule #2: The Respectful Counter-Offer</span>
              </div>
              <h3 className={styles.cardTitle}>When receiving an offer slightly below market rate</h3>
              <div className={styles.answerBox}>
                <em>
                  "I'm thrilled about the offer and excited to join the team. Given my experience in distributed systems and the expectations for this role, I was targeting a base of $X / ₹Y. If we can reach that figure, I am prepared to sign today."
                </em>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default CareerInterviewSupportPage
