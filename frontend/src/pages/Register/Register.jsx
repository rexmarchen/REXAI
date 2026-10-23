import React, { useMemo, useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Check,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Building2,
  BookOpen,
  Award,
  BarChart3
} from 'lucide-react'
import GoogleSignInButton from '../../components/auth/GoogleSignInButton'
import { useAuth } from '../../context/AuthContext'
import authApi from '../../services/authApi'
import { getAuthErrorMessage, resolveAuthRedirectPath } from '../../utils/authSession'
import { isGoogleAuthConfigured } from '../../config/googleAuth'
import studentRobotImg from '../../assets/rexion_student_robot.png'
import facultyRobotImg from '../../assets/rexion_faculty_robot.png'
import styles from './Register.module.css'

const getDestinationLabel = (path) => {
  if (path.startsWith('/faculty')) return 'Educator Hub'
  if (path.startsWith('/developer')) return 'Developer Portal'
  if (path.startsWith('/resume-predictor')) return 'Resume Predictor'
  if (path.startsWith('/intern-hunt')) return 'Intern Hunt'
  if (path.startsWith('/resume')) return 'Resume Builder'
  if (path.startsWith('/rexcode')) return 'Rexcode'
  if (path.startsWith('/workspace') || path.startsWith('/dashboard')) return 'Dashboard'
  return 'REXION'
}

