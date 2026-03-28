'use client'

import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import styles from '@/styles/landing.module.css'

const navItems = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#how-it-works', label: 'How it Works' },
  { href: '#social-proof', label: 'Outcomes' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
      <div className={styles.navInner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark} />
          REXION AI
        </Link>

        <nav className={styles.navLinks}>
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className={styles.navActions}>
          <Link href="/login" className={styles.ghostButton}>
            Log In
          </Link>
          <Link href="/signup" className={styles.primaryButton}>
            Start Free
          </Link>
        </div>

        <button className={styles.navToggle} onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={styles.mobileMenu}
            style={{
              margin: '0 16px 16px',
              borderRadius: '20px',
              border: '1px solid var(--border-soft)',
              background: 'rgba(7, 11, 8, 0.92)',
              padding: '16px',
            }}
          >
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={styles.navLink}
                style={{ display: 'block', padding: '12px 0' }}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div style={{ display: 'grid', gap: '10px', marginTop: '12px' }}>
              <Link href="/login" className={styles.ghostButton} onClick={() => setOpen(false)}>
                Log In
              </Link>
              <Link href="/signup" className={styles.primaryButton} onClick={() => setOpen(false)}>
                Start Free
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  )
}
