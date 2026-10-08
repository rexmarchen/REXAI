import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Briefcase,
  Layers,
  Compass,
  Zap,
  TrendingUp,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Flame,
  Award,
  Sparkles
} from 'lucide-react'

export default function DashboardShowcase() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <section
      id="showcase"
      style={{
        backgroundColor: '#090B0A',
        color: '#F7F4EE',
        padding: '120px 24px 140px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background glow and subtle mesh */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(233, 120, 82, 0.14) 0%, rgba(200, 137, 91, 0.05) 50%, transparent 70%)',
          filter: 'blur(90px)',
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          textAlign: 'center',
          marginBottom: '54px'
        }}
      >
        <div
          style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#E97852',
            marginBottom: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Sparkles size={14} /> LIVE COMMAND CENTER
        </div>

        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(2.4rem, 4.4vw, 3.8rem)',
            lineHeight: 1.1,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            margin: '0 0 16px',
            color: '#F7F4EE'
          }}
        >
          Your Complete Career Workspace
        </h2>

        <p
          style={{
            fontSize: '1.05rem',
            lineHeight: 1.68,
            color: 'rgba(247, 244, 238, 0.72)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            maxWidth: '620px',
            margin: '0 auto 28px'
          }}
        >
          Seamlessly navigate between ATS score diagnostics, live job applications, skill testing, and autonomous recruiter outreach.
        </p>

        {/* Tab Switcher Pills */}
        <div
          style={{
            display: 'inline-flex',
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '6px',
            borderRadius: '999px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            gap: '4px'
          }}
        >
          {[
            { id: 'overview', label: 'All-in-One Hub', icon: Layers },
            { id: 'resume', label: 'Resume ATS Engine', icon: FileText, route: '/resume-analyser' },
            { id: 'jobs', label: 'Live Jobs Radar', icon: Briefcase, route: '/internships' },
            { id: 'career', label: 'Skill Graph & Arena', icon: Compass, route: '/career' }
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  if (tab.route) navigate(tab.route)
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  borderRadius: '999px',
                  background: isActive ? '#E97852' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'rgba(247, 244, 238, 0.75)',
                  border: 'none',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Floating Realistic Dashboard Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 50 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{
          maxWidth: '1160px',
          margin: '0 auto',
          background: '#0D1110',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '26px',
          boxShadow: '0 32px 90px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(233, 120, 82, 0.12)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Mock Window Top Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#EF4444' }} />
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#F59E0B' }} />
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#10B981' }} />
            <span style={{ marginLeft: '12px', fontSize: '0.78rem', color: 'rgba(247, 244, 238, 0.5)', fontFamily: 'monospace' }}>
              app.rexion.ai/workspace · Candidate Command Center
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                color: '#4F8C72',
                background: 'rgba(79, 140, 114, 0.15)',
                padding: '4px 10px',
                borderRadius: '999px',
                fontWeight: 600
              }}
            >
              ● System Online
            </span>
          </div>
        </div>

        {/* Dashboard Grid Content */}
        <div
          style={{
            padding: '28px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}
        >
          {/* Card 1: Resume Score & Diagnostic */}
          <div
            onClick={() => navigate('/resume-analyser')}
            style={{
              background: '#121715',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '22px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.76rem', color: 'rgba(247, 244, 238, 0.55)', fontWeight: 600 }}>ATS RESUME AUDIT</span>
                <span style={{ fontSize: '0.72rem', color: '#4F8C72', fontWeight: 700 }}>+14% this week</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '2.4rem', fontWeight: 800, color: '#F7F4EE' }}>92</span>
                <span style={{ fontSize: '1rem', color: 'rgba(247, 244, 238, 0.5)' }}>/ 100</span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'rgba(247, 244, 238, 0.7)', lineHeight: 1.5, margin: 0 }}>
                Strong technical alignment with Tier-1 AI roles. Recommended: expand distributed systems keywords.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', color: '#E97852', fontSize: '0.82rem', fontWeight: 600 }}>
              Open Audit →
            </div>
          </div>

          {/* Card 2: Live Job Matches */}
          <div
            onClick={() => navigate('/internships')}
            style={{
              background: '#121715',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '22px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.76rem', color: 'rgba(247, 244, 238, 0.55)', fontWeight: 600 }}>MATCHED OPPORTUNITIES</span>
                <span style={{ fontSize: '0.72rem', color: '#E97852', fontWeight: 700 }}>12 new today</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { role: 'AI Research Intern', comp: 'Mistral AI', stipend: '₹45k/mo', fit: '96%' },
                  { role: 'Full Stack Engineer', comp: 'Perplexity', stipend: '₹60k/mo', fit: '91%' }
                ].map((job, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F7F4EE' }}>{job.role}</div>
                      <div style={{ fontSize: '0.74rem', color: 'rgba(247, 244, 238, 0.55)' }}>{job.comp} • {job.stipend}</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4F8C72' }}>{job.fit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', color: '#E97852', fontSize: '0.82rem', fontWeight: 600 }}>
              View 24 Roles →
            </div>
          </div>

          {/* Card 3: Skill Verification & Arena */}
          <div
            onClick={() => navigate('/career')}
            style={{
              background: '#121715',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '22px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.76rem', color: 'rgba(247, 244, 238, 0.55)', fontWeight: 600 }}>SKILL RADAR</span>
                <span style={{ fontSize: '0.72rem', color: '#4F8C72', fontWeight: 700 }}>Rank #3 Contender</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { name: 'Python Basics', score: '100%', color: '#2E9362' },
                  { name: 'RAG Pipeline Embeddings', score: '85%', color: '#E97852' },
                  { name: 'Autonomous Agent Workflows', score: '78%', color: '#2F74DE' }
                ].map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: 'rgba(247, 244, 238, 0.8)' }}>{s.name}</span>
                    <span style={{ fontWeight: 700, color: s.color }}>{s.score}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', color: '#E97852', fontSize: '0.82rem', fontWeight: 600 }}>
              Launch Arena →
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
