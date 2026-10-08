import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Play, Sparkles, Briefcase, Compass, FileCheck, Target } from 'lucide-react'
import sunsetHeroAsset from '../../../assets/rexion_sunset_future_hero.jpg'

export default function FinalCTA({ onOpenDemo }) {
  const navigate = useNavigate()

  return (
    <section
      id="cta"
      style={{
        position: 'relative',
        backgroundColor: '#090B0A',
        color: '#FFFFFF',
        padding: '95px 28px 105px',
        overflow: 'hidden'
      }}
      className="rexion-final-cta-root"
    >
      {/* ── Top Arched Curved Boundary from Cream Section Above ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          lineHeight: 0,
          zIndex: 12,
          pointerEvents: 'none'
        }}
      >
        <svg
          viewBox="0 0 1440 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '44px', display: 'block' }}
        >
          <path
            d="M 0,0 L 1440,0 L 1440,16 C 980,44 460,42 0,10 Z"
            fill="#F7F1E7"
          />
        </svg>
      </div>

      {/* ── Panoramic Sunset Mountain Backdrop ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${sunsetHeroAsset})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 35%',
          pointerEvents: 'none',
          opacity: 0.88
        }}
      />

      {/* Left-to-right readable contrast gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(9, 11, 10, 0.94) 0%, rgba(9, 11, 10, 0.84) 36%, rgba(9, 11, 10, 0.45) 65%, rgba(9, 11, 10, 0.20) 100%)',
          pointerEvents: 'none'
        }}
      />

      {/* Bottom fade to footer black */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '120px',
          background: 'linear-gradient(to bottom, transparent 0%, #090B0A 100%)',
          pointerEvents: 'none'
        }}
      />

      {/* ── Content Container ── */}
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 10,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.25fr)',
          gap: '40px',
          alignItems: 'center',
          minHeight: '360px'
        }}
        className="rexion-final-cta-grid"
      >
        {/* Left Column: Editorial Headline & Actions */}
        <div style={{ maxWidth: '480px' }}>
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
            YOUR FUTURE AWAITS
          </div>

          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(2.4rem, 4vw, 3.6rem)',
              lineHeight: 1.1,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              margin: '0 0 16px',
              color: '#FFFFFF'
            }}
          >
            Your Future
            <br />
            Starts Now.
          </h2>

          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.65,
              color: 'rgba(255, 255, 255, 0.78)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              margin: '0 0 32px'
            }}
          >
            Build in-demand skills, discover better opportunities and get personalized career guidance.
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => navigate('/register')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '13px 26px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #E97852, #D96D48)',
                color: '#FFFFFF',
                fontSize: '0.94rem',
                fontWeight: 700,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(233, 120, 82, 0.42)',
                transition: 'transform 0.16s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(233, 120, 82, 0.55)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(233, 120, 82, 0.42)'
              }}
            >
              Get Started — Free <ArrowRight size={16} />
            </button>

            <button
              onClick={onOpenDemo}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 22px',
                borderRadius: '999px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                color: '#FFFFFF',
                fontSize: '0.92rem',
                fontWeight: 600,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.14)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
            >
              <Play size={15} fill="#FFFFFF" style={{ marginLeft: '1px' }} />
              Watch Demo
            </button>
          </div>
        </div>

        {/* ── Right Column: Interactive Glowing Holographic Orbit Nodes ── */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '320px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          className="rexion-future-nodes-container"
        >
          {/* Glowing SVG Connectors */}
          <svg
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          >
            <path
              d="M 120,65 Q 240,110 320,160 T 480,180"
              stroke="rgba(233, 120, 82, 0.35)"
              strokeWidth="1.5"
              fill="none"
              strokeDasharray="4 4"
            />
            <path
              d="M 90,160 Q 210,190 280,240 T 440,240"
              stroke="rgba(233, 120, 82, 0.28)"
              strokeWidth="1.5"
              fill="none"
              strokeDasharray="4 4"
            />
          </svg>

          {/* Node 1: Skills (Top-Left) */}
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            onClick={() => navigate('/career')}
            style={{
              position: 'absolute',
              top: '15%',
              left: '12%',
              backgroundColor: 'rgba(18, 16, 14, 0.75)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(233, 120, 82, 0.45)',
              borderRadius: '999px',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(233, 120, 82, 0.25)',
              cursor: 'pointer'
            }}
          >
            <Target size={15} color="#E97852" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>Skills</span>
          </motion.div>

          {/* Node 2: Jobs (Mid-Left) */}
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            onClick={() => navigate('/internships')}
            style={{
              position: 'absolute',
              top: '46%',
              left: '8%',
              backgroundColor: 'rgba(18, 16, 14, 0.75)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(233, 120, 82, 0.45)',
              borderRadius: '999px',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(233, 120, 82, 0.25)',
              cursor: 'pointer'
            }}
          >
            <Briefcase size={15} color="#E97852" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>Jobs</span>
          </motion.div>

          {/* Node 3: Applications (Bottom-Center) */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            onClick={() => navigate('/connections')}
            style={{
              position: 'absolute',
              bottom: '16%',
              left: '32%',
              backgroundColor: 'rgba(18, 16, 14, 0.75)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(233, 120, 82, 0.45)',
              borderRadius: '999px',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(233, 120, 82, 0.25)',
              cursor: 'pointer'
            }}
          >
            <FileCheck size={15} color="#E97852" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>Applications</span>
          </motion.div>

          {/* Node 4: Jobs (Mid-Right) */}
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
            onClick={() => navigate('/internships')}
            style={{
              position: 'absolute',
              top: '42%',
              right: '26%',
              backgroundColor: 'rgba(18, 16, 14, 0.75)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(233, 120, 82, 0.45)',
              borderRadius: '999px',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(233, 120, 82, 0.25)',
              cursor: 'pointer'
            }}
          >
            <Briefcase size={15} color="#E97852" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>Jobs</span>
          </motion.div>

          {/* Node 5: Career Path (Bottom-Right) */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
            onClick={() => navigate('/skill-graph')}
            style={{
              position: 'absolute',
              bottom: '18%',
              right: '6%',
              backgroundColor: 'rgba(18, 16, 14, 0.75)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(233, 120, 82, 0.45)',
              borderRadius: '999px',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(233, 120, 82, 0.25)',
              cursor: 'pointer'
            }}
          >
            <Compass size={15} color="#E97852" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>Career Path</span>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .rexion-final-cta-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .rexion-future-nodes-container {
            display: none !important;
          }
        }
      `}</style>
    </section>
  )
}
