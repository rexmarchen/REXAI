import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Cookie, X } from 'lucide-react'
import styles from './CookieConsentBanner.module.css'

const STORAGE_KEY = 'rexion_cookie_consent'

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    try {
      const consent = localStorage.getItem(STORAGE_KEY)
      if (!consent) {
        // Small delay so it smoothly appears without blocking initial paint
        const timer = setTimeout(() => setIsVisible(true), 800)
        return () => clearTimeout(timer)
      }
    } catch {
      // localStorage may fail in strict private modes
    }
  }, [])

  const handleConsent = (choice) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        status: choice,
        timestamp: new Date().toISOString()
      }))
    } catch {
      // ignore storage errors
    }
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className={styles.wrapper} role="region" aria-label="Cookie consent banner">
      <div className={styles.content}>
        <div className={styles.iconWrapper} aria-hidden="true">
          <Cookie size={22} />
        </div>
        <div className={styles.textContent}>
          <h3 className={styles.title}>Respecting Your Privacy</h3>
          <p className={styles.text}>
            REXION AI uses cookies and local session caching strictly to optimize application performance, maintain secure logins, and analyze platform traffic. We never sell your personal data. Read our{' '}
            <Link to="/privacy" className={styles.privacyLink}>
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link to="/terms" className={styles.privacyLink}>
              Terms
            </Link>.
          </p>
        </div>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          onClick={() => handleConsent('essential')}
          className={styles.declineBtn}
        >
          Essential Only
        </button>
        <button
          type="button"
          onClick={() => handleConsent('all')}
          className={styles.acceptBtn}
        >
          Accept All Cookies
        </button>
      </div>
    </div>
  )
}
