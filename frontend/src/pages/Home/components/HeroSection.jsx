import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Play,
  Target,
  Briefcase,
  BarChart3
} from 'lucide-react'
import heroPanoramicBg from '../../../assets/rexion_cream_hero_panoramic.jpg'

export default function HeroSection({ onOpenDemo }) {
  const navigate = useNavigate()
  const [gaugeLoaded, setGaugeLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setGaugeLoaded(true), 300)
    return () => clearTimeout(timer)
  }, [])

  const topSkills = [
    { name: 'Python', pct: 89 },
    { name: 'SQL', pct: 82 },
    { name: 'ML', pct: 48 },
    { name: 'System Design', pct: 31 }
  ]

  return (
    <section
      id="hero"
      style={{
        position: 'relative',
        backgroundColor: '#F7F2E9',
        color: '#171512',
        paddingTop: '96px',
        paddingBottom: '36px',
        minHeight: '720px',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden'
      }}
      className="rexion-hero-root"
    >
      {/* ── Background: Exact Clean Panoramic Scene from Original Mockup ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${heroPanoramicBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          pointerEvents: 'none'
        }}
      />

      {/* Main Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '0 28px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.15fr)',
          gap: '32px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 10
        }}
        className="rexion-hero-layout-grid"
      >
        {/* ── Left Column: Editorial Headline & Actions (Positioned on the clean cream canvas) ── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          style={{ maxWidth: '540px' }}
        >
          {/* Eyebrow Pill Badge: + YOUR AI CAREER COMPANION */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              border: '1px solid rgba(233, 120, 82, 0.35)',
              color: '#E97852',
              fontSize: '0.74rem',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '18px',
              boxShadow: '0 2px 10px rgba(233, 120, 82, 0.08)'
            }}
          >
            <span style={{ fontSize: '0.9rem', fontWeight: 900, lineHeight: 1 }}>+</span>
            YOUR AI CAREER COMPANION
          </div>

          {/* Large Editorial Headline */}
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(2.6rem, 4.4vw, 3.9rem)',
              lineHeight: 1.05,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              margin: '0 0 18px',
              color: '#161616'
            }}
          >
            <span>Build Skills.</span>
            <br />
            <span>Get Opportunities.</span>
            <br />
            <span
              style={{
                color: '#E97852',
                fontStyle: 'italic',
                fontWeight: 600
              }}
            >
              Shape Your Future.
            </span>
          </h1>

          {/* Supporting Paragraph */}
          <p
            style={{
              fontSize: 'clamp(0.95rem, 1.15vw, 1.02rem)',
              lineHeight: 1.62,
              color: '#5A554E',
              maxWidth: '500px',
              margin: '0 0 28px',
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}
          >
            REXION is your all-in-one AI career platform — analyze your resume, discover relevant jobs and internships, build in-demand skills, and move closer to your career goals.
          </p>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              marginBottom: '32px'
            }}
          >
            {/* Primary CTA Button: Coral Gradient */}
            <button
              onClick={() => navigate('/register')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '13px 26px',
                background: 'linear-gradient(135deg, #E97852 0%, #F28A63 100%)',
                color: '#FFFFFF',
                borderRadius: '999px',
                fontSize: '0.94rem',
                fontWeight: 700,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 10px 24px rgba(233, 120, 82, 0.38)',
                transition: 'transform 0.16s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 14px 30px rgba(233, 120, 82, 0.50)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 10px 24px rgba(233, 120, 82, 0.38)'
              }}
            >
              Start Your Journey <ArrowRight size={16} />
            </button>

            {/* Secondary CTA Button: Frosted Glass with Coral Circle */}
            <button
              onClick={onOpenDemo}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 22px',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: '#161616',
                borderRadius: '999px',
                fontSize: '0.92rem',
                fontWeight: 700,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                border: '1px solid rgba(228, 217, 204, 0.95)',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(40, 30, 20, 0.04)',
                transition: 'background-color 0.2s ease, border-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FFFFFF'
                e.currentTarget.style.borderColor = '#E97852'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.85)'
                e.currentTarget.style.borderColor = 'rgba(228, 217, 204, 0.95)'
              }}
            >
              <span
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  border: '1.5px solid #E97852',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#E97852'
                }}
              >
                <Play size={10} fill="#E97852" />
              </span>
              Watch Demo
            </button>
          </div>

          {/* Bottom Social Proof */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {[
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80'
              ].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="Student member"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '2px solid #F7F2E9',
                    marginLeft: i === 0 ? 0 : '-10px',
                    objectFit: 'cover'
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#161616' }}>
                Join 10,000+ students
              </span>
              <span style={{ fontSize: '0.76rem', color: '#7A756D' }}>
                Building better careers with REXION
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Right Column: The 4 Floating Metric Cards Matching Exact Mockup Coordinates ── */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '460px'
          }}
          className="rexion-hero-metrics-container"
        >
          {/* ── Card 1: ATS Score (Dark Obsidian Glass, Upper Left of Window) ── */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            onClick={() => navigate('/resume-analyser')}
            style={{
              position: 'absolute',
              top: '12px',
              left: '0px',
              backgroundColor: 'rgba(18, 22, 20, 0.88)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35)',
              cursor: 'pointer',
              zIndex: 5
            }}
            whileHover={{ y: -3 }}
            className="rexion-card-ats"
          >
            {/* Circular Dial: 92% */}
            <div
              style={{
                position: 'relative',
                width: '42px',
                height: '42px',
                flexShrink: 0
              }}
            >
              <svg width="42" height="42" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="16" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="3" />
                <circle
                  cx="21"
                  cy="21"
                  r="16"
                  fill="none"
                  stroke="#E97852"
                  strokeWidth="3"
                  strokeDasharray="100.5"
                  strokeDashoffset={gaugeLoaded ? '8.0' : '100.5'}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: '#FFFFFF'
                }}
              >
                92%
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2 }}>
                ATS Score
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.65)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span>Resume Analysis</span>
                <span style={{ color: '#E97852' }}>→</span>
              </div>
            </div>
          </motion.div>

          {/* ── Card 2: Application Chance (Frosted White Glass, Upper Center) ── */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            onClick={() => navigate('/career')}
            style={{
              position: 'absolute',
              top: '8px',
              left: '210px',
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(228, 217, 204, 0.85)',
              borderRadius: '16px',
              padding: '12px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              boxShadow: '0 12px 30px rgba(40, 30, 20, 0.08)',
              cursor: 'pointer',
              zIndex: 5
            }}
            whileHover={{ y: -3 }}
            className="rexion-card-chance"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(233, 120, 82, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#E97852'
                }}
              >
                <Target size={11} color="#E97852" />
              </span>
              <span style={{ fontSize: '0.74rem', color: '#756E66', fontWeight: 600 }}>
                Application Chance
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#171512', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                78%
              </span>
              <span style={{ fontSize: '0.68rem', color: '#2F7E5B', fontWeight: 700, backgroundColor: 'rgba(47, 126, 91, 0.1)', padding: '1px 6px', borderRadius: '999px' }}>
                ↑ 12%
              </span>
            </div>

            <div style={{ fontSize: '0.7rem', color: '#756E66', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span>Strong Match</span>
              <span style={{ color: '#E97852' }}>→</span>
            </div>
          </motion.div>

          {/* ── Card 3: Live Jobs (Frosted White Glass, Upper Right) ── */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            onClick={() => navigate('/internships')}
            style={{
              position: 'absolute',
              top: '8px',
              right: '0px',
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(228, 217, 204, 0.85)',
              borderRadius: '16px',
              padding: '12px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              boxShadow: '0 12px 30px rgba(40, 30, 20, 0.08)',
              cursor: 'pointer',
              zIndex: 5
            }}
            whileHover={{ y: -3 }}
            className="rexion-card-jobs"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '5px',
                  backgroundColor: 'rgba(233, 120, 82, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#E97852'
                }}
              >
                <Briefcase size={11} color="#E97852" />
              </span>
              <span style={{ fontSize: '0.74rem', color: '#756E66', fontWeight: 600 }}>
                Live Jobs
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '2px', gap: '8px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#171512' }}>
                12 new today
              </span>
              <span style={{ color: '#E97852', fontSize: '0.84rem' }}>→</span>
            </div>
          </motion.div>

          {/* ── Card 4: Top Skills (Dark Obsidian Glass, Floating Mid-Right) ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            onClick={() => navigate('/skill-graph')}
            style={{
              position: 'absolute',
              top: '125px',
              right: '0px',
              backgroundColor: 'rgba(18, 22, 20, 0.88)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '18px',
              padding: '14px 18px',
              width: '210px',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
              cursor: 'pointer',
              zIndex: 5
            }}
            whileHover={{ y: -3 }}
            className="rexion-card-skills"
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <BarChart3 size={13} color="#E97852" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>
                Top Skills
              </span>
            </div>

            {/* Skills List with Thin Progress Lines */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topSkills.map((skill) => (
                <div key={skill.name}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.7rem',
                      marginBottom: '3px'
                    }}
                  >
                    <span style={{ color: 'rgba(255, 255, 255, 0.75)' }}>{skill.name}</span>
                    <span style={{ color: '#E97852', fontWeight: 700 }}>{skill.pct}%</span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '3.5px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: gaugeLoaded ? `${skill.pct}%` : '0%',
                        height: '100%',
                        backgroundColor: '#E97852',
                        borderRadius: '4px',
                        transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: '0 0 6px rgba(233, 120, 82, 0.6)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .rexion-hero-layout-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .rexion-hero-root {
            min-height: auto !important;
            padding-top: 90px !important;
            padding-bottom: 40px !important;
          }
          .rexion-hero-metrics-container {
            height: auto !important;
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 12px !important;
          }
          .rexion-card-ats,
          .rexion-card-chance,
          .rexion-card-jobs,
          .rexion-card-skills {
            position: static !important;
            width: auto !important;
          }
        }
      `}</style>
    </section>
  )
}
