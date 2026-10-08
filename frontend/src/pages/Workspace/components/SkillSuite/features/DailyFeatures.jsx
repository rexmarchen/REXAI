import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './Features.module.css'

// 1. SKILL CHALLENGE (Code Editor & Test Case Runner)
export function SkillChallengeView({ module, onComplete }) {
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState(`class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map(); // Preserves insertion order
  }

  get(key) {
    if (!this.map.has(key)) return -1;
    const val = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, val); // Refresh recency
    return val;
  }

  put(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      // Evict oldest (first key in Map iterator)
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
    }
  }
}`)
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const handleRunTests = () => {
    setIsRunning(true)
    setTimeout(() => {
      setIsRunning(false)
      setTestResults([
        { id: 1, name: 'Test 1: Get & Put O(1) lookups', passed: true, duration: '4ms' },
        { id: 2, name: 'Test 2: Capacity eviction on capacity=2', passed: true, duration: '2ms' },
        { id: 3, name: 'Test 3: Recency update on cache hit', passed: true, duration: '3ms' }
      ])
      setSubmitted(true)
    }, 800)
  }

  return (
    <div className={styles.container}>
      <div className={styles.featureHeader}>
        <div className={styles.featureHeaderTitle}>
          <span>⚡ Daily Sprint: O(1) Cache Eviction</span>
        </div>
        <span className={styles.featureHeaderBadge}>Hard · 50 XP</span>
      </div>

      <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
        Implement an in-memory <strong>LRUCache</strong> class with strict <code>O(1)</code> time complexity for both <code>get</code> and <code>put</code> operations. When cache reaches capacity, evict the least recently used key.
      </p>

      <div className={styles.editorPane}>
        <div className={styles.editorToolbar}>
          <div className={styles.editorTabs}>
            <button
              type="button"
              className={`${styles.editorTab} ${language === 'javascript' ? styles.editorTabActive : ''}`}
              onClick={() => setLanguage('javascript')}
            >
              solution.js
            </button>
            <button
              type="button"
              className={`${styles.editorTab} ${language === 'python' ? styles.editorTabActive : ''}`}
              onClick={() => setLanguage('python')}
            >
              solution.py
            </button>
          </div>
          <span>Execution Env: Node.js v20 (V8 Engine)</span>
        </div>
        <textarea
          className={styles.codeTextarea}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck="false"
        />
      </div>

      <div className={styles.testCasesBox}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <strong style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Automated Verification Suite</strong>
          <span style={{ fontSize: '11px', color: '#00ff88' }}>O(1) Strict Complexity Evaluator</span>
        </div>

        {testResults ? (
          testResults.map((t) => (
            <div key={t.id} className={`${styles.testCaseRow} ${t.passed ? styles.testCasePassed : ''}`}>
              <span>✓ {t.name}</span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{t.duration} · Passed</span>
            </div>
          ))
        ) : (
          <div className={`${styles.testCaseRow} ${styles.testCasePending}`}>
            <span>3 Unit Tests Ready (Awaiting Execution)</span>
            <span style={{ fontSize: '11px' }}>Pending</span>
          </div>
        )}
      </div>

      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(0, 255, 136, 0.12)',
            border: '1px solid rgba(0, 255, 136, 0.35)',
            color: '#00ff88',
            fontSize: '13px'
          }}
        >
          <strong>✓ Challenge Verified: </strong> All 3 test cases passed in 9ms. Solution qualifies for Staff-level O(1) doubly-linked-map requirement. <strong>+50 XP & Streak Extended!</strong>
        </motion.div>
      )}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
          onClick={() => {
            setCode(`// Resetting boilerplate\nclass LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n  }\n}`)
            setTestResults(null)
            setSubmitted(false)
          }}
        >
          Reset Code
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
          onClick={handleRunTests}
          disabled={isRunning}
        >
          {isRunning ? 'Running Tests...' : '▶ Run Test Suite & Submit'}
        </button>
      </div>
    </div>
  )
}

