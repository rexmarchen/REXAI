import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthParticleBackground from '../../components/common/AuthParticleBackground'
import authApi from '../../services/authApi'
import styles from './Login.module.css'

const Login = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    remember: false
  })
  const [errors, setErrors] = useState({})
  const [submitMessage, setSubmitMessage] = useState('')
  const [submitError, setSubmitError] = useState('')

  const validate = () => {
    const nextErrors = {}

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

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitMessage('')
    setSubmitError('')

    if (!validate()) return

    setLoading(true)
    try {
      const response = await authApi.login({
        email: form.email.trim(),
        password: form.password
      })

      const authPayload = JSON.stringify(response.user)
      const storage = form.remember ? localStorage : sessionStorage

      localStorage.removeItem('rexionAuthToken')
      localStorage.removeItem('rexionUser')
      sessionStorage.removeItem('rexionAuthToken')
      sessionStorage.removeItem('rexionUser')

      storage.setItem('rexionAuthToken', response.token)
      storage.setItem('rexionUser', authPayload)

      setSubmitMessage(response.message || 'Login successful. Redirecting to home...')
      setTimeout(() => navigate('/'), 500)
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={styles.page}>
      <AuthParticleBackground
        particleCount={95}
        particleColor="rgba(200, 230, 255, 0.6)"
        particleSize={2}
        repulsionForce={2.2}
      />
      <div className={styles.particlesLayer} aria-hidden="true"></div>

      <div className={styles.card}>
        <h1 className={styles.title}>LOGIN</h1>
        <p className={styles.subtitle}>Welcome back to REXION AI</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="login-password">Password</label>
            <div className={styles.passwordWrap}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Enter password"
                autoComplete="current-password"
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

          <div className={styles.metaRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(event) => {
                  const checked = event.target.checked
                  setForm((prev) => ({ ...prev, remember: checked }))
                }}
              />
              Remember me
            </label>
            <button type="button" className={styles.linkButton}>Forgot Password?</button>
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          {submitMessage && <p className={styles.success}>{submitMessage}</p>}
          {submitError && <p className={styles.error}>{submitError}</p>}
        </form>

        <p className={styles.footerText}>
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </section>
  )
}

export default Login
