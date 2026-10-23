import React, { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import GoogleSignInButton from '../../components/auth/GoogleSignInButton'
import { useAuth } from '../../context/AuthContext'
import authApi from '../../services/authApi'
import { getAuthErrorMessage, resolveAuthRedirectPath } from '../../utils/authSession'
import { isGoogleAuthConfigured } from '../../config/googleAuth'
import { Link000, Link001, Link004 } from '../../components/ui/skiper-ui/skiper40'
import styles from './Login.module.css'

const getDestinationLabel = (path) => {
  if (path.startsWith('/developer')) return 'Developer Portal'
  if (path.startsWith('/resume-predictor')) return 'Resume Predictor'
  if (path.startsWith('/intern-hunt')) return 'Intern Hunt'
  if (path.startsWith('/resume')) return 'Resume Builder'
  if (path.startsWith('/rexcode')) return 'Rexcode'
  if (path.startsWith('/workspace') || path.startsWith('/dashboard')) return 'Dashboard'
  return 'REXION'
}

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { applyAuthResponse } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isDeveloperMode, setIsDeveloperMode] = useState(
    Boolean(searchParams.get('mode') === 'developer' || location.pathname.includes('developer'))
  )
  const [form, setForm] = useState({
    email: '',
    password: ''
  })
  const [honeypot, setHoneypot] = useState('')
  const [errors, setErrors] = useState({})
  const [submitMessage, setSubmitMessage] = useState('')
  const [submitError, setSubmitError] = useState('')

  const validate = () => {
    const nextErrors = {}

    if (!form.email.trim()) {
      nextErrors.email = 'Email address is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Please enter a valid email address.'
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.'
    } else if (form.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const defaultRedirect = isDeveloperMode ? '/developer/apply' : '/dashboard'
  const nextPath = useMemo(
    () =>
      resolveAuthRedirectPath(
        searchParams.get('next') || location.state?.from?.pathname,
        defaultRedirect
      ),
    [defaultRedirect, location.state, searchParams]
  )
  const destinationLabel = useMemo(() => getDestinationLabel(nextPath), [nextPath])

  const completeLogin = (response) => {
    applyAuthResponse(response, true)
    const loggedUser = response?.user || response?.data?.user
    const isAdmin = loggedUser?.role === 'admin'

    const explicitNext = searchParams.get('next') || location.state?.from?.pathname
    const targetPath = explicitNext ? nextPath : (isAdmin ? '/admin' : nextPath)
    const targetLabel = isAdmin && !explicitNext ? 'Admin Control Center' : destinationLabel

    setSubmitMessage(response.message || `Login successful. Redirecting to ${targetLabel}...`)
    setTimeout(() => navigate(targetPath, { replace: true }), 400)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitMessage('')
    setSubmitError('')

    // Honeypot spam trap
    if (honeypot) {
      setLoading(true)
      setTimeout(() => {
        setLoading(false)
        setSubmitError('Invalid submission detected.')
      }, 800)
      return
    }

    if (!validate()) return

    setLoading(true)
    try {
      let response
      try {
        response = await authApi.login({
          email: form.email.trim(),
          password: form.password
        })
      } catch (firstErr) {
        const status = firstErr?.response?.status
        const isTransient =
          status === 503 ||
          status === 502 ||
          status === 504 ||
          (status === 500 && (typeof firstErr?.response?.data === 'string' || !firstErr?.response?.data?.message)) ||
          firstErr?.code === 'ERR_NETWORK'

        if (isTransient) {
          await new Promise((r) => setTimeout(r, 1200))
          response = await authApi.login({
            email: form.email.trim(),
            password: form.password
          })
        } else {
          throw firstErr
        }
      }

      completeLogin(response)
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error, 'Login failed. Please check your credentials.'))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleCredential = async (credential) => {
    setSubmitMessage('')
    setSubmitError('')
    setErrors({})
    setLoading(true)

    try {
      const response = await authApi.googleLogin({ credential })
      completeLogin(response)
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error, 'Google sign-in failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const handleGithubClick = () => {
    setSubmitError('GitHub sign-in is enabled for verified Developer accounts. Use your email or Google account.')
  }

  return (
    <div className={styles.page}>
      <div className={styles.splitCard}>
        {/* ====================================================================
            LEFT HERO COLUMN (Cozy Desk Visual, Books, Mug, Sunlight & Typography)
            ==================================================================== */}
        <div className={styles.heroColumn}>
          {/* Interactive Nav Links aligned over the visual header */}
          <div className={styles.heroTopHotspots}>
            <Link to="/" className={styles.heroBrandLink} aria-label="REXION Home" />
            <nav className={styles.heroNavHotspots} aria-label="Quick links">
              <Link000 to="/intern-hunt" className={styles.heroNavLink}>
                Find Jobs
              </Link000>
              <span style={{ color: '#8C7A6B', fontSize: '0.75rem' }} aria-hidden="true">·</span>
              <Link000 to="/rexcode" className={styles.heroNavLink}>
                Build Skills
              </Link000>
              <span style={{ color: '#8C7A6B', fontSize: '0.75rem' }} aria-hidden="true">·</span>
              <Link000 to="/resume-predictor" className={styles.heroNavLink}>
                Grow Faster
              </Link000>
            </nav>
          </div>
        </div>

        {/* ====================================================================
            RIGHT COLUMN (Login Form, Developer Switcher & Skiper UI Animations)
            ==================================================================== */}
        <div className={styles.formColumn}>
          {/* Top Row: Sign Up Link with Skiper UI Link001 Animation */}
          <div className={styles.formTopRow}>
            <span>Don&apos;t have an account?</span>
            <Link001
              to={`/register?next=${encodeURIComponent(nextPath)}`}
              className={styles.signUpLink}
            >
              Sign Up
            </Link001>
          </div>

          <div>
            {/* Segmented Developer Mode Switcher */}
            <div className={styles.devSegmentWrap} role="tablist" aria-label="Account Type">
              <button
                type="button"
                role="tab"
                aria-selected={!isDeveloperMode}
                className={`${styles.devSegmentBtn} ${!isDeveloperMode ? styles.devSegmentBtnActive : ''}`}
                onClick={() => setIsDeveloperMode(false)}
              >
                <span>Candidate / Student</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isDeveloperMode}
                className={`${styles.devSegmentBtn} ${isDeveloperMode ? styles.devSegmentBtnActive : ''}`}
                onClick={() => setIsDeveloperMode(true)}
              >
                <span>Developer Account</span>
                <span className={styles.devBadge}>CREATOR</span>
              </button>
            </div>

            {/* Header Greeting */}
            <div className={styles.formHeader}>
              <h1 className={styles.welcomeHeading}>
                {isDeveloperMode ? 'Developer Workspace 💻' : 'Welcome Back 👋'}
              </h1>
              <p className={styles.welcomeSubtext}>
                {isDeveloperMode
                  ? 'Log in to access your Developer Portal, API credentials, and submissions.'
                  : 'Log in to your account and continue your journey with REXION.'}
              </p>
            </div>

            {/* Feedback Banners */}
            {submitError && (
              <div className={`${styles.alertMessage} ${styles.alertError}`} role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{submitError}</span>
              </div>
            )}
            {submitMessage && (
              <div className={`${styles.alertMessage} ${styles.alertSuccess}`} role="status">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>{submitMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              {/* Bot trap */}
              <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0, zIndex: -1 }} aria-hidden="true">
                <label htmlFor="login_hp_field">Leave this empty</label>
                <input
                  id="login_hp_field"
                  name="login_hp_field"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {/* Email Field */}
              <div className={styles.inputGroup}>
                <label htmlFor="login-email" className={styles.inputLabel}>Email Address</label>
                <div className={styles.inputWrapper}>
                  <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <input
                    id="login-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={styles.input}
                  />
                </div>
                {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
              </div>

              {/* Password Field */}
              <div className={styles.inputGroup}>
                <label htmlFor="login-password" className={styles.inputLabel}>Password</label>
                <div className={styles.inputWrapper}>
                  <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className={`${styles.input} ${styles.inputWithToggle}`}
                  />
                  <button
                    type="button"
                    className={styles.togglePassBtn}
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
              </div>

              {/* Forgot Password Link with Skiper UI Link000 */}
              <div className={styles.forgotRow}>
                <Link000 to="/forgot-password" className={styles.forgotLink}>
                  Forgot password?
                </Link000>
              </div>

              {/* Primary Submit Button */}
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                <span>{loading ? 'Signing In...' : isDeveloperMode ? 'Developer Log In' : 'Log In'}</span>
                {!loading && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                )}
              </button>

              {/* OR Divider */}
              <div className={styles.divider} aria-hidden="true">
                <span>OR</span>
              </div>

              {/* Social Login Buttons */}
              <div className={styles.socialButtons}>
                {isGoogleAuthConfigured() ? (
                  <div className={styles.googleFrameWrap}>
                    <GoogleSignInButton
                      text="continue_with"
                      disabled={loading}
                      onCredential={handleGoogleCredential}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.socialBtn}
                    onClick={() => {
                      setSubmitError('Google OAuth is ready to connect once VITE_GOOGLE_CLIENT_ID is configured.')
                    }}
                  >
                    <svg className={styles.socialIcon} viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                )}

                <button
                  type="button"
                  className={styles.socialBtn}
                  onClick={handleGithubClick}
                >
                  <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>Continue with GitHub</span>
                </button>
              </div>

              {/* Developer Callout Banner with Skiper UI Link004 */}
              <div className={styles.devCalloutBanner}>
                <div className={styles.devCalloutText}>
                  <strong>Looking to build or contribute tools?</strong>
                  <span>Join REXION Creator Network</span>
                </div>
                <Link004 to="/developer/apply" className={styles.devApplyLink}>
                  Developer Portal
                </Link004>
              </div>
            </form>
          </div>

          {/* Privacy & Security Footer */}
          <div className={styles.trustFooter}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Your data is safe with us. We never share your information.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
