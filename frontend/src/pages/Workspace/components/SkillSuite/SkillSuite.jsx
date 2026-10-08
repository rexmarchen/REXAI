import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './SkillSuite.module.css'

import { SkillChallengeView, MinuteDrillView, MemoryGymView } from './features/DailyFeatures'
import { InterviewArenaView, DebugThisView, ConceptBattleView, CommunicationSimulatorView } from './features/PracticeFeatures'
import { BuildChallengeView, ProjectStressTestView, CodeReviewRoomView, WorkplaceSimulatorView } from './features/BuildFeatures'
import { SkillGapMapView, LearningPathView, CareerMissionView, WeeklyBenchmarkView } from './features/GrowthFeatures'
import { IdeaLabView, ToolRadarView, RealWorldScenarioView } from './features/DiscoveryFeatures'

const MODULE_DATA = [
  {
    categoryKey: 'daily',
    categoryName: 'Daily',
    categoryEyebrow: '⚡ High-Yield Habits',
    categoryDesc: 'Bite-sized daily technical conditioning to stay sharp and maintain continuous momentum.',
    modules: [
      {
        id: 'daily-skill-challenge',
        title: 'Skill Challenge',
        icon: '⚡',
        pill: 'Daily Sprint',
        desc: "Solve today's targeted algorithmic and real-world system optimization prompt.",
        meta: 'Today: O(N) Cache Eviction',
        interactiveType: 'challenge',
        content: {
          prompt: "Design an in-memory Cache with O(1) eviction policy when capacity is reached. What data structure combination guarantees both O(1) key lookups and O(1) node movement?",
          options: [
            { text: "Doubly Linked List + Hash Map (LRU)", isCorrect: true, explanation: "Correct! The hash map gives O(1) lookup to list nodes, while the doubly linked list allows O(1) removal and insertion to the head." },
            { text: "Binary Search Tree + Array", isCorrect: false, explanation: "Incorrect: BST lookups take O(log N) average time, failing the strict O(1) requirement." },
            { text: "Single Queue + Min-Heap", isCorrect: false, explanation: "Incorrect: Heap deletion or reprioritization takes O(log N) time." }
          ]
        }
      },
      {
        id: 'daily-minute-drill',
        title: '1-Minute Drill',
        icon: '⏱️',
        pill: '1 Min Drill',
        desc: 'Quick-fire micro-problems to sharpen mental agility, cognitive speed, and syntax fluency.',
        meta: 'Streak: 4 Days · 60s',
        interactiveType: 'drill',
        content: {
          prompt: "Rapid Question: In JavaScript, what does `['1', '7', '11'].map(parseInt)` return?",
          options: [
            { text: "[1, NaN, 3]", isCorrect: true, explanation: "Correct! parseInt accepts (string, radix). map passes (element, index). So: parseInt('1', 0) -> 1, parseInt('7', 1) -> NaN, parseInt('11', 2) -> 3." },
            { text: "[1, 7, 11]", isCorrect: false, explanation: "Incorrect: map passes index as the second argument, which parseInt interprets as the mathematical radix." },
            { text: "[1, NaN, NaN]", isCorrect: false, explanation: "Incorrect: '11' in binary radix 2 is equal to 3." }
          ]
        }
      },
      {
        id: 'daily-memory-gym',
        title: 'Memory Gym',
        icon: '🧠',
        pill: 'Active Recall',
        desc: 'Spaced-repetition active recall drills covering system design, database internals, and protocols.',
        meta: '12 cards due for review',
        interactiveType: 'memory',
        content: {
          prompt: "Active Recall: What is the primary difference between ACID transactions and the BASE consistency model in distributed data stores?",
          options: [
            { text: "ACID prioritizes strict consistency & isolation; BASE prioritizes availability and eventual consistency.", isCorrect: true, explanation: "Spot on! ACID (Pessimistic) ensures immediate linearizability, while BASE (Optimistic) allows stale reads in exchange for partition tolerance and high write throughput." },
            { text: "ACID is only for relational DBs, BASE is only for Redis caches.", isCorrect: false, explanation: "Incorrect: BASE is an architectural philosophy applied to distributed datastores like Dynamo, Cassandra, and Cosmos DB." }
          ]
        }
      }
    ]
  },
  {
    categoryKey: 'practice',
    categoryName: 'Practice',
    categoryEyebrow: '🎙️ Technical Simulation',
    categoryDesc: 'High-stakes simulated interviews, code debugging, and technical debate environments.',
    modules: [
      {
        id: 'practice-interview-arena',
        title: 'Interview Arena',
        icon: '🎙️',
        pill: 'AI Mock Round',
        desc: 'AI mock interviewer simulating FAANG-grade technical, system design, and behavioral screenings.',
        meta: 'Staff Level · Live Evaluator',
        interactiveType: 'interview',
        content: {
          prompt: "Mock Interview Round: 'How would you design a distributed URL shortener (like TinyURL) handling 500 million new URLs per month with 99.999% read uptime?'",
          options: [
            { text: "Base62 encoding of counter with pre-allocated distributed zookeeper ID ranges + global Redis CDN edge caching", isCorrect: true, explanation: "Excellent architectural response! Pre-allocating ID blocks eliminates single points of failure, Base62 provides 62^7 combinations (~3.5 trillion URLs), and CDN/Redis handles read-heavy 100:1 ratios." },
            { text: "MD5 hash of URL truncated to 6 chars stored in single MySQL master instance with auto-increment ID", isCorrect: false, explanation: "Fails at scale: Hash collisions will occur, and single MySQL master will quickly bottleneck on 500M monthly write operations." }
          ]
        }
      },
      {
        id: 'practice-debug-this',
        title: 'Debug This',
        icon: '🐛',
        pill: 'Bug Hunter',
        desc: 'Identify and fix subtle race conditions, memory leaks, and broken queries in production-grade code.',
        meta: 'Scenario: Node.js Event Leak',
        interactiveType: 'debug',
        content: {
          prompt: "Identify the critical production issue in this backend snippet:\n\nconst emitter = new EventEmitter()\napp.get('/events', (req, res) => {\n  emitter.on('data', (d) => res.write(d))\n})",
          options: [
            { text: "Memory Leak: Listener added on every HTTP request is never removed when the connection closes (`req.on('close')`).", isCorrect: true, explanation: "Exactly right! As users disconnect, listeners remain bound to the global emitter, causing heap exhaustion and MaxListenersExceededWarning crashes." },
            { text: "Syntax error: `res.write` cannot take arbitrary data.", isCorrect: false, explanation: "Incorrect: `res.write` accepts buffers and strings. The root cause is the listener leak." }
          ]
        }
      },
      {
        id: 'practice-concept-battle',
        title: 'Concept Battle',
        icon: '⚔️',
        pill: 'Trade-off Lab',
        desc: 'Compare competing architectural paradigms (Kafka vs RabbitMQ, SQL vs NoSQL, SSR vs SSG).',
        meta: 'Round: Kafka vs RabbitMQ',
        interactiveType: 'battle',
        content: {
          prompt: "Trade-off Showdown: In a high-throughput event sourcing system where 10 microservices need to replay transactions from 30 days ago, which is superior?",
          options: [
            { text: "Apache Kafka: Persistent distributed log allows arbitrary offset seek and multi-consumer independent replay.", isCorrect: true, explanation: "Correct! RabbitMQ deletes messages after delivery acknowledgment, whereas Kafka preserves immutable commit logs on disk based on retention policies." },
            { text: "RabbitMQ: Smart broker routing handles complex exchanges better than raw partition logs.", isCorrect: false, explanation: "Incorrect for this case: While RabbitMQ has sophisticated routing, it is fundamentally a transient queue and cannot replay 30 days of historical streams." }
          ]
        }
      },
      {
        id: 'practice-communication-simulator',
        title: 'Communication Simulator',
        icon: '💬',
        pill: 'Exec Presence',
        desc: 'Practice high-stakes engineering communications: post-mortems, PR pushbacks, and roadmap updates.',
        meta: 'Scenario: P0 Outage Briefing',
        interactiveType: 'comm',
        content: {
          prompt: "Scenario: A checkout microservice outage caused $40k loss. The VP of Eng asks for an immediate slack update. Which response demonstrates senior engineering ownership?",
          options: [
            { text: "[STATUS: MITIGATED] Root cause identified (DB pool exhaustion after v2.4 deploy). Rolled back to v2.3 at 14:18 UTC. 100% orders normal. Post-mortem doc with preventative SLO alerts drafting by 18:00 UTC.", isCorrect: true, explanation: "Strong leadership communication: concise, objective, includes impact, mitigation time, and commitments without deflection or panic." },
            { text: "It wasn't our code, DevOps misconfigured the database connection pool settings during deployment.", isCorrect: false, explanation: "Fails leadership standards: Blames others, provides no verification of current state, and destroys team trust." }
          ]
        }
      }
    ]
  },
  {
    categoryKey: 'build',
    categoryName: 'Build',
    categoryEyebrow: '🔨 Engineering Depth',
    categoryDesc: 'Hands-on architectural challenges, stress testing, and real workplace engineering scenarios.',
    modules: [
      {
        id: 'build-challenge',
        title: 'Build Challenge',
        icon: '🔨',
        pill: 'Mini-Project',
        desc: 'Architect and scaffold production-ready micro-services and fullstack features from strict specifications.',
        meta: 'Spec: Distributed Rate Limiter',
        interactiveType: 'build',
        content: {
          prompt: "Specification: Build an HTTP rate limiter allowing 100 requests per minute per IP using Redis. Which atomic pattern prevents race conditions between multiple API containers?",
          options: [
            { text: "Redis Lua script or MULTI/EXEC executing token-bucket / sliding window check & decrement in single atomic execution.", isCorrect: true, explanation: "Correct! Performing GET, check, and INCR as separate network trips causes race conditions. Lua scripts execute atomically in single Redis thread." },
            { text: "Application-level mutex in Node.js cluster memory.", isCorrect: false, explanation: "Fails in production: Mutexes in local memory only protect a single instance, not traffic distributed across multiple server pods." }
          ]
        }
      },
      {
        id: 'build-project-stress-test',
        title: 'Project Stress Test',
        icon: '💥',
        pill: 'Chaos Sim',
        desc: 'Subject your project designs to simulated 100k RPS traffic surges, node failures, and latency spikes.',
        meta: 'Load: 100k RPS Spike',
        interactiveType: 'stress',
        content: {
          prompt: "Stress Test Alert: Flash sale causes 50x read spike on product details page. Primary database CPU hits 98%. What is the most immediate zero-downtime protection?",
          options: [
            { text: "Enable Redis read-replica read pooling + aggressively increase CDN edge cache-control S-Maxage with stale-while-revalidate.", isCorrect: true, explanation: "Immediate relief! Edge caching absorbs 95%+ of identical read requests before they ever reach origin databases." },
            { text: "Restart the primary database server with larger memory parameters.", isCorrect: false, explanation: "Dangerous: Restarting causes immediate 100% outage for all ongoing checkout transactions." }
          ]
        }
      },
      {
        id: 'build-code-review-room',
        title: 'Code Review Room',
        icon: '🔍',
        pill: 'PR Hygiene',
        desc: 'Review realistic incoming Pull Requests, identify anti-patterns, security holes, and performance bottlenecks.',
        meta: 'PR #402: Auth & SQL Token',
        interactiveType: 'review',
        content: {
          prompt: "Review PR #402 snippet:\n`const user = await db.query('SELECT * FROM users WHERE email = \"' + req.body.email + '\"')`\nWhat is your review feedback?",
          options: [
            { text: "BLOCKER: Critical SQL Injection vulnerability. Must parameterize query using placeholders: `db.query('SELECT * FROM users WHERE email = ?', [email])`.", isCorrect: true, explanation: "Spot on! String concatenation in SQL statements allows arbitrary SQL execution by malicious actors." },
            { text: "LGTM: Simple and readable query.", isCorrect: false, explanation: "Dangerous review: Misses a fatal security vulnerability." }
          ]
        }
      },
      {
        id: 'build-workplace-simulator',
        title: 'Workplace Simulator',
        icon: '🏢',
        pill: 'Real-Life Case',
        desc: 'Navigate tricky real-world engineering politics, sprint prioritization, and tech-debt vs feature velocity.',
        meta: 'Case: Tech Debt vs Deadline',
        interactiveType: 'workplace',
        content: {
          prompt: "Product Manager requests 3 new features before quarterly board meeting, but core database migrations have 2 months of accumulated tech debt. How do you resolve?",
          options: [
            { text: "Propose a phased compromise: Ship the #1 highest-conversion feature alongside foundational DB migration, scheduling the remaining 2 for the next sprint.", isCorrect: true, explanation: "Masterful engineering judgment: aligns with business outcomes while protecting system reliability." },
            { text: "Refuse to build any features until all tech debt is 100% eliminated.", isCorrect: false, explanation: "Creates adversarial relationship with leadership and demonstrates lack of business empathy." }
          ]
        }
      }
    ]
  },
  {
    categoryKey: 'growth',
    categoryName: 'Growth',
    categoryEyebrow: '🗺️ Career Calibration',
    categoryDesc: 'Diagnostic radar mapping, personalized learning roadmap, and quantified industry benchmarking.',
    modules: [
      {
        id: 'growth-skill-gap-map',
        title: 'Skill Gap Map',
        icon: '🗺️',
        pill: 'Diagnostic Radar',
        desc: 'Dynamic diagnostic radar mapping your current skills against top 1% market demand for target roles.',
        meta: '88% Match to Staff Role',
        interactiveType: 'gap',
        content: {
          prompt: "Diagnostic Radar: You score 94% in React/Node.js, 88% in System Design, but 42% in Kubernetes / Distributed Observability. What is your highest-leverage growth priority?",
          options: [
            { text: "Deep-dive into Prometheus/OpenTelemetry instrumentation and Docker/K8s cluster orchestration to eliminate your single weakest dimension.", isCorrect: true, explanation: "Correct! Senior & Staff interviews follow a weak-link heuristic; leveling your 42% blindspot unlocks top tier offers." },
            { text: "Learn another frontend state management library like Zustand or Redux Toolkit.", isCorrect: false, explanation: "Low ROI: Marginal gains in your already strongest skill do not elevate your interview pass rate." }
          ]
        }
      },
      {
        id: 'growth-learning-path',
        title: 'Learning Path',
        icon: '🎯',
        pill: 'Adaptive AI Plan',
        desc: 'Adaptive day-by-day progression plan prioritizing highest ROI topics for your upcoming interviews.',
        meta: 'Module 3 of 7 in Progress',
        interactiveType: 'path',
        content: {
          prompt: "Learning Path Milestone: Active module focuses on 'Distributed Caching Invalidation & Cache Stampede Defense'. Ready to verify mastery?",
          options: [
            { text: "Verify: Implement Mutex Locking (SingleFlight pattern) + Probabilistic Early Expiration (XFetch algorithm).", isCorrect: true, explanation: "Optimal! SingleFlight ensures only one worker queries origin DB on cache miss, while XFetch prevents stampede by proactively recalculating popular keys." },
            { text: "Verify: Set TTL to 1 hour and flush all keys on updates.", isCorrect: false, explanation: "Suboptimal: Causes catastrophic cache stampede spikes upon global flushes." }
          ]
        }
      },
      {
        id: 'growth-career-mission',
        title: 'Career Mission',
        icon: '🚀',
        pill: 'Weekly Sprint',
        desc: 'Your active high-leverage weekly campaign: submit 12 tailored apps, 4 cold reachouts, 2 mock sessions.',
        meta: '72% Completed this Week',
        interactiveType: 'mission',
        content: {
          prompt: "Weekly Sprint Status: You have completed 8/12 job apps and 2/2 mock interviews, but 0/4 direct outreach messages. Which action maximizes interview velocity today?",
          options: [
            { text: "Use REXION direct recruiter outreach engine to dispatch 4 personalized emails to engineering managers for active job matches.", isCorrect: true, explanation: "Direct outreach to decision makers converts at 4x-8x higher rates than cold ATS applications alone." },
            { text: "Submit 20 more standard LinkedIn Easy Apply applications.", isCorrect: false, explanation: "Easy Apply has single digit response rates; personalized outreach yields significantly higher interview conversion." }
          ]
        }
      },
      {
        id: 'growth-weekly-benchmark',
        title: 'Weekly Benchmark',
        icon: '📊',
        pill: 'Percentile Rank',
        desc: 'Quantified analytics scoring your problem-solving velocity, code quality, and consistency against peers.',
        meta: 'Top 5% Problem Solving',
        interactiveType: 'benchmark',
        content: {
          prompt: "Your Weekly Scorecard: Solving Speed: 94th percentile · System Architecture: 91st percentile · Consistency: 6-day streak.",
          options: [
            { text: "Lock in streak bonus and claim weekly performance badge.", isCorrect: true, explanation: "Consistency is the #1 predictor of interview offer success. Keep the momentum going!" }
          ]
        }
      }
    ]
  },
  {
    categoryKey: 'discovery',
    categoryName: 'Discovery',
    categoryEyebrow: '💡 Innovation & Market',
    categoryDesc: 'Breakthrough startup concepts, live developer tool radar, and elite engineering case studies.',
    modules: [
      {
        id: 'discovery-idea-lab',
        title: 'Idea Lab',
        icon: '💡',
        pill: 'Market Blueprints',
        desc: 'High-value startup, side-project, and open-source project ideas with validated market demand.',
        meta: '3 Curated Blueprints',
        interactiveType: 'idealab',
        content: {
          prompt: "Featured Blueprint: 'Autonomous OpenTelemetry Agent that automatically rewrites slow SQL queries via PR generator'. Target Market: High-scale FinTech and SaaS startups.",
          options: [
            { text: "Review Architecture Blueprint & Clone Starter Spec", isCorrect: true, explanation: "Blueprint unpacked: Utilizes eBPF tracing, pg_stat_statements parser, and LLM-assisted indexed migration suggestions." },
            { text: "Archive for later reading", isCorrect: false, explanation: "Saved to your bookmarks for your weekend building sessions." }
          ]
        }
      },
      {
        id: 'discovery-tool-radar',
        title: 'Tool Radar',
        icon: '📡',
        pill: 'Live Tech Sensor',
        desc: 'Live tracking of breakthrough libraries, dev tools, and autonomous AI agents shaping engineering.',
        meta: '14 Tools Trending Today',
        interactiveType: 'radar',
        content: {
          prompt: "Trending Tech Radar this week: vLLM (High-throughput LLM inference), Bun 1.2 (Full Postgres driver), ClickHouse (Real-time analytics), and Cursor (Agentic IDE).",
          options: [
            { text: "Inspect production benchmarks and adoption case studies.", isCorrect: true, explanation: "Benchmarked: vLLM delivers 24x throughput over standard HuggingFace endpoints using PagedAttention memory management." }
          ]
        }
      },
      {
        id: 'discovery-real-world-scenario',
        title: 'Real-World Scenario',
        icon: '🏛️',
        pill: 'Architecture Retrospective',
        desc: 'Deep-dives into actual architecture retrospectives from Stripe, Uber, Netflix, and Figma.',
        meta: 'Case: Stripe Ledger 99.999%',
        interactiveType: 'scenario',
        content: {
          prompt: "Deep-Dive: How Stripe guarantees zero double-entry errors across billions in transactions using idempotent tokens and deterministic ledger state machines.",
          options: [
            { text: "Read full retrospective and architectural decision log.", isCorrect: true, explanation: "Key take-away: Every mutation requires an idempotency key cached in Redis cluster with strict leasing, guaranteeing exactly-once side-effects." }
          ]
        }
      }
    ]
  }
]

