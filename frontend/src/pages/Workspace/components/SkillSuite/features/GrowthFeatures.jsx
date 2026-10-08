import React, { useState } from 'react'
import { motion } from 'framer-motion'
import styles from './Features.module.css'

// 1. SKILL GAP MAP (Diagnostic Radar & Target Role Benchmarking)
export function SkillGapMapView({ module, onComplete }) {
  const [targetRole, setTargetRole] = useState('staff-backend')

  const rolesData = {
    'staff-backend': {
      title: 'Staff Backend Engineer (L6 / IC6)',
      overallMatch: '88%',
      skills: [
        { name: 'Distributed Systems & Consensus', current: 82, target: 95, gap: -13 },
        { name: 'System Design & Scalability', current: 90, target: 92, gap: -2 },
        { name: 'Database Internals & Partitioning', current: 84, target: 90, gap: -6 },
        { name: 'Kubernetes & Observability (O11y)', current: 58, target: 85, gap: -27 },
        { name: 'Concurrency & Async Patterns', current: 94, target: 90, gap: +4 }
      ],
      recommendation: 'Prioritize OpenTelemetry instrumentation and Kubernetes pod scheduling to eliminate your single largest blindspot (-27% gap).'
    },
    'ai-systems': {
      title: 'AI Systems Architect',
      overallMatch: '82%',
      skills: [
        { name: 'High-Throughput LLM Inference (vLLM)', current: 75, target: 95, gap: -20 },
        { name: 'Vector DBs & Embeddings (LanceDB/Milvus)', current: 88, target: 90, gap: -2 },
        { name: 'RAG Pipeline Optimization & Chunking', current: 92, target: 95, gap: -3 },
        { name: 'GPU Memory & CUDA Architecture', current: 52, target: 80, gap: -28 },
        { name: 'Agentic Workflows & Tool Calling', current: 90, target: 90, gap: 0 }
      ],
      recommendation: 'Deep dive into KV Cache PagedAttention and Tensor Parallelism to reach top 1% market readiness for AI Platform roles.'
    }
  }

  const currentRole = rolesData[targetRole]

  return (
    <div className={styles.container}>
      <div className={styles.featureHeader}>
        <div className={styles.featureHeaderTitle}>
          <span>🗺️ Diagnostic Radar: Market Skill Gap Map</span>
        </div>
        <span className={styles.featureHeaderBadge}>{currentRole.overallMatch} Match</span>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={() => setTargetRole('staff-backend')}
          className={`${styles.editorTab} ${targetRole === 'staff-backend' ? styles.editorTabActive : ''}`}
          style={{ padding: '6px 14px' }}
        >
          Staff Backend Engineer
        </button>
        <button
          type="button"
          onClick={() => setTargetRole('ai-systems')}
          className={`${styles.editorTab} ${targetRole === 'ai-systems' ? styles.editorTabActive : ''}`}
          style={{ padding: '6px 14px' }}
        >
          AI Systems Architect
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {currentRole.skills.map((s, idx) => (
          <div key={idx} className={styles.gapBarRow}>
            <div className={styles.gapBarHeader}>
              <span style={{ color: '#ffffff', fontWeight: 600 }}>{s.name}</span>
              <span style={{ color: s.gap < -15 ? '#ef4444' : s.gap < 0 ? '#fbbf24' : '#00ff88', fontWeight: 700 }}>
                You: {s.current}% · Target: {s.target}% ({s.gap > 0 ? `+${s.gap}%` : `${s.gap}%`})
              </span>
            </div>
            <div className={styles.drillTimerBar} style={{ height: '8px' }}>
              <div
                style={{
                  height: '100%',
                  width: `${s.current}%`,
                  background: s.gap < -15 ? 'linear-gradient(90deg, #ef4444, #fbbf24)' : 'linear-gradient(90deg, #00ff88, #00f0ff)',
                  borderRadius: '999px'
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(0, 255, 136, 0.05)', border: '1px solid rgba(0, 255, 136, 0.3)', fontSize: '12.5px', color: '#e2e8f0' }}>
        <strong style={{ color: '#00ff88' }}>High-ROI Recommendation: </strong>
        {currentRole.recommendation}
      </div>
    </div>
  )
}

// 2. LEARNING PATH (7-Day Adaptive Progression Roadmap)
export function LearningPathView({ module, onComplete }) {
  const [days, setDays] = useState([
    { day: 1, title: 'Distributed Caching & Cache Stampede Defense', status: 'completed' },
    { day: 2, title: 'Database Partitioning & Consistent Hashing', status: 'completed' },
    { day: 3, title: 'Event Sourcing & CQRS with Apache Kafka', status: 'active' },
    { day: 4, title: 'Resiliency Patterns: Circuit Breakers & Jitter Retries', status: 'upcoming' },
    { day: 5, title: 'Microservices Auth & Zero-Trust Token Verification', status: 'upcoming' },
    { day: 6, title: 'High-Concurrency V8 Event Loop & Memory Profiling', status: 'upcoming' },
    { day: 7, title: 'Full FAANG Staff Mock System Design Simulation', status: 'upcoming' }
  ])

  const toggleDay = (idx) => {
    setDays((prev) =>
      prev.map((d, i) => {
        if (i === idx) {
          return { ...d, status: d.status === 'completed' ? 'active' : 'completed' }
        }
        return d
      })
    )
  }

  const completedCount = days.filter((d) => d.status === 'completed').length

  return (
    <div className={styles.container}>
      <div className={styles.featureHeader}>
        <div className={styles.featureHeaderTitle}>
          <span>🎯 Adaptive AI Learning Path: 7-Day Sprint</span>
        </div>
        <span className={styles.featureHeaderBadge}>{completedCount} of 7 Done</span>
      </div>

      <div className={styles.drillTimerBar}>
        <div className={styles.drillTimerFill} style={{ width: `${(completedCount / 7) * 100}%` }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {days.map((item, idx) => (
          <div
            key={idx}
            onClick={() => toggleDay(idx)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: '10px',
              background: item.status === 'active' ? 'rgba(0, 255, 136, 0.08)' : 'rgba(255, 255, 255, 0.02)',
              border: item.status === 'active' ? '1px solid rgba(0, 255, 136, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: item.status === 'completed' ? '#00ff88' : item.status === 'active' ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.06)',
                  color: item.status === 'completed' ? '#000000' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 800
                }}
              >
                {item.status === 'completed' ? '✓' : item.day}
              </span>
              <span style={{ color: item.status === 'completed' ? '#94a3b8' : '#ffffff', textDecoration: item.status === 'completed' ? 'line-through' : 'none' }}>
                Day {item.day}: {item.title}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: item.status === 'active' ? '#00ff88' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              {item.status}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
        <button type="button" className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}>
          ▶ Resume Active Day 3 Challenge
        </button>
      </div>
    </div>
  )
}

// 3. CAREER MISSION (Active Weekly High-Leverage Sprint)
export function CareerMissionView({ module, onComplete }) {
  return (
    <div className={styles.container}>
      <div className={styles.featureHeader}>
        <div className={styles.featureHeaderTitle}>
          <span>🚀 Weekly Career Campaign: Sprint #4</span>
        </div>
        <span className={styles.featureHeaderBadge}>72% Target Achieved</span>
      </div>

      <div className={styles.drillScoreboard}>
        <div className={styles.drillStatCard}>
          <div className={styles.drillStatVal}>8 / 12</div>
          <div className={styles.drillStatLabel}>Applications</div>
        </div>
        <div className={styles.drillStatCard}>
          <div className={styles.drillStatVal} style={{ color: '#00f0ff' }}>2 / 4</div>
          <div className={styles.drillStatLabel}>Outreach Emails</div>
        </div>
        <div className={styles.drillStatCard}>
          <div className={styles.drillStatVal} style={{ color: '#fbbf24' }}>2 / 2</div>
          <div className={styles.drillStatLabel}>Mock Interviews</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>4 Tailored Applications Remaining</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Target: High-fit Staff & Senior Roles</div>
          </div>
          <button type="button" className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} style={{ padding: '6px 12px', fontSize: '11px' }}>
            ⚡ 1-Click Apply
          </button>
        </div>

        <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>2 Recruiter Direct Messages Remaining</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>High-conversion personalized engineering pitch</div>
          </div>
          <button type="button" className={`${styles.actionBtn} ${styles.actionBtnSecondary}`} style={{ padding: '6px 12px', fontSize: '11px' }}>
            ✉ Open Outreach
          </button>
        </div>
      </div>
    </div>
  )
}

// 4. WEEKLY BENCHMARK (Quantified Peer Percentile Analytics)
export function WeeklyBenchmarkView({ module, onComplete }) {
  return (
    <div className={styles.container}>
      <div className={styles.featureHeader}>
        <div className={styles.featureHeaderTitle}>
          <span>📊 Quantified Benchmark: Global Percentile Rank</span>
        </div>
        <span className={styles.featureHeaderBadge}>Top 4% Global</span>
      </div>

      <div style={{ padding: '20px', background: 'rgba(0, 255, 136, 0.04)', borderRadius: '12px', border: '1px solid rgba(0, 255, 136, 0.3)', textAlign: 'center' }}>
        <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#00ff88' }}>
          96th Percentile
        </div>
        <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '4px' }}>
          Your technical speed and architecture design rank among the top 4% of active engineering candidates.
        </div>
      </div>

      <div className={styles.rubricGrid}>
        <div className={styles.rubricItem}>
          <span className={styles.rubricItemLabel}>Problem-Solving Velocity</span>
          <span className={styles.rubricItemScore}>94th %ile (1.4m avg)</span>
        </div>
        <div className={styles.rubricItem}>
          <span className={styles.rubricItemLabel}>System Architecture Depth</span>
          <span className={styles.rubricItemScore}>92nd %ile</span>
        </div>
        <div className={styles.rubricItem}>
          <span className={styles.rubricItemLabel}>Code Quality & Cleanliness</span>
          <span className={styles.rubricItemScore}>95th %ile (Grade A+)</span>
        </div>
        <div className={styles.rubricItem}>
          <span className={styles.rubricItemLabel}>Consistency & Daily Streak</span>
          <span className={styles.rubricItemScore}>98th %ile (6-Day Run)</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
          onClick={() => alert("Verification Hash: REXION-L6-VERIFIED-96TH-OCT2026. Added to your candidate profile!")}
        >
          🏆 Claim Verified REXION Top 5% Badge
        </button>
      </div>
    </div>
  )
}