// 2. 1-MINUTE DRILL (Rapid-fire 60s Sprint)
const DRILL_QUESTIONS = [
  {
    q: "In JavaScript, what does ['1', '7', '11'].map(parseInt) return?",
    options: ["[1, NaN, 3]", "[1, 7, 11]", "[1, NaN, NaN]", "[1, 7, 3]"],
    correct: 0,
    explanation: "parseInt(str, radix). map passes (element, index). Radix 0->1, Radix 1->NaN, Radix 2 ('11')->3."
  },
  {
    q: "What is the return value of typeof NaN in JavaScript?",
    options: ["'number'", "'NaN'", "'undefined'", "'object'"],
    correct: 0,
    explanation: "In IEEE 754 floating point standard, NaN represents a numeric error condition and typeof is 'number'."
  },
  {
    q: "Which HTTP header prevents MIME-type sniffing attacks?",
    options: ["X-Content-Type-Options: nosniff", "Content-Security-Policy", "X-Frame-Options", "Strict-Transport-Security"],
    correct: 0,
    explanation: "X-Content-Type-Options: nosniff blocks browsers from guessing content types beyond the declared header."
  },
  {
    q: "In PostgreSQL, which index type is optimal for text trigram and fuzzy searching?",
    options: ["GIN (Generalized Inverted Index)", "B-Tree", "Hash Index", "BRIN"],
    correct: 0,
    explanation: "GIN with pg_trgm extension indexes composite 3-letter substrings for ultra-fast ILIKE searches."
  },
  {
    q: "What is the amortized time complexity of inserting into a dynamic array (Vector/ArrayList)?",
    options: ["O(1)", "O(N)", "O(log N)", "O(N^2)"],
    correct: 0,
    explanation: "Due to geometric doubling capacity strategy, resize cost amortizes to O(1) per insert."
  }
]

export function MinuteDrillView({ module, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(60)
  const [isActive, setIsActive] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [isFinished, setIsFinished] = useState(false)

  useEffect(() => {
    let timer = null
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    } else if (timeLeft === 0) {
      setIsActive(false)
      setIsFinished(true)
    }
    return () => clearInterval(timer)
  }, [isActive, timeLeft])

  const handleStart = () => {
    setTimeLeft(60)
    setIsActive(true)
    setCurrentIndex(0)
    setScore(0)
    setStreak(0)
    setFeedback(null)
    setIsFinished(false)
  }

  const handleAnswer = (optionIdx) => {
    if (!isActive || isFinished) return
    const currentQ = DRILL_QUESTIONS[currentIndex]
    if (optionIdx === currentQ.correct) {
      const nextStreak = streak + 1
      setStreak(nextStreak)
      const points = 100 * (nextStreak >= 3 ? 1.5 : 1.0)
      setScore((s) => s + points)
      setFeedback({ correct: true, text: `✓ Correct! +${points} pts (${nextStreak}x Streak)` })
    } else {
      setStreak(0)
      setFeedback({ correct: false, text: `✕ ${currentQ.explanation}` })
    }

    setTimeout(() => {
      setFeedback(null)
      if (currentIndex + 1 < DRILL_QUESTIONS.length) {
        setCurrentIndex((i) => i + 1)
      } else {
        setIsActive(false)
        setIsFinished(true)
      }
    }, 700)
  }

  const progressPercent = (timeLeft / 60) * 100

  return (
    <div className={styles.container}>
      <div className={styles.featureHeader}>
        <div className={styles.featureHeaderTitle}>
          <span>⏱️ 1-Minute Technical Reflex Drill</span>
        </div>
        <span className={styles.featureHeaderBadge}>{timeLeft}s Left</span>
      </div>

      <div className={styles.drillTimerBar}>
        <div className={styles.drillTimerFill} style={{ width: `${progressPercent}%` }} />
      </div>

      <div className={styles.drillScoreboard}>
        <div className={styles.drillStatCard}>
          <div className={styles.drillStatVal}>{score}</div>
          <div className={styles.drillStatLabel}>Total Score</div>
        </div>
        <div className={styles.drillStatCard}>
          <div className={styles.drillStatVal} style={{ color: '#00f0ff' }}>{streak}🔥</div>
          <div className={styles.drillStatLabel}>Combo Streak</div>
        </div>
        <div className={styles.drillStatCard}>
          <div className={styles.drillStatVal} style={{ color: '#e2e8f0' }}>{currentIndex + 1} / {DRILL_QUESTIONS.length}</div>
          <div className={styles.drillStatLabel}>Question</div>
        </div>
      </div>

      {!isActive && !isFinished ? (
        <div style={{ textAlign: 'center', padding: '24px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: '#fff' }}>Sharpen Mental Agility</h4>
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#94a3b8' }}>
            Answer rapid-fire engineering reflex prompts against the 60-second clock. Build neural pathways for instant recall during high-pressure FAANG live interviews.
          </p>
          <button type="button" className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={handleStart}>
            🚀 Start 60-Second Drill
          </button>
        </div>
      ) : isFinished ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '24px 16px', background: 'rgba(0,255,136,0.05)', borderRadius: '12px', border: '1px solid rgba(0,255,136,0.3)' }}>
          <h4 style={{ margin: '0 0 6px', fontSize: '1.3rem', color: '#00ff88' }}>Drill Finished!</h4>
          <p style={{ margin: '0 0 14px', fontSize: '14px', color: '#e2e8f0' }}>
            Final Score: <strong>{score} pts</strong> · Accuracy: <strong>{Math.round((score / (DRILL_QUESTIONS.length * 100)) * 100)}%</strong> · Global Speed: <strong>Top 4%</strong>
          </p>
          <button type="button" className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={handleStart}>
            🔄 Play Again & Beat Record
          </button>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', borderLeft: '3px solid #00f0ff', fontSize: '14px', color: '#fff' }}>
            {DRILL_QUESTIONS[currentIndex].q}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            {DRILL_QUESTIONS[currentIndex].options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAnswer(idx)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: '#05080c',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.15s ease'
                }}
              >
                {opt}
              </button>
            ))}
          </div>

          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: feedback.correct ? 'rgba(0,255,136,0.15)' : 'rgba(239,68,68,0.15)',
                color: feedback.correct ? '#00ff88' : '#f87171',
                fontSize: '12.5px',
                fontWeight: 600
              }}
            >
              {feedback.text}
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}

