import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Briefcase,
  GraduationCap,
  Send,
  Compass,
  Bot,
  ArrowRight
} from 'lucide-react'

export default function FeatureSection() {
  const navigate = useNavigate()

  const features = [
    {
      id: 'resume-analysis',
      title: 'Resume Analysis',
      desc: 'Get ATS score, skill gaps and career recommendations.',
      icon: FileText,
      iconBg: '#FFEDE5',
      iconColor: '#E97852',
      route: '/resume-analyser'
    },
    {
      id: 'job-matching',
      title: 'Live Job Matching',
      desc: 'Find relevant jobs & internships with direct apply links.',
      icon: Briefcase,
      iconBg: '#FFEDE5',
      iconColor: '#E97852',
      route: '/internships'
    },
    {
      id: 'skill-dev',
      title: 'Skill Development',
      desc: 'Learn, practice and track progress with AI-powered guidance.',
      icon: GraduationCap,
      iconBg: '#ECE8F9',
      iconColor: '#7964CC',
      route: '/career'
    },
    {
      id: 'app-auto',
      title: 'Application Automation',
      desc: 'Save time with 1-click applications and outreach tools.',
      icon: Send,
      iconBg: '#FDEAE9',
      iconColor: '#E85F52',
      route: '/connections'
    },
    {
      id: 'career-guidance',
      title: 'Career Guidance',
      desc: 'Personalized career paths for your goals.',
      icon: Compass,
      iconBg: '#E7F2EB',
      iconColor: '#3B8E67',
      route: '/skill-graph'
    },
    {
      id: 'ai-assistant',
      title: 'AI Assistant',
      desc: 'Get instant help with your career journey.',
      icon: Bot,
      iconBg: '#FFEDE5',
      iconColor: '#E97852',
      route: '/ai-tutor'
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
    }
  }

  return (
    <section
      id="features"
      style={{
        backgroundColor: '#F7F1E7',
        color: '#161616',
        padding: '76px 28px 84px',
        position: 'relative',
        overflow: 'hidden'
      }}
      className="rexion-why-rexion-root"
    >
      {/* ── Faint Pine Trees & Mountain Ridge Silhouette Illustration (Matches Bottom-Left Mockup) ── */}
      <svg
        viewBox="0 0 460 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '420px',
          height: '200px',
          pointerEvents: 'none',
          opacity: 0.28,
          zIndex: 1
        }}
      >
        {/* Soft Background Distant Mountain Contours */}
        <path
          d="M 0,140 Q 80,105 160,130 T 320,120 Q 400,145 460,170 L 460,220 L 0,220 Z"
          fill="#C4B6A3"
          opacity="0.4"
        />
        <path
          d="M 0,165 Q 110,130 220,158 Q 330,148 460,190 L 460,220 L 0,220 Z"
          fill="#B6A794"
          opacity="0.55"
        />
        {/* Layered Pine Trees on the Left */}
        {/* Tree 1 (Tall, Far Left) */}
        <path
          d="M 24,105 L 31,124 L 27,124 L 35,148 L 30,148 L 38,178 L 26,178 L 26,196 L 22,196 L 22,178 L 10,178 L 18,148 L 13,148 L 21,124 L 17,124 Z"
          fill="#8F806E"
          opacity="0.75"
        />
        {/* Tree 2 */}
        <path
          d="M 48,120 L 54,136 L 51,136 L 58,158 L 54,158 L 61,186 L 50,186 L 50,202 L 46,202 L 46,186 L 35,186 L 42,158 L 38,158 L 45,136 L 42,136 Z"
          fill="#8F806E"
          opacity="0.7"
        />
        {/* Tree 3 */}
        <path
          d="M 74,135 L 79,148 L 76,148 L 82,168 L 79,168 L 85,194 L 76,194 L 76,208 L 72,208 L 72,194 L 63,194 L 69,168 L 66,168 L 72,148 L 69,148 Z"
          fill="#8F806E"
          opacity="0.6"
        />
        {/* Tree 4 */}
        <path
          d="M 102,152 L 106,163 L 104,163 L 109,180 L 106,180 L 112,200 L 104,200 L 104,212 L 100,212 L 100,200 L 92,200 L 98,180 L 95,180 L 100,163 L 98,163 Z"
          fill="#8F806E"
          opacity="0.5"
        />
        {/* Tree 5 (Small) */}
        <path
          d="M 128,168 L 131,176 L 129,176 L 134,190 L 131,190 L 136,206 L 130,206 L 130,215 L 126,215 L 126,206 L 120,206 L 125,190 L 122,190 L 126,176 L 124,176 Z"
          fill="#8F806E"
          opacity="0.4"
        />
      </svg>

      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 340px) minmax(0, 1fr)',
          gap: '36px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2
        }}
        className="rexion-features-layout-grid"
      >
        {/* ── Left Column: Eyebrow, Headline, Paragraph, Explore Link ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          {/* Eyebrow: WHY REXION — */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '14px'
            }}
          >
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#E97852'
              }}
            >
              WHY REXION
            </span>
            <span style={{ width: '18px', height: '2px', backgroundColor: '#E97852', opacity: 0.85, borderRadius: '2px' }} />
            <span style={{ width: '12px', height: '2px', backgroundColor: '#E97852', opacity: 0.5, borderRadius: '2px' }} />
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
            Everything You Need.
            <br />
            In One Place.
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
            From resume analysis to career growth, REXION gives you the tools, guidance and opportunities to move forward.
          </p>

          <a
            href="#career-paths"
            onClick={(e) => {
              e.preventDefault()
              const el = document.querySelector('#career-paths')
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#E97852',
              fontWeight: 700,
              fontSize: '0.96rem',
              textDecoration: 'none',
              cursor: 'pointer',
              width: 'fit-content',
              transition: 'gap 0.2s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.gap = '12px')}
            onMouseLeave={(e) => (e.currentTarget.style.gap = '8px')}
          >
            Explore All Features <ArrowRight size={16} />
          </a>
        </div>

        {/* ── Right Column: Exact 3 × 2 Feature Grid (Matches Original Mockup) ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px'
          }}
          className="rexion-features-3x2-grid"
        >
          {features.map((item) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.id}
                variants={cardVariants}
                whileHover={{
                  y: -3,
                  boxShadow: '0 10px 24px rgba(160, 130, 100, 0.09)',
                  borderColor: 'rgba(233, 120, 82, 0.35)'
                }}
                transition={{ duration: 0.2 }}
                onClick={() => navigate(item.route)}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #ECE3D7',
                  borderRadius: '18px',
                  padding: '18px 18px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: '14px',
                  minHeight: '106px',
                  boxShadow: '0 3px 14px rgba(160, 130, 100, 0.04)',
                  transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s'
                }}
              >
                {/* Left Side: Soft Pastel Rounded Icon Badge */}
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    minWidth: '42px',
                    minHeight: '42px',
                    borderRadius: '12px',
                    backgroundColor: item.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Icon size={20} color={item.iconColor} strokeWidth={2.2} />
                </div>

                {/* Right Side: Title & Description */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '0.98rem',
                      fontWeight: 700,
                      margin: 0,
                      color: '#161616',
                      lineHeight: 1.25
                    }}
                  >
                    {item.title}
                  </h3>

                  <p
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '0.80rem',
                      lineHeight: 1.42,
                      color: '#756E66',
                      margin: 0
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 1140px) {
          .rexion-features-layout-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .rexion-features-3x2-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .rexion-features-3x2-grid {
            grid-template-columns: 1fr !important;
          }
          .rexion-why-rexion-root {
            padding: 56px 20px 64px !important;
          }
        }
      `}</style>
    </section>
  )
}
