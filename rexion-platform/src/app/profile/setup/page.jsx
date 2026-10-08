'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Briefcase,
  Target,
  Code2,
  UploadCloud,
  Share2,
  Sliders,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  FileText,
  AlertCircle,
  X,
  Plus,
} from 'lucide-react'

const LOOKING_FOR_OPTIONS = [
  { id: 'Internship', title: 'Internship', desc: 'Summer, fall, or micro-internships at tech startups & companies' },
  { id: 'Full-time', title: 'Full-time Role', desc: 'Graduate, entry-level, or experienced full-time engineering positions' },
  { id: 'Freelance', title: 'Freelance & Gigs', desc: 'High-impact contract work, AI builds, and specialized bounties' },
  { id: 'Exploring', title: 'Exploring Opportunities', desc: 'Passive discovery, interview prep, and career benchmarking' },
]

const POPULAR_ROLES = [
  'AI / ML Engineer',
  'Full Stack Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Software Engineer Intern',
  'DevOps / Cloud Engineer',
  'Data Scientist',
  'Product Engineer',
]

const SUGGESTED_SKILLS = [
  'Python',
  'TypeScript',
  'React',
  'Next.js',
  'Node.js',
  'PyTorch',
  'OpenAI API',
  'PostgreSQL',
  'MongoDB',
  'Docker',
  'Tailwind CSS',
  'LangChain',
]