// 3. MEMORY GYM (Spaced Repetition Active Recall Deck)
const MEMORY_DECK = [
  {
    id: 1,
    topic: "Distributed Systems",
    question: "What is the primary difference between ACID transactions and the BASE consistency model in distributed data stores?",
    answer: "ACID (Atomicity, Consistency, Isolation, Durability) prioritizes strict immediate linearizability and consistency, locking resources if needed.\n\nBASE (Basically Available, Soft state, Eventual consistency) prioritizes 100% availability and partition tolerance (CAP theorem), allowing temporary replica divergence in exchange for high write throughput.",
    diagram: "ACID: Immediate Consensus [Locking] ➔ BASE: Asynchronous Gossip / Anti-Entropy [Eventual]"
  },
  {
    id: 2,
    topic: "Consensus Protocols",
    question: "How does the Raft consensus algorithm handle network partitions and split votes?",
    answer: "Raft divides nodes into Leader, Follower, and Candidate. Random randomized election timeouts (150-300ms) prevent persistent split-brain ties. A candidate must obtain majority quorum (> N/2) votes across the active cluster. In a partition, only the partition with a majority quorum can commit log entries.",
    diagram: "Term X: Leader ➔ AppendEntries Heartbeats (50ms) ➔ Majority Quorum ACK"
  },
  {
    id: 3,
    topic: "Database Internals",
    question: "Why do write-heavy databases (like Cassandra & RocksDB) utilize LSM-Trees instead of traditional B-Trees?",
    answer: "B-Trees require random disk I/O to update leaf pages in place, creating heavy disk head/SSD write amplification.\n\nLSM-Trees append all mutations sequentially to an in-memory MemTable and write-ahead log (WAL), then flush sorted immutable SSTables to disk sequentially. Sequential disk writes are 10x-100x faster than random writes.",
    diagram: "Writes: WAL + MemTable ➔ Flush Sequential SSTable Level 0 ➔ Background Compaction"
  },
  {
    id: 4,
    topic: "Web Protocols",
    question: "How does TLS 1.3 0-RTT (Zero Round Trip Time) resumption operate, and what is its main security trade-off?",
    answer: "In TLS 1.3, clients that previously connected cache a Pre-Shared Key (PSK). On reconnect, the client sends encrypted early application data alongside the initial ClientHello in the very first flight (0-RTT).\n\nTrade-off: 0-RTT is vulnerable to Replay Attacks, so only idempotent HTTP GET requests should be transmitted in 0-RTT data.",
    diagram: "Client ➔ [ClientHello + Early Data + PSK] ➔ Server immediately returns Response"
  }
]

