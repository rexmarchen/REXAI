import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Users, Building, HeartHandshake, ChevronLeft, ChevronRight } from 'lucide-react'
import AnimatedCounter from './AnimatedCounter'

export default function StatsAndTestimonials() {
  const [currentIdx, setCurrentIdx] = useState(0)

  const stats = [
    { target: 10000, suffix: '+', decimals: 0, label: 'Active Students', icon: Users, iconColor: '#E97852', iconBg: '#FFEDE5' },
    { target: 500, suffix: '+', decimals: 0, label: 'Hiring Partners', icon: Building, iconColor: '#B9633F', iconBg: '#FFEDE5' },
    { target: 95, suffix: '%', decimals: 0, label: 'Career Support', icon: HeartHandshake, iconColor: '#E97852', iconBg: '#FFEDE5' },
    { target: 4.8, suffix: '/5', decimals: 1, label: 'User Rating', icon: Star, iconColor: '#E97852', iconBg: '#FFEDE5' }
  ]

  const testimonials = [
    {
      name: 'Priyanshu Sharma',
      role: 'B.Tech CSE – CGC University',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      quote: 'REXION helped me understand exactly what I needed to improve before applying.',
      stars: 5
    },
    {
      name: 'Aarav Patel',
      role: 'Software Engineer Intern',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      quote: 'The ATS analysis and automated application tracking saved me over 30 hours during hiring season.',
      stars: 5
    },
    {
      name: 'Sneha Roy',
      role: 'AI / ML Track – IIT Delhi',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      quote: 'The personalized career paths and real skill verification challenges gave me proof employers cared about.',
      stars: 5
    }
  ]

  const nextTestimonial = () => {
    setCurrentIdx((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIdx((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const activeT = testimonials[currentIdx]

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
            REAL PEOPLE. REAL PROGRESS.
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
            Trusted by 10,000+ Students
          </h2>
        </div>

        {/* ── Main Row: 4 Metric Cards (Left) + Testimonial Card with Arrows (Right) ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
            gap: '24px',
            alignItems: 'stretch'
          }}
          className="rexion-trust-composite-grid"
        >
          {/* 4 Stat Cards in a Single Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '14px'
            }}
            className="rexion-stats-four-grid"
          >
            {stats.map((st, i) => {
              const Icon = st.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.06 }}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #ECE3D7',
                    borderRadius: '18px',
                    padding: '20px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    boxShadow: '0 4px 16px rgba(160, 130, 100, 0.04)'
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
                      backgroundColor: st.iconBg,
                      color: st.iconColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px'
                    }}
                  >
                    <Icon size={18} strokeWidth={2.2} />
                  </div>

                  <div
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '1.45rem',
                      fontWeight: 800,
                      color: '#161616',
                      lineHeight: 1.1,
                      marginBottom: '4px'
                    }}
                  >
                    <AnimatedCounter
                      target={st.target}
                      suffix={st.suffix}
                      decimals={st.decimals}
                      duration={1600}
                    />
                  </div>

                  <div
                    style={{
                      fontSize: '0.76rem',
                      color: '#756E66',
                      fontWeight: 600,
                      lineHeight: 1.3
                    }}
                  >
                    {st.label}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Testimonial Card with Slider Controls */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #ECE3D7',
              borderRadius: '20px',
              padding: '22px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 6px 20px rgba(160, 130, 100, 0.05)',
              position: 'relative'
            }}
          >
            {/* Top Row: Slider Navigation Arrows */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}
            >
              <button
                onClick={prevTestimonial}
                aria-label="Previous testimonial"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: '1px solid #ECE3D7',
                  backgroundColor: '#FAF7F2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#161616',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ECE3D7')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FAF7F2')}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextTestimonial}
                aria-label="Next testimonial"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: '1px solid #ECE3D7',
                  backgroundColor: '#FAF7F2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#161616',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ECE3D7')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FAF7F2')}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
              >
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <img
                    src={activeT.avatar}
                    alt={activeT.name}
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0,
                      border: '2px solid #FFEDE5'
                    }}
                  />
                  <div>
                    <p
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: '0.88rem',
                        lineHeight: 1.5,
                        color: '#161616',
                        margin: '0 0 10px',
                        fontStyle: 'normal'
                      }}
                    >
                      "{activeT.quote}"
                    </p>
                    <div
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        color: '#161616'
                      }}
                    >
                      {activeT.name}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#756E66' }}>
                      {activeT.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Bottom Row: 5 Gold Stars */}
            <div style={{ display: 'flex', gap: '3px', color: '#E97852', justifyContent: 'flex-end', paddingTop: '4px' }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="#E97852" />
              ))}
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
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </section>
  )
}