export default function ProfileSetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  // Form State
  const [lookingFor, setLookingFor] = useState('Full-time')
  const [targetRoles, setTargetRoles] = useState(['Software Engineer'])
  const [customRole, setCustomRole] = useState('')
  const [skills, setSkills] = useState(['Python', 'React', 'TypeScript'])
  const [customSkill, setCustomSkill] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeInfo, setResumeInfo] = useState(null)
  const [socialLinks, setSocialLinks] = useState({
    github: '',
    linkedin: '',
    portfolio: '',
  })
  const [workModes, setWorkModes] = useState(['remote', 'hybrid'])
  const [preferredLocations, setPreferredLocations] = useState('Bengaluru, Remote')
  const [relocation, setRelocation] = useState('open')
  const [completionScore, setCompletionScore] = useState(40)

  // Load existing profile on mount
  useEffect(() => {
    async function loadExisting() {
      try {
        const res = await fetch('/api/profile')
        if (res.ok) {
          const data = await res.json()
          if (data.profile) {
            const p = data.profile
            if (p.jobPreferences?.employmentTypes?.[0]) {
              setLookingFor(p.jobPreferences.employmentTypes[0])
            }
            if (p.targetRoles?.length) {
              setTargetRoles(p.targetRoles)
            }
            if (p.skills?.length) {
              setSkills(p.skills)
            }
            if (p.resume?.fileName) {
              setResumeInfo(p.resume)
            }
            if (p.socialLinks) {
              setSocialLinks((prev) => ({ ...prev, ...p.socialLinks }))
            }
            if (p.jobPreferences?.workModes?.length) {
              setWorkModes(p.jobPreferences.workModes)
            }
            if (p.jobPreferences?.preferredLocations?.length) {
              setPreferredLocations(p.jobPreferences.preferredLocations.join(', '))
            }
          }
          if (data.completion) {
            setCompletionScore(data.completion.percentage || 40)
          }
        }
      } catch (err) {
        console.error('Error loading initial onboarding data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadExisting()
  }, [])

  const handleToggleRole = (role) => {
    setTargetRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  const handleAddCustomRole = (e) => {
    e.preventDefault()
    if (customRole.trim() && !targetRoles.includes(customRole.trim())) {
      setTargetRoles([...targetRoles, customRole.trim()])
      setCustomRole('')
    }
  }

  const handleToggleSkill = (skill) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }

  const handleAddCustomSkill = (e) => {
    e.preventDefault()
    if (customSkill.trim() && !skills.includes(customSkill.trim())) {
      setSkills([...skills, customSkill.trim()])
      setCustomSkill('')
    }
  }

  const handleToggleWorkMode = (mode) => {
    setWorkModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    )
  }

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    const formData = new FormData()
    formData.append('resume', file)

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload resume')
      }
      setResumeInfo(data.resume || { fileName: file.name, atsScore: 80 })
      if (data.profile?.skills?.length) {
        setSkills(Array.from(new Set([...skills, ...data.profile.skills])))
      }
      if (data.completion) {
        setCompletionScore(data.completion.percentage)
      }
    } catch (err) {
      setError(err.message || 'Error uploading resume')
    } finally {
      setUploading(false)
    }
  }

  const saveStepProgress = async () => {
    setSaving(true)
    try {
      const payload = {
        skills,
        targetRoles,
        socialLinks,
        jobPreferences: {
          employmentTypes: [lookingFor],
          targetRoles,
          workModes,
          preferredLocations: preferredLocations.split(',').map((s) => s.trim()).filter(Boolean),
          relocationPreference: relocation,
        },
      }
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.completion) {
        setCompletionScore(data.completion.percentage)
      }
    } catch (err) {
      console.error('Error saving step:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    await saveStepProgress()
    if (step < 7) {
      setStep(step + 1)
    } else {
      setStep(8) // Finish step
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050806] text-white">
        <Loader2 size={32} className="animate-spin text-emerald-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050806] via-[#080d0a] to-[#040605] text-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Top Branding & Step Indicator */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400 font-bold text-[#04110d] text-xs">
              Rx
            </span>
            <span className="font-display font-semibold tracking-tight text-white">REXION</span>
          </Link>

          {step <= 7 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--text-muted)]">Step {step} of 7</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                  <span
                    key={s}
                    className={`h-1.5 w-4 rounded-full transition-all ${
                      s <= step ? 'bg-emerald-400' : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
              Complete
            </span>
          )}
        </div>

        {/* Step Card Content */}
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[rgba(12,20,16,0.92)] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <AnimatePresence mode="wait">
            {/* STEP 1: Welcome */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Welcome to REXION Career OS
                  </h2>
                  <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                    Let&apos;s build your AI career identity in under 2 minutes. Your profile will power intelligent job matching, automated resume tailoring, and 1-click applications.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-[var(--text-secondary)]">
                      Completely isolated and private multi-user environment.
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-[var(--text-secondary)]">
                      Instant ATS parse & automated skills extraction.
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-[var(--text-secondary)]">
                      You stay in full control — skip any optional step at any time.
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Looking For */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">What are you looking for?</h2>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    This helps REXION tailor your intelligence feed and job opportunities.
                  </p>
                </div>

                <div className="grid gap-3">
                  {LOOKING_FOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setLookingFor(opt.id)}
                      className={`flex flex-col items-start rounded-2xl border p-4 text-left transition ${
                        lookingFor === opt.id
                          ? 'border-emerald-400/40 bg-emerald-400/10 shadow-lg shadow-emerald-500/10'
                          : 'border-white/6 bg-white/[0.02] hover:border-white/15'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="text-sm font-bold text-white">{opt.title}</span>
                        {lookingFor === opt.id && <CheckCircle2 size={16} className="text-emerald-400" />}
                      </div>
                      <span className="mt-1 text-xs text-[var(--text-secondary)]">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 3: Choose Target Roles */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">Choose your target roles</h2>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Select roles you want REXION AI to hunt for and match you with.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {POPULAR_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleToggleRole(role)}
                      className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                        targetRoles.includes(role)
                          ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-200'
                          : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:text-white'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleAddCustomRole} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="Add custom role (e.g. AI Research Intern)..."
                    className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-2xl border border-emerald-400/30 bg-emerald-400/15 px-4 py-2.5 text-xs font-semibold text-emerald-200"
                  >
                    Add
                  </button>
                </form>
              </motion.div>
            )}

            {/* STEP 4: Add Skills */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">Add your core skills</h2>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Select your languages, libraries, and AI technologies.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_SKILLS.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleToggleSkill(skill)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                        skills.includes(skill)
                          ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-200'
                          : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:text-white'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleAddCustomSkill} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    placeholder="Add custom skill (e.g. FastAPI, LangGraph)..."
                    className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-2xl border border-emerald-400/30 bg-emerald-400/15 px-4 py-2.5 text-xs font-semibold text-emerald-200"
                  >
                    Add
                  </button>
                </form>
              </motion.div>
            )}

            {/* STEP 5: Upload Resume */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">Upload your resume</h2>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Upload your PDF or DOCX to auto-extract experience, education, and ATS score.
                  </p>
                </div>

                <div className="relative rounded-2xl border-2 border-dashed border-emerald-400/30 bg-black/40 p-8 text-center transition hover:border-emerald-400/60">
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,application/pdf"
                    onChange={handleResumeUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {uploading ? (
                    <div className="space-y-2">
                      <Loader2 size={32} className="mx-auto animate-spin text-emerald-400" />
                      <p className="text-xs font-semibold text-emerald-200">Parsing resume with AI...</p>
                    </div>
                  ) : resumeInfo ? (
                    <div className="space-y-2">
                      <CheckCircle2 size={32} className="mx-auto text-emerald-400" />
                      <p className="text-sm font-bold text-white">{resumeInfo.fileName}</p>
                      <p className="text-xs text-emerald-300">
                        ATS Score: {resumeInfo.atsScore || 85}% • Click to replace
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <UploadCloud size={32} className="mx-auto text-emerald-400" />
                      <p className="text-sm font-semibold text-white">Click or drag resume file here</p>
                      <p className="text-xs text-[var(--text-muted)]">PDF or DOCX (Max 10MB)</p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                    <AlertCircle size={15} />
                    <span>{error}</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 6: Social & Developer Links */}
            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">Add developer links</h2>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Connect your GitHub, LinkedIn, and personal portfolio.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-[var(--text-secondary)]">GitHub Profile</label>
                    <input
                      type="text"
                      value={socialLinks.github}
                      onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })}
                      placeholder="https://github.com/username"
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-[var(--text-secondary)]">LinkedIn Profile</label>
                    <input
                      type="text"
                      value={socialLinks.linkedin}
                      onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-[var(--text-secondary)]">Portfolio / Website</label>
                    <input
                      type="text"
                      value={socialLinks.portfolio}
                      onChange={(e) => setSocialLinks({ ...socialLinks, portfolio: e.target.value })}
                      placeholder="https://yourdomain.com"
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 7: Work Preferences */}
            {step === 7 && (
              <motion.div
                key="step7"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">Set work preferences</h2>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Choose your preferred work mode and relocation preference.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-[var(--text-secondary)]">Work Mode</label>
                  <div className="flex gap-2">
                    {['remote', 'hybrid', 'onsite'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleToggleWorkMode(m)}
                        className={`rounded-xl border px-4 py-2 text-xs font-semibold capitalize transition ${
                          workModes.includes(m)
                            ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-200'
                            : 'border-white/10 bg-white/5 text-[var(--text-secondary)]'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-[var(--text-secondary)]">Preferred Locations</label>
                  <input
                    type="text"
                    value={preferredLocations}
                    onChange={(e) => setPreferredLocations(e.target.value)}
                    placeholder="e.g. Bengaluru, Remote, San Francisco"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-[var(--text-secondary)]">Relocation</label>
                  <select
                    value={relocation}
                    onChange={(e) => setRelocation(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#0e1713] px-4 py-2.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="open">Open to relocation</option>
                    <option value="yes">Actively looking to relocate</option>
                    <option value="no">Not looking to relocate</option>
                  </select>
                </div>
              </motion.div>
            )}

            {/* STEP 8: Success / Ready Screen */}
            {step === 8 && (
              <motion.div
                key="step8"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center py-4"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/20 border border-emerald-400/40 text-emerald-400 shadow-xl shadow-emerald-500/20">
                  <CheckCircle2 size={36} />
                </div>

                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Your REXION Career Profile is ready!
                  </h2>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Profile Completion: <strong className="text-emerald-400">{completionScore}%</strong>
                  </p>
                </div>

                <div className="rounded-2xl border border-white/8 bg-black/40 p-4 max-w-sm mx-auto space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[var(--text-muted)]">Readiness Score</span>
                    <span className="text-emerald-400">{completionScore}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300"
                      style={{ width: `${completionScore}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/profile')}
                    className="w-full sm:w-auto rounded-full border border-white/10 bg-white/5 px-6 py-3 text-xs font-semibold text-white hover:bg-white/10 transition"
                  >
                    View & Edit Full Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-3 text-xs font-semibold text-[#04110d] shadow-lg shadow-emerald-500/20 transition hover:brightness-110"
                  >
                    Go to Command Center
                    <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Controls */}
          {step <= 7 && (
            <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-white transition"
                >
                  <ArrowLeft size={14} />
                  Back
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleNext}
                  className="text-xs font-medium text-[var(--text-muted)] hover:text-white transition"
                >
                  Skip
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2.5 text-xs font-semibold text-[#04110d] transition hover:brightness-110 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      {step === 7 ? 'Complete Setup' : 'Continue'}
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
