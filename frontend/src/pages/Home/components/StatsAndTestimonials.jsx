import React from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Terminal, Award, Lock, Cpu, Database, CheckCircle2 } from 'lucide-react'

export default function StatsAndTestimonials() {
  const pillars = [
    {
      title: 'Academic Faculty Quality',
      desc: 'Quizzes and assessment sets authored and reviewed by verified university educators with institutional credentials.',
      icon: Award,
      badge: 'VERIFIED CONTENT'
    },
    {
      title: 'Sandboxed Code Arena',
      desc: 'Multi-language code execution engine testing syntax, performance, and edge cases in isolated environments.',
      icon: Terminal,
      badge: 'LIVE RUNTIME'
    },
    {
      title: 'Zero-Trust Data Privacy',
      desc: 'Strict candidate data protection. Your resumes, code submissions, and profiles are never resold or shared with third parties.',
      icon: Lock,
      badge: 'DATA PROTECTION'
    },
    {
      title: 'Direct ATS Integration',
      desc: 'Deterministic keyword, section, and semantic match scoring calibrated against actual job requirements.',
      icon: ShieldCheck,
      badge: 'REAL ATS METRICS'
    }
  ]

  return (
    <section
      id="stats"
      style={{
        backgroundColor: '#F7F1E7',
        color: '#161616',
        padding: '70px 28px 80px',
        position: 'relative'
      }}
    >
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto'
        }}
      >
        {/* Eyebrow & Headline */}
        <div style={{ marginBottom: '32px' }}>
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#B9633F',
              marginBottom: '10px'
            }}
          >
            ENGINEERED FOR ACCURACY · ZERO FABRICATION
          </div>

          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(2.2rem, 3.2vw, 3.1rem)',
              lineHeight: 1.15,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: 0,
              color: '#161616'
            }}
          >
            Verifiable Skills. Real Production Standards.
          </h2>
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '1rem',
              color: '#655E57',
              marginTop: '10px',
              maxWidth: '680px',
              lineHeight: 1.55
            }}
          >
            REXION replaces inflated marketing metrics with verifiable engineering standards.
            Every score, quiz, and candidate evaluation is backed by transparent, deterministic evaluation models.
          </p>
        </div>

        {/* ── Main Row: 4 Architecture Pillar Cards (Left) + Transparency Box (Right) ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
            gap: '24px',
            alignItems: 'stretch'
          }}
          className="rexion-trust-composite-grid"
        >
          {/* 4 Pillar Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px'
            }}
            className="rexion-stats-four-grid"
          >
            {pillars.map((p, i) => {
              const Icon = p.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #ECE3D7',
                    borderRadius: '18px',
                    padding: '24px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 16px rgba(160, 130, 100, 0.04)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          backgroundColor: '#FFEDE5',
                          color: '#E97852',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Icon size={20} strokeWidth={2.2} />
                      </div>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          letterSpacing: '0.06em',
                          color: '#B9633F',
                          backgroundColor: '#FAF5EE',
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        {p.badge}
                      </span>
                    </div>

                    <h3
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        color: '#161616',
                        margin: '0 0 8px',
                        lineHeight: 1.3
                      }}
                    >
                      {p.title}
                    </h3>

                    <p
                      style={{
                        fontSize: '0.84rem',
                        color: '#655E57',
                        lineHeight: 1.5,
                        margin: 0
                      }}
                    >
                      {p.desc}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Architecture Transparency Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #ECE3D7',
              borderRadius: '20px',
              padding: '26px 28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 6px 20px rgba(160, 130, 100, 0.05)',
              position: 'relative'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Cpu size={18} color="#E97852" />
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#B9633F', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Platform Integrity
                </span>
              </div>

              <h3
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: '#161616',
                  margin: '0 0 12px'
                }}
              >
                No Fabricated Metrics. Just Clean Code.
              </h3>

              <p
                style={{
                  fontSize: '0.86rem',
                  color: '#655E57',
                  lineHeight: 1.55,
                  margin: '0 0 20px'
                }}
              >
                At REXION, we believe career platforms should practice the engineering honesty they preach.
                We do not display simulated reviews or paid endorsements. Our features speak for themselves.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.84rem', color: '#161616' }}>
                  <CheckCircle2 size={16} color="#16A34A" />
                  <span><strong>Role-Based Access Control</strong> (Admin, Faculty, Developer, Student)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.84rem', color: '#161616' }}>
                  <CheckCircle2 size={16} color="#16A34A" />
                  <span><strong>Authenticated Server Sessions</strong> with secure cryptographic tokens</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.84rem', color: '#161616' }}>
                  <CheckCircle2 size={16} color="#16A34A" />
                  <span><strong>Deterministic Evaluation</strong> without artificial rating inflation</span>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 24,
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: '#FAF7F2',
                border: '1px solid #ECE3D7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Database size={15} color="#E97852" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#161616' }}>Production Data Architecture</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 700 }}>
                ● 100% Verified
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1080px) {
          .rexion-trust-composite-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 768px) {
          .rexion-stats-four-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
