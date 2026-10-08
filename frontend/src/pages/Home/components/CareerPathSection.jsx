import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Flame,
  Cpu,
  Shield,
  Network
} from 'lucide-react'
import mountainsAsset from '../../../assets/career_hero_mountains.jpg'

// Custom Clover AI Icon matching reference screenshot
function CloverAiIcon({ size = 22, color = '#E86339' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 4.2C13.65 4.2 15 5.55 15 7.2C15 8.85 13.65 10.2 12 10.2C10.35 10.2 9 8.85 9 7.2C9 5.55 10.35 4.2 12 4.2Z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M12 13.8C13.65 13.8 15 15.15 15 16.8C15 18.45 13.65 19.8 12 19.8C10.35 19.8 9 18.45 9 16.8C9 15.15 10.35 13.8 12 13.8Z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M4.2 12C4.2 10.35 5.55 9 7.2 9C8.85 9 10.2 10.35 10.2 12C10.2 13.65 8.85 15 7.2 15C5.55 15 4.2 13.65 4.2 12Z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M13.8 12C13.8 10.35 15.15 9 16.8 9C18.45 9 19.8 10.35 19.8 12C19.8 13.65 18.45 15 16.8 15C15.15 15 13.8 13.65 13.8 12Z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="1.6" fill={color} />
    </svg>
  )
}

// Custom Data Scientist Line Chart Icon matching screenshot
function DataScientistIcon({ size = 20, color = '#E86339' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 20h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M5 16l4-5 4 3 6-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="5" cy="16" r="1.5" fill={color} />
      <circle cx="9" cy="11" r="1.5" fill={color} />
      <circle cx="13" cy="14" r="1.5" fill={color} />
      <circle cx="19" cy="7" r="1.5" fill={color} />
    </svg>
  )
}

