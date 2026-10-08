import React, { useState } from 'react'
import { motion } from 'framer-motion'
import styles from './Features.module.css'

// 1. IDEA LAB (Market Blueprints & Startup Architectures)
export function IdeaLabView({ module, onComplete }) {
  const [selectedBlueprint, setSelectedBlueprint] = useState(0)

  const blueprints = [
    {
      title: "Autonomous SQL Query Optimizer Agent",
      tam: "$4.2B Market TAM",
      market: "High-scale FinTech and SaaS startups with exploding AWS RDS / Aurora costs.",
      problem: "Engineers ship unindexed joins and sequential scans. DBAs spend 40% of time manually crafting composite indexes.",
      architecture: "eBPF Linux kernel tracing ➔ PostgreSQL pg_stat_statements stream ➔ AST SQL Parser ➔ LLM-assisted index advisor ➔ Automated Pull Request generator with zero-downtime CONCURRENTLY migrations.",
      stack: "Rust / Bun · ClickHouse · OpenAI API · Docker · GitHub Octokit"
    },
    {
      title: "Edge AI Voice Proxy with 80ms Latency",
      tam: "$2.8B Market TAM",
      market: "Customer service AI agents, real-time gaming voice assistants, telehealth.",
      problem: "Traditional STT (Speech-to-Text) ➔ LLM ➔ TTS pipelines have 1,200ms roundtrip latency, destroying conversational realism.",
      architecture: "WebSocket full-duplex audio stream ➔ Deepgram Nova-2 streaming STT ➔ Anthropic streaming tokens ➔ ElevenLabs WebSocket TTS ➔ Zero-buffering chunk streaming to client browser.",
      stack: "Go / Node.js · WebSockets · Redis Pub/Sub · WebRTC"
    },
    {
      title: "Zero-Config Microservices Chaos Testing Platform",
      tam: "$1.5B Market TAM",
      market: "Mid-market engineering teams lacking dedicated Netflix-style SRE teams.",
      problem: "Simulating cascading outages and network partitions requires complex Gremlin or Chaos Mesh setups.",
      architecture: "Sidecar Envoy proxy injector ➔ Synthetic traffic surge generator (100k RPS) ➔ Automated circuit breaker test ➔ Executive SLO compliance audit report.",
      stack: "Kubernetes Operator · Go · Prometheus · Next.js UI"
    }
  ]

  const active = blueprints[selectedBlueprint]

  return (
    <div className={styles.container}>
      <div className={styles.featureHeader}>
        <div className={styles.featureHeaderTitle}>
          <span>💡 Idea Lab: High-Value Startup & Architecture Blueprints</span>
        </div>
        <span className={styles.featureHeaderBadge}>{active.tam}</span>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {blueprints.map((bp, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setSelectedBlueprint(idx)}
            className={`${styles.editorTab} ${selectedBlueprint === idx ? styles.editorTabActive : ''}`}
            style={{ padding: '6px 12px' }}
          >
            Blueprint #{idx + 1}
          </button>
        ))}
      </div>

      <div className={styles.blueprintCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff' }}>{active.title}</h4>
          <span className={styles.blueprintMetaBadge}>{active.tam}</span>
        </div>

        <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
          <strong style={{ color: '#00f0ff' }}>Market Pain: </strong>{active.problem}
        </div>

        <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, background: 'rgba(0,0,0,0.4)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <strong style={{ color: '#00ff88' }}>System Architecture: </strong>
          <p style={{ margin: '4px 0 0', fontFamily: 'monospace', fontSize: '12px' }}>{active.architecture}</p>
        </div>

        <div style={{ fontSize: '12.5px', color: '#e2e8f0' }}>
          <strong style={{ color: '#fbbf24' }}>Recommended Tech Stack: </strong>{active.stack}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
          onClick={() => alert(`Starter Specification and Architectural Diagram for '${active.title}' downloaded!`)}
        >
          📥 Download Architecture Spec & Clone Repo
        </button>
      </div>
    </div>
  )
}

