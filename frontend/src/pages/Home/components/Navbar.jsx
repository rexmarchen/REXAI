import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Search, Moon, Sun, Menu, X, ArrowRight, Code2, Sparkles, FileText, CheckCircle2, Shield, User, Briefcase, Zap, Terminal, GraduationCap } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { buildLoginPath } from '../../../utils/authSession'

export default function Navbar({ onOpenDemo }) {
  const { user, isAuthenticated, logout } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [quickMenuOpen, setQuickMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const quickMenuRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setQuickMenuOpen(false)
    }
    const handleClickOutside = (e) => {
      if (quickMenuRef.current && !quickMenuRef.current.contains(e.target)) {
        setQuickMenuOpen(false)
      }
    }
    if (quickMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [quickMenuOpen])

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
          {/* Brand & Three Lines Quick Menu Group */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px' }} ref={quickMenuRef}>
            {/* Three-Line Menu Button */}
            <button
              type="button"
              onClick={() => setQuickMenuOpen((prev) => !prev)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: quickMenuOpen ? 'rgba(233, 120, 82, 0.12)' : 'rgba(23, 21, 18, 0.04)',
                border: quickMenuOpen ? '1px solid rgba(233, 120, 82, 0.5)' : '1px solid rgba(228, 217, 204, 0.9)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                flexShrink: 0,
                boxShadow: quickMenuOpen ? '0 0 0 3px rgba(233, 120, 82, 0.15)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!quickMenuOpen) {
                  e.currentTarget.style.backgroundColor = 'rgba(233, 120, 82, 0.08)'
                  e.currentTarget.style.borderColor = 'rgba(233, 120, 82, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                if (!quickMenuOpen) {
                  e.currentTarget.style.backgroundColor = 'rgba(23, 21, 18, 0.04)'
                  e.currentTarget.style.borderColor = 'rgba(228, 217, 204, 0.9)'
                }
              }}
              aria-expanded={quickMenuOpen}
              aria-label="Toggle Developer & Platform Menu"
              title="Developer Account & Platform Features"
            >
              <span style={{ display: 'block', width: '16px', height: '2px', borderRadius: '2px', backgroundColor: quickMenuOpen ? '#E97852' : '#171512', transition: 'all 0.2s' }} />
              <span style={{ display: 'block', width: '12px', height: '2px', borderRadius: '2px', backgroundColor: quickMenuOpen ? '#E97852' : '#171512', transition: 'all 0.2s' }} />
              <span style={{ display: 'block', width: '16px', height: '2px', borderRadius: '2px', backgroundColor: quickMenuOpen ? '#E97852' : '#171512', transition: 'all 0.2s' }} />
            </button>

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

            {/* In-page Left Quick Menu Popover Panel */}
            <AnimatePresence>
              {quickMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 14px)',
                    left: 0,
                    width: '360px',
                    maxWidth: '92vw',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '20px',
                    border: '1px solid #E8DFD5',
                    boxShadow: '0 24px 60px rgba(40, 30, 20, 0.16), 0 4px 16px rgba(0,0,0,0.06)',
                    zIndex: 1100,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Panel Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    borderBottom: '1px solid #F0EAE1',
                    background: '#FAF6F0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={14} color="#E97852" />
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        color: '#8A8075',
                        textTransform: 'uppercase',
                        fontFamily: "'Plus Jakarta Sans', sans-serif"
                      }}>
                        WORKSPACE & DEVELOPER TOOLS
                      </span>
                    </div>
                    <button
                      onClick={() => setQuickMenuOpen(false)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#8A8075',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      aria-label="Close"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* FEATURED: Role-Aware Workspace Box */}
                  <div style={{ padding: '14px 14px 10px', background: '#FFFFFF' }}>
                    {user?.role === 'admin' ? (
                      /* ADMIN CONTROL CENTER CARD */
                      <div style={{
                        padding: '14px 16px',
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.05))',
                        borderRadius: '16px',
                        border: '1.5px solid rgba(245, 158, 11, 0.35)',
                        boxShadow: '0 6px 20px rgba(245, 158, 11, 0.12)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                            }}>
                              <Shield size={18} />
                            </div>
                            <div>
                              <strong style={{ fontSize: '0.94rem', color: '#171512', fontWeight: 800, display: 'block', lineHeight: 1.2 }}>
                                Admin Control Panel
                              </strong>
                              <span style={{ fontSize: '0.68rem', color: '#B45309', fontWeight: 700 }}>
                                Platform System Governance
                              </span>
                            </div>
                          </div>
                          <span style={{
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: '#F59E0B',
                            color: '#FFFFFF',
                            letterSpacing: '0.04em'
                          }}>
                            SUPER ADMIN
                          </span>
                        </div>
                        <p style={{
                          fontSize: '0.78rem',
                          color: '#5A554E',
                          margin: '0 0 12px',
                          lineHeight: 1.45
                        }}>
                          Manage users, promote technical creators, verify educators, and monitor system metrics.
                        </p>
                        <Link
                          to="/admin"
                          onClick={() => setQuickMenuOpen(false)}
                          style={{
                            width: '100%',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '9px 14px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                            color: '#FFFFFF',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.28)'
                          }}
                        >
                          <span>Open Admin Command Center</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    ) : user?.role === 'faculty' || user?.facultyStatus === 'verified' ? (
                      /* FACULTY & EDUCATOR HUB CARD */
                      <div style={{
                        padding: '14px 16px',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.04))',
                        borderRadius: '16px',
                        border: '1.5px solid rgba(16, 185, 129, 0.35)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #10B981, #059669)',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.28)'
                            }}>
                              <GraduationCap size={18} />
                            </div>
                            <div>
                              <strong style={{ fontSize: '0.94rem', color: '#171512', fontWeight: 800, display: 'block', lineHeight: 1.2 }}>
                                Faculty & Educator Suite
                              </strong>
                              <span style={{ fontSize: '0.68rem', color: '#047857', fontWeight: 700 }}>
                                {user?.facultyStatus === 'verified' ? 'Verified Educator' : 'Educator Workspace'}
                              </span>
                            </div>
                          </div>
                          <span style={{
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: '#10B981',
                            color: '#FFFFFF',
                            letterSpacing: '0.04em'
                          }}>
                            {user?.facultyStatus === 'verified' ? 'VERIFIED' : 'EDUCATOR'}
                          </span>
                        </div>
                        <p style={{
                          fontSize: '0.78rem',
                          color: '#5A554E',
                          margin: '0 0 12px',
                          lineHeight: 1.45
                        }}>
                          Create adaptive quizzes, publish challenges, and monitor student learning analytics.
                        </p>
                        <Link
                          to="/faculty"
                          onClick={() => setQuickMenuOpen(false)}
                          style={{
                            width: '100%',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '9px 14px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #10B981, #059669)',
                            color: '#FFFFFF',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)'
                          }}
                        >
                          <span>Open Faculty Dashboard</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    ) : user?.role === 'developer' || user?.developerStatus === 'active' ? (
                      /* ACTIVE DEVELOPER CARD */
                      <div style={{
                        padding: '14px 16px',
                        background: 'linear-gradient(135deg, rgba(233, 120, 82, 0.1), rgba(217, 109, 72, 0.04))',
                        borderRadius: '16px',
                        border: '1.5px solid rgba(233, 120, 82, 0.35)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #E97852, #D96D48)',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 12px rgba(233, 120, 82, 0.3)'
                            }}>
                              <Code2 size={18} />
                            </div>
                            <div>
                              <strong style={{ fontSize: '0.94rem', color: '#171512', fontWeight: 800, display: 'block', lineHeight: 1.2 }}>
                                Developer Workspace
                              </strong>
                              <span style={{ fontSize: '0.68rem', color: '#C25A38', fontWeight: 700 }}>
                                Active Creator Program
                              </span>
                            </div>
                          </div>
                          <span style={{
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: '#10B981',
                            color: '#FFFFFF',
                            letterSpacing: '0.04em'
                          }}>
                            ACTIVE
                          </span>
                        </div>
                        <p style={{
                          fontSize: '0.78rem',
                          color: '#5A554E',
                          margin: '0 0 12px',
                          lineHeight: 1.45
                        }}>
                          Author technical quizzes, algorithm problem sets, and assessment benchmarks for students.
                        </p>
                        <Link
                          to="/developer"
                          onClick={() => setQuickMenuOpen(false)}
                          style={{
                            width: '100%',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '9px 14px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #E97852, #D96D48)',
                            color: '#FFFFFF',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            boxShadow: '0 4px 14px rgba(233, 120, 82, 0.28)'
                          }}
                        >
                          <span>Open Developer Portal</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    ) : (
                      /* CANDIDATE / CREATOR OPPORTUNITY CARD */
                      <div style={{
                        padding: '14px 16px',
                        background: 'linear-gradient(135deg, rgba(233, 120, 82, 0.08), rgba(217, 109, 72, 0.03))',
                        borderRadius: '16px',
                        border: '1px solid rgba(233, 120, 82, 0.3)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #E97852, #D96D48)',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 10px rgba(233, 120, 82, 0.3)'
                            }}>
                              <Code2 size={17} />
                            </div>
                            <div>
                              <strong style={{ fontSize: '0.94rem', color: '#171512', fontWeight: 800, display: 'block', lineHeight: 1.2 }}>
                                Developer & Educator Access
                              </strong>
                              <span style={{ fontSize: '0.68rem', color: '#8A8075', fontWeight: 600 }}>
                                {user?.developerStatus === 'pending'
                                  ? 'Application Under Review'
                                  : 'Technical Creator Program'}
                              </span>
                            </div>
                          </div>
                          <span style={{
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: '#E97852',
                            color: '#FFFFFF',
                            letterSpacing: '0.04em'
                          }}>
                            {user?.developerStatus === 'pending' ? 'PENDING' : 'APPLY'}
                          </span>
                        </div>
                        <p style={{
                          fontSize: '0.78rem',
                          color: '#5A554E',
                          margin: '0 0 12px',
                          lineHeight: 1.45
                        }}>
                          Author technical quizzes, algorithm problem sets, or join as a verified educator to publish course assessments.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <Link
                            to={isAuthenticated ? '/developer/apply' : buildLoginPath('/developer/apply')}
                            onClick={() => setQuickMenuOpen(false)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              padding: '8px 10px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #E97852, #D96D48)',
                              color: '#FFFFFF',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                              textAlign: 'center'
                            }}
                          >
                            <span>
                              {user?.developerStatus === 'pending' ? 'Application Review' : 'Developer Apply'}
                            </span>
                            <ArrowRight size={12} />
                          </Link>
                          <Link
                            to="/register?type=faculty"
                            onClick={() => setQuickMenuOpen(false)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              padding: '8px 10px',
                              borderRadius: '10px',
                              background: 'rgba(16, 185, 129, 0.1)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              color: '#059669',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                              textAlign: 'center'
                            }}
                          >
                            <span>Faculty Suite</span>
                            <ArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Core Tools Links */}
                  <div style={{
                    padding: '6px 10px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                    maxHeight: '260px',
                    overflowY: 'auto'
                  }}>
                    <div style={{
                      padding: '6px 10px 2px',
                      fontSize: '0.66rem',
                      fontWeight: 800,
                      color: '#8A8075',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase'
                    }}>
                      Platform Tools
                    </div>

                    <Link
                      to={isAuthenticated ? '/resume' : buildLoginPath('/resume')}
                      onClick={() => setQuickMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        color: '#171512',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF6F0')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: 'rgba(233, 120, 82, 0.1)',
                        color: '#E97852',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <FileText size={15} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: '0.84rem', display: 'block', fontWeight: 600 }}>Resume Builder</strong>
                        <span style={{ fontSize: '0.72rem', color: '#756E66', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Targeted ATS resumes & PDF export
                        </span>
                      </div>
                    </Link>

                    <Link
                      to={isAuthenticated ? '/resume-predictor' : buildLoginPath('/resume-predictor')}
                      onClick={() => setQuickMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        color: '#171512',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF6F0')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#3B82F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Zap size={15} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: '0.84rem', display: 'block', fontWeight: 600 }}>Autonomous Apply & ATS</strong>
                        <span style={{ fontSize: '0.72rem', color: '#756E66', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Score match & 1-click agent job submit
                        </span>
                      </div>
                    </Link>

                    <Link
                      to="/career"
                      onClick={() => setQuickMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        color: '#171512',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF6F0')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: 'rgba(234, 179, 8, 0.1)',
                        color: '#D97706',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Sparkles size={15} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: '0.84rem', display: 'block', fontWeight: 600 }}>Career Hub</strong>
                        <span style={{ fontSize: '0.72rem', color: '#756E66', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Daily challenges, skill graph & quizzes
                        </span>
                      </div>
                    </Link>

                    <Link
                      to="/rexcode"
                      onClick={() => setQuickMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        color: '#171512',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF6F0')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: 'rgba(168, 85, 247, 0.1)',
                        color: '#9333EA',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Terminal size={15} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: '0.84rem', display: 'block', fontWeight: 600 }}>Code Arena</strong>
                        <span style={{ fontSize: '0.72rem', color: '#756E66', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Interactive code editor & algorithm testing
                        </span>
                      </div>
                    </Link>

                    {user?.role === 'admin' && (
                      <div style={{
                        marginTop: 6,
                        padding: '10px 12px',
                        background: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.28)',
                        borderRadius: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Admin Console
                          </span>
                          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#B45309', background: 'rgba(245, 158, 11, 0.2)', padding: '1px 5px', borderRadius: 4 }}>
                            GOVERNANCE
                          </span>
                        </div>
                        <Link
                          to="/admin"
                          onClick={() => setQuickMenuOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '7px 10px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            color: '#92400E',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            background: '#FFFFFF',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <Shield size={15} color="#D97706" />
                            <span>User Directory & Console</span>
                          </div>
                          <ArrowRight size={13} />
                        </Link>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                          <Link
                            to="/admin/developers"
                            onClick={() => setQuickMenuOpen(false)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              textDecoration: 'none',
                              color: '#0369A1',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              background: '#FFFFFF'
                            }}
                          >
                            <Code2 size={13} color="#0284C7" />
                            <span>Dev Queue</span>
                          </Link>
                          <Link
                            to="/admin/faculty"
                            onClick={() => setQuickMenuOpen(false)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              textDecoration: 'none',
                              color: '#047857',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              background: '#FFFFFF'
                            }}
                          >
                            <GraduationCap size={13} color="#10B981" />
                            <span>Faculty Queue</span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Panel Footer */}
                  <div style={{
                    padding: '12px 16px',
                    borderTop: '1px solid #F0EAE1',
                    background: '#FAF6F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    {isAuthenticated ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <div style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: user?.role === 'admin' ? '#F59E0B' : user?.role === 'faculty' ? '#10B981' : user?.role === 'developer' ? '#E97852' : '#3B82F6',
                            color: '#FFFFFF',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {(user?.name || user?.email || 'U')[0].toUpperCase()}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                            <span style={{ fontSize: '0.78rem', color: '#171512', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {user?.name || user?.email}
                            </span>
                            <span style={{
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              padding: '2px 5px',
                              borderRadius: '4px',
                              background: user?.role === 'admin' ? 'rgba(245, 158, 11, 0.18)' : user?.role === 'faculty' ? 'rgba(16, 185, 129, 0.18)' : user?.role === 'developer' ? 'rgba(233, 120, 82, 0.15)' : 'rgba(59, 130, 246, 0.12)',
                              color: user?.role === 'admin' ? '#D97706' : user?.role === 'faculty' ? '#059669' : user?.role === 'developer' ? '#C25A38' : '#2563EB',
                              textTransform: 'uppercase'
                            }}>
                              {user?.role || 'STUDENT'}
                            </span>
                          </div>
                        </div>
                        <Link
                          to={user?.role === 'admin' ? '/admin' : user?.role === 'faculty' ? '/faculty' : user?.role === 'developer' ? '/developer' : '/dashboard'}
                          onClick={() => setQuickMenuOpen(false)}
                          style={{
                            fontSize: '0.76rem',
                            color: user?.role === 'admin' ? '#D97706' : '#E97852',
                            fontWeight: 700,
                            textDecoration: 'none'
                          }}
                        >
                          {user?.role === 'admin' ? 'Admin Console →' : 'Workspace →'}
                        </Link>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: '0.78rem', color: '#756E66' }}>Ready to create?</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Link
                            to="/login"
                            onClick={() => setQuickMenuOpen(false)}
                            style={{
                              fontSize: '0.78rem',
                              color: '#171512',
                              fontWeight: 600,
                              textDecoration: 'none',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: '#FFFFFF',
                              border: '1px solid #E4D9CC'
                            }}
                          >
                            Sign In
                          </Link>
                          <Link
                            to="/register"
                            onClick={() => setQuickMenuOpen(false)}
                            style={{
                              fontSize: '0.78rem',
                              color: '#FFFFFF',
                              fontWeight: 600,
                              textDecoration: 'none',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: '#E97852'
                            }}
                          >
                            Register
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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

            {/* Desktop Auth Controls - Synchronized with AuthContext */}
            {isAuthenticated && user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Role-Aware Dashboard Button */}
                <button
                  onClick={() => {
                    const target = user?.role === 'admin'
                      ? '/admin'
                      : user?.role === 'faculty'
                        ? '/faculty'
                        : user?.role === 'developer' || user?.developerStatus === 'active'
                          ? '/developer'
                          : '/dashboard'
                    navigate(target)
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: user?.role === 'admin'
                      ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                      : user?.role === 'faculty'
                        ? 'linear-gradient(135deg, #10B981, #059669)'
                        : 'linear-gradient(135deg, #E97852, #D96D48)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '999px',
                    padding: scrolled ? '7px 16px' : '8px 18px',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(233, 120, 82, 0.28)',
                    transition: 'transform 0.15s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {user?.role === 'admin' ? (
                    <Shield size={14} />
                  ) : user?.role === 'faculty' ? (
                    <GraduationCap size={14} />
                  ) : user?.role === 'developer' || user?.developerStatus === 'active' ? (
                    <Code2 size={14} />
                  ) : (
                    <Briefcase size={14} />
                  )}
                  <span>
                    {user?.role === 'admin'
                      ? 'Admin Center'
                      : user?.role === 'faculty'
                        ? 'Faculty Portal'
                        : user?.role === 'developer' || user?.developerStatus === 'active'
                          ? 'Developer Portal'
                          : 'Dashboard'}
                  </span>
                </button>

                {/* User Avatar & Logout Pill */}
                <div
                  style={{
                    display: 'none',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 6px 4px 8px',
                    borderRadius: '999px',
                    background: 'rgba(23, 21, 18, 0.04)',
                    border: '1px solid rgba(23, 21, 18, 0.12)'
                  }}
                  className="rexion-desktop-auth"
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #E97852, #D96D48)',
                      color: '#FFFFFF',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={user?.email}
                  >
                    {(user?.name || user?.fullName || user?.email || 'U')[0].toUpperCase()}
                  </div>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#171512',
                      maxWidth: '100px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {user?.name?.split(' ')[0] || user?.fullName?.split(' ')[0] || user?.email?.split('@')[0]}
                  </span>
                  <button
                    onClick={() => logout()}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      color: '#756E66',
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: '999px',
                      transition: 'color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#DC2626')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#756E66')}
                    title="Sign Out"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}

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
            {/* Developer Account Mobile Card */}
            <div style={{
              padding: '12px 14px',
              background: 'linear-gradient(135deg, rgba(233, 120, 82, 0.08), rgba(217, 109, 72, 0.03))',
              borderRadius: '14px',
              border: '1px solid rgba(233, 120, 82, 0.3)',
              marginBottom: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #E97852, #D96D48)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Code2 size={15} />
                  </div>
                  <strong style={{ fontSize: '0.88rem', color: '#171512' }}>Developer Account</strong>
                </div>
                <span style={{
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '999px',
                  background: user?.developerStatus === 'active' || user?.role === 'developer'
                    ? '#10B981'
                    : user?.developerStatus === 'pending'
                      ? '#F59E0B'
                      : '#E97852',
                  color: '#FFFFFF'
                }}>
                  {user?.developerStatus === 'active' || user?.role === 'developer'
                    ? 'ACTIVE'
                    : user?.developerStatus === 'pending'
                      ? 'PENDING'
                      : 'APPLY'}
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#5A554E', margin: '0 0 8px', lineHeight: 1.35 }}>
                Author technical quizzes & challenge problem sets for REXION students.
              </p>
              <Link
                to={isAuthenticated ? (user?.role === 'developer' || user?.developerStatus === 'active' ? '/developer' : '/developer/apply') : buildLoginPath('/developer/apply')}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #E97852, #D96D48)',
                  color: '#FFFFFF',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                <span>
                  {user?.role === 'developer' || user?.developerStatus === 'active'
                    ? 'Open Developer Portal'
                    : user?.developerStatus === 'pending'
                      ? 'Application Under Review'
                      : 'Create Developer Account'}
                </span>
                <ArrowRight size={13} />
              </Link>
            </div>

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
              {isAuthenticated && user ? (
                <>
                  <button
                    onClick={() => {
                      const target = user?.role === 'admin'
                        ? '/admin'
                        : user?.role === 'faculty'
                          ? '/faculty'
                          : user?.role === 'developer' || user?.developerStatus === 'active'
                            ? '/developer'
                            : '/dashboard'
                      navigate(target)
                      setMobileMenuOpen(false)
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '12px',
                      background: user?.role === 'admin'
                        ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                        : user?.role === 'faculty'
                          ? 'linear-gradient(135deg, #10B981, #059669)'
                          : 'linear-gradient(135deg, #E97852, #D96D48)',
                      border: 'none',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.86rem',
                      cursor: 'pointer'
                    }}
                  >
                    {user?.role === 'admin'
                      ? 'Admin Center'
                      : user?.role === 'faculty'
                        ? 'Faculty Portal'
                        : user?.role === 'developer' || user?.developerStatus === 'active'
                          ? 'Developer Portal'
                          : 'My Dashboard'}
                  </button>
                  <button
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(23, 21, 18, 0.05)',
                      border: '1px solid #E4D9CC',
                      color: '#DC2626',
                      fontWeight: 600,
                      fontSize: '0.86rem',
                      cursor: 'pointer'
                    }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
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
                </>
              )}
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
