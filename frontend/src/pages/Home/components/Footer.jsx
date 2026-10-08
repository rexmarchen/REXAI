import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Footer() {
  const navigate = useNavigate()

  const navLinks = [
    { label: 'Home', href: '#hero' },
    { label: 'Career Hub', route: '/career' },
    { label: 'Connections', route: '/connections' },
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#stats' }
  ]

  const handleNavClick = (e, link) => {
    if (link.route) {
      navigate(link.route)
      return
    }
    if (link.href && link.href.startsWith('#')) {
      e.preventDefault()
      if (window.location.pathname !== '/') {
        navigate(`/${link.href}`)
        return
      }
      const el = document.querySelector(link.href)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <footer
      style={{
        backgroundColor: '#070908',
        color: '#F7F4EE',
        padding: '54px 28px 36px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)'
      }}
    >
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto'
        }}
      >
        {/* ── Main Top Row: 4 Columns ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(200px, 1.2fr) minmax(240px, 1.4fr) minmax(180px, 1fr) minmax(140px, 0.8fr)',
            gap: '32px',
            alignItems: 'flex-start',
            marginBottom: '44px'
          }}
          className="rexion-footer-top-grid"
        >
          {/* Col 1: Brandmark */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none'
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
                  fontSize: '1.05rem',
                  letterSpacing: '0.08em',
                  color: '#FFFFFF'
                }}
              >
                REXION
              </span>
              <span
                style={{
                  fontSize: '0.58rem',
                  letterSpacing: '0.14em',
                  color: 'rgba(255, 255, 255, 0.55)',
                  fontWeight: 600,
                  marginTop: '-3px'
                }}
              >
                AI CAREER PLATFORM
              </span>
            </div>
          </Link>

          {/* Col 2: Navigation Links */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              flexWrap: 'wrap'
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href || '#'}
                onClick={(e) => handleNavClick(e, link)}
                style={{
                  color: link.label === 'Home' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.68)',
                  textDecoration: 'none',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  borderBottom: link.label === 'Home' ? '2px solid #E97852' : 'none',
                  paddingBottom: link.label === 'Home' ? '2px' : '0',
                  cursor: 'pointer',
                  transition: 'color 0.16s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                onMouseLeave={(e) => {
                  if (link.label !== 'Home') e.currentTarget.style.color = 'rgba(255, 255, 255, 0.68)'
                }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Col 3: Resources Grid */}
          <div>
            <div
              style={{
                fontSize: '0.84rem',
                fontWeight: 700,
                color: '#FFFFFF',
                marginBottom: '10px',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}
            >
              Resources
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px 18px',
                fontSize: '0.80rem',
                color: 'rgba(255, 255, 255, 0.62)'
              }}
            >
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/career')}>Blog</span>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/resume-analyser')}>Press</span>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/skill-graph')}>Guides</span>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/ai-tutor')}>Help Center</span>
            </div>
          </div>

          {/* Col 4: Follow Us */}
          <div>
            <div
              style={{
                fontSize: '0.84rem',
                fontWeight: 700,
                color: '#FFFFFF',
                marginBottom: '10px',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}
            >
              Follow Us
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.75)',
                  textDecoration: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  transition: 'background-color 0.2s, color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(233, 120, 82, 0.2)'
                  e.currentTarget.style.color = '#E97852'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)'
                }}
              >
                in
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.75)',
                  textDecoration: 'none',
                  transition: 'background-color 0.2s, color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(233, 120, 82, 0.2)'
                  e.currentTarget.style.color = '#E97852'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>

              {/* GitHub */}
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.75)',
                  textDecoration: 'none',
                  transition: 'background-color 0.2s, color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(233, 120, 82, 0.2)'
                  e.currentTarget.style.color = '#E97852'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                </svg>
              </a>

              {/* X */}
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="X"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.75)',
                  textDecoration: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  transition: 'background-color 0.2s, color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(233, 120, 82, 0.2)'
                  e.currentTarget.style.color = '#E97852'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)'
                }}
              >
                𝕏
              </a>
            </div>
          </div>
        </div>

        {/* ── Bottom Row: Copyright & Brand Motto ── */}
        <div
          style={{
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            fontSize: '0.78rem',
            color: 'rgba(255, 255, 255, 0.45)'
          }}
        >
          <div>© 2026 REXION. All rights reserved.</div>
          <div>Build Skills • Get Opportunities • Shape Your Future</div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .rexion-footer-top-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 28px !important;
          }
        }
        @media (max-width: 600px) {
          .rexion-footer-top-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  )
}
