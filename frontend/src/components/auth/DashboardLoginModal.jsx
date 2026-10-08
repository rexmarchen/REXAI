import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react'
import GoogleSignInButton from './GoogleSignInButton'
import { useAuth } from '../../context/AuthContext'
import authApi from '../../services/authApi'
import { getAuthErrorMessage } from '../../utils/authSession'
import { isGoogleAuthConfigured } from '../../config/googleAuth'
import styles from './DashboardLoginModal.module.css'

const DashboardLoginModal = ({
  isOpen,
  nextPath = '/dashboard',
  onSuccess,
  onClose,
  allowDismiss = true
}) => {
  const { applyAuthResponse } = useAuth()
  const emailInputRef = useRef(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    remember: true
  })
  const [errors, setErrors] = useState({})
  const [submitMessage, setSubmitMessage] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false)

  const registerHref = useMemo(
    () => `/register?next=${encodeURIComponent(nextPath)}`,
    [nextPath]
  )

  // Auto focus email & lock background scroll
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && allowDismiss && onClose) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const timeout = setTimeout(() => {
      if (!form.email && emailInputRef.current) {
        emailInputRef.current.focus()
      }
    }, 120)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prevOverflow
      clearTimeout(timeout)
    }
  }, [isOpen, allowDismiss, onClose, form.email])

  if (!isOpen) {
    return null
  }

  const validate = () => {
    const nextErrors = {}

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.'
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.'
    } else if (form.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
    if (submitError) setSubmitError('')
  }

  const completeLogin = (response, remember) => {
    applyAuthResponse(response, remember)
    setSubmitMessage(response.message || 'Login successful. Opening your workspace...')
    setSubmitError('')
    setTimeout(() => {
      onSuccess?.()
    }, 450)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitMessage('')
    setSubmitError('')
    setForgotPasswordNotice(false)

    if (!validate()) {
      return
    }

    setLoading(true)
    try {
      let response
      try {
        response = await authApi.login({
          email: form.email.trim(),
          password: form.password
        })
      } catch (firstErr) {
        // If database was doing a cold handshake (503) or dev proxy was warming up, retry once
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

      completeLogin(response, form.remember)
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error, 'Unable to sign in. Please verify your credentials.'))
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
      completeLogin(response, form.remember)
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error, 'Google sign-in failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    setForgotPasswordNotice(true)
    setSubmitError('')
  }

  const showGoogleAuth = isGoogleAuthConfigured()

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-login-title"
    >
      <div
        className={styles.backdrop}
        onClick={allowDismiss ? onClose : undefined}
        aria-hidden="true"
      />

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.headerContent}>
            <div className={styles.kickerBadge}>
              <span className={styles.pulseDot} />
              REXION AI WORKSPACE
            </div>
            <h2 id="dashboard-login-title" className={styles.title}>
              Sign In
            </h2>
            <p className={styles.subtitle}>
              Unlock your automated job search, outreach engine, and tracker data.
            </p>
          </div>

          {allowDismiss && onClose ? (
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close modal"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          ) : null}
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {submitError && (
            <div className={styles.alertError} role="alert">
              <AlertCircle size={18} className={styles.alertIcon} />
              <span>{submitError}</span>
            </div>
          )}

          {submitMessage && (
            <div className={styles.alertSuccess} role="status">
              <CheckCircle2 size={18} className={styles.alertIcon} />
              <span>{submitMessage}</span>
            </div>
          )}

          {forgotPasswordNotice && (
            <div className={styles.alertSuccess} role="status">
              <CheckCircle2 size={18} className={styles.alertIcon} />
              <span>
                If an account exists for {form.email ? form.email : 'your email'}, a reset link has been dispatched.
              </span>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="dashboard-login-email">Email Address</label>
            <div
              className={`${styles.inputWrap} ${
                errors.email ? styles.inputError : ''
              }`}
            >
              <Mail size={17} className={styles.inputIcon} />
              <input
                ref={emailInputRef}
                id="dashboard-login-email"
                type="email"
                value={form.email}
                onChange={(event) => handleFieldChange('email', event.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>
            {errors.email && (
              <span className={styles.fieldError}>
                <AlertCircle size={13} /> {errors.email}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="dashboard-login-password">Password</label>
            <div
              className={`${styles.inputWrap} ${
                errors.password ? styles.inputError : ''
              }`}
            >
              <Lock size={17} className={styles.inputIcon} />
              <input
                id="dashboard-login-password"
                type={showPassword ? 'text' : 'password'}
                className={styles.passwordInput}
                value={form.password}
                onChange={(event) => handleFieldChange('password', event.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className={styles.toggleButton}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <span className={styles.fieldError}>
                <AlertCircle size={13} /> {errors.password}
              </span>
            )}
          </div>

          <div className={styles.metaRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, remember: event.target.checked }))
                }
                disabled={loading}
              />
              Remember me
            </label>
            <button
              type="button"
              className={styles.linkButton}
              onClick={handleForgotPassword}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className={styles.spinner} />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Enter Dashboard</span>
            )}
          </button>

          {showGoogleAuth && (
            <>
              <div className={styles.authDivider} aria-hidden="true">
                <span>OR CONTINUE WITH</span>
              </div>

              <GoogleSignInButton
                text="signin_with"
                disabled={loading}
                onCredential={handleGoogleCredential}
              />
            </>
          )}
        </form>

        <p className={styles.footerText}>
          Don&apos;t have an account?{' '}
          <Link to={registerHref}>Create one free →</Link>
        </p>
      </div>
    </div>
  )
}

export default DashboardLoginModal
