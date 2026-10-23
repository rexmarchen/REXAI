import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Code2, CheckCircle2, AlertTriangle, Clock, ShieldAlert,
  ArrowRight, ExternalLink, Sparkles, BookOpen
} from 'lucide-react'
import developerApi from '../../services/developerApi'
import { useAuth } from '../../context/AuthContext'
import styles from './DeveloperApplyPage.module.css'

const TECH_OPTIONS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express.js',
  'MongoDB', 'Python', 'SQL', 'System Design', 'Algorithms',
  'AI / ML', 'DevOps / Cloud', 'Computer Networks'
]

export default function DeveloperApplyPage() {
  const navigate = useNavigate()
  const { user, refreshSession } = useAuth()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [profile, setProfile] = useState(null)
  const [displayName, setDisplayName] = useState(user?.name || '')
  const [title, setTitle] = useState('Full-Stack Developer')
  const [bio, setBio] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [applicationReason, setApplicationReason] = useState('')
  const [selectedTech, setSelectedTech] = useState([])
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const res = await developerApi.getProfile()
        if (res.success && res.profile) {
          setProfile(res.profile)
          setDisplayName(res.profile.displayName || user?.name || '')
          setTitle(res.profile.title || 'Full-Stack Developer')
          setBio(res.profile.bio || '')
          setGithubUrl(res.profile.githubUrl || '')
          setLinkedinUrl(res.profile.linkedinUrl || '')
          setPortfolioUrl(res.profile.portfolioUrl || '')
          setApplicationReason(res.profile.applicationReason || '')
          setSelectedTech(Array.isArray(res.profile.technicalExpertise) ? res.profile.technicalExpertise : [])
        }
      } catch (err) {
        // Not applied yet or profile doesn't exist
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const toggleTech = (tech) => {
    if (selectedTech.includes(tech)) {
      setSelectedTech(selectedTech.filter(t => t !== tech))
    } else {
      setSelectedTech([...selectedTech, tech])
    }
  }

  const handleApply = async (e) => {
    e.preventDefault()
    if (!displayName.trim()) {
      setFeedback({ type: 'error', message: 'Display name is required.' })
      return
    }

    try {
      setSubmitting(true)
      setFeedback(null)
      const res = await developerApi.applyForDeveloper({
        displayName: displayName.trim(),
        title: title.trim(),
        bio: bio.trim(),
        technicalExpertise: selectedTech,
        githubUrl: githubUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        portfolioUrl: portfolioUrl.trim(),
        applicationReason: applicationReason.trim()
      })
      if (res.success) {
        setProfile(res.profile)
        if (typeof refreshSession === 'function') {
          await refreshSession()
        }
        setFeedback({
          type: 'success',
          message: res.profile.status === 'active'
            ? 'Developer profile activated! You can now access the Developer Portal.'
            : 'Your developer application has been submitted and is currently pending administrator review!'
        })
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to submit developer application.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingBox}>
          <p>Checking developer status...</p>
        </div>
      </div>
    )
  }

  // If already active, redirect or show active status banner
  if (profile?.status === 'active' || user?.role === 'developer' || user?.role === 'admin') {
    return (
      <div className={styles.container}>
        <div className={styles.statusCard}>
          <div className={styles.statusIconWrap} style={{ background: '#D1FAE5', color: '#059669' }}>
            <CheckCircle2 size={40} />
          </div>
          <h2>Developer Access Active</h2>
          <p>
            You have active developer privileges on REXION. You can create, edit, preview, and publish technical assessments in the Developer Portal.
          </p>
          <button
            className={styles.primaryBtn}
            onClick={() => navigate('/developer')}
          >
            Launch Developer Portal →
          </button>
        </div>
      </div>
    )
  }

  // If pending review
  if (profile?.status === 'pending') {
    return (
      <div className={styles.container}>
        <div className={styles.statusCard}>
          <div className={styles.statusIconWrap} style={{ background: '#FEF3C7', color: '#D97706' }}>
            <Clock size={40} />
          </div>
          <h2>Application Under Review</h2>
          <p>
            Your developer application is currently being reviewed by the REXION editorial team. You will be notified once your technical creator privileges have been granted.
          </p>
          <div className={styles.pendingDetails}>
            <div><strong>Display Name:</strong> {profile.displayName}</div>
            <div><strong>Expertise:</strong> {(profile.technicalExpertise || []).join(', ') || 'General'}</div>
            <div><strong>Submitted:</strong> {new Date(profile.createdAt).toLocaleDateString()}</div>
          </div>
          <button
            className={styles.secondaryBtn}
            onClick={() => navigate('/career')}
          >
            Return to Career Hub
          </button>
        </div>
      </div>
    )
  }

  // If suspended or revoked
  if (profile?.status === 'suspended' || profile?.status === 'revoked') {
    return (
      <div className={styles.container}>
        <div className={styles.statusCard}>
          <div className={styles.statusIconWrap} style={{ background: '#FEE2E2', color: '#DC2626' }}>
            <ShieldAlert size={40} />
          </div>
          <h2>Developer Access {profile.status === 'suspended' ? 'Suspended' : 'Revoked'}</h2>
          <p>
            Your technical developer account has been {profile.status}. If you believe this is an error or wish to appeal, please contact the administrator.
          </p>
          <button
            className={styles.secondaryBtn}
            onClick={() => navigate('/career')}
          >
            Return to Career Hub
          </button>
        </div>
      </div>
    )
  }

  // Application form
  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <div className={styles.header}>
          <div className={styles.badge}>REXION CREATOR PROGRAM</div>
          <h1 className={styles.title}>Apply for Developer Access</h1>
          <p className={styles.subtitle}>
            Join the technical authoring community to create, refine, and publish technical quizzes and problem sets across DSA, React, Python, System Design, and more.
          </p>
        </div>

        {feedback && (
          <div className={`${styles.feedback} ${styles[feedback.type]}`}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleApply} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Developer Display Name *</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="e.g. Alex Rivera or @alexcodes"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Professional Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Senior Software Engineer / Technical Lead"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Technical Background & Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell us about your engineering background, favorite tech stacks, or authoring experience..."
            />
          </div>

          <div className={styles.formGroup}>
            <label>Primary Technical Domains (Select all that apply)</label>
            <div className={styles.techPillsGrid}>
              {TECH_OPTIONS.map(tech => {
                const isSelected = selectedTech.includes(tech)
                return (
                  <button
                    key={tech}
                    type="button"
                    className={`${styles.techPill} ${isSelected ? styles.techPillActive : ''}`}
                    onClick={() => toggleTech(tech)}
                  >
                    {tech}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className={styles.formGroup}>
              <label>GitHub Profile URL</label>
              <input
                type="url"
                value={githubUrl}
                onChange={e => setGithubUrl(e.target.value)}
                placeholder="https://github.com/yourusername"
              />
            </div>
            <div className={styles.formGroup}>
              <label>LinkedIn Profile URL</label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={e => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourusername"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Portfolio / Personal Website (Optional)</label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={e => setPortfolioUrl(e.target.value)}
              placeholder="https://yourportfolio.dev"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Why do you want to become a REXION Developer Creator?</label>
            <textarea
              rows={2}
              value={applicationReason}
              onChange={e => setApplicationReason(e.target.value)}
              placeholder="Share what motivates you to author technical content, assessments or challenges for REXION students..."
            />
          </div>

          <div className={styles.termsNote}>
            By applying, you agree to adhere to REXION's content standards: authoring original technical questions, providing accurate solutions and pedagogical explanations, and avoiding plagiarism.
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={submitting}
          >
            {submitting ? 'Submitting Application...' : 'Submit Developer Application →'}
          </button>
        </form>
      </div>
    </div>
  )
}
