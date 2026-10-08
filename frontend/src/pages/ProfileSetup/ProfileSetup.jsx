import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import profileApi from '../../services/profileApi'
import styles from './ProfileSetup.module.css'

const STEPS = [
  { id: 1, label: 'Personal Info', icon: '👤' },
  { id: 2, label: 'Resume', icon: '📄' },
  { id: 3, label: 'Preferences', icon: '⚙️' },
  { id: 4, label: 'Review', icon: '✅' },
]

const WORK_AUTH_OPTIONS = ['Citizen', 'Permanent Resident', 'Work Visa (H1-B)', 'Work Visa (Other)', 'Need Sponsorship']
const WORK_MODE_OPTIONS = ['remote', 'hybrid', 'on-site', 'any']
const RELOCATION_OPTIONS = ['yes', 'no', 'open']
const EDUCATION_LEVELS = ['High School', 'Associate', 'Bachelor\'s', 'Master\'s', 'PhD', 'Bootcamp', 'Self-taught', 'Other']

export default function ProfileSetup() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileRef = useRef(null)

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    location: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    headline: '',
    resumeUrl: '',
    resumeFileName: '',
    targetRole: '',
    skills: '',
    yearsExperience: '',
    educationLevel: '',
    fieldOfStudy: '',
    workAuth: 'Citizen',
    relocate: 'no',
    workMode: 'remote',
    salaryMin: '',
    salaryMax: '',
    noticePeriod: '',
  })

  // Pre-fill name and email from auth context
  useEffect(() => {
    if (user) {
      const parts = (user.fullName || '').split(' ')
      setForm((prev) => ({
        ...prev,
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
      }))
    }
  }, [user])

  // Load any existing profile from the server
  useEffect(() => {
    profileApi.get().then((data) => {
      const p = data?.profile || {}
      setForm((prev) => ({
        ...prev,
        firstName: p.firstName || prev.firstName,
        lastName: p.lastName || prev.lastName,
        phone: p.phone || '',
        location: p.location || '',
        linkedinUrl: p.linkedinUrl || '',
        githubUrl: p.githubUrl || '',
        portfolioUrl: p.portfolioUrl || '',
        headline: p.headline || '',
        resumeUrl: p.resumeUrl || '',
        resumeFileName: p.resumeFileName || '',
        targetRole: p.targetRole || '',
        skills: Array.isArray(p.skills) ? p.skills.join(', ') : (p.skills || ''),
        yearsExperience: p.yearsExperience || '',
        educationLevel: p.educationLevel || '',
        fieldOfStudy: p.fieldOfStudy || '',
        workAuth: p.workAuth || 'Citizen',
        relocate: p.relocate || 'no',
        workMode: p.workMode || 'remote',
        salaryMin: p.salaryMin || '',
        salaryMax: p.salaryMax || '',
        noticePeriod: p.noticePeriod || '',
      }))
    }).catch(() => {})
  }, [])

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const res = await profileApi.uploadResume(file, setUploadPct)
      set('resumeUrl', res.resumeUrl || '')
      set('resumeFileName', res.resumeFileName || file.name)
      setSuccess('Resume uploaded ✓')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Resume upload failed. Try again.')
    } finally {
      setUploading(false)
      setUploadPct(0)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        skills: form.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }
      await profileApi.save(payload)
      return true
    } catch (err) {
      setError('Failed to save profile. Please try again.')
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    setError('')
    if (step === 1) {
      if (!form.firstName.trim() || !form.lastName.trim()) {
        setError('First and last name are required.')
        return
      }
    }
    if (step < STEPS.length) {
      setStep((s) => s + 1)
    }
  }

  const handleBack = () => {
    setError('')
    setStep((s) => Math.max(1, s - 1))
  }

  const handleFinish = async () => {
    const ok = await saveProfile()
    if (ok) {
      navigate('/dashboard')
    }
  }

  const handleSkip = () => navigate('/dashboard')

  return (
    <div className={styles.root}>
      {/* Left panel — gradient branding */}
      <aside className={styles.sidePanel}>
        <div className={styles.brand}>
          <span className={styles.brandDot} />
          <span className={styles.brandName}>REXION AI</span>
        </div>
        <p className={styles.sideTagline}>
          Set up your profile once — let AI apply to hundreds of jobs automatically.
        </p>
        <nav className={styles.stepNav}>
          {STEPS.map((s) => (
            <button
              key={s.id}
              className={`${styles.stepItem} ${step === s.id ? styles.stepActive : ''} ${step > s.id ? styles.stepDone : ''}`}
              onClick={() => step > s.id && setStep(s.id)}
            >
              <span className={styles.stepIcon}>{step > s.id ? '✓' : s.icon}</span>
              <span className={styles.stepLabel}>{s.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        {/* Progress bar */}
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        <div className={styles.card}>
          {/* Step 1 — Personal Info */}
          {step === 1 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Personal Information</h2>
              <p className={styles.sectionSub}>This is used to auto-fill job applications.</p>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>First Name <span className={styles.req}>*</span></label>
                  <input
                    value={form.firstName}
                    onChange={(e) => set('firstName', e.target.value)}
                    placeholder="Anshu"
                  />
                </div>
                <div className={styles.field}>
                  <label>Last Name <span className={styles.req}>*</span></label>
                  <input
                    value={form.lastName}
                    onChange={(e) => set('lastName', e.target.value)}
                    placeholder="Pal"
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Email</label>
                  <input
                    value={user?.email || ''}
                    readOnly
                    className={styles.readOnly}
                  />
                </div>
                <div className={styles.field}>
                  <label>Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="+1 555 000 0000"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label>Location <span className={styles.hint}>(City, State, Country)</span></label>
                <input
                  value={form.location}
                  onChange={(e) => set('location', e.target.value)}
                  placeholder="New York, NY, USA"
                />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>LinkedIn URL</label>
                  <input
                    value={form.linkedinUrl}
                    onChange={(e) => set('linkedinUrl', e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div className={styles.field}>
                  <label>GitHub URL</label>
                  <input
                    value={form.githubUrl}
                    onChange={(e) => set('githubUrl', e.target.value)}
                    placeholder="https://github.com/username"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label>Portfolio / Website</label>
                <input
                  value={form.portfolioUrl}
                  onChange={(e) => set('portfolioUrl', e.target.value)}
                  placeholder="https://yourportfolio.com"
                />
              </div>
            </section>
          )}

          {/* Step 2 — Resume */}
          {step === 2 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Your Resume</h2>
              <p className={styles.sectionSub}>Upload your resume so we can auto-fill applications.</p>

              <div
                className={`${styles.dropZone} ${form.resumeUrl ? styles.dropZoneDone : ''}`}
                onClick={() => fileRef.current?.click()}
              >
                {form.resumeUrl ? (
                  <>
                    <span className={styles.dropIcon}>✅</span>
                    <p className={styles.dropTitle}>{form.resumeFileName || 'Resume uploaded'}</p>
                    <p className={styles.dropSub}>Click to replace</p>
                  </>
                ) : (
                  <>
                    <span className={styles.dropIcon}>📎</span>
                    <p className={styles.dropTitle}>Click to upload resume</p>
                    <p className={styles.dropSub}>PDF or DOCX · Max 5 MB</p>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className={styles.hidden}
                  onChange={handleFileChange}
                />
              </div>

              {uploading && (
                <div className={styles.uploadProgress}>
                  <div className={styles.uploadBar} style={{ width: `${uploadPct}%` }} />
                  <span>{uploadPct}%</span>
                </div>
              )}

              <div className={styles.field} style={{ marginTop: '1.5rem' }}>
                <label>Professional Headline</label>
                <input
                  value={form.headline}
                  onChange={(e) => set('headline', e.target.value)}
                  placeholder="e.g. Full-Stack Engineer | Open to Remote"
                />
              </div>

              <div className={styles.field}>
                <label>Target Role</label>
                <input
                  value={form.targetRole}
                  onChange={(e) => set('targetRole', e.target.value)}
                  placeholder="e.g. Software Engineer, Data Analyst"
                />
              </div>

              <div className={styles.field}>
                <label>Skills <span className={styles.hint}>(comma-separated)</span></label>
                <input
                  value={form.skills}
                  onChange={(e) => set('skills', e.target.value)}
                  placeholder="React, Node.js, Python, SQL..."
                />
              </div>
            </section>
          )}

          {/* Step 3 — Preferences */}
          {step === 3 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Job Preferences</h2>
              <p className={styles.sectionSub}>Help the AI target the right roles.</p>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    value={form.yearsExperience}
                    onChange={(e) => set('yearsExperience', e.target.value)}
                    placeholder="e.g. 3"
                  />
                </div>
                <div className={styles.field}>
                  <label>Education Level</label>
                  <select value={form.educationLevel} onChange={(e) => set('educationLevel', e.target.value)}>
                    <option value="">-- Select --</option>
                    {EDUCATION_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label>Field of Study</label>
                <input
                  value={form.fieldOfStudy}
                  onChange={(e) => set('fieldOfStudy', e.target.value)}
                  placeholder="e.g. Computer Science"
                />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Work Authorization</label>
                  <select value={form.workAuth} onChange={(e) => set('workAuth', e.target.value)}>
                    {WORK_AUTH_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Work Mode</label>
                  <select value={form.workMode} onChange={(e) => set('workMode', e.target.value)}>
                    {WORK_MODE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Open to Relocation?</label>
                  <select value={form.relocate} onChange={(e) => set('relocate', e.target.value)}>
                    {RELOCATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Notice Period</label>
                  <input
                    value={form.noticePeriod}
                    onChange={(e) => set('noticePeriod', e.target.value)}
                    placeholder="e.g. 2 weeks, Immediate"
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Min Salary (USD)</label>
                  <input
                    type="number"
                    value={form.salaryMin}
                    onChange={(e) => set('salaryMin', e.target.value)}
                    placeholder="60000"
                  />
                </div>
                <div className={styles.field}>
                  <label>Max Salary (USD)</label>
                  <input
                    type="number"
                    value={form.salaryMax}
                    onChange={(e) => set('salaryMax', e.target.value)}
                    placeholder="120000"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Step 4 — Review */}
          {step === 4 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Review & Confirm</h2>
              <p className={styles.sectionSub}>Everything looks good? Hit Finish to save your profile.</p>

              <div className={styles.reviewGrid}>
                <ReviewRow label="Name" value={`${form.firstName} ${form.lastName}`} />
                <ReviewRow label="Email" value={user?.email || '—'} />
                <ReviewRow label="Phone" value={form.phone || '—'} />
                <ReviewRow label="Location" value={form.location || '—'} />
                <ReviewRow label="LinkedIn" value={form.linkedinUrl || '—'} />
                <ReviewRow label="Resume" value={form.resumeFileName || (form.resumeUrl ? 'Uploaded' : '⚠ Not uploaded')} warn={!form.resumeUrl} />
                <ReviewRow label="Headline" value={form.headline || '—'} />
                <ReviewRow label="Target Role" value={form.targetRole || '—'} />
                <ReviewRow label="Skills" value={form.skills || '—'} />
                <ReviewRow label="Work Auth" value={form.workAuth} />
                <ReviewRow label="Work Mode" value={form.workMode} />
                <ReviewRow label="Relocate?" value={form.relocate} />
                <ReviewRow label="Experience" value={form.yearsExperience ? `${form.yearsExperience} yrs` : '—'} />
                <ReviewRow label="Education" value={form.educationLevel || '—'} />
                <ReviewRow label="Salary Range" value={form.salaryMin && form.salaryMax ? `$${Number(form.salaryMin).toLocaleString()} – $${Number(form.salaryMax).toLocaleString()}` : '—'} />
              </div>
            </section>
          )}

          {/* Error / Success */}
          {error && <div className={styles.errorBanner}>{error}</div>}
          {success && <div className={styles.successBanner}>{success}</div>}

          {/* Navigation buttons */}
          <div className={styles.actions}>
            {step > 1 ? (
              <button className={styles.btnSecondary} onClick={handleBack} disabled={saving}>
                ← Back
              </button>
            ) : (
              <button className={styles.btnGhost} onClick={handleSkip}>
                Skip for now
              </button>
            )}

            {step < STEPS.length ? (
              <button className={styles.btnPrimary} onClick={handleNext}>
                Continue →
              </button>
            ) : (
              <button className={styles.btnPrimary} onClick={handleFinish} disabled={saving}>
                {saving ? 'Saving...' : '🚀 Finish & Go to Dashboard'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function ReviewRow({ label, value, warn }) {
  return (
    <div className={`${styles.reviewRow} ${warn ? styles.reviewWarn : ''}`}>
      <span className={styles.reviewLabel}>{label}</span>
      <span className={styles.reviewValue}>{value}</span>
    </div>
  )
}