const Register = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { applyAuthResponse } = useAuth()
  const shouldReduceMotion = useReducedMotion()

  // Determine initial account type from URL if specified
  const initialRole = useMemo(() => {
    const param = (
      searchParams.get('type') ||
      searchParams.get('role') ||
      searchParams.get('accountType') ||
      searchParams.get('mode') ||
      ''
    ).toLowerCase()
    return param === 'faculty' || param === 'educator' ? 'faculty' : 'student'
  }, [searchParams])

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: initialRole,
    agree: false
  })

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [errors, setErrors] = useState({})
  const [submitMessage, setSubmitMessage] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [sweepTrigger, setSweepTrigger] = useState(0)

  const isFaculty = form.accountType === 'faculty'

  // Trigger light sweep effect when role changes
  const handleRoleChange = (newRole) => {
    if (form.accountType === newRole) return
    setForm((prev) => ({ ...prev, accountType: newRole }))
    setSweepTrigger((prev) => prev + 1)
  }

  const validate = () => {
    const nextErrors = {}

    if (!form.fullName.trim()) {
      nextErrors.fullName = 'Full name is required.'
    }

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

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Confirm your password.'
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }

    if (!form.agree) {
      nextErrors.agree = 'You must accept the terms to continue.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const defaultRedirect = isFaculty ? '/faculty/profile' : '/dashboard'
  const nextPath = useMemo(
    () =>
      resolveAuthRedirectPath(
        searchParams.get('next') || location.state?.from?.pathname,
        defaultRedirect
      ),
    [defaultRedirect, location.state, searchParams]
  )
  const destinationLabel = useMemo(() => getDestinationLabel(nextPath), [nextPath])

  const completeGoogleAuth = (response) => {
    applyAuthResponse(response, true)
    setSubmitMessage(response.message || `Google sign-in successful. Redirecting to ${destinationLabel}...`)
    setTimeout(() => navigate(nextPath, { replace: true }), 500)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitMessage('')
    setSubmitError('')

    // Anti-bot honeypot check
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
      const response = await authApi.register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        accountType: form.accountType
      })

      // Auto-login: persist token & user session
      applyAuthResponse(response, true)

      if (form.accountType === 'faculty') {
        setSubmitMessage(response.message || 'Faculty account created! Taking you to educator workspace...')
        setTimeout(() => navigate('/faculty/profile', { replace: true }), 600)
      } else {
        setSubmitMessage(response.message || 'Account created! Taking you to profile setup...')
        setTimeout(() => navigate('/profile-setup', { replace: true }), 600)
      }
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error, 'Registration failed. Please check your details.'))
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
    <div className={styles.pageContainer} data-theme={form.accountType}>
      {/* ------------------------------------------------------------------
          ATMOSPHERIC LAYERS & LIGHT SWEEP
          ------------------------------------------------------------------ */}
      <div className={styles.ambientBackdrop} aria-hidden="true">
        <div className={styles.studentGlow} />
        <div className={styles.facultyGlow} />
        <div className={styles.starField} />
      </div>

      {/* Cinematic Coral Light Sweep across the viewport on role change */}
      <AnimatePresence>
        {sweepTrigger > 0 && !shouldReduceMotion && (
          <motion.div
            key={sweepTrigger}
            className={styles.coralLightSweep}
            initial={{ x: '-120%', opacity: 0 }}
            animate={{ x: '160%', opacity: [0, 0.5, 0.75, 0.4, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------
          TOP NAVIGATION
          ------------------------------------------------------------------ */}
      <header className={styles.topNav}>
        <Link to="/" className={styles.brandLink} aria-label="REXION AI Home">
          <div className={styles.brandLogoMark}>R</div>
          <div className={styles.brandTitle}>
            REXION <span>AI</span>
          </div>
          <div className={styles.brandTaglineWrap}>
            <div className={styles.brandDivider} />
            <span className={styles.brandTagline}>Build · Learn · Grow</span>
          </div>
        </Link>

        <div className={styles.topNavRight}>
          <span className={styles.topNavPrompt}>Already have an account?</span>
          <Link
            to={`/login?next=${encodeURIComponent(nextPath)}`}
            className={styles.navSignInBtn}
          >
            <span>Sign In</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* ------------------------------------------------------------------
          MAIN 3-COLUMN CONTENT GRID
          ------------------------------------------------------------------ */}
      <main className={styles.mainGrid}>
        {/* ================================================================
            LEFT HERO COLUMN
            ================================================================ */}
        <div className={styles.heroColumn}>
          <AnimatePresence mode="wait">
            {!isFaculty ? (
              <motion.div
                key="student-hero"
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
              >
                <div className={styles.heroHandwrittenTop}>
                  Your Future Starts Here ✦
                </div>
                <h1 className={styles.heroHeading}>
                  Create your <span className={styles.coralAccentText}>account.</span>
                </h1>
                <p className={styles.heroSubtext}>
                  Join REXION and take the first step towards your dream career with AI-guided acceleration.
                </p>

                <div className={styles.heroBadgesRow}>
                  <div className={styles.heroBadge}>
                    <Briefcase size={14} className={styles.heroBadgeIcon} />
                    <span>Find Jobs & Internships</span>
                  </div>
                  <div className={styles.heroBadge}>
                    <GraduationCap size={14} className={styles.heroBadgeIcon} />
                    <span>Build Your Skills</span>
                  </div>
                  <div className={styles.heroBadge}>
                    <TrendingUp size={14} className={styles.heroBadgeIcon} />
                    <span>Track Your Progress</span>
                  </div>
                </div>

                <div className={styles.mascotFrame}>
                  <img
                    src={studentRobotImg}
                    alt="Cozy REXION student mascot learning at desk"
                    className={styles.mascotImage}
                    loading="lazy"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="faculty-hero"
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
              >
                <div className={styles.heroTagPill}>
                  <Sparkles size={13} />
                  <span>Your Career. Powered by AI.</span>
                </div>
                <h1 className={styles.heroHeading}>
                  Create your <span className={styles.coralAccentText}>account.</span>
                </h1>
                <p className={styles.heroSubtext}>
                  Empower students through real-world challenges, automated AI quizzes, and verifiable hiring skill benchmarks.
                </p>

                <div className={styles.heroBadgesRow}>
                  <div className={styles.heroBadge}>
                    <Building2 size={14} className={styles.heroBadgeIcon} />
                    <span>Academic Workspace</span>
                  </div>
                  <div className={styles.heroBadge}>
                    <Sparkles size={14} className={styles.heroBadgeIcon} />
                    <span>Live Challenges</span>
                  </div>
                  <div className={styles.heroBadge}>
                    <BarChart3 size={14} className={styles.heroBadgeIcon} />
                    <span>Progress Analytics</span>
                  </div>
                </div>

                <div className={styles.mascotFrame}>
                  <img
                    src={facultyRobotImg}
                    alt="Cinematic REXION educator robot mascot"
                    className={styles.mascotImage}
                    loading="lazy"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ================================================================
            CENTER REGISTRATION CARD
            ================================================================ */}
        <div className={styles.formCardWrapper}>
          <div className={styles.formCard}>
            <span className={styles.cardTopKicker}>REXION AI</span>
            <h2 className={styles.cardTitle}>
              Create your <span className={styles.coralAccentText}>account.</span>
            </h2>
            <p className={styles.cardSubtitle}>
              {destinationLabel === 'Dashboard'
                ? 'Create an account to continue to REXION.'
                : `Create an account to continue to ${destinationLabel}.`}
            </p>

            {/* Central Animated Role Switcher */}
            <div className={styles.roleSelectorContainer}>
              <label className={styles.roleSelectorLabel}>I am joining as:</label>
              <div className={styles.roleSegmentTrack} role="tablist" aria-label="Account Type">
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isFaculty}
                  className={`${styles.roleButton} ${!isFaculty ? styles.roleButtonActive : ''}`}
                  onClick={() => handleRoleChange('student')}
                >
                  {!isFaculty && (
                    <motion.div
                      layoutId="activeRoleIndicator"
                      className={styles.roleActiveIndicatorPill}
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <GraduationCap size={16} style={{ position: 'relative', zIndex: 3 }} />
                  <span style={{ position: 'relative', zIndex: 3 }}>Student / Candidate</span>
                  {!isFaculty && (
                    <span className={styles.roleDotIndicator} style={{ position: 'relative', zIndex: 3 }} />
                  )}
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={isFaculty}
                  className={`${styles.roleButton} ${isFaculty ? styles.roleButtonActive : ''}`}
                  onClick={() => handleRoleChange('faculty')}
                >
                  {isFaculty && (
                    <motion.div
                      layoutId="activeRoleIndicator"
                      className={styles.roleActiveIndicatorPill}
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <Building2 size={16} style={{ position: 'relative', zIndex: 3 }} />
                  <span style={{ position: 'relative', zIndex: 3 }}>Faculty / Educator</span>
                  {isFaculty && (
                    <span className={styles.roleDotIndicator} style={{ position: 'relative', zIndex: 3 }} />
                  )}
                </button>
              </div>
            </div>

            {/* Registration Form */}
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              {/* Anti-bot honeypot field */}
              <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0, zIndex: -1 }} aria-hidden="true">
                <label htmlFor="reg_safety_check">Leave empty</label>
                <input
                  id="reg_safety_check"
                  name="reg_safety_check"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {/* Full Name */}
              <div className={styles.field}>
                <label htmlFor="register-name" className={styles.fieldLabel}>
                  <User size={14} className={styles.fieldLabelIcon} />
                  <span>Full Name</span>
                </label>
                <div className={styles.inputWrap}>
                  <input
                    id="register-name"
                    type="text"
                    className={styles.inputField}
                    value={form.fullName}
                    onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter your full name"
                    autoComplete="name"
                  />
                  <span className={styles.inputPrefixIcon}>
                    <User size={15} />
                  </span>
                </div>
                {errors.fullName && <span className={styles.errorMessage}>{errors.fullName}</span>}
              </div>

              {/* Email Address */}
              <div className={styles.field}>
                <label htmlFor="register-email" className={styles.fieldLabel}>
                  <Mail size={14} className={styles.fieldLabelIcon} />
                  <span>Email</span>
                </label>
                <div className={styles.inputWrap}>
                  <input
                    id="register-email"
                    type="email"
                    className={styles.inputField}
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                  <span className={styles.inputPrefixIcon}>
                    <Mail size={15} />
                  </span>
                </div>
                {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
              </div>

              {/* Password */}
              <div className={styles.field}>
                <label htmlFor="register-password" className={styles.fieldLabel}>
                  <Lock size={14} className={styles.fieldLabelIcon} />
                  <span>Password</span>
                </label>
                <div className={styles.inputWrap}>
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    className={styles.inputField}
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Create password"
                    autoComplete="new-password"
                  />
                  <span className={styles.inputPrefixIcon}>
                    <Lock size={15} />
                  </span>
                  <button
                    type="button"
                    className={styles.togglePassBtn}
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                {errors.password && <span className={styles.errorMessage}>{errors.password}</span>}
              </div>

              {/* Confirm Password */}
              <div className={styles.field}>
                <label htmlFor="register-confirm" className={styles.fieldLabel}>
                  <Lock size={14} className={styles.fieldLabelIcon} />
                  <span>Confirm Password</span>
                </label>
                <div className={styles.inputWrap}>
                  <input
                    id="register-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    className={styles.inputField}
                    value={form.confirmPassword}
                    onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                  />
                  <span className={styles.inputPrefixIcon}>
                    <Lock size={15} />
                  </span>
                  <button
                    type="button"
                    className={styles.togglePassBtn}
                    onClick={() => setShowConfirm((prev) => !prev)}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                    <span>{showConfirm ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className={styles.errorMessage}>{errors.confirmPassword}</span>
                )}
              </div>

              {/* Terms and Privacy Checkbox */}
              <label className={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={form.agree}
                  onChange={(e) => setForm((prev) => ({ ...prev, agree: e.target.checked }))}
                />
                <span>
                  I agree to the{' '}
                  <Link to="/terms" target="_blank" className={styles.termsLink}>
                    terms
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" target="_blank" className={styles.termsLink}>
                    privacy policy
                  </Link>
                  .
                </span>
              </label>
              {errors.agree && <span className={styles.errorMessage}>{errors.agree}</span>}

              {/* Submit CTA Button */}
              <motion.button
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
                whileHover={shouldReduceMotion ? {} : { scale: 1.015 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.985 }}
              >
                {loading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </motion.button>

              {/* Optional Google Sign-In */}
              {isGoogleAuthConfigured() && (
                <>
                  <div className={styles.authDivider} aria-hidden="true">
                    <span>OR</span>
                  </div>

                  <GoogleSignInButton
                    text="signup_with"
                    disabled={loading}
                    onCredential={handleGoogleCredential}
                  />
                </>
              )}

              {/* Feedback Alerts */}
              {submitError && (
                <div className={`${styles.feedbackAlert} ${styles.alertError}`} role="alert">
                  <Lock size={14} />
                  <span>{submitError}</span>
                </div>
              )}
              {submitMessage && (
                <div className={`${styles.feedbackAlert} ${styles.alertSuccess}`} role="status">
                  <Check size={14} />
                  <span>{submitMessage}</span>
                </div>
              )}
            </form>

            <div className={styles.cardFooterText}>
              Already have an account?
              <Link to={`/login?next=${encodeURIComponent(nextPath)}`} className={styles.cardFooterLink}>
                Log in
              </Link>
            </div>
          </div>
        </div>

        {/* ================================================================
            RIGHT DECORATIVE COLUMN
            ================================================================ */}
        <div className={styles.rightColumn}>
          <AnimatePresence mode="wait">
            {!isFaculty ? (
              <motion.div
                key="student-features"
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
              >
                <div className={styles.rightHandwrittenTop}>
                  Small Steps Big Dreams ♡
                </div>

                <div className={styles.featureCardsStack}>
                  <div className={styles.featureCard}>
                    <div className={styles.featureCardIconWrap}>
                      <Briefcase size={20} />
                    </div>
                    <div className={styles.featureCardContent}>
                      <div className={styles.featureCardTitle}>Personalized Career Guidance</div>
                      <div className={styles.featureCardDesc}>Get AI-powered insights & custom roadmaps</div>
                    </div>
                  </div>

                  <div className={styles.featureCard}>
                    <div className={styles.featureCardIconWrap}>
                      <Sparkles size={20} />
                    </div>
                    <div className={styles.featureCardContent}>
                      <div className={styles.featureCardTitle}>Real Internship Opportunities</div>
                      <div className={styles.featureCardDesc}>Direct apply links & verified company openings</div>
                    </div>
                  </div>

                  <div className={styles.featureCard}>
                    <div className={styles.featureCardIconWrap}>
                      <GraduationCap size={20} />
                    </div>
                    <div className={styles.featureCardContent}>
                      <div className={styles.featureCardTitle}>Build In-Demand Skills</div>
                      <div className={styles.featureCardDesc}>Stay ahead of the curve with Code Arena & AI tutoring</div>
                    </div>
                  </div>
                </div>

                <div className={styles.rightHandwrittenBottom}>
                  <span>Good Things Ahead ♡</span>
                  {/* Minimalist Mountain Line-Art Doodle */}
                  <svg
                    width="110"
                    height="42"
                    viewBox="0 0 110 42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={styles.doodleSvg}
                    aria-hidden="true"
                  >
                    <path d="M4 38L32 10L52 28L72 16L102 38" />
                    <path d="M24 18L32 26L42 18" />
                    <path d="M64 22L72 28L80 22" />
                    <circle cx="92" cy="12" r="4.5" strokeDasharray="2 2" />
                    <path d="M92 4V6M92 18V20M84 12H86M98 12H100" />
                  </svg>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="faculty-features"
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
              >
                <div className={styles.rightHandwrittenTop}>
                  Dream · Learn · Build Your Future ♡
                </div>

                <div className={styles.featureCardsStack}>
                  <div className={styles.featureCard}>
                    <div className={styles.featureCardIconWrap}>
                      <BookOpen size={20} />
                    </div>
                    <div className={styles.featureCardContent}>
                      <div className={styles.featureCardTitle}>Create Quizzes</div>
                      <div className={styles.featureCardDesc}>Design adaptive assessments with automated grading</div>
                    </div>
                  </div>

                  <div className={styles.featureCard}>
                    <div className={styles.featureCardIconWrap}>
                      <Award size={20} />
                    </div>
                    <div className={styles.featureCardContent}>
                      <div className={styles.featureCardTitle}>Publish Challenges</div>
                      <div className={styles.featureCardDesc}>Host coding competitions & live hackathons</div>
                    </div>
                  </div>

                  <div className={styles.featureCard}>
                    <div className={styles.featureCardIconWrap}>
                      <BarChart3 size={20} />
                    </div>
                    <div className={styles.featureCardContent}>
                      <div className={styles.featureCardTitle}>Track Student Progress</div>
                      <div className={styles.featureCardDesc}>Cohort analytics on skill mastery & hiring readiness</div>
                    </div>
                  </div>
                </div>

                <div className={styles.rightHandwrittenBottom}>
                  <span>You Got This ♡</span>
                  {/* Subtle Glowing Constellation Sparkles */}
                  <svg
                    width="100"
                    height="38"
                    viewBox="0 0 100 38"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={styles.doodleSvg}
                    aria-hidden="true"
                  >
                    <path d="M18 4L21 13L30 16L21 19L18 28L15 19L6 16L15 13Z" fill="currentColor" fillOpacity="0.25" />
                    <path d="M68 10L70 16L76 18L70 20L68 26L66 20L60 18L66 16Z" fill="currentColor" fillOpacity="0.3" />
                    <circle cx="44" cy="10" r="1.5" fill="currentColor" />
                    <circle cx="86" cy="22" r="1.5" fill="currentColor" />
                  </svg>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

export default Register