// Custom Full Stack Developer Code Icon matching screenshot
function FullStackIcon({ size = 20, color = '#E86339' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="m7 8-4 4 4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m17 8 4 4-4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m14 4-4 16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function CareerPathSection() {
  const navigate = useNavigate()
  const [activeIndex, setActiveIndex] = useState(1) // 1 = AI Engineer (default center)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef(null)

  const careerPaths = [
    {
      id: 'data-scientist',
      role: 'Data Scientist',
      desc: 'Turn data into insights and impact.',
      icon: DataScientistIcon,
      skills: ['Pandas', 'SQL'],
      xp: '+40 XP',
      route: '/career?role=Data+Scientist'
    },
    {
      id: 'ai-engineer',
      role: 'AI Engineer',
      desc: 'Build intelligent systems and shape the future with AI.',
      icon: CloverAiIcon,
      skills: ['Python', 'ML', 'LLMs', 'RAG'],
      xp: '+50 XP',
      popular: true,
      badge: 'Most Popular',
      route: '/career?role=AI+Engineer'
    },
    {
      id: 'fullstack-dev',
      role: 'Full Stack Developer',
      desc: 'Build complete web applications.',
      icon: FullStackIcon,
      skills: ['React', 'Node.js'],
      xp: '+45 XP',
      route: '/career?role=Full+Stack+Developer'
    },
    {
      id: 'agentic-ai',
      role: 'Agentic AI Engineer',
      desc: 'Orchestrate autonomous agent swarms and multi-step tool workflows.',
      icon: Network,
      skills: ['LangGraph', 'MCP', 'Vector DBs'],
      xp: '+60 XP',
      popular: true,
      badge: 'Trending',
      route: '/career?role=Agentic+AI+Engineer'
    },
    {
      id: 'ml-systems',
      role: 'ML Systems Engineer',
      desc: 'Deploy high-throughput inference engines and production PyTorch models.',
      icon: Cpu,
      skills: ['PyTorch', 'MLOps', 'CUDA'],
      xp: '+55 XP',
      route: '/career?role=ML+Engineer'
    },
    {
      id: 'security-engineer',
      role: 'Cybersecurity Analyst',
      desc: 'Secure cloud perimeters, audit vulnerabilities, and hunt automated threats.',
      icon: Shield,
      skills: ['SIEM', 'CloudSec', 'Linux'],
      xp: '+45 XP',
      route: '/career?role=Cybersecurity+Engineer'
    }
  ]

  // Gentle auto-rotation when user is not hovering
  useEffect(() => {
    if (isPaused) return

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % careerPaths.length)
    }, 4500)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused, careerPaths.length])

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : careerPaths.length - 1))
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % careerPaths.length)
  }

  // Get 3 visible cards positioned around activeIndex
  const getVisibleCards = () => {
    const total = careerPaths.length
    const leftIndex = (activeIndex - 1 + total) % total
    const centerIndex = activeIndex
    const rightIndex = (activeIndex + 1) % total

    return [
      { ...careerPaths[leftIndex], position: 'left', originalIndex: leftIndex },
      { ...careerPaths[centerIndex], position: 'center', originalIndex: centerIndex },
      { ...careerPaths[rightIndex], position: 'right', originalIndex: rightIndex }
    ]
  }

  const visibleCards = getVisibleCards()

  return (
    <section
      id="career-paths"
      style={{
        backgroundColor: '#090B0A',
        color: '#F7F4EE',
        padding: '85px 24px 95px',
        position: 'relative',
        overflow: 'hidden',
        marginTop: '-1px'
      }}
    >
      {/* ── Subtle Curved Boundary Mask (44px) ── */}
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

      {/* ── Mountain Scenic Panoramic Backdrop ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${mountainsAsset})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 38%',
          pointerEvents: 'none',
          opacity: 0.85
        }}
      />

      {/* Left-to-right contrast gradient overlay so text is 100% readable while mountains shine on right */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(9, 11, 10, 0.96) 0%, rgba(9, 11, 10, 0.90) 32%, rgba(9, 11, 10, 0.52) 62%, rgba(9, 11, 10, 0.18) 100%)',
          pointerEvents: 'none'
        }}
      />

      {/* Bottom gradient fade to solid dark ground */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, #090B0A 0%, rgba(9, 11, 10, 0.85) 15%, transparent 60%)',
          pointerEvents: 'none'
        }}
      />

      {/* Atmospheric sunset horizon amber glow on right */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          right: '5%',
          width: '720px',
          height: '400px',
          background: 'radial-gradient(ellipse at 75% 45%, rgba(232, 99, 57, 0.28) 0%, rgba(240, 126, 79, 0.09) 45%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none'
        }}
      />

      {/* Glowing Circular Pedestal Ring beneath the cards on the terrain matching screenshot */}
      <div
        style={{
          position: 'absolute',
          bottom: '55px',
          right: '8%',
          width: '660px',
          height: '200px',
          border: '1.5px solid rgba(232, 99, 57, 0.55)',
          borderRadius: '50%',
          boxShadow: '0 0 50px rgba(232, 99, 57, 0.38), inset 0 0 35px rgba(232, 99, 57, 0.22)',
          transform: 'perspective(600px) rotateX(72deg)',
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          maxWidth: '1420px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 0.32fr) minmax(0, 0.68fr)',
          gap: '40px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 15
        }}
        className="rexion-career-layout-grid"
      >
        {/* ── Left Column: Editorial Content & Navigation Controls ── */}
        <div style={{ maxWidth: '420px' }}>
          {/* Eyebrow with 2 dashes matching reference screenshot */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#E86339'
              }}
            >
              EXPLORE CAREER PATHS
            </span>
            <span style={{ width: '18px', height: '2px', backgroundColor: '#E86339', opacity: 0.8, borderRadius: '2px' }} />
            <span style={{ width: '12px', height: '2px', backgroundColor: '#E86339', opacity: 0.5, borderRadius: '2px' }} />
          </div>

          {/* Headline */}
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(2.4rem, 4vw, 3.6rem)',
              lineHeight: 1.12,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 18px',
              color: '#FFFFFF'
            }}
          >
            Find Your Dream
            <br />
            <span>Career Path</span>
          </h2>

          {/* Subtext */}
          <p
            style={{
              fontSize: '0.98rem',
              lineHeight: 1.65,
              color: 'rgba(247, 244, 238, 0.72)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              margin: '0 0 32px'
            }}
          >
            Not sure where to start? Choose from curated career paths based on your interests, skills and market demand.
          </p>

          {/* Explore Button */}
          <div style={{ marginBottom: '36px' }}>
            <button
              onClick={() => navigate('/career')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 26px',
                borderRadius: '999px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                color: '#FFFFFF',
                fontSize: '0.94rem',
                fontWeight: 600,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)'
              }}
            >
              Explore Career Paths <ArrowRight size={15} />
            </button>
          </div>

          {/* Avatar stack + 500+ career paths */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
                  alt="Student"
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    border: '2px solid #090B0A',
                    marginLeft: i === 0 ? 0 : '-10px',
                    objectFit: 'cover'
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>500+ career paths</span>
              <span style={{ fontSize: '0.76rem', color: 'rgba(247, 244, 238, 0.55)' }}>across different fields</span>
            </div>
          </div>
        </div>

        {/* ── Right Column: 3 Cards Pedestal Framed with Left and Right Circular Arrow Buttons ── */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            width: '100%'
          }}
        >
          {/* Left Navigation Arrow */}
          <button
            onClick={handlePrev}
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              backdropFilter: 'blur(8px)',
              transition: 'background 0.2s, border-color 0.2s',
              zIndex: 20
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)'
            }}
            aria-label="Previous career card"
          >
            <ChevronLeft size={20} />
          </button>

          {/* 3 Pedestal Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.25fr) minmax(0, 0.9fr)',
              gap: '16px',
              width: '100%',
              alignItems: 'center'
            }}
            className="rexion-pedestal-3cards-grid"
          >
            {visibleCards.map((card) => {
              const Icon = card.icon
              const isCenter = card.position === 'center'

              return (
                <motion.div
                  key={card.id}
                  layout
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => navigate(card.route)}
                  style={{
                    backgroundColor: isCenter ? 'rgba(20, 25, 23, 0.92)' : 'rgba(14, 18, 16, 0.8)',
                    backdropFilter: 'blur(14px)',
                    border: isCenter
                      ? '2px solid #E86339'
                      : '1px solid rgba(255, 255, 255, 0.09)',
                    borderRadius: isCenter ? '24px' : '22px',
                    padding: isCenter ? '32px 24px' : '26px 20px',
                    boxShadow: isCenter
                      ? '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 45px rgba(232, 99, 57, 0.5), inset 0 0 25px rgba(232, 99, 57, 0.15)'
                      : '0 16px 36px rgba(0, 0, 0, 0.45)',
                    transform: isCenter ? 'scale(1.05) translateY(-6px)' : 'scale(0.96)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: isCenter ? '355px' : '285px',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease'
                  }}
                >
                  {/* Card Content */}
                  <div>
                    {/* Top Row: Icon on left, "Most Popular" on right */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '16px'
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          backgroundColor: isCenter ? 'rgba(232, 99, 57, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                          border: isCenter ? '1px solid rgba(232, 99, 57, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                          color: '#E86339',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Icon size={20} color="#E86339" />
                      </div>

                      {/* "Most Popular" Pill Badge on Center Card */}
                      {isCenter && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 12px',
                            borderRadius: '999px',
                            background: 'linear-gradient(90deg, #E85B2F, #F17543)',
                            color: '#FFFFFF',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            letterSpacing: '0.03em',
                            boxShadow: '0 4px 14px rgba(232, 91, 47, 0.45)'
                          }}
                        >
                          <Flame size={12} fill="#FFFFFF" />
                          Most Popular
                        </div>
                      )}
                    </div>

                    {/* Role Title */}
                    <h3
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: isCenter ? '1.32rem' : '1.1rem',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        margin: '0 0 8px'
                      }}
                    >
                      {card.role}
                    </h3>

                    {/* Description */}
                    <p
                      style={{
                        fontSize: '0.84rem',
                        lineHeight: 1.55,
                        color: 'rgba(247, 244, 238, 0.68)',
                        margin: '0 0 18px'
                      }}
                    >
                      {card.desc}
                    </p>

                    {/* Skill Tags */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '22px' }}>
                      {card.skills.map((s) => (
                        <span
                          key={s}
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            padding: '4px 12px',
                            borderRadius: '999px',
                            backgroundColor: isCenter ? 'rgba(255, 255, 255, 0.09)' : 'rgba(255, 255, 255, 0.06)',
                            color: 'rgba(247, 244, 238, 0.92)',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Bottom: XP + Circular Arrow Button (Featured card only) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '6px'
                    }}
                  >
                    <span
                      style={{
                        fontSize: isCenter ? '1.22rem' : '0.94rem',
                        fontWeight: 800,
                        color: isCenter ? '#E86339' : 'rgba(247, 244, 238, 0.72)',
                        letterSpacing: '-0.01em'
                      }}
                    >
                      {card.xp}
                    </span>

                    {/* Action circle arrow button - only on center featured card */}
                    {isCenter && (
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #E86339, #F07E4F)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.84rem',
                          boxShadow: '0 6px 18px rgba(232, 99, 57, 0.55)',
                          transition: 'transform 0.2s ease'
                        }}
                      >
                        <ArrowRight size={17} />
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Right Navigation Arrow */}
          <button
            onClick={handleNext}
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              backdropFilter: 'blur(8px)',
              transition: 'background 0.2s, border-color 0.2s',
              zIndex: 20
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)'
            }}
            aria-label="Next career card"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* ── Bottom Arched Curved Mask Transitioning into Cream Skill Section ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
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
            d="M 0,44 L 1440,44 L 1440,28 C 980,0 460,0 0,28 Z"
            fill="#F7F1E7"
          />
        </svg>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .rexion-career-layout-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .rexion-pedestal-3cards-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
