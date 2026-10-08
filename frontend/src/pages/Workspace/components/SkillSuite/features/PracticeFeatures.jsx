import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './Features.module.css'

// 1. INTERVIEW ARENA (AI Mock Interviewer)
export function InterviewArenaView({ module, onComplete }) {
  const [candidateResponse, setCandidateResponse] = useState(
    "To handle 500 million new URLs per month with 99.999% uptime, I would architect a distributed token generator using Base62 encoding. Instead of single database auto-increment keys, we pre-allocate distributed unique ID ranges via a lightweight Zookeeper / Raft cluster to each API worker node.\n\nFor reads, which follow a 100:1 read-to-write ratio, we place Cloudflare edge caching in front of a global Redis cluster with Least-Recently-Used (LRU) eviction. Primary persistent storage uses a distributed key-value store (Cassandra or DynamoDB) partitioned on the hash of the short URL token to guarantee sub-10ms p99 read latency."
  )
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [rubricResult, setRubricResult] = useState(null)
  const [isMicActive, setIsMicActive] = useState(false)

  const handleEvaluate = () => {
    setIsEvaluating(true)
    setTimeout(() => {
      setIsEvaluating(false)
      setRubricResult({
        overallSignal: 'STRONG HIRE (Staff Level)',
        overallScore: 92,
        breakdown: [
          { label: 'System Scalability & Scale Math', score: '95 / 100' },
          { label: 'Pre-allocation & Race Condition Defense', score: '93 / 100' },
          { label: 'Cache Invalidation & Storage Partitioning', score: '90 / 100' },
          { label: 'Executive Articulation & Polish', score: '91 / 100' }
        ],
        strengths: "Pre-allocating ID ranges across distributed workers avoids central DB lock bottlenecks. Correctly recognized 100:1 read skew and placed Redis/CDN edge tier.",
        growthOpportunity: "Consider addressing 301 vs 302 HTTP redirects (301 reduces origin hits via browser cache, but 302 is required if click analytics are tracked)."
      })
    }, 1000)
  }

  return (
    <div className={styles.container}>
      <div className={styles.featureHeader}>
        <div className={styles.featureHeaderTitle}>
          <span>🎙️ AI Mock Interview Arena: FAANG Staff Level</span>
        </div>
        <span className={styles.featureHeaderBadge}>Live AI Evaluator</span>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,255,136,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', border: '1px solid rgba(0,255,136,0.4)' }}>
          🤖
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', color: '#00ff88', fontWeight: 700, textTransform: 'uppercase' }}>Interviewer Prompt · System Design</div>
          <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 600, marginTop: '2px' }}>
            "How would you design a distributed URL shortener (TinyURL) handling 500M new URLs/month with 99.999% read uptime?"
          </div>
        </div>
      </div>

      <div className={styles.waveWrap}>
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className={styles.waveBar}
            style={{
              animationDelay: `${(i * 0.05).toFixed(2)}s`,
              animationDuration: `${0.6 + (i % 5) * 0.15}s`,
              background: isMicActive ? '#00f0ff' : '#00ff88'
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Your Architectural Response:</span>
          <button
            type="button"
            onClick={() => setIsMicActive(!isMicActive)}
            style={{
              background: isMicActive ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${isMicActive ? '#00f0ff' : 'rgba(255,255,255,0.15)'}`,
              color: isMicActive ? '#00f0ff' : '#94a3b8',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            {isMicActive ? '🎙️ Mic Active (Listening)' : '🎙️ Enable Speech Dictation'}
          </button>
        </div>
        <textarea
          className={styles.codeTextarea}
          style={{ minHeight: '130px', color: '#f1f5f9', fontFamily: 'inherit' }}
          value={candidateResponse}
          onChange={(e) => setCandidateResponse(e.target.value)}
        />
      </div>

      {rubricResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(0, 255, 136, 0.04)',
            border: '1px solid rgba(0, 255, 136, 0.35)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#00ff88' }}>
              ✓ Recommendation: {rubricResult.overallSignal}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
              Score: {rubricResult.overallScore} / 100
            </span>
          </div>

          <div className={styles.rubricGrid}>
            {rubricResult.breakdown.map((b, i) => (
              <div key={i} className={styles.rubricItem}>
                <span className={styles.rubricItemLabel}>{b.label}</span>
                <span className={styles.rubricItemScore}>{b.score}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.5 }}>
            <strong style={{ color: '#00ff88' }}>Key Highlight: </strong>{rubricResult.strengths}
          </div>
          <div style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5 }}>
            <strong style={{ color: '#fbbf24' }}>Staff Differentiation Tip: </strong>{rubricResult.growthOpportunity}
          </div>
        </motion.div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
          onClick={handleEvaluate}
          disabled={isEvaluating}
        >
          {isEvaluating ? 'Evaluating System Design...' : '⚡ Submit for AI Rubric Evaluation'}
        </button>
      </div>
    </div>
  )
}

// 2. DEBUG THIS (Production Bug Hunter)
export function DebugThisView({ module, onComplete }) {
  const [isPatched, setIsPatched] = useState(false)
  const [diagnosticsRan, setDiagnosticsRan] = useState(false)
  const [testOutput, setTestOutput] = useState(null)

  const originalBuggyCode = `// Production File: backend/src/events/streamHandler.js
const { EventEmitter } = require('events');
const eventBus = new EventEmitter();

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');

  // BUG: Listener is added per request, but NEVER removed on client disconnect!
  eventBus.on('broadcast', (data) => {
    res.write(\`data: \${JSON.stringify(data)}\\n\\n\`);
  });
});`

  const patchedSolution = `// Production File: backend/src/events/streamHandler.js
const { EventEmitter } = require('events');
const eventBus = new EventEmitter();

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');

  const onBroadcast = (data) => {
    res.write(\`data: \${JSON.stringify(data)}\\n\\n\`);
  };

  eventBus.on('broadcast', onBroadcast);

  // FIX: Unbind listener immediately when client terminates HTTP connection
  req.on('close', () => {
    eventBus.removeListener('broadcast', onBroadcast);
  });
});`

  const handleRunDiagnostics = () => {
    setDiagnosticsRan(true)
  }

  const handleApplyPatch = () => {
    setIsPatched(true)
    setTestOutput({
      heapBefore: '1,842 MB (Growing exponentially)',
      heapAfter: '36 MB (Stabilized in steady state)',
      listeners: '0 dangling listeners (100% reclaimed)',
      concurrencyTest: 'PASS: 1,000 simulated disconnects verified cleanly.'
    })
  }

  return (
    <div className={styles.container}>
      <div className={styles.featureHeader}>
        <div className={styles.featureHeaderTitle}>
          <span>🐛 Bug Hunter: Node.js Event Listener Memory Leak</span>
        </div>
        <span className={styles.featureHeaderBadge} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
          P0 Incident
        </span>
      </div>

      <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
        Our production streaming endpoint <code>/events</code> triggered a <code>MaxListenersExceededWarning</code> and caused Kubernetes OOM-kill pod restarts under 500 RPS. Identify and patch the root cause.
      </p>

      <div className={styles.diffPane}>
        <div style={{ color: '#64748b', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '4px' }}>
          Target: <code>backend/src/events/streamHandler.js</code>
        </div>
        {!isPatched ? (
          <pre style={{ margin: 0, color: '#f87171' }}>{originalBuggyCode}</pre>
        ) : (
          <div>
            <span className={styles.diffLineContext}>// Applied Surgical Patch</span>
            <pre style={{ margin: 0, color: '#00ff88' }}>{patchedSolution}</pre>
          </div>
        )}
      </div>

      {!diagnosticsRan ? (
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
          onClick={handleRunDiagnostics}
        >
          🔍 Inspect Production Heap Profiler & Diagnostics
        </button>
      ) : (
        <div className={styles.consoleOutput}>
          <div>[V8 Heap Profiler] Analyzing memory snapshot...</div>
          <div style={{ color: '#ef4444' }}>⚠ Warning: Possible EventEmitter memory leak detected. 12,410 'broadcast' listeners added to eventBus.</div>
          <div style={{ color: '#38bdf8' }}>➜ Root cause: Each SSE connection binds onBroadcast, but never listens to 'close' or 'aborted'.</div>
        </div>
      )}

      {testOutput && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '14px',
            borderRadius: '10px',
            background: 'rgba(0, 255, 136, 0.08)',
            border: '1px solid rgba(0, 255, 136, 0.35)',
            fontSize: '12.5px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <strong style={{ color: '#00ff88', fontSize: '13px' }}>✓ Verification Suite Passed!</strong>
          <div>Heap Memory: <span style={{ color: '#ef4444' }}>{testOutput.heapBefore}</span> ➔ <span style={{ color: '#00ff88', fontWeight: 700 }}>{testOutput.heapAfter}</span></div>
          <div>Listener Leak Test: <span style={{ color: '#00ff88' }}>{testOutput.listeners}</span></div>
          <div>Load Simulation: <span style={{ color: '#ffffff' }}>{testOutput.concurrencyTest}</span></div>
        </motion.div>
      )}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
        {!isPatched ? (
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
            onClick={handleApplyPatch}
          >
            🛠️ Apply Surgical Fix & Verify Heap
          </button>
        ) : (
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
            onClick={() => {
              setIsPatched(false)
              setTestOutput(null)
            }}
          >
            Undo Patch
          </button>
        )}
      </div>
    </div>
  )
}

// 3. CONCEPT BATTLE (Architecture Trade-off Lab)
export function ConceptBattleView({ module, onComplete }) {
  const [throughput, setThroughput] = useState(250000)
  const [replayDays, setReplayDays] = useState(30)
  const [routingComplexity, setRoutingComplexity] = useState('low')

  const isKafkaSuperior = replayDays > 0 || throughput > 100000

  return (
    <div className={styles.container}>
      <div className={styles.featureHeader}>
        <div className={styles.featureHeaderTitle}>
          <span>⚔️ Concept Battle: Apache Kafka vs RabbitMQ</span>
        </div>
        <span className={styles.featureHeaderBadge}>Trade-off Lab</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <strong style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>
          Tune Your Workload Constraints:
        </strong>

        <div className={styles.sliderGroup}>
          <div className={styles.sliderLabel}>
            <span>Event Throughput:</span>
            <strong style={{ color: '#00ff88' }}>{throughput.toLocaleString()} msg/sec</strong>
          </div>
          <input
            type="range"
            className={styles.rangeSlider}
            min={10000}
            max={1000000}
            step={20000}
            value={throughput}
            onChange={(e) => setThroughput(Number(e.target.value))}
          />
        </div>

        <div className={styles.sliderGroup}>
          <div className={styles.sliderLabel}>
            <span>Historical Stream Replay Retention:</span>
            <strong style={{ color: '#00f0ff' }}>{replayDays} Days</strong>
          </div>
          <input
            type="range"
            className={styles.rangeSlider}
            min={0}
            max={90}
            step={5}
            value={replayDays}
            onChange={(e) => setReplayDays(Number(e.target.value))}
          />
        </div>
      </div>

      <div className={styles.battleMatrix}>
        <div className={`${styles.battleCol} ${isKafkaSuperior ? styles.battleColHighlight : ''}`}>
          <div className={styles.battleColTitle}>
            <span>Apache Kafka</span>
            {isKafkaSuperior && <span style={{ fontSize: '11px', color: '#00ff88' }}>★ Optimal Choice</span>}
          </div>
          <div className={styles.battleStatRow}>
            <span>Paradigm</span>
            <strong>Distributed Commit Log</strong>
          </div>
          <div className={styles.battleStatRow}>
            <span>Throughput Limit</span>
            <strong>Millions / sec (Partitioned)</strong>
          </div>
          <div className={styles.battleStatRow}>
            <span>Message Retention</span>
            <strong>Configurable Disk (e.g. 30d)</strong>
          </div>
          <div className={styles.battleStatRow}>
            <span>Replay Capability</span>
            <strong style={{ color: '#00ff88' }}>Arbitrary Offset Seek ✓</strong>
          </div>
        </div>

        <div className={`${styles.battleCol} ${!isKafkaSuperior ? styles.battleColHighlight : ''}`}>
          <div className={styles.battleColTitle}>
            <span>RabbitMQ</span>
            {!isKafkaSuperior && <span style={{ fontSize: '11px', color: '#00ff88' }}>★ Optimal Choice</span>}
          </div>
          <div className={styles.battleStatRow}>
            <span>Paradigm</span>
            <strong>Transient Smart Broker</strong>
          </div>
          <div className={styles.battleStatRow}>
            <span>Throughput Limit</span>
            <strong>~50k - 100k msg / sec</strong>
          </div>
          <div className={styles.battleStatRow}>
            <span>Message Retention</span>
            <strong>Deleted upon ACK</strong>
          </div>
          <div className={styles.battleStatRow}>
            <span>Routing Power</span>
            <strong style={{ color: '#00f0ff' }}>Complex AMQP Exchanges ✓</strong>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', borderLeft: '3px solid #00ff88', fontSize: '12.5px', color: '#e2e8f0', lineHeight: 1.5 }}>
        <strong>Architectural Verdict: </strong>
        {isKafkaSuperior
          ? `For your scale (${throughput.toLocaleString()} msg/sec with ${replayDays} days replay), Kafka is mathematically superior. RabbitMQ stores messages in memory queues and deletes them on acknowledgment; trying to buffer ${replayDays} days will cause RAM exhaustion.`
          : 'For transient tasks with complex topic routing, dead-letter exchanges, and strict per-message priority where replay is not needed, RabbitMQ excels with lower operational overhead.'}
      </div>
    </div>
  )
}

// 4. COMMUNICATION SIMULATOR (Executive Presence & Crisis Briefing)
export function CommunicationSimulatorView({ module, onComplete }) {
  const [draft, setDraft] = useState(
    "[STATUS: MITIGATED] Root cause identified: DB connection pool exhaustion following the v2.4 deploy. Rolled back to v2.3 at 14:18 UTC. 100% of checkout traffic has normalized. Zero customer transactions were permanently lost. A blameless post-mortem doc with preventative SLO alerts is drafting by 18:00 UTC."
  )
  const [evalResult, setEvalResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = () => {
    setIsAnalyzing(true)
    setTimeout(() => {
      setIsAnalyzing(false)
      setEvalResult({
        leadershipScore: 96,
        blamelessScore: 100,
        concisenessScore: 92,
        actionabilityScore: 95,
        summary: "Exceptional executive presence. You provided immediate status, precise timeline, financial/transaction impact, and committed next steps without emotional deflection or finger-pointing."
      })
    }, 700)
  }

  return (
    <div className={styles.container}>
      <div className={styles.featureHeader}>
        <div className={styles.featureHeaderTitle}>
          <span>💬 Communication Simulator: P0 Outage Briefing</span>
        </div>
        <span className={styles.featureHeaderBadge}>Exec Presence</span>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ fontSize: '18px' }}>🚨</span>
        <div style={{ fontSize: '12.5px', color: '#e2e8f0' }}>
          <strong>Scenario:</strong> Checkout microservice dropped orders for 14 minutes ($40k impact). The VP of Engineering requests an immediate Slack update in <code>#incident-command</code>.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Your Executive Broadcast Message:</span>
        <textarea
          className={styles.codeTextarea}
          style={{ minHeight: '110px', color: '#f8fafc', fontFamily: 'inherit' }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      </div>

      {evalResult && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(0, 255, 136, 0.05)',
            border: '1px solid rgba(0, 255, 136, 0.35)',
            borderRadius: '10px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#00ff88' }}>
              ✓ Staff Leadership Rating: {evalResult.leadershipScore} / 100
            </span>
            <span style={{ fontSize: '11px', color: '#00ff88', background: 'rgba(0,255,136,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
              Blameless Culture: {evalResult.blamelessScore}%
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.5 }}>
            {evalResult.summary}
          </p>
        </motion.div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
          onClick={handleAnalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? 'Analyzing Tone & Impact...' : '📊 Evaluate Executive Presence'}
        </button>
      </div>
    </div>
  )
}
