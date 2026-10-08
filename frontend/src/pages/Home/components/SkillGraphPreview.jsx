import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import laptopMockupImg from '../../../assets/rexion_open_laptop_dashboard.jpg'

export default function SkillGraphPreview() {
  const navigate = useNavigate()

  return (
    <section
      id="skills"
      style={{
        backgroundColor: '#F7F1E7',
        color: '#161616',
        padding: '80px 28px 90px',
        position: 'relative',
        overflow: 'hidden'
      }}
      className="rexion-skills-preview-root"
    >
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 340px) minmax(0, 1fr)',
          gap: '40px',
          alignItems: 'center'
        }}
        className="rexion-skills-layout-grid"
      >
        {/* ── Left Column: Editorial Copy ── */}
        <div style={{ maxWidth: '340px' }}>
          {/* Eyebrow */}
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
            SKILL DEVELOPMENT
          </div>

          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(2.4rem, 3.2vw, 3.2rem)',
              lineHeight: 1.12,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              margin: '0 0 16px',
              color: '#161616'
            }}
          >
            Don't Just Learn.
            <br />
            Build Proof.
          </h2>

          <p
            style={{
              fontSize: '0.98rem',
              lineHeight: 1.62,
              color: '#6E675F',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              margin: '0 0 28px'
            }}
          >
            Track your progress, master in-demand skills and get AI-powered guidance to stay ahead in your career.
          </p>

          <button
            onClick={() => navigate('/career')}
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
              boxShadow: '0 8px 22px rgba(233, 120, 82, 0.35)',
              transition: 'transform 0.16s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(233, 120, 82, 0.45)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 22px rgba(233, 120, 82, 0.35)'
            }}
          >
            Explore Learning System <ArrowRight size={16} />
          </button>
        </div>

        {/* ── Right Column: Dual Showcase (Skill Graph Card + Open Laptop) ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1.35fr)',
            gap: '24px',
            alignItems: 'center'
          }}
          className="rexion-skills-showcase-grid"
        >
          {/* Card 1: Interactive Skill Graph Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '22px',
              border: '1px solid #ECE3D7',
              padding: '22px',
              boxShadow: '0 10px 30px rgba(160, 130, 100, 0.06)',
              position: 'relative'
            }}
          >
            <div
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#161616',
                marginBottom: '16px'
              }}
            >
              Skill Graph
            </div>

            {/* Interactive Graph Canvas */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '240px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* SVG Connecting Strands */}
              <svg
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none'
                }}
              >
                {/* Lines radiating from center (50%, 50%) */}
                <line x1="50%" y1="50%" x2="22%" y2="22%" stroke="#E2D7C8" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="50%" y1="50%" x2="78%" y2="24%" stroke="#E2D7C8" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="50%" y1="50%" x2="20%" y2="76%" stroke="#E2D7C8" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="50%" y1="50%" x2="52%" y2="82%" stroke="#E2D7C8" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="50%" y1="50%" x2="82%" y2="74%" stroke="#E2D7C8" strokeWidth="1.5" strokeDasharray="3 3" />
              </svg>

              {/* Central Primary Node: Python 82% */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 4,
                  backgroundColor: '#0F1318',
                  color: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '10px 14px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: '#1E2530',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem'
                  }}
                >
                  🐍
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, lineHeight: 1.1 }}>Python</div>
                  <div style={{ fontSize: '0.72rem', color: '#E97852', fontWeight: 800 }}>82%</div>
                </div>
              </motion.div>

              {/* Node 1: Machine Learning 68% (Top-Left) */}
              <div
                style={{
                  position: 'absolute',
                  top: '12%',
                  left: '6%',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #ECE3D7',
                  borderRadius: '12px',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
                  zIndex: 3
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#E97852' }} />
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#161616' }}>Machine Learning</div>
                  <div style={{ fontSize: '0.62rem', color: '#756E66' }}>68%</div>
                </div>
              </div>

              {/* Node 2: SQL 54% (Top-Right) */}
              <div
                style={{
                  position: 'absolute',
                  top: '14%',
                  right: '6%',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #ECE3D7',
                  borderRadius: '12px',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
                  zIndex: 3
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3878E8' }} />
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#161616' }}>SQL</div>
                  <div style={{ fontSize: '0.62rem', color: '#756E66' }}>54%</div>
                </div>
              </div>

              {/* Node 3: RAG 36% (Bottom-Left) */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '12%',
                  left: '6%',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #ECE3D7',
                  borderRadius: '12px',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
                  zIndex: 3
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#E86339' }} />
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#161616' }}>RAG</div>
                  <div style={{ fontSize: '0.62rem', color: '#756E66' }}>36%</div>
                </div>
              </div>

              {/* Node 4: System Design 43% (Bottom-Center) */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '4%',
                  left: '42%',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #ECE3D7',
                  borderRadius: '12px',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
                  zIndex: 3
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6B7A99' }} />
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#161616' }}>System Design</div>
                  <div style={{ fontSize: '0.62rem', color: '#756E66' }}>43%</div>
                </div>
              </div>

              {/* Node 5: Agentic AI 22% (Bottom-Right) */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '14%',
                  right: '4%',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #ECE3D7',
                  borderRadius: '12px',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
                  zIndex: 3
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8B6BC6' }} />
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#161616' }}>Agentic AI</div>
                  <div style={{ fontSize: '0.62rem', color: '#756E66' }}>22%</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Open Laptop Device Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            style={{
              borderRadius: '22px',
              overflow: 'hidden',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.12)',
              position: 'relative'
            }}
          >
            <img
              src={laptopMockupImg}
              alt="REXION Platform Command Center"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: '22px'
              }}
            />
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .rexion-skills-layout-grid {
            grid-template-columns: 1fr !important;
            gap: 36px !important;
          }
          .rexion-skills-showcase-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
