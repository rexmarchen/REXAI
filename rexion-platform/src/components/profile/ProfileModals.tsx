'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Plus,
  Trash2,
  Loader2,
  Check,
  AlertCircle,
  UploadCloud,
  FileText,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Github,
  Linkedin,
  Globe,
  Code2,
} from 'lucide-react'
import type {
  CareerProfileShape,
  ProfileExperience,
  ProfileEducation,
  ProfileProject,
  ProfileCertification,
  ProfileAchievement,
  ProfileSocialLinks,
  ProfileJobPreferences,
  ProfileWorkAuthorization,
  ProfileApplicationPreferences,
  ProfilePrivacySettings,
  CategorizedSkills,
} from '@/types/profile'

// Base Modal Wrapper
function ModalWrapper({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0c1410] p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white">{title}</h3>
            {subtitle && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mt-6 max-h-[75vh] overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  )
}

// 1. Basic Info Modal
export function EditBasicInfoModal({
  profile,
  userName,
  onClose,
  onSave,
}: {
  profile: CareerProfileShape
  userName: string
  onClose: () => void
  onSave: (data: Partial<CareerProfileShape> & { name?: string }) => Promise<void>
}) {
  const [name, setName] = useState(userName || '')
  const [headline, setHeadline] = useState(profile.headline || '')
  const [city, setCity] = useState(profile.city || profile.location?.city || '')
  const [country, setCountry] = useState(profile.country || profile.location?.country || 'India')
  const [phone, setPhone] = useState(profile.phone || '')
  const [careerLevel, setCareerLevel] = useState(profile.careerLevel || 'Student / Intern')
  const [currentStatus, setCurrentStatus] = useState(profile.currentStatus || 'Actively Looking')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSave({
      name,
      headline,
      city,
      country,
      location: {
        city,
        country,
        state: profile.location?.state || '',
        timezone: profile.location?.timezone || '',
      },
      phone,
      careerLevel: careerLevel as any,
      currentStatus: currentStatus as any,
    })
    setSaving(false)
    onClose()
  }

  return (
    <ModalWrapper title="Edit Basic Information" subtitle="Personal details and career identity" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Professional Headline</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Full Stack Engineer • AI & Next.js Enthusiast"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Bengaluru"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Country</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. India"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Career Level</label>
            <select
              value={careerLevel}
              onChange={(e) => setCareerLevel(e.target.value as any)}
              className="w-full rounded-2xl border border-white/10 bg-[#0e1713] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            >
              <option value="Student / Intern">Student / Intern</option>
              <option value="Entry Level">Entry Level</option>
              <option value="Mid Level">Mid Level</option>
              <option value="Senior">Senior</option>
              <option value="Lead / Principal">Lead / Principal</option>
              <option value="Executive">Executive</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Current Status</label>
            <select
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value as any)}
              className="w-full rounded-2xl border border-white/10 bg-[#0e1713] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            >
              <option value="Actively Looking">Actively Looking</option>
              <option value="Open to Offers">Open to Offers</option>
              <option value="Interviewing">Interviewing</option>
              <option value="Employed & Not Looking">Employed & Not Looking</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2 text-xs font-semibold text-[#04110d] transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Changes
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// 2. About Modal
export function EditAboutModal({
  profile,
  onClose,
  onSave,
}: {
  profile: CareerProfileShape
  onClose: () => void
  onSave: (data: Partial<CareerProfileShape>) => Promise<void>
}) {
  const [summary, setSummary] = useState(profile.professionalSummary || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSave({ professionalSummary: summary })
    setSaving(false)
    onClose()
  }

  return (
    <ModalWrapper title="Edit Professional Summary" subtitle="Elevator pitch for recruiters and AI matching" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">About You</label>
          <textarea
            rows={6}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Write 2-4 sentences describing your background, core technical strengths, proudest achievements, and what you're excited to work on next."
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white focus:border-emerald-400 focus:outline-none leading-relaxed"
            required
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2 text-xs font-semibold text-[#04110d] transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Summary
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// 3. Career Direction Modal
export function EditCareerDirectionModal({
  profile,
  onClose,
  onSave,
}: {
  profile: CareerProfileShape
  onClose: () => void
  onSave: (data: Partial<CareerProfileShape>) => Promise<void>
}) {
  const [targetRolesInput, setTargetRolesInput] = useState((profile.targetRoles || []).join(', '))
  const [secondaryRolesInput, setSecondaryRolesInput] = useState((profile.secondaryRoles || []).join(', '))
  const [industriesInput, setIndustriesInput] = useState((profile.industries || []).join(', '))
  const [careerLevel, setCareerLevel] = useState(profile.careerLevel || 'Student / Intern')
  const [currentStatus, setCurrentStatus] = useState(profile.currentStatus || 'Actively Looking')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const targetRoles = targetRolesInput.split(',').map((s) => s.trim()).filter(Boolean)
    const secondaryRoles = secondaryRolesInput.split(',').map((s) => s.trim()).filter(Boolean)
    const industries = industriesInput.split(',').map((s) => s.trim()).filter(Boolean)

    await onSave({
      targetRoles,
      secondaryRoles,
      industries,
      careerLevel: careerLevel as any,
      currentStatus: currentStatus as any,
    })
    setSaving(false)
    onClose()
  }

  return (
    <ModalWrapper title="Career Direction" subtitle="Target roles, seniority level, and industry preferences" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">
            Primary Target Roles <span className="text-[var(--text-muted)]">(comma separated)</span>
          </label>
          <input
            type="text"
            value={targetRolesInput}
            onChange={(e) => setTargetRolesInput(e.target.value)}
            placeholder="e.g. AI/ML Engineer, Full Stack Developer, Frontend Architect"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">
            Secondary Roles <span className="text-[var(--text-muted)]">(comma separated)</span>
          </label>
          <input
            type="text"
            value={secondaryRolesInput}
            onChange={(e) => setSecondaryRolesInput(e.target.value)}
            placeholder="e.g. DevOps Engineer, Technical Writer, Product Engineer"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">
            Target Industries <span className="text-[var(--text-muted)]">(comma separated)</span>
          </label>
          <input
            type="text"
            value={industriesInput}
            onChange={(e) => setIndustriesInput(e.target.value)}
            placeholder="e.g. Artificial Intelligence, FinTech, SaaS, Developer Tools"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Career Level</label>
            <select
              value={careerLevel}
              onChange={(e) => setCareerLevel(e.target.value as any)}
              className="w-full rounded-2xl border border-white/10 bg-[#0e1713] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            >
              <option value="Student / Intern">Student / Intern</option>
              <option value="Entry Level">Entry Level</option>
              <option value="Mid Level">Mid Level</option>
              <option value="Senior">Senior</option>
              <option value="Lead / Principal">Lead / Principal</option>
              <option value="Executive">Executive</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Current Status</label>
            <select
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value as any)}
              className="w-full rounded-2xl border border-white/10 bg-[#0e1713] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            >
              <option value="Actively Looking">Actively Looking</option>
              <option value="Open to Offers">Open to Offers</option>
              <option value="Interviewing">Interviewing</option>
              <option value="Employed & Not Looking">Employed & Not Looking</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2 text-xs font-semibold text-[#04110d] transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Direction
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// 4. Skills Modal
export function EditSkillsModal({
  profile,
  onClose,
  onSave,
}: {
  profile: CareerProfileShape
  onClose: () => void
  onSave: (data: Partial<CareerProfileShape>) => Promise<void>
}) {
  const [categorized, setCategorized] = useState<CategorizedSkills>({
    languages: profile.categorizedSkills?.languages || profile.languages || [],
    aiMl: profile.categorizedSkills?.aiMl || [],
    frameworks: profile.categorizedSkills?.frameworks || profile.frameworks || [],
    databases: profile.categorizedSkills?.databases || profile.databases || [],
    tools: profile.categorizedSkills?.tools || profile.tools || [],
    other: profile.categorizedSkills?.other || [],
  })

  const [newSkillText, setNewSkillText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<keyof CategorizedSkills>('languages')
  const [saving, setSaving] = useState(false)

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newSkillText.trim()
    if (!trimmed) return

    const skillsToAdd = trimmed.split(',').map((s) => s.trim()).filter(Boolean)
    setCategorized((prev) => ({
      ...prev,
      [selectedCategory]: Array.from(new Set([...(prev[selectedCategory] || []), ...skillsToAdd])),
    }))
    setNewSkillText('')
  }

  const handleRemoveSkill = (category: keyof CategorizedSkills, skillToRemove: string) => {
    setCategorized((prev) => ({
      ...prev,
      [category]: (prev[category] || []).filter((s) => s !== skillToRemove),
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    const allSkills = [
      ...(categorized.languages || []),
      ...(categorized.aiMl || []),
      ...(categorized.frameworks || []),
      ...(categorized.databases || []),
      ...(categorized.tools || []),
      ...(categorized.other || []),
    ]
    await onSave({
      categorizedSkills: categorized,
      skills: Array.from(new Set(allSkills)),
      languages: categorized.languages,
      frameworks: categorized.frameworks,
      databases: categorized.databases,
      tools: categorized.tools,
    })
    setSaving(false)
    onClose()
  }

  return (
    <ModalWrapper title="Manage Technical Skills" subtitle="Add, categorize, and organize your tech stack" onClose={onClose}>
      <div className="space-y-6">
        {/* Quick Add Bar */}
        <form onSubmit={handleAddSkill} className="flex flex-col gap-2 sm:flex-row">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="rounded-2xl border border-white/10 bg-[#0e1713] px-3 py-2 text-xs font-semibold text-emerald-300 focus:border-emerald-400 focus:outline-none sm:w-44"
          >
            <option value="languages">Languages</option>
            <option value="aiMl">AI / ML</option>
            <option value="frameworks">Frameworks</option>
            <option value="databases">Databases</option>
            <option value="tools">Dev Tools</option>
            <option value="other">Other</option>
          </select>

          <input
            type="text"
            value={newSkillText}
            onChange={(e) => setNewSkillText(e.target.value)}
            placeholder="Type skill (e.g. Python, PyTorch) & press Add"
            className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
          />

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-400/15 border border-emerald-400/30 px-4 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-400/25"
          >
            <Plus size={14} />
            Add
          </button>
        </form>

        {/* Categories Breakdown */}
        <div className="space-y-4">
          {(
            [
              { key: 'languages', label: 'Programming Languages' },
              { key: 'aiMl', label: 'AI & Machine Learning' },
              { key: 'frameworks', label: 'Frameworks & Libraries' },
              { key: 'databases', label: 'Databases & Storage' },
              { key: 'tools', label: 'Tools & DevOps' },
              { key: 'other', label: 'Other Skills' },
            ] as const
          ).map((cat) => {
            const list = categorized[cat.key] || []
            return (
              <div key={cat.key} className="rounded-2xl border border-white/6 bg-black/20 p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {cat.label} ({list.length})
                  </span>
                </div>
                {list.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] italic">No skills in this category</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {list.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(cat.key, skill)}
                          className="text-[var(--text-muted)] hover:text-rose-400 transition"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2 text-xs font-semibold text-[#04110d] transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Skills
          </button>
        </div>
      </div>
    </ModalWrapper>
  )
}

// 5. Add / Edit Experience Modal
export function ExperienceModal({
  initialData,
  index,
  onClose,
  onSave,
}: {
  initialData?: ProfileExperience | null
  index?: number | null
  onClose: () => void
  onSave: (item: ProfileExperience, index?: number | null) => Promise<void>
}) {
  const [company, setCompany] = useState(initialData?.company || '')
  const [role, setRole] = useState(initialData?.role || '')
  const [employmentType, setEmploymentType] = useState(initialData?.employmentType || 'Full-time')
  const [location, setLocation] = useState(initialData?.location || '')
  const [startDate, setStartDate] = useState(initialData?.startDate || '')
  const [endDate, setEndDate] = useState(initialData?.endDate || '')
  const [isCurrent, setIsCurrent] = useState(Boolean(initialData?.isCurrent))
  const [description, setDescription] = useState(initialData?.description || '')
  const [skillsInput, setSkillsInput] = useState((initialData?.skills || []).join(', '))
  const [companyUrl, setCompanyUrl] = useState(initialData?.companyUrl || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const skills = skillsInput.split(',').map((s) => s.trim()).filter(Boolean)
    await onSave(
      {
        company,
        role,
        employmentType: employmentType as any,
        location,
        startDate,
        endDate: isCurrent ? '' : endDate,
        isCurrent,
        description,
        skills,
        companyUrl,
      },
      index
    )
    setSaving(false)
    onClose()
  }

  return (
    <ModalWrapper
      title={initialData ? 'Edit Experience' : 'Add Experience'}
      subtitle="Work, internships, freelance gigs, and open-source contributions"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Company / Organization</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Google, Razorpay, Stealth Startup"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Role / Job Title</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Engineer Intern"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Employment Type</label>
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value as any)}
              className="w-full rounded-2xl border border-white/10 bg-[#0e1713] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            >
              <option value="Internship">Internship</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Freelance">Freelance</option>
              <option value="Contract">Contract</option>
              <option value="Open source">Open source</option>
              <option value="Volunteer">Volunteer</option>
              <option value="Hackathon">Hackathon</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Remote / Bengaluru, India"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Start Date</label>
            <input
              type="text"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="e.g. Jun 2024"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">End Date</label>
            <input
              type="text"
              value={isCurrent ? 'Present' : endDate}
              disabled={isCurrent}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="e.g. Aug 2024"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isCurrentExp"
            checked={isCurrent}
            onChange={(e) => setIsCurrent(e.target.checked)}
            className="h-4 w-4 rounded accent-emerald-400"
          />
          <label htmlFor="isCurrentExp" className="text-xs text-white select-none cursor-pointer">
            I am currently working in this role
          </label>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Description / Impact</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="• Built automated CI/CD pipeline reducing deployment time by 40%&#10;• Developed reactive UI components with Next.js and Tailwind CSS"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white focus:border-emerald-400 focus:outline-none leading-relaxed"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">
            Skills Used <span className="text-[var(--text-muted)]">(comma separated)</span>
          </label>
          <input
            type="text"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            placeholder="e.g. React, Node.js, AWS, MongoDB"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Company URL (optional)</label>
          <input
            type="url"
            value={companyUrl}
            onChange={(e) => setCompanyUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2 text-xs font-semibold text-[#04110d] transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Experience
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// 6. Add / Edit Project Modal
export function ProjectModal({
  initialData,
  index,
  onClose,
  onSave,
}: {
  initialData?: ProfileProject | null
  index?: number | null
  onClose: () => void
  onSave: (item: ProfileProject, index?: number | null) => Promise<void>
}) {
  const [title, setTitle] = useState(initialData?.title || initialData?.projectName || '')
  const [role, setRole] = useState(initialData?.role || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [technologiesInput, setTechnologiesInput] = useState((initialData?.technologies || []).join(', '))
  const [githubUrl, setGithubUrl] = useState(initialData?.githubUrl || '')
  const [liveUrl, setLiveUrl] = useState(initialData?.liveUrl || '')
  const [startDate, setStartDate] = useState(initialData?.startDate || '')
  const [endDate, setEndDate] = useState(initialData?.endDate || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const technologies = technologiesInput.split(',').map((s) => s.trim()).filter(Boolean)
    await onSave(
      {
        title,
        projectName: title,
        role,
        description,
        technologies,
        githubUrl,
        liveUrl,
        startDate,
        endDate,
      },
      index
    )
    setSaving(false)
    onClose()
  }

  return (
    <ModalWrapper
      title={initialData ? 'Edit Project' : 'Add Project'}
      subtitle="Showcase technical depth, open-source repos, and live apps"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Project Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AI Agent Career Platform"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Your Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Sole Creator / Lead Full-Stack"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Built an autonomous AI application engine with Next.js 14, LangChain, and MongoDB. Achieved 98% accuracy in resume matching."
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white focus:border-emerald-400 focus:outline-none leading-relaxed"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">
            Technologies Used <span className="text-[var(--text-muted)]">(comma separated)</span>
          </label>
          <input
            type="text"
            value={technologiesInput}
            onChange={(e) => setTechnologiesInput(e.target.value)}
            placeholder="e.g. Next.js, TypeScript, OpenAI API, Tailwind CSS, MongoDB"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">GitHub URL</label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username/project"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Live Demo URL</label>
            <input
              type="url"
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              placeholder="https://project.com"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Start Date</label>
            <input
              type="text"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="e.g. Jan 2024"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">End Date</label>
            <input
              type="text"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="e.g. Apr 2024"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2 text-xs font-semibold text-[#04110d] transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Project
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// 7. Add / Edit Education Modal
export function EducationModal({
  initialData,
  index,
  onClose,
  onSave,
}: {
  initialData?: ProfileEducation | null
  index?: number | null
  onClose: () => void
  onSave: (item: ProfileEducation, index?: number | null) => Promise<void>
}) {
  const [institution, setInstitution] = useState(initialData?.institution || '')
  const [degree, setDegree] = useState(initialData?.degree || '')
  const [fieldOfStudy, setFieldOfStudy] = useState(initialData?.fieldOfStudy || '')
  const [startYear, setStartYear] = useState(initialData?.startYear || '')
  const [endYear, setEndYear] = useState(initialData?.endYear || '')
  const [isCurrent, setIsCurrent] = useState(Boolean(initialData?.isCurrent))
  const [cgpa, setCgpa] = useState(initialData?.cgpa || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSave(
      {
        institution,
        degree,
        fieldOfStudy,
        startYear,
        endYear: isCurrent ? '' : endYear,
        isCurrent,
        cgpa,
        description,
      },
      index
    )
    setSaving(false)
    onClose()
  }

  return (
    <ModalWrapper
      title={initialData ? 'Edit Education' : 'Add Education'}
      subtitle="University, college, degree, and academic specialization"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Institution / University</label>
          <input
            type="text"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder="e.g. Stanford University, IIT Bombay, University of Toronto"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Degree</label>
            <input
              type="text"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              placeholder="e.g. B.Tech, B.S., M.S."
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Field of Study</label>
            <input
              type="text"
              value={fieldOfStudy}
              onChange={(e) => setFieldOfStudy(e.target.value)}
              placeholder="e.g. Computer Science & AI"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Start Year</label>
            <input
              type="text"
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
              placeholder="e.g. 2022"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Graduation Year</label>
            <input
              type="text"
              value={isCurrent ? 'Present' : endYear}
              disabled={isCurrent}
              onChange={(e) => setEndYear(e.target.value)}
              placeholder="e.g. 2026"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none disabled:opacity-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">CGPA / Grade</label>
            <input
              type="text"
              value={cgpa}
              onChange={(e) => setCgpa(e.target.value)}
              placeholder="e.g. 8.9 / 10"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isCurrentEdu"
            checked={isCurrent}
            onChange={(e) => setIsCurrent(e.target.checked)}
            className="h-4 w-4 rounded accent-emerald-400"
          />
          <label htmlFor="isCurrentEdu" className="text-xs text-white select-none cursor-pointer">
            I am currently a student here
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2 text-xs font-semibold text-[#04110d] transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Education
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// 8. Add / Edit Certification Modal
export function CertificationModal({
  initialData,
  index,
  onClose,
  onSave,
}: {
  initialData?: ProfileCertification | null
  index?: number | null
  onClose: () => void
  onSave: (item: ProfileCertification, index?: number | null) => Promise<void>
}) {
  const [name, setName] = useState(initialData?.name || '')
  const [issuingOrganization, setIssuingOrganization] = useState(initialData?.issuingOrganization || '')
  const [issueDate, setIssueDate] = useState(initialData?.issueDate || '')
  const [credentialId, setCredentialId] = useState(initialData?.credentialId || '')
  const [credentialUrl, setCredentialUrl] = useState(initialData?.credentialUrl || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSave({ name, issuingOrganization, issueDate, credentialId, credentialUrl }, index)
    setSaving(false)
    onClose()
  }

  return (
    <ModalWrapper
      title={initialData ? 'Edit Certification' : 'Add Certification'}
      subtitle="Certifications, courses, and credential badges"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Certification Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. AWS Certified Solutions Architect, Deep Learning Specialization"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Issuing Organization</label>
            <input
              type="text"
              value={issuingOrganization}
              onChange={(e) => setIssuingOrganization(e.target.value)}
              placeholder="e.g. Amazon Web Services, Coursera, Google"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Issue Date</label>
            <input
              type="text"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              placeholder="e.g. May 2024"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Credential ID</label>
            <input
              type="text"
              value={credentialId}
              onChange={(e) => setCredentialId(e.target.value)}
              placeholder="e.g. AWS-1234567"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Credential URL</label>
            <input
              type="url"
              value={credentialUrl}
              onChange={(e) => setCredentialUrl(e.target.value)}
              placeholder="https://credly.com/..."
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2 text-xs font-semibold text-[#04110d] transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Certification
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// 9. Add / Edit Achievement Modal
export function AchievementModal({
  initialData,
  index,
  onClose,
  onSave,
}: {
  initialData?: ProfileAchievement | null
  index?: number | null
  onClose: () => void
  onSave: (item: ProfileAchievement, index?: number | null) => Promise<void>
}) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [organization, setOrganization] = useState(initialData?.organization || '')
  const [date, setDate] = useState(initialData?.date || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [verificationUrl, setVerificationUrl] = useState(initialData?.verificationUrl || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSave({ title, organization, date, description, verificationUrl }, index)
    setSaving(false)
    onClose()
  }

  return (
    <ModalWrapper
      title={initialData ? 'Edit Achievement' : 'Add Achievement'}
      subtitle="Honors, hackathon wins, and competitive ratings"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Award / Achievement Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 1st Place - Smart India Hackathon 2024"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Host Organization</label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="e.g. Ministry of Education / MLH"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Date</label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="e.g. Aug 2024"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Built an autonomous disaster response AI drone system out of 500+ competing teams."
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white focus:border-emerald-400 focus:outline-none leading-relaxed"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Verification Link (optional)</label>
          <input
            type="url"
            value={verificationUrl}
            onChange={(e) => setVerificationUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2 text-xs font-semibold text-[#04110d] transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Achievement
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// 10. Social Links Modal
export function SocialLinksModal({
  profile,
  onClose,
  onSave,
}: {
  profile: CareerProfileShape
  onClose: () => void
  onSave: (data: Partial<CareerProfileShape>) => Promise<void>
}) {
  const [social, setSocial] = useState<ProfileSocialLinks>(profile.socialLinks || {})
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSave({
      socialLinks: social,
      linkedin: social.linkedin,
      portfolio: social.portfolio,
    })
    setSaving(false)
    onClose()
  }

  return (
    <ModalWrapper title="Developer & Social Profiles" subtitle="Connect code repositories, portfolio, and socials" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">GitHub</label>
          <input
            type="text"
            value={social.github || ''}
            onChange={(e) => setSocial({ ...social, github: e.target.value })}
            placeholder="https://github.com/yourhandle or yourhandle"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">LinkedIn</label>
          <input
            type="text"
            value={social.linkedin || ''}
            onChange={(e) => setSocial({ ...social, linkedin: e.target.value })}
            placeholder="https://linkedin.com/in/yourhandle"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Portfolio / Personal Website</label>
          <input
            type="text"
            value={social.portfolio || ''}
            onChange={(e) => setSocial({ ...social, portfolio: e.target.value })}
            placeholder="https://yourportfolio.com"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">LeetCode</label>
            <input
              type="text"
              value={social.leetcode || ''}
              onChange={(e) => setSocial({ ...social, leetcode: e.target.value })}
              placeholder="leetcode.com/username"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">HackerRank</label>
            <input
              type="text"
              value={social.hackerrank || ''}
              onChange={(e) => setSocial({ ...social, hackerrank: e.target.value })}
              placeholder="hackerrank.com/username"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Kaggle</label>
            <input
              type="text"
              value={social.kaggle || ''}
              onChange={(e) => setSocial({ ...social, kaggle: e.target.value })}
              placeholder="kaggle.com/username"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">X / Twitter</label>
            <input
              type="text"
              value={social.twitter || ''}
              onChange={(e) => setSocial({ ...social, twitter: e.target.value })}
              placeholder="x.com/username"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2 text-xs font-semibold text-[#04110d] transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Links
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// 11. Job Preferences Modal
export function EditJobPreferencesModal({
  profile,
  onClose,
  onSave,
}: {
  profile: CareerProfileShape
  onClose: () => void
  onSave: (data: Partial<CareerProfileShape>) => Promise<void>
}) {
  const [types, setTypes] = useState<string[]>(
    profile.jobPreferences?.employmentTypes || ['Full-time', 'Internship']
  )
  const [modes, setModes] = useState<string[]>(
    profile.jobPreferences?.workModes || ['remote', 'hybrid']
  )
  const [locations, setLocations] = useState(
    (profile.jobPreferences?.preferredLocations || []).join(', ')
  )
  const [relocation, setRelocation] = useState<'yes' | 'no' | 'open'>(
    profile.jobPreferences?.relocationPreference || 'open'
  )
  const [salaryMin, setSalaryMin] = useState(profile.jobPreferences?.salaryMin || '')
  const [salaryMax, setSalaryMax] = useState(profile.jobPreferences?.salaryMax || '')
  const [currency, setCurrency] = useState(profile.jobPreferences?.currency || 'USD')
  const [saving, setSaving] = useState(false)

  const toggleType = (t: string) => {
    setTypes((prev) => (prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]))
  }

  const toggleMode = (m: string) => {
    setModes((prev) => (prev.includes(m) ? prev.filter((item) => item !== m) : [...prev, m]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const preferredLocations = locations.split(',').map((s) => s.trim()).filter(Boolean)
    await onSave({
      jobPreferences: {
        targetRoles: profile.targetRoles || [],
        desiredTitles: profile.targetRoles || [],
        employmentTypes: types,
        workModes: modes,
        preferredLocations,
        relocationPreference: relocation,
        industryPreferences: profile.industries || [],
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
        currency,
      },
    })
    setSaving(false)
    onClose()
  }

  return (
    <ModalWrapper title="Job Preferences" subtitle="Work modes, employment types, and relocation willingness" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Employment Type</label>
          <div className="flex flex-wrap gap-2">
            {['Internship', 'Full-time', 'Part-time', 'Contract'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleType(t)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                  types.includes(t)
                    ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-200'
                    : 'border-white/10 bg-white/5 text-[var(--text-secondary)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Work Mode</label>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'remote', label: 'Remote' },
              { key: 'hybrid', label: 'Hybrid' },
              { key: 'onsite', label: 'On-site' },
            ].map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => toggleMode(m.key)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                  modes.includes(m.key)
                    ? 'border-teal-400/40 bg-teal-400/15 text-teal-200'
                    : 'border-white/10 bg-white/5 text-[var(--text-secondary)]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">
            Preferred Locations <span className="text-[var(--text-muted)]">(comma separated)</span>
          </label>
          <input
            type="text"
            value={locations}
            onChange={(e) => setLocations(e.target.value)}
            placeholder="e.g. Bengaluru, Remote, San Francisco, Singapore"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Relocation Willingness</label>
          <select
            value={relocation}
            onChange={(e) => setRelocation(e.target.value as any)}
            className="w-full rounded-2xl border border-white/10 bg-[#0e1713] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
          >
            <option value="open">Open to relocation</option>
            <option value="yes">Actively looking to relocate</option>
            <option value="no">Not looking to relocate</option>
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#0e1713] px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            >
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Min Comp</label>
            <input
              type="number"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              placeholder="e.g. 80000"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Max / Target</label>
            <input
              type="number"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              placeholder="e.g. 140000"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2 text-xs font-semibold text-[#04110d] transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Preferences
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// 12. Work Authorization Modal
export function EditWorkAuthModal({
  profile,
  onClose,
  onSave,
}: {
  profile: CareerProfileShape
  onClose: () => void
  onSave: (data: Partial<CareerProfileShape>) => Promise<void>
}) {
  const [residence, setResidence] = useState(profile.workAuthorization?.countryOfResidence || 'India')
  const [authorized, setAuthorized] = useState((profile.workAuthorization?.authorizedCountries || ['India']).join(', '))
  const [requiresSponsorship, setRequiresSponsorship] = useState(Boolean(profile.workAuthorization?.requiresSponsorship))
  const [openToInternationalRemote, setOpenToInternationalRemote] = useState(
    profile.workAuthorization?.openToInternationalRemote !== false
  )
  const [openToRelocation, setOpenToRelocation] = useState(profile.workAuthorization?.openToRelocation !== false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const authorizedCountries = authorized.split(',').map((s) => s.trim()).filter(Boolean)
    await onSave({
      workAuthorization: {
        countryOfResidence: residence,
        authorizedCountries,
        requiresSponsorship,
        openToInternationalRemote,
        openToRelocation,
      },
    })
    setSaving(false)
    onClose()
  }

  return (
    <ModalWrapper title="Work Authorization & Visa" subtitle="Legal eligibility and global remote status" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Country of Residence</label>
          <input
            type="text"
            value={residence}
            onChange={(e) => setResidence(e.target.value)}
            placeholder="e.g. India, United States, Canada"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">
            Authorized Work Countries <span className="text-[var(--text-muted)]">(comma separated)</span>
          </label>
          <input
            type="text"
            value={authorized}
            onChange={(e) => setAuthorized(e.target.value)}
            placeholder="e.g. India, United States"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            required
          />
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={requiresSponsorship}
              onChange={(e) => setRequiresSponsorship(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-400"
            />
            <span className="text-xs text-white">I will require visa sponsorship for international on-site roles</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={openToInternationalRemote}
              onChange={(e) => setOpenToInternationalRemote(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-400"
            />
            <span className="text-xs text-white">I am open to working as an international remote contractor</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={openToRelocation}
              onChange={(e) => setOpenToRelocation(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-400"
            />
            <span className="text-xs text-white">I am open to domestic or international relocation</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2 text-xs font-semibold text-[#04110d] transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Authorization
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// 13. Application Profile Modal (For AI Agent)
export function EditApplicationProfileModal({
  profile,
  onClose,
  onSave,
}: {
  profile: CareerProfileShape
  onClose: () => void
  onSave: (data: Partial<CareerProfileShape>) => Promise<void>
}) {
  const [years, setYears] = useState(profile.applicationPreferences?.yearsOfExperience || 0)
  const [notice, setNotice] = useState(profile.applicationPreferences?.noticePeriod || 'Immediate')
  const [gradYear, setGradYear] = useState(profile.applicationPreferences?.graduationYear || '2026')
  const [currentEdu, setCurrentEdu] = useState(profile.applicationPreferences?.currentEducation || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSave({
      applicationPreferences: {
        yearsOfExperience: Number(years),
        noticePeriod: notice,
        graduationYear: gradYear,
        currentEducation: currentEdu,
        workAuthorization: profile.workAuthorization?.countryOfResidence || 'Authorized',
        sponsorshipRequirement: Boolean(profile.workAuthorization?.requiresSponsorship),
        relocationPreference: profile.jobPreferences?.relocationPreference || 'Open',
        preferredEmploymentTypes: profile.jobPreferences?.employmentTypes || ['Full-time', 'Internship'],
      },
    })
    setSaving(false)
    onClose()
  }

  return (
    <ModalWrapper
      title="Application Profile (REXION AI Agent)"
      subtitle="Reusable job application answers for autonomous form filling"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Total Years of Experience</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Notice Period</label>
            <select
              value={notice}
              onChange={(e) => setNotice(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#0e1713] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            >
              <option value="Immediate">Immediate / Student</option>
              <option value="15 Days">15 Days</option>
              <option value="30 Days">30 Days</option>
              <option value="60 Days">60 Days</option>
              <option value="90 Days">90 Days</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Graduation Year</label>
            <input
              type="text"
              value={gradYear}
              onChange={(e) => setGradYear(e.target.value)}
              placeholder="e.g. 2026"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Current Education Level</label>
            <input
              type="text"
              value={currentEdu}
              onChange={(e) => setCurrentEdu(e.target.value)}
              placeholder="e.g. B.Tech 2nd Year, Master's, Graduated"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2 text-xs font-semibold text-[#04110d] transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Application Profile
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// 14. Privacy Settings Modal
export function EditPrivacyModal({
  profile,
  onClose,
  onSave,
}: {
  profile: CareerProfileShape
  onClose: () => void
  onSave: (data: Partial<CareerProfileShape>) => Promise<void>
}) {
  const [visibility, setVisibility] = useState<'private' | 'recruiters' | 'public'>(
    profile.privacySettings?.profileVisibility || 'recruiters'
  )
  const [showEmail, setShowEmail] = useState(profile.privacySettings?.showEmail !== false)
  const [showPhone, setShowPhone] = useState(Boolean(profile.privacySettings?.showPhone))
  const [showLocation, setShowLocation] = useState(profile.privacySettings?.showLocation !== false)
  const [allowAi, setAllowAi] = useState(profile.privacySettings?.allowAiUseProfileData !== false)
  const [allowAuto, setAllowAuto] = useState(profile.privacySettings?.allowAutomatedApplications !== false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSave({
      privacySettings: {
        profileVisibility: visibility,
        showEmail,
        showPhone,
        showLocation,
        allowAiUseProfileData: allowAi,
        allowAutomatedApplications: allowAuto,
      },
    })
    setSaving(false)
    onClose()
  }

  return (
    <ModalWrapper title="Privacy & Security Settings" subtitle="Control visibility, recruiter permissions, and AI usage" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Profile Visibility</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as any)}
            className="w-full rounded-2xl border border-white/10 bg-[#0e1713] px-4 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
          >
            <option value="recruiters">Verified Recruiters & Companies (Recommended)</option>
            <option value="public">Public (Visible on Web & Search)</option>
            <option value="private">Private (Only You and Direct Submissions)</option>
          </select>
        </div>

        <div className="space-y-3 rounded-2xl border border-white/6 bg-black/20 p-4">
          <span className="type-label !mb-2 block">Contact Information Visibility</span>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showEmail}
              onChange={(e) => setShowEmail(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-400"
            />
            <span className="text-xs text-white">Show email address to verified recruiters</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showPhone}
              onChange={(e) => setShowPhone(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-400"
            />
            <span className="text-xs text-white">Show phone number to verified recruiters</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showLocation}
              onChange={(e) => setShowLocation(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-400"
            />
            <span className="text-xs text-white">Show general location / city on public profile</span>
          </label>
        </div>

        <div className="space-y-3 rounded-2xl border border-white/6 bg-black/20 p-4">
          <span className="type-label !mb-2 block">AI Agent Permissions</span>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allowAi}
              onChange={(e) => setAllowAi(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-400"
            />
            <span className="text-xs text-white">Allow REXION AI to index profile for career matchmaking</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allowAuto}
              onChange={(e) => setAllowAuto(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-400"
            />
            <span className="text-xs text-white">Allow automated 1-Click application workflows</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2 text-xs font-semibold text-[#04110d] transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Settings
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// 15. Resume Upload & ATS Parsing Modal
export function ResumeUploadModal({
  profile,
  onClose,
  onSuccess,
}: {
  profile: CareerProfileShape
  onClose: () => void
  onSuccess: (data: any) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      if (
        !selected.name.endsWith('.pdf') &&
        !selected.name.endsWith('.docx') &&
        !selected.name.endsWith('.doc')
      ) {
        setError('Please select a valid PDF or DOCX file.')
        return
      }
      if (selected.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB.')
        return
      }
      setError('')
      setFile(selected)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a resume file to upload.')
      return
    }

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('resume', file)

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to upload resume.')
        setUploading(false)
        return
      }

      setUploading(false)
      onSuccess(data)
      onClose()
    } catch (err: any) {
      console.error('Upload failed:', err)
      setError(err?.message || 'Network error during upload.')
      setUploading(false)
    }
  }

  return (
    <ModalWrapper title="Upload & Parse Resume" subtitle="Extract skills, experience, and calculate your ATS score" onClose={onClose}>
      <form onSubmit={handleUpload} className="space-y-5">
        <div className="relative rounded-2xl border-2 border-dashed border-emerald-400/30 bg-black/30 p-8 text-center transition hover:border-emerald-400/60">
          <input
            type="file"
            accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <UploadCloud size={32} className="mx-auto text-emerald-400 mb-3" />
          {file ? (
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">{file.name}</p>
              <p className="text-xs text-emerald-300">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to Parse</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">Click or drag & drop resume file</p>
              <p className="text-xs text-[var(--text-muted)]">Supported formats: PDF, DOCX (Max 10MB)</p>
            </div>
          )}
        </div>

        {profile.resume?.fileName && (
          <div className="rounded-xl border border-white/6 bg-white/[0.02] p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-emerald-400" />
              <div>
                <span className="text-white font-medium block">Current File: {profile.resume.fileName}</span>
                {profile.resume.atsScore && (
                  <span className="text-[11px] text-emerald-300">ATS Match Score: {profile.resume.atsScore}%</span>
                )}
              </div>
            </div>
            {profile.resume.fileUrl && (
              <a
                href={profile.resume.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"
              >
                View <ExternalLink size={11} />
              </a>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!file || uploading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2 text-xs font-semibold text-[#04110d] transition hover:brightness-110 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Parsing with AI...
              </>
            ) : (
              'Upload & Parse Resume'
            )}
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// 16. Profile Preview Modal
export function ProfilePreviewModal({
  profile,
  userName,
  userEmail,
  onClose,
}: {
  profile: CareerProfileShape
  userName: string
  userEmail?: string | null
  onClose: () => void
}) {
  const displayName = userName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Candidate'
  const headline = profile.headline || 'Career Candidate'
  const location =
    profile.city && profile.country
      ? `${profile.city}, ${profile.country}`
      : profile.city || profile.country || 'Remote'
  const social = profile.socialLinks || {}

  return (
    <ModalWrapper
      title="Profile Preview"
      subtitle="Recruiter and company view of your verified career identity"
      onClose={onClose}
    >
      <div className="space-y-6 pb-2">
        {/* Recruiter Banner */}
        <div className="flex items-center justify-between rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-200">
              Verified REXION Career Identity
            </span>
          </div>
          <span className="rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 uppercase">
            {profile.currentStatus || 'Open to Offers'}
          </span>
        </div>

        {/* Profile Card */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-6 space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{displayName}</h2>
            <p className="text-sm font-medium text-emerald-300 mt-0.5">{headline}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {location} • {profile.careerLevel || 'Entry Level'}
            </p>
          </div>

          {/* Social Links */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-white/6">
            {social.github && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white">
                <Github size={12} /> GitHub
              </span>
            )}
            {social.linkedin && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white">
                <Linkedin size={12} /> LinkedIn
              </span>
            )}
            {social.portfolio && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white">
                <Globe size={12} /> Portfolio
              </span>
            )}
          </div>
        </div>

        {/* About */}
        {profile.professionalSummary && (
          <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">About</h4>
            <p className="text-xs leading-relaxed text-[var(--text-secondary)] whitespace-pre-line">
              {profile.professionalSummary}
            </p>
          </div>
        )}

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">Skills & Stack</h4>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-2.5 py-1 text-xs font-medium text-emerald-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {profile.experience && profile.experience.length > 0 && (
          <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">Experience</h4>
            <div className="space-y-3">
              {profile.experience.map((exp, i) => (
                <div key={i} className="border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <strong className="text-sm text-white font-semibold">{exp.role}</strong>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate || 'Present'}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/90 font-medium">{exp.company}</p>
                  {exp.description && (
                    <p className="mt-1.5 text-xs text-[var(--text-secondary)] leading-relaxed">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {profile.projects && profile.projects.length > 0 && (
          <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">Projects</h4>
            <div className="space-y-3">
              {profile.projects.map((proj, i) => (
                <div key={i} className="border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                  <strong className="text-sm text-white font-semibold block">{proj.title || proj.projectName}</strong>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">{proj.description}</p>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {proj.technologies.map((t) => (
                        <span key={t} className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-teal-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>
  )
}
