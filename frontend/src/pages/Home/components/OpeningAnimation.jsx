import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function OpeningAnimation({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [statusIndex, setStatusIndex] = useState(0)
  const [isExiting, setIsExiting] = useState(false)

  const statusMessages = [
    'Initializing AI career neural network...',
    'Calibrating ATS analysis engine...',
    'Syncing live industry internships & tracks...',
    'Welcome to REXION.'
  ]

  useEffect(() => {
    // Smooth progress counter from 0 to 100 over ~1.6s
    const startTime = performance.now()
    const duration = 1600

    let animationFrame = null

    const update = (now) => {
      const elapsed = now - startTime
      const p = Math.min(elapsed / duration, 1)

      // Quintic ease out
      const eased = 1 - Math.pow(1 - p, 4)
      const currentVal = Math.floor(eased * 100)

      setProgress(currentVal)

      if (p < 0.3) {
        setStatusIndex(0)
      } else if (p < 0.6) {
        setStatusIndex(1)
      } else if (p < 0.9) {
        setStatusIndex(2)
      } else {
        setStatusIndex(3)
      }

      if (p < 1) {
        animationFrame = requestAnimationFrame(update)
      } else {
        // Pause briefly at 100% then trigger exit
        setTimeout(() => {
          setIsExiting(true)
          setTimeout(() => {
            if (onComplete) onComplete()
          }, 650)
        }, 250)
      }
    }

    animationFrame = requestAnimationFrame(update)

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame)
    }
  }, [onComplete])

  const handleSkip = () => {
    setIsExiting(true)
    setTimeout(() => {
      if (onComplete) onComplete()
    }, 300)
  }

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.04,
            filter: 'blur(10px)',
            transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] }
          }}
          onClick={handleSkip}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: '#070908',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            overflow: 'hidden'
          }}
        >
          {/* Ambient Cosmic Radial Glows */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '600px',
              height: '600px',
              background: 'radial-gradient(circle, rgba(233, 120, 82, 0.22) 0%, rgba(200, 137, 91, 0.08) 40%, transparent 70%)',
              filter: 'blur(80px)',
              pointerEvents: 'none'
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(79, 140, 114, 0.15) 0%, transparent 65%)',
              filter: 'blur(70px)',
              pointerEvents: 'none'
            }}
          />

          {/* Central Logo & Branding */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              zIndex: 10
            }}
          >
            {/* Animated Logo Mark */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #E97852, #D96D48)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 50px rgba(233, 120, 82, 0.6), 0 0 100px rgba(233, 120, 82, 0.2)',
                marginBottom: '22px',
                position: 'relative'
              }}
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 3h7a5 5 0 0 1 5 5 5 5 0 0 1-5 5H6V3zm0 10h6l5 8h-4.5L8 13.5V21H6V13z"
                  fill="#FFFFFF"
                />
              </svg>
            </motion.div>

            {/* Brand Title with smooth tracking animation */}
            <motion.div
              initial={{ opacity: 0, y: 12, letterSpacing: '0.25em' }}
              animate={{ opacity: 1, y: 0, letterSpacing: '0.12em' }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '2rem',
                fontWeight: 900,
                color: '#F7F4EE',
                textAlign: 'center',
                marginBottom: '6px'
              }}
            >
              REXION
            </motion.div>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.65 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{
                fontSize: '0.72rem',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                letterSpacing: '0.24em',
                fontWeight: 700,
                color: '#E97852',
                textTransform: 'uppercase',
                marginBottom: '42px'
              }}
            >
              AI CAREER PLATFORM
            </motion.div>

            {/* Progress Container */}
            <div
              style={{
                width: '280px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              {/* Progress Track */}
              <div
                style={{
                  width: '100%',
                  height: '3px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '999px',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                {/* Glowing Progress Fill */}
                <motion.div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #E97852, #F39E76, #4F8C72)',
                    boxShadow: '0 0 14px rgba(233, 120, 82, 0.9)',
                    borderRadius: '999px',
                    transition: 'width 0.05s linear'
                  }}
                />
              </div>

              {/* Progress Percentage & Status */}
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '0.74rem'
                }}
              >
                <motion.span
                  key={statusIndex}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ color: 'rgba(247, 244, 238, 0.6)', fontWeight: 500 }}
                >
                  {statusMessages[statusIndex]}
                </motion.span>

                <span style={{ color: '#E97852', fontWeight: 800, minWidth: '36px', textAlign: 'right' }}>
                  {progress}%
                </span>
              </div>
            </div>
          </div>

          {/* Skip hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 0.8 }}
            style={{
              position: 'absolute',
              bottom: '36px',
              fontSize: '0.74rem',
              color: 'rgba(247, 244, 238, 0.4)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              letterSpacing: '0.08em'
            }}
          >
            Click anywhere to enter
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
