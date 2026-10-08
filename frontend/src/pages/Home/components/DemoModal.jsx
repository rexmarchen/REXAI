import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function DemoModal({ isOpen, onClose }) {
  const navigate = useNavigate()

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: 'rgba(5, 7, 6, 0.82)',
          backdropFilter: 'blur(16px)'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '820px',
            backgroundColor: '#0F1312',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            boxShadow: '0 32px 80px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(233, 120, 82, 0.15)',
            overflow: 'hidden',
            color: '#F7F4EE'
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 28px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #E97852, #D96D48)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}
              >
                <Play size={16} fill="#fff" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  REXION Interactive Platform Tour
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'rgba(247, 244, 238, 0.6)' }}>
                  See how REXION transforms your career workflow in 2 minutes
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                color: '#F7F4EE',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              aria-label="Close demo"
            >
              <X size={18} />
            </button>
          </div>

          {/* Video / Interactive Simulation Screen */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16/9',
              background: '#070908',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px',
              textAlign: 'center',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              overflow: 'hidden'
            }}
          >
            {/* Background ambient glow */}
            <div
              style={{
                position: 'absolute',
                width: '400px',
                height: '250px',
                background: 'radial-gradient(circle, rgba(233, 120, 82, 0.22) 0%, transparent 70%)',
                filter: 'blur(50px)',
                pointerEvents: 'none'
              }}
            />

            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ repeat: Infinity, repeatType: 'reverse', duration: 3 }}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #E97852, #D96D48)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '18px',
                boxShadow: '0 0 35px rgba(233, 120, 82, 0.55)',
                cursor: 'pointer'
              }}
              onClick={() => {
                onClose()
                navigate('/career')
              }}
            >
              <Play size={26} fill="#fff" color="#fff" style={{ marginLeft: '4px' }} />
            </motion.div>

            <h4
              style={{
                fontSize: '1.45rem',
                margin: '0 0 10px',
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 600
              }}
            >
              Experience the Full AI Career Suite
            </h4>
            <p
              style={{
                maxWidth: '480px',
                fontSize: '0.92rem',
                color: 'rgba(247, 244, 238, 0.72)',
                lineHeight: 1.6,
                margin: '0 0 24px'
              }}
            >
              Watch automated resume ATS scoring, dynamic skill graph verification, real job matching, and 1-click recruiter applications in action.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  onClose()
                  navigate('/resume-analyser')
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#F7F4EE',
                  cursor: 'pointer'
                }}
              >
                1. Resume Analyzer
              </button>
              <button
                onClick={() => {
                  onClose()
                  navigate('/internships')
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#F7F4EE',
                  cursor: 'pointer'
                }}
              >
                2. Live Job Match
              </button>
              <button
                onClick={() => {
                  onClose()
                  navigate('/career')
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#F7F4EE',
                  cursor: 'pointer'
                }}
              >
                3. Career Hub & Challenges
              </button>
            </div>
          </div>

          {/* Footer CTA */}
          <div
            style={{
              padding: '20px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#0D1110',
              flexWrap: 'wrap',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.84rem', color: 'rgba(247, 244, 238, 0.75)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={15} color="#4F8C72" /> Free account
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={15} color="#4F8C72" /> No credit card needed
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={15} color="#4F8C72" /> 10,000+ active students
              </span>
            </div>

            <button
              onClick={() => {
                onClose()
                navigate('/register')
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 22px',
                background: 'linear-gradient(135deg, #E97852, #D96D48)',
                color: '#fff',
                border: 'none',
                borderRadius: '999px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(233, 120, 82, 0.35)'
              }}
            >
              Start Free Journey <ArrowRight size={15} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