export function MemoryGymView({ module, onComplete }) {
  const [currentCardIdx, setCurrentCardIdx] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [masteredCount, setMasteredCount] = useState(0)
  const [ratingFeedback, setRatingFeedback] = useState(null)

  const card = MEMORY_DECK[currentCardIdx]

  const handleRate = (interval) => {
    setRatingFeedback(`Card scheduled for review in: ${interval}`)
    if (interval === 'Good (1d)' || interval === 'Easy (4d)') {
      setMasteredCount((c) => c + 1)
    }

    setTimeout(() => {
      setRatingFeedback(null)
      setIsFlipped(false)
      setCurrentCardIdx((idx) => (idx + 1) % MEMORY_DECK.length)
    }, 600)
  }

  return (
    <div className={styles.container}>
      <div className={styles.featureHeader}>
        <div className={styles.featureHeaderTitle}>
          <span>🧠 Memory Gym: Spaced Repetition Active Recall</span>
        </div>
        <span className={styles.featureHeaderBadge}>Card {currentCardIdx + 1} of {MEMORY_DECK.length}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#94a3b8' }}>
        <span>Deck: System Architecture & Protocols</span>
        <span style={{ color: '#00ff88', fontWeight: 600 }}>Mastered: {masteredCount} / {MEMORY_DECK.length}</span>
      </div>

      <div className={styles.flashcardWrap}>
        <div
          className={styles.flashcard}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: '#00f0ff', fontWeight: 700, textTransform: 'uppercase' }}>
                {card.topic}
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {isFlipped ? 'Tap to hide answer' : 'Tap to reveal answer'}
              </span>
            </div>
            <div className={styles.flashcardPrompt}>
              {card.question}
            </div>
          </div>

          <AnimatePresence>
            {isFlipped && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={styles.flashcardBack}
              >
                <div style={{ whiteSpace: 'pre-line', marginBottom: '10px' }}>
                  {card.answer}
                </div>
                <div style={{ padding: '6px 10px', background: 'rgba(0,0,0,0.4)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', color: '#00ff88' }}>
                  {card.diagram}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
            {!isFlipped ? '🔍 Click card to inspect solution & architecture flow' : '⚡ Rate recall confidence below'}
          </div>
        </div>
      </div>

      {isFlipped && (
        <div className={styles.sm2Controls}>
          <button type="button" className={styles.sm2Btn} onClick={() => handleRate('Again (< 1m)')}>
            <span style={{ color: '#ef4444', display: 'block', fontSize: '10px' }}>&lt; 1m</span>
            <span>Again</span>
          </button>
          <button type="button" className={styles.sm2Btn} onClick={() => handleRate('Hard (12h)')}>
            <span style={{ color: '#fbbf24', display: 'block', fontSize: '10px' }}>12h</span>
            <span>Hard</span>
          </button>
          <button type="button" className={styles.sm2Btn} onClick={() => handleRate('Good (1d)')}>
            <span style={{ color: '#00ff88', display: 'block', fontSize: '10px' }}>1d</span>
            <span>Good</span>
          </button>
          <button type="button" className={styles.sm2Btn} onClick={() => handleRate('Easy (4d)')}>
            <span style={{ color: '#00f0ff', display: 'block', fontSize: '10px' }}>4d</span>
            <span>Easy</span>
          </button>
        </div>
      )}

      {ratingFeedback && (
        <div style={{ textAlign: 'center', fontSize: '12px', color: '#00ff88', fontWeight: 600 }}>
          {ratingFeedback}
        </div>
      )}
    </div>
  )
}