// 2. TOOL RADAR (Live Tech Sensor & Quadrant)
export function ToolRadarView({ module, onComplete }) {
  const [activeQuadrant, setActiveQuadrant] = useState('ALL')

  const tools = [
    { name: 'vLLM', quadrant: 'ADOPT', category: 'AI Inference', stars: '+4.2k/wk', desc: 'High-throughput LLM serving engine with PagedAttention algorithm.' },
    { name: 'ClickHouse', quadrant: 'ADOPT', category: 'Analytics DB', stars: '+2.8k/wk', desc: 'Columnar database executing real-time analytical queries on billions of rows.' },
    { name: 'Bun 1.2', quadrant: 'TRIAL', category: 'Runtime', stars: '+3.1k/wk', desc: 'Ultra-fast JavaScript/TypeScript runtime with native PostgreSQL driver.' },
    { name: 'Cursor / Claude 3.5', quadrant: 'ADOPT', category: 'Agentic IDE', stars: 'Trending', desc: 'The leading AI pair-programmer accelerating fullstack engineering velocity.' },
    { name: 'LanceDB', quadrant: 'ASSESS', category: 'Vector DB', stars: '+1.4k/wk', desc: 'Serverless vector database built on Apache Arrow for multimodal RAG.' },
    { name: 'Turborepo', quadrant: 'ADOPT', category: 'Build System', stars: '+1.9k/wk', desc: 'High-performance monorepo build system for TypeScript/JavaScript.' }
  ]

  const filtered = activeQuadrant === 'ALL' ? tools : tools.filter(t => t.quadrant === activeQuadrant)

  return (
    <div className={styles.container}>
      <div className={styles.featureHeader}>
        <div className={styles.featureHeaderTitle}>
          <span>📡 Tool Radar: Live Tech Sensor</span>
        </div>
        <span className={styles.featureHeaderBadge}>14 Tools Tracked</span>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {['ALL', 'ADOPT', 'TRIAL', 'ASSESS'].map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setActiveQuadrant(q)}
            className={`${styles.editorTab} ${activeQuadrant === q ? styles.editorTabActive : ''}`}
            style={{ padding: '6px 14px' }}
          >
            {q}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        {filtered.map((tool, idx) => (
          <div key={idx} className={styles.blueprintCard} style={{ padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '13px', color: '#ffffff' }}>{tool.name}</strong>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: tool.quadrant === 'ADOPT' ? 'rgba(0,255,136,0.15)' : tool.quadrant === 'TRIAL' ? 'rgba(0,240,255,0.15)' : 'rgba(251,191,36,0.15)',
                  color: tool.quadrant === 'ADOPT' ? '#00ff88' : tool.quadrant === 'TRIAL' ? '#00f0ff' : '#fbbf24'
                }}
              >
                {tool.quadrant}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>{tool.category} · {tool.stars}</div>
            <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.4 }}>{tool.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 3. REAL-WORLD SCENARIO (Architecture Retrospectives)
export function RealWorldScenarioView({ module, onComplete }) {
  const [selectedCase, setSelectedCase] = useState('stripe')

  const cases = {
    stripe: {
      company: 'Stripe',
      title: 'The 99.999% Idempotent Distributed Ledger',
      bottleneck: 'At millions of API requests per minute, transient network drops caused clients to retry HTTP POST /v1/charges, creating high risk of double-charging customers.',
      solution: 'Stripe implemented deterministic Idempotency Keys cached in a distributed Redis cluster with atomic lease locks. If a retry arrives with an identical idempotency key while the transaction is processing, it yields to the lease; if finished, it serves the cached response payload verbatim.',
      takeaway: 'In system design interviews, always mention idempotency keys + atomic cache leases whenever designing payment gateways or order placement endpoints.'
    },
    uber: {
      company: 'Uber',
      title: 'Dispatch Engine: Migrating from Monolith to Geohash Ring',
      bottleneck: 'Uber original dispatch ran on a single Python monolith database. As concurrent rider requests scaled, geospatial queries (searching nearest available drivers) locked relational DB tables.',
      solution: 'Uber partitioned the entire world into H3 hexagonal / Geohash spatial indexes, distributing driver locations across a decentralized Ringpop hash-ring cluster with in-memory location updates.',
      takeaway: 'Spatial proximity queries at scale require discrete geohashing (H3/S2) to shard writes into localized geographic buckets rather than scanning global lat/lng coordinates.'
    }
  }

  const active = cases[selectedCase]

  return (
    <div className={styles.container}>
      <div className={styles.featureHeader}>
        <div className={styles.featureHeaderTitle}>
          <span>🏛️ Architecture Retrospective: {active.company}</span>
        </div>
        <span className={styles.featureHeaderBadge}>Staff Case Study</span>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={() => setSelectedCase('stripe')}
          className={`${styles.editorTab} ${selectedCase === 'stripe' ? styles.editorTabActive : ''}`}
          style={{ padding: '6px 14px' }}
        >
          Stripe: Idempotent Ledger
        </button>
        <button
          type="button"
          onClick={() => setSelectedCase('uber')}
          className={`${styles.editorTab} ${selectedCase === 'uber' ? styles.editorTabActive : ''}`}
          style={{ padding: '6px 14px' }}
        >
          Uber: Geohash Dispatch
        </button>
      </div>

      <div className={styles.blueprintCard}>
        <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff' }}>{active.title}</h4>

        <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
          <strong style={{ color: '#ef4444' }}>The Scaling Bottleneck: </strong>{active.bottleneck}
        </div>

        <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, background: 'rgba(0,0,0,0.4)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <strong style={{ color: '#00ff88' }}>The Winning Architecture: </strong>
          <p style={{ margin: '4px 0 0' }}>{active.solution}</p>
        </div>

        <div style={{ fontSize: '12.5px', color: '#fbbf24', lineHeight: 1.5 }}>
          <strong>Interview Takeaway: </strong>{active.takeaway}
        </div>
      </div>
    </div>
  )
}