export default function SkillSuite() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeModalModule, setActiveModalModule] = useState(null)
  const [selectedOption, setSelectedOption] = useState(null)
  const [submittedFeedback, setSubmittedFeedback] = useState(null)

  const handleOpenModal = (module) => {
    setActiveModalModule(module)
    setSelectedOption(null)
    setSubmittedFeedback(null)
  }

  const handleCloseModal = () => {
    setActiveModalModule(null)
    setSelectedOption(null)
    setSubmittedFeedback(null)
  }

  const handleSelectOption = (index, option) => {
    setSelectedOption(index)
    setSubmittedFeedback(option)
  }

  const filteredCategories = activeCategory === 'all'
    ? MODULE_DATA
    : MODULE_DATA.filter((cat) => cat.categoryKey === activeCategory)

  const totalModulesCount = MODULE_DATA.reduce((acc, cat) => acc + cat.modules.length, 0)

  return (
    <div className={styles.suiteContainer}>
      {/* Category Filter Bar */}
      <div className={styles.filterBar}>
        <button
          type="button"
          className={`${styles.filterTab} ${activeCategory === 'all' ? styles.filterTabActive : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          <span>All Modules</span>
          <span className={styles.filterTabCount}>{totalModulesCount}</span>
        </button>

        {MODULE_DATA.map((cat) => (
          <button
            key={cat.categoryKey}
            type="button"
            className={`${styles.filterTab} ${activeCategory === cat.categoryKey ? styles.filterTabActive : ''}`}
            onClick={() => setActiveCategory(cat.categoryKey)}
          >
            <span>{cat.categoryName}</span>
            <span className={styles.filterTabCount}>{cat.modules.length}</span>
          </button>
        ))}
      </div>

      {/* Render Grouped Category Sections */}
      {filteredCategories.map((category) => (
        <section key={category.categoryKey} className={styles.trackSection}>
          <div className={styles.trackHeader}>
            <div className={styles.trackHeaderLeft}>
              <span className={styles.trackEyebrow}>{category.categoryEyebrow}</span>
              <h3 className={styles.trackTitle}>{category.categoryName.toUpperCase()}</h3>
              <p className={styles.trackDesc}>{category.categoryDesc}</p>
            </div>
            <span className={styles.trackBadge}>{category.modules.length} Modules</span>
          </div>

          <div className={styles.cardsGrid}>
            {category.modules.map((mod) => (
              <article
                key={mod.id}
                className={styles.moduleCard}
                onClick={() => handleOpenModal(mod)}
              >
                <div>
                  <div className={styles.cardTopRow}>
                    <div className={styles.cardIconWrap}>{mod.icon}</div>
                    <span className={styles.cardPill}>{mod.pill}</span>
                  </div>

                  <div className={styles.cardContent}>
                    <h4 className={styles.cardTitle}>{mod.title}</h4>
                    <p className={styles.cardDesc}>{mod.desc}</p>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.cardMeta}>
                    <span className={styles.cardMetaDot} />
                    <span>{mod.meta}</span>
                  </div>
                  <button type="button" className={styles.cardActionBtn}>
                    <span>Launch</span>
                    <span>→</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      {/* Interactive Modal Drawer */}
      <AnimatePresence>
        {activeModalModule && (
          <motion.div
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
          >
            <motion.div
              className={styles.modalContainer}
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <div className={styles.modalHeaderTitleWrap}>
                  <span className={styles.modalIcon}>{activeModalModule.icon}</span>
                  <div>
                    <span className={styles.modalCategory}>{activeModalModule.pill}</span>
                    <h3 className={styles.modalTitle}>{activeModalModule.title}</h3>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.closeButton}
                  onClick={handleCloseModal}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className={styles.modalBody}>
                {(() => {
                  switch (activeModalModule.interactiveType) {
                    case 'challenge':
                      return <SkillChallengeView module={activeModalModule} onComplete={handleCloseModal} />
                    case 'drill':
                      return <MinuteDrillView module={activeModalModule} onComplete={handleCloseModal} />
                    case 'memory':
                      return <MemoryGymView module={activeModalModule} onComplete={handleCloseModal} />
                    case 'interview':
                      return <InterviewArenaView module={activeModalModule} onComplete={handleCloseModal} />
                    case 'debug':
                      return <DebugThisView module={activeModalModule} onComplete={handleCloseModal} />
                    case 'battle':
                      return <ConceptBattleView module={activeModalModule} onComplete={handleCloseModal} />
                    case 'comm':
                      return <CommunicationSimulatorView module={activeModalModule} onComplete={handleCloseModal} />
                    case 'build':
                      return <BuildChallengeView module={activeModalModule} onComplete={handleCloseModal} />
                    case 'stress':
                      return <ProjectStressTestView module={activeModalModule} onComplete={handleCloseModal} />
                    case 'review':
                      return <CodeReviewRoomView module={activeModalModule} onComplete={handleCloseModal} />
                    case 'workplace':
                      return <WorkplaceSimulatorView module={activeModalModule} onComplete={handleCloseModal} />
                    case 'gap':
                      return <SkillGapMapView module={activeModalModule} onComplete={handleCloseModal} />
                    case 'path':
                      return <LearningPathView module={activeModalModule} onComplete={handleCloseModal} />
                    case 'mission':
                      return <CareerMissionView module={activeModalModule} onComplete={handleCloseModal} />
                    case 'benchmark':
                      return <WeeklyBenchmarkView module={activeModalModule} onComplete={handleCloseModal} />
                    case 'idealab':
                      return <IdeaLabView module={activeModalModule} onComplete={handleCloseModal} />
                    case 'radar':
                      return <ToolRadarView module={activeModalModule} onComplete={handleCloseModal} />
                    case 'scenario':
                      return <RealWorldScenarioView module={activeModalModule} onComplete={handleCloseModal} />
                    default:
                      return (
                        <div>
                          <div className={styles.modalPromptBox}>
                            <strong>Mission Context:</strong>
                            <p style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>
                              {activeModalModule.content?.prompt}
                            </p>
                          </div>
                          {activeModalModule.content?.options && (
                            <div className={styles.modalInteractiveArea}>
                              {activeModalModule.content.options.map((opt, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className={`${styles.modalOptionBtn} ${selectedOption === idx ? styles.modalOptionBtnSelected : ''}`}
                                  onClick={() => handleSelectOption(idx, opt)}
                                >
                                  <span>{opt.text}</span>
                                  {selectedOption === idx && <span>✓</span>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                  }
                })()}
              </div>

              <div className={styles.modalFooter}>
                <div className={styles.modalFooterStatus}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88' }} />
                  <span>Interactive Real-time Simulator Active</span>
                </div>
                <button
                  type="button"
                  className={styles.modalFooterActionBtn}
                  onClick={handleCloseModal}
                >
                  Completed & Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
