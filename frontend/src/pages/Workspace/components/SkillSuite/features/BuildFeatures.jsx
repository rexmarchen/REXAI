import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './Features.module.css'

// 1. BUILD CHALLENGE (Micro-Service Architecture Scaffolder)
export function BuildChallengeView({ module, onComplete }) {
  const [components, setComponents] = useState({
    gateway: true,
    redisCluster: true,
    luaScript: true,
    localFallback: false
  })
  const [copied, setCopied] = useState(false)

  const scaffoldCode = `// Generated Production Rate Limiter: Redis Sliding Window Lua
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

// Atomic Lua Script: Evaluates sliding window in single Redis event-loop tick
const slidingWindowLua = \`
  local key = KEYS[1]
  local now = tonumber(ARGV[1])
  local window = tonumber(ARGV[2])
  local limit = tonumber(ARGV[3])
  local clearBefore = now - window

  redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)
  local currentRequests = redis.call('ZCARD', key)

  if currentRequests < limit then
    redis.call('ZADD', key, now, now)
    redis.call('EXPIRE', key, math.ceil(window / 1000))
    return 1
  else
    return 0
  end
\`;

module.exports = async function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxLimit = 100;

  const allowed = await redis.eval(slidingWindowLua, 1, \`rate:\${ip}\`, now, windowMs, maxLimit);
  return allowed === 1;
};`

  const handleCopy = () => {
    navigator.clipboard.writeText(scaffoldCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={styles.container}>
      <div className={styles.featureHeader}>
        <div className={styles.featureHeaderTitle}>
          <span>🔨 Build Challenge: Distributed Sliding-Window Rate Limiter</span>
        </div>
        <span className={styles.featureHeaderBadge}>Microservice Spec</span>
      </div>

      <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
        Architect a distributed HTTP rate limiter allowing 100 requests per minute per IP. Select system topology components to prevent distributed race conditions across Kubernetes pods.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        <button
          type="button"
          onClick={() => setComponents(c => ({ ...c, redisCluster: !c.redisCluster }))}
          className={`${styles.mitigationPill} ${components.redisCluster ? styles.mitigationPillActive : ''}`}
        >
          <span>📦 Redis Cluster (Primary Store)</span>
          <span>{components.redisCluster ? '✓' : '+'}</span>
        </button>

        <button
          type="button"
          onClick={() => setComponents(c => ({ ...c, luaScript: !c.luaScript }))}
          className={`${styles.mitigationPill} ${components.luaScript ? styles.mitigationPillActive : ''}`}
        >
          <span>⚡ Atomic Lua Script (No Race)</span>
          <span>{components.luaScript ? '✓' : '+'}</span>
        </button>

        <button
          type="button"
          onClick={() => setComponents(c => ({ ...c, gateway: !c.gateway }))}
          className={`${styles.mitigationPill} ${components.gateway ? styles.mitigationPillActive : ''}`}
        >
          <span>🌐 Envoy / Kong API Gateway Tier</span>
          <span>{components.gateway ? '✓' : '+'}</span>
        </button>

        <button
          type="button"
          onClick={() => setComponents(c => ({ ...c, localFallback: !c.localFallback }))}
          className={`${styles.mitigationPill} ${components.localFallback ? styles.mitigationPillActive : ''}`}
        >
          <span>🛡️ In-Memory Fallback Breaker</span>
          <span>{components.localFallback ? '✓' : '+'}</span>
        </button>
      </div>

      <div className={styles.editorPane}>
        <div className={styles.editorToolbar}>
          <span>rateLimiter.service.js (Scaffolded from Spec)</span>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              background: copied ? '#00ff88' : 'rgba(255,255,255,0.08)',
              color: copied ? '#000000' : '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {copied ? '✓ Copied to Clipboard!' : '📋 Copy Production Scaffold'}
          </button>
        </div>
        <textarea
          className={styles.codeTextarea}
          style={{ minHeight: '170px' }}
          readOnly
          value={scaffoldCode}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
        <button type="button" className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={handleCopy}>
          🚀 Export Scaffold to Project Repo
        </button>
      </div>
    </div>
  )
}

// 2. PROJECT STRESS TEST (Chaos Engineering & 100k RPS Simulator)
export function ProjectStressTestView({ module, onComplete }) {
  const [rps, setRps] = useState(65000)
  const [dbFailover, setDbFailover] = useState(false)
  const [mitigations, setMitigations] = useState({
    readReplicas: true,
    edgeCaching: false,
    circuitBreaker: false
  })

  // Dynamic calculations based on load and active mitigations
  let errorRate = 0.01
  let latencyP99 = 24

  if (rps > 80000) {
    latencyP99 += (rps - 80000) * 0.005
    errorRate += (rps - 80000) * 0.0003
  }

  if (dbFailover) {
    latencyP99 += 320
    errorRate += 18.5
  }

  if (mitigations.edgeCaching) {
    latencyP99 = Math.max(12, latencyP99 * 0.3)
    errorRate = Math.max(0.01, errorRate * 0.15)
  }

  if (mitigations.circuitBreaker && errorRate > 5) {
    errorRate = 1.2
    latencyP99 = Math.min(80, latencyP99)
  }

  const isHealthy = errorRate < 2.0 && latencyP99 < 150

  return (
    <div className={styles.container}>
      <div className={styles.featureHeader}>
        <div className={styles.featureHeaderTitle}>
          <span>💥 Chaos Simulator: 100k RPS Production Surge</span>
        </div>
        <span
          className={styles.featureHeaderBadge}
          style={{
            background: isHealthy ? 'rgba(0, 255, 136, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: isHealthy ? '#00ff88' : '#ef4444',
            borderColor: isHealthy ? 'rgba(0, 255, 136, 0.3)' : 'rgba(239, 68, 68, 0.4)'
          }}
        >
          {isHealthy ? '● Systems Stable' : '▲ Incident: Degraded'}
        </span>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricVal} style={{ color: '#00f0ff' }}>
            {rps.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Current RPS</div>
        </div>
        <div className={styles.metricCard}>
          <div className={`${styles.metricVal} ${latencyP99 > 150 ? styles.metricCritical : styles.metricHealthy}`}>
            {Math.round(latencyP99)}ms
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>p99 Latency</div>
        </div>
        <div className={styles.metricCard}>
          <div className={`${styles.metricVal} ${errorRate > 2.0 ? styles.metricCritical : styles.metricHealthy}`}>
            {errorRate.toFixed(2)}%
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>HTTP 5xx Error Rate</div>
        </div>
      </div>

      <div className={styles.sliderGroup}>
        <div className={styles.sliderLabel}>
          <span>Simulate Sudden Traffic Surge:</span>
          <strong style={{ color: '#00ff88' }}>{rps.toLocaleString()} RPS</strong>
        </div>
        <input
          type="range"
          className={styles.rangeSlider}
          min={10000}
          max={150000}
          step={5000}
          value={rps}
          onChange={(e) => setRps(Number(e.target.value))}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <strong style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>
          Zero-Downtime Mitigations:
        </strong>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <button
            type="button"
            className={`${styles.mitigationPill} ${mitigations.edgeCaching ? styles.mitigationPillActive : ''}`}
            onClick={() => setMitigations(m => ({ ...m, edgeCaching: !m.edgeCaching }))}
          >
            <span>🌐 Edge CDN Cache</span>
            <span>{mitigations.edgeCaching ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            className={`${styles.mitigationPill} ${mitigations.readReplicas ? styles.mitigationPillActive : ''}`}
            onClick={() => setMitigations(m => ({ ...m, readReplicas: !m.readReplicas }))}
          >
            <span>🔄 Read-Replica Pool</span>
            <span>{mitigations.readReplicas ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            className={`${styles.mitigationPill} ${mitigations.circuitBreaker ? styles.mitigationPillActive : ''}`}
            onClick={() => setMitigations(m => ({ ...m, circuitBreaker: !m.circuitBreaker }))}
          >
            <span>⚡ Circuit Breaker</span>
            <span>{mitigations.circuitBreaker ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
        <button
          type="button"
          onClick={() => setDbFailover(!dbFailover)}
          style={{
            background: dbFailover ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${dbFailover ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
            color: dbFailover ? '#ef4444' : '#94a3b8',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          {dbFailover ? '⚠ Primary DB Crash Active' : '💥 Inject Chaos: Kill Primary DB Node'}
        </button>

        <span style={{ fontSize: '12px', color: '#00ff88', fontWeight: 600 }}>
          {isHealthy ? 'SLO Target Satisfied: 99.99% Availability' : 'SRE Alarm: Latency Budget Exceeded'}
        </span>
      </div>
    </div>
  )
}

// 3. CODE REVIEW ROOM (PR Hygiene & Security Auditor)
export function CodeReviewRoomView({ module, onComplete }) {
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [reviewVerdict, setReviewVerdict] = useState(null)

  const handleLineClick = (issue) => {
    setSelectedIssue(issue)
  }

  const handleRequestChanges = () => {
    setReviewVerdict({
      action: 'CHANGES_REQUESTED',
      badge: '🚫 Request Changes (Security Blocker)',
      notes: "Blocked deployment due to CWE-89 SQL Injection on line 14 and plaintext password comparison on line 22. Parameterized queries and bcrypt.compare are mandatory before merge."
    })
  }

  return (
    <div className={styles.container}>
      <div className={styles.featureHeader}>
        <div className={styles.featureHeaderTitle}>
          <span>🔍 PR Review Room: PR #402 (Auth & SQL Query)</span>
        </div>
        <span className={styles.featureHeaderBadge} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
          2 Vulnerabilities Flagged
        </span>
      </div>

      <div className={styles.diffPane}>
        <div style={{ color: '#94a3b8', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          diff --git a/services/auth.js b/services/auth.js
        </div>
        <span className={styles.diffLineContext}>{"@@ -10,14 +10,18 @@ async function authenticateUser(req, res) {"}</span>
        <span className={styles.diffLineRem}>-  const user = await User.findById(req.params.id);</span>
        <span
          className={styles.diffLineAdd}
          style={{ cursor: 'pointer', background: 'rgba(239, 68, 68, 0.25)', borderLeft: '3px solid #ef4444' }}
          onClick={() => handleLineClick({
            title: "CWE-89: SQL Injection Vulnerability",
            desc: "String concatenation allows attackers to supply ' OR '1'='1 to extract all database credentials.",
            fix: "db.query('SELECT * FROM users WHERE email = ?', [req.body.email])"
          })}
        >
          {'+  const query = "SELECT * FROM users WHERE email = \'" + req.body.email + "\'"; // [CLICK TO AUDIT]'}
        </span>
        <span className={styles.diffLineAdd}>{'+  const user = await db.query(query);'}</span>
        <span
          className={styles.diffLineAdd}
          style={{ cursor: 'pointer', background: 'rgba(239, 68, 68, 0.25)', borderLeft: '3px solid #ef4444' }}
          onClick={() => handleLineClick({
            title: "CWE-208: Plaintext Timing Attack",
            desc: "Direct equality comparison (user.password === req.body.password) leaks character timing and stores plaintext passwords.",
            fix: "await bcrypt.compare(req.body.password, user.passwordHash)"
          })}
        >
          {'+  if (user && user.password === req.body.password) { // [CLICK TO AUDIT]'}
        </span>
        <span className={styles.diffLineAdd}>{'+    return res.json({ token: generateToken(user) });'}</span>
        <span className={styles.diffLineContext}>{"   }"}</span>
      </div>

      {selectedIssue && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            fontSize: '12.5px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          <strong style={{ color: '#ef4444' }}>⚠ {selectedIssue.title}</strong>
          <span style={{ color: '#cbd5e1' }}>{selectedIssue.desc}</span>
          <div style={{ marginTop: '4px', color: '#00ff88', fontFamily: 'monospace', fontSize: '11.5px' }}>
            Recommended Fix: <code>{selectedIssue.fix}</code>
          </div>
        </motion.div>
      )}

      {reviewVerdict && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'rgba(0, 255, 136, 0.08)',
            border: '1px solid rgba(0, 255, 136, 0.4)',
            fontSize: '12.5px'
          }}
        >
          <strong style={{ color: '#00ff88' }}>{reviewVerdict.badge}</strong>
          <p style={{ margin: '6px 0 0', color: '#e2e8f0', lineHeight: 1.45 }}>{reviewVerdict.notes}</p>
        </motion.div>
      )}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
          onClick={() => alert("Warning: Approving code with known SQL injection fails the security audit!")}
        >
          Approve (LGTM)
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
          onClick={handleRequestChanges}
        >
          🛑 Request Changes (Block PR)
        </button>
      </div>
    </div>
  )
}

// 4. WORKPLACE SIMULATOR (Engineering Dilemma Engine)
export function WorkplaceSimulatorView({ module, onComplete }) {
  const [meters, setMeters] = useState({
    morale: 75,
    techDebt: 65,
    trust: 80,
    velocity: 85
  })
  const [selectedDecision, setSelectedDecision] = useState(null)

  const handleDecision = (type) => {
    if (type === 'compromise') {
      setMeters({ morale: 85, techDebt: 45, trust: 92, velocity: 88 })
      setSelectedDecision({
        title: "Balanced Phased Delivery",
        outcome: "Executive leadership praised your pragmatic business alignment. The #1 revenue-critical feature shipped on time, while foundational database connection pooling was refactored without any downtime."
      })
    } else if (type === 'refuse') {
      setMeters({ morale: 60, techDebt: 20, trust: 50, velocity: 40 })
      setSelectedDecision({
        title: "Dogmatic Refusal",
        outcome: "Tech debt was cleaned, but missed board deadlines caused product friction. Leadership feels engineering is disconnected from commercial business priorities."
      })
    } else {
      setMeters({ morale: 50, techDebt: 95, trust: 70, velocity: 95 })
      setSelectedDecision({
        title: "100% Feature Rush",
        outcome: "Features shipped, but unaddressed DB locks caused a 2-hour production outage during peak traffic next weekend."
      })
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.featureHeader}>
        <div className={styles.featureHeaderTitle}>
          <span>🏢 Workplace Simulator: Tech Debt vs Feature Deadline</span>
        </div>
        <span className={styles.featureHeaderBadge}>Staff Dilemma</span>
      </div>

      <div className={styles.stakeholderGrid}>
        <div className={styles.meterCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span>Team Morale</span>
            <strong style={{ color: '#00ff88' }}>{meters.morale}%</strong>
          </div>
          <div className={styles.meterBarBg}>
            <div className={styles.meterBarFill} style={{ width: `${meters.morale}%`, background: '#00ff88' }} />
          </div>
        </div>

        <div className={styles.meterCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span>Tech Debt Risk</span>
            <strong style={{ color: meters.techDebt > 70 ? '#ef4444' : '#00f0ff' }}>{meters.techDebt}%</strong>
          </div>
          <div className={styles.meterBarBg}>
            <div className={styles.meterBarFill} style={{ width: `${meters.techDebt}%`, background: meters.techDebt > 70 ? '#ef4444' : '#00f0ff' }} />
          </div>
        </div>

        <div className={styles.meterCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span>Executive Trust</span>
            <strong style={{ color: '#00ff88' }}>{meters.trust}%</strong>
          </div>
          <div className={styles.meterBarBg}>
            <div className={styles.meterBarFill} style={{ width: `${meters.trust}%`, background: '#00ff88' }} />
          </div>
        </div>

        <div className={styles.meterCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span>Feature Velocity</span>
            <strong style={{ color: '#00f0ff' }}>{meters.velocity}%</strong>
          </div>
          <div className={styles.meterBarBg}>
            <div className={styles.meterBarFill} style={{ width: `${meters.velocity}%`, background: '#00f0ff' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <strong style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>
          Choose Your Leadership Decision:
        </strong>

        <button
          type="button"
          onClick={() => handleDecision('compromise')}
          className={styles.modalOptionBtn}
          style={{ padding: '12px 14px' }}
        >
          <span>1. Ship #1 highest-revenue feature alongside core DB connection pool refactor; schedule remaining features for next sprint.</span>
        </button>

        <button
          type="button"
          onClick={() => handleDecision('refuse')}
          className={styles.modalOptionBtn}
          style={{ padding: '12px 14px' }}
        >
          <span>2. Refuse all new features until 100% of accumulated database tech debt is resolved.</span>
        </button>

        <button
          type="button"
          onClick={() => handleDecision('rush')}
          className={styles.modalOptionBtn}
          style={{ padding: '12px 14px' }}
        >
          <span>3. Rush all 3 features to hit board deadline, completely deferring tech debt.</span>
        </button>
      </div>

      {selectedDecision && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'rgba(0, 255, 136, 0.08)',
            border: '1px solid rgba(0, 255, 136, 0.35)',
            fontSize: '12.5px',
            color: '#e2e8f0',
            lineHeight: 1.5
          }}
        >
          <strong style={{ color: '#00ff88' }}>Result: {selectedDecision.title}</strong>
          <p style={{ margin: '4px 0 0' }}>{selectedDecision.outcome}</p>
        </motion.div>
      )}
    </div>
  )
}
