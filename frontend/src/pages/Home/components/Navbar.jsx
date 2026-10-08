import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Search, Moon, Sun, Menu, X, ArrowRight } from 'lucide-react'

export default function Navbar({ onOpenDemo }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Professional engineer arrangement: Core portals (Career Hub, Connections) + Platform deep-dives (Features, Pricing, About)
  const navLinks = [
    { label: 'Home', href: '#hero', route: null },
    { label: 'Career Hub', href: null, route: '/career' },
    { label: 'Connections', href: null, route: '/connections' },
    { label: 'Features', href: '#features', route: null },
    { label: 'Pricing', href: '#pricing', route: null },
    { label: 'About', href: '#stats', route: null }
  ]

  const handleNavClick = (e, link) => {
    if (link.route) {
      navigate(link.route)
      setMobileMenuOpen(false)
      return
    }
    if (link.href && link.href.startsWith('#')) {
      e.preventDefault()
      if (window.location.pathname !== '/') {
        navigate(`/${link.href}`)
        setMobileMenuOpen(false)
        return
      }
      const el = document.querySelector(link.href)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      setMobileMenuOpen(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    const q = searchQuery.toLowerCase().trim()
    if (q.includes('resume')) navigate('/resume-analyser')
    else if (q.includes('job') || q.includes('intern')) navigate('/internships')
    else if (q.includes('connect')) navigate('/connections')
    else if (q.includes('career') || q.includes('hub')) navigate('/career')
    else if (q.includes('price') || q.includes('cost') || q.includes('plan')) {
      if (window.location.pathname === '/') {
        const el = document.querySelector('#pricing')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        navigate('/#pricing')
      }
    }
    else if (q.includes('dash') || q.includes('work')) navigate('/dashboard')
    else if (q.includes('quiz')) navigate('/quizzes')
    else if (q.includes('code') || q.includes('arena')) navigate('/code-arena')
    else if (q.includes('tutor') || q.includes('ai')) navigate('/ai-tutor')
    else navigate(`/career?q=${encodeURIComponent(searchQuery)}`)
    setSearchOpen(false)
  }

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          padding: scrolled ? '8px 20px' : '12px 24px',
          transition: 'padding 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <nav
          style={{
            width: '100%',
            maxWidth: '1280px',
            height: scrolled ? '56px' : '62px',
            borderRadius: '999px',
            backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.88)' : 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(228, 217, 204, 0.75)',
            boxShadow: scrolled ? '0 12px 30px rgba(40, 30, 20, 0.08)' : '0 4px 18px rgba(40, 30, 20, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Brand Logo */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              flexShrink: 0
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #E97852, #D96D48)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(233, 120, 82, 0.35)'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 3h7a5 5 0 0 1 5 5 5 5 0 0 1-5 5H6V3zm0 10h6l5 8h-4.5L8 13.5V21H6V13z"
                  fill="#FFFFFF"
                />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: '1.02rem',
                  letterSpacing: '0.08em',
                  color: '#171512'
                }}
              >
                REXION
              </span>
              <span
                style={{
                  fontSize: '0.56rem',
                  letterSpacing: '0.14em',
                  color: '#756E66',
                  fontWeight: 600,
                  marginTop: '-3px'
                }}
              >
                AI CAREER PLATFORM
              </span>
            </div>
          </Link>

          {/* Desktop Center Links: Clean, spacious, identical to original */}
          <div
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '24px'
            }}
            className="rexion-desktop-links"
          >
            {navLinks.map((link) => {
              const isHome = link.label === 'Home'
              return (
                <div key={link.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <a
                    href={link.href || '#'}
                    onClick={(e) => handleNavClick(e, link)}
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '0.88rem',
                      fontWeight: isHome ? 700 : 500,
                      color: isHome ? '#171512' : '#5A554E',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#E97852')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = isHome ? '#171512' : '#5A554E')}
                  >
                    {link.label}
                  </a>
                  {isHome && (
                    <motion.div
                      layoutId="nav-active-indicator"
                      style={{
                        width: '16px',
                        height: '2px',
                        borderRadius: '2px',
                        backgroundColor: '#E97852',
                        marginTop: '3px'
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Right Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            {/* Search Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#5A554E',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: '50%',
                transition: 'color 0.2s, background 0.2s'
              }}
              aria-label="Search"
              title="Search jobs, skills, connections"
            >
              <Search size={17} />
            </button>

            {/* Ambient Lighting toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#5A554E',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: '50%',
                transition: 'color 0.2s'
              }}
              aria-label="Toggle ambient theme"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Sign In (Pill matching original) */}
            <button
              onClick={() => navigate('/login')}
              style={{
                display: 'none',
                background: 'rgba(23, 21, 18, 0.04)',
                border: '1px solid rgba(23, 21, 18, 0.12)',
                borderRadius: '999px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '0.84rem',
                fontWeight: 600,
                color: '#171512',
                cursor: 'pointer',
                padding: '7px 18px',
                transition: 'background-color 0.2s, border-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(23, 21, 18, 0.09)'
                e.currentTarget.style.borderColor = 'rgba(23, 21, 18, 0.22)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(23, 21, 18, 0.04)'
                e.currentTarget.style.borderColor = 'rgba(23, 21, 18, 0.12)'
              }}
              className="rexion-desktop-auth"
            >
              Sign In
            </button>

            {/* Get Started Pill */}
            <button
              onClick={() => navigate('/register')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #E97852, #D96D48)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '999px',
                padding: scrolled ? '8px 18px' : '9px 20px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(233, 120, 82, 0.32)',
                transition: 'transform 0.15s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 8px 22px rgba(233, 120, 82, 0.45)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(233, 120, 82, 0.32)'
              }}
            >
              <span>Get Started</span>
              <ArrowRight size={14} />
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#171512',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px'
              }}
              className="rexion-mobile-menu-btn"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Search Overlay Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSearchOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2000,
              backgroundColor: 'rgba(9, 11, 10, 0.65)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingTop: '120px'
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '600px',
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #E4D9CC',
                padding: '24px',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)'
              }}
            >
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Search size={20} color="#E97852" />
                <input
                  type="text"
                  placeholder="Search jobs, skill graphs, connections, challenges..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '1.05rem',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    color: '#171512'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#756E66',
                    cursor: 'pointer'
                  }}
                >
                  <X size={18} />
                </button>
              </form>

              <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', color: '#756E66' }}>Quick:</span>
                {['Career Hub', 'Connections', 'Dashboard', 'Internships', 'ATS Resume'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setSearchQuery(term)
                      if (term === 'Career Hub') navigate('/career')
                      else if (term === 'Connections') navigate('/connections')
                      else if (term === 'Dashboard') navigate('/workspace')
                      else if (term === 'Internships') navigate('/internships')
                      else if (term === 'ATS Resume') navigate('/resume-analyser')
                      setSearchOpen(false)
                    }}
                    style={{
                      background: 'rgba(233, 120, 82, 0.08)',
                      border: '1px solid rgba(233, 120, 82, 0.2)',
                      borderRadius: '999px',
                      padding: '4px 12px',
                      fontSize: '0.74rem',
                      color: '#E97852',
                      cursor: 'pointer'
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: 'fixed',
              top: '72px',
              left: '16px',
              right: '16px',
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #E4D9CC',
              padding: '24px',
              zIndex: 999,
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href || '#'}
                onClick={(e) => handleNavClick(e, link)}
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#171512',
                  textDecoration: 'none',
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
                }}
              >
                {link.label}
              </a>
            ))}
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button
                onClick={() => {
                  navigate('/login')
                  setMobileMenuOpen(false)
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(23, 21, 18, 0.05)',
                  border: '1px solid #E4D9CC',
                  color: '#171512',
                  fontWeight: 600
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  navigate('/register')
                  setMobileMenuOpen(false)
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #E97852, #D96D48)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 600
                }}
              >
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (min-width: 900px) {
          .rexion-desktop-links {
            display: flex !important;
          }
          .rexion-desktop-auth {
            display: inline-block !important;
          }
          .rexion-mobile-menu-btn {
            display: none !important;
          }
        }
      `}</style>
    </>
  )
}
