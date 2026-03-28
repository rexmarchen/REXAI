import React, { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import GoogleSignInButton from '../../components/auth/GoogleSignInButton'
import AuthParticleBackground from '../../components/common/AuthParticleBackground'
import { useAuth } from '../../context/AuthContext'
import authApi from '../../services/authApi'
import { getAuthErrorMessage, resolveAuthRedirectPath } from '../../utils/authSession'
import styles from './Register.module.css'

const Register = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { applyAuthResponse } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agree: false
  })
  const [errors, setErrors] = useState({})
  const [submitMessage, setSubmitMessage] = useState('')
  const [submitError, setSubmitError] = useState('')

  const validate = () => {
    const nextErrors = {}

    if (!form.fullName.trim()) {
      nextErrors.fullName = 'Full name is required.'
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.'
    } else if (form.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.'
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.'
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }

    if (!form.agree) {
      nextErrors.agree = 'You must accept terms to continue.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const nextPath = useMemo(
    () =>
      resolveAuthRedirectPath(
        searchParams.get('next') || location.state?.from?.pathname,
        '/dashboard'
      ),
    [location.state, searchParams]
  )

  const completeGoogleAuth = (response) => {
    applyAuthResponse(response, true)
    setSubmitMessage(response.message || 'Google sign-in successful. Redirecting to your dashboard...')
    setTimeout(() => navigate(nextPath, { replace: true }), 500)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitMessage('')
    setSubmitError('')

    if (!validate()) return

    setLoading(true)
    try {
      const response = await authApi.register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password
      })

      setSubmitMessage(response.message || 'Registration successful. Redirecting to login...')
      setTimeout(() => navigate('/login'), 700)
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error, 'Registration failed. Please try again.'))
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
      completeGoogleAuth(response)
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error, 'Google sign-in failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={styles.page}>
      <AuthParticleBackground
        particleCount={105}
        particleColor="rgba(82, 139, 255, 0.42)"
        particleSize={1.8}
        repulsionForce={1.8}
      />
      <div className={styles.particlesLayer} aria-hidden="true"></div>

      <div className={styles.card}>
        <p className={styles.kicker}>REXION AI</p>
        <h1 className={styles.title}>Create your account.</h1>
        <p className={styles.subtitle}>Start with the premium frontend, then move straight into the new dashboard workflow.</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="register-name">Full Name</label>
            <input
              id="register-name"
              type="text"
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              placeholder="Anshupal"
              autoComplete="name"
            />
            {errors.fullName && <span className={styles.error}>{errors.fullName}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="register-password">Password</label>
            <div className={styles.passwordWrap}>
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Create password"
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.toggleButton}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <span className={styles.error}>{errors.password}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="register-confirm">Confirm Password</label>
            <div className={styles.passwordWrap}>
              <input
                id="register-confirm"
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                placeholder="Confirm password"
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.toggleButton}
                onClick={() => setShowConfirm((prev) => !prev)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword}</span>}
          </div>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={form.agree}
              onChange={(event) => {
                const checked = event.target.checked
                setForm((prev) => ({ ...prev, agree: checked }))
              }}
            />
            I agree to the terms and privacy policy
          </label>
          {errors.agree && <span className={styles.error}>{errors.agree}</span>}

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className={styles.authDivider} aria-hidden="true">
            <span>OR</span>
          </div>

          <GoogleSignInButton
            text="signup_with"
            disabled={loading}
            onCredential={handleGoogleCredential}
          />

          {submitMessage && <p className={styles.success}>{submitMessage}</p>}
          {submitError && <p className={styles.error}>{submitError}</p>}
        </form>

        <p className={styles.footerText}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </section>
  )
}

export default Register
