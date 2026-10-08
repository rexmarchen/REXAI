'use client'

import {
  Share2,
  Sliders,
  ShieldCheck,
  Bot,
  Lock,
  Edit3,
  ExternalLink,
  Github,
  Linkedin,
  Globe,
  Code2,
  Twitter,
  DollarSign,
  Building,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import type {
  ProfileSocialLinks,
  ProfileJobPreferences,
  ProfileWorkAuthorization,
  ProfileApplicationPreferences,
  ProfilePrivacySettings,
} from '@/types/profile'

// 1. Social Links Section
export function ProfileSocialLinksSection({
  socialLinks = {},
  onEdit,
}: {
  socialLinks: ProfileSocialLinks
  onEdit: () => void
}) {
  const links = [
    { key: 'github', label: 'GitHub', value: socialLinks.github, icon: Github, prefix: 'https://github.com/' },
    { key: 'linkedin', label: 'LinkedIn', value: socialLinks.linkedin, icon: Linkedin, prefix: 'https://linkedin.com/in/' },
    { key: 'portfolio', label: 'Portfolio', value: socialLinks.portfolio, icon: Globe, prefix: 'https://' },
    { key: 'leetcode', label: 'LeetCode', value: socialLinks.leetcode, icon: Code2, prefix: 'https://leetcode.com/' },
    { key: 'hackerrank', label: 'HackerRank', value: socialLinks.hackerrank, icon: Code2, prefix: 'https://hackerrank.com/' },
    { key: 'kaggle', label: 'Kaggle', value: socialLinks.kaggle, icon: Code2, prefix: 'https://kaggle.com/' },
    { key: 'twitter', label: 'X / Twitter', value: socialLinks.twitter, icon: Twitter, prefix: 'https://x.com/' },
  ]

  const activeLinks = links.filter((l) => Boolean(l.value?.trim()))

  return (
    <div className="rounded-[28px] border border-white/8 bg-[rgba(15,26,22,0.85)] p-6 shadow-xl backdrop-blur-xl" id="social-links">
      <div className="flex items-center justify-between pb-4 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
            <Share2 size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Social & Developer Links</h3>
            <p className="text-xs text-[var(--text-secondary)]">Public code repositories, technical profiles, and socials</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-emerald-400/30 hover:bg-white/10"
        >
          <Edit3 size={13} className="text-emerald-400" />
          Edit Links
        </button>
      </div>

      {activeLinks.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center">
          <p className="text-xs text-[var(--text-muted)]">No developer links connected yet.</p>
          <button
            type="button"
            onClick={onEdit}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/20 transition"
          >
            Connect Profiles
          </button>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {activeLinks.map((item) => {
            const Icon = item.icon
            const url = item.value?.startsWith('http') ? item.value : `https://${item.value}`
            return (
              <a
                key={item.key}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.02] p-3.5 transition hover:border-emerald-400/30 hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/40 text-emerald-400">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block">{item.label}</span>
                    <span className="text-[11px] text-[var(--text-muted)] truncate block">{item.value}</span>
                  </div>
                </div>
                <ExternalLink size={13} className="text-[var(--text-muted)] group-hover:text-emerald-300 shrink-0" />
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}

// 2. Job Preferences Section
export function ProfileJobPreferencesSection({
  preferences,
  onEdit,
}: {
  preferences?: ProfileJobPreferences
  onEdit: () => void
}) {
  const prefs = preferences || {
    targetRoles: [],
    employmentTypes: ['Full-time', 'Internship'],
    workModes: ['remote', 'hybrid'],
    preferredLocations: [],
    relocationPreference: 'open',
    industryPreferences: [],
    currency: 'USD',
  }

  return (
    <div className="rounded-[28px] border border-white/8 bg-[rgba(15,26,22,0.85)] p-6 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
            <Sliders size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Job Preferences</h3>
            <p className="text-xs text-[var(--text-secondary)]">Target roles, employment types, work modes, and locations</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-emerald-400/30 hover:bg-white/10"
        >
          <Edit3 size={13} className="text-emerald-400" />
          Edit Preferences
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/6 bg-black/20 p-4">
          <span className="type-label !mb-1.5 block">Employment Type</span>
          <div className="flex flex-wrap gap-1.5">
            {prefs.employmentTypes?.length > 0 ? (
              prefs.employmentTypes.map((t) => (
                <span key={t} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white">
                  {t}
                </span>
              ))
            ) : (
              <span className="text-xs text-[var(--text-muted)]">Any</span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/6 bg-black/20 p-4">
          <span className="type-label !mb-1.5 block">Work Mode</span>
          <div className="flex flex-wrap gap-1.5">
            {prefs.workModes?.length > 0 ? (
              prefs.workModes.map((m) => (
                <span key={m} className="rounded-lg border border-teal-400/30 bg-teal-400/10 px-2.5 py-1 text-xs font-medium text-teal-200 capitalize">
                  {m}
                </span>
              ))
            ) : (
              <span className="text-xs text-[var(--text-muted)]">Remote / Hybrid</span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/6 bg-black/20 p-4">
          <span className="type-label !mb-1.5 block">Preferred Locations</span>
          <p className="text-xs text-white">
            {prefs.preferredLocations?.length > 0
              ? prefs.preferredLocations.join(', ')
              : 'Open to all locations (Remote worldwide)'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/6 bg-black/20 p-4">
          <span className="type-label !mb-1.5 block">Relocation</span>
          <p className="text-xs font-medium text-emerald-300 capitalize">
            {prefs.relocationPreference === 'yes'
              ? 'Willing to relocate'
              : prefs.relocationPreference === 'open'
              ? 'Open to discussion'
              : 'Not looking to relocate'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/6 bg-black/20 p-4">
          <span className="type-label !mb-1.5 block">Salary / Compensation</span>
          <p className="text-xs text-white font-medium">
            {prefs.salaryMin || prefs.salaryMax
              ? `${prefs.currency || 'USD'} ${prefs.salaryMin ? prefs.salaryMin.toLocaleString() : '0'} ${
                  prefs.salaryMax ? `— ${prefs.salaryMax.toLocaleString()}` : '+'
                }`
              : 'Flexible / Not specified'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/6 bg-black/20 p-4">
          <span className="type-label !mb-1.5 block">Target Industries</span>
          <p className="text-xs text-white">
            {prefs.industryPreferences?.length > 0
              ? prefs.industryPreferences.join(', ')
              : 'AI, SaaS, Tech startups, Fintech'}
          </p>
        </div>
      </div>
    </div>
  )
}

// 3. Work Authorization Section
export function ProfileWorkAuthSection({
  auth,
  onEdit,
}: {
  auth?: ProfileWorkAuthorization
  onEdit: () => void
}) {
  const workAuth = auth || {
    countryOfResidence: 'India',
    authorizedCountries: ['India'],
    requiresSponsorship: false,
    openToInternationalRemote: true,
    openToRelocation: true,
  }

  return (
    <div className="rounded-[28px] border border-white/8 bg-[rgba(15,26,22,0.85)] p-6 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Work Authorization</h3>
            <p className="text-xs text-[var(--text-secondary)]">Residency, legal work eligibility, and visa requirements</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-emerald-400/30 hover:bg-white/10"
        >
          <Edit3 size={13} className="text-emerald-400" />
          Edit
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/6 bg-black/20 p-3.5">
          <span className="type-label !mb-1 block">Country of Residence</span>
          <strong className="text-xs font-semibold text-white">{workAuth.countryOfResidence || 'India'}</strong>
        </div>

        <div className="rounded-2xl border border-white/6 bg-black/20 p-3.5">
          <span className="type-label !mb-1 block">Authorized In</span>
          <strong className="text-xs font-semibold text-white">
            {workAuth.authorizedCountries?.length > 0 ? workAuth.authorizedCountries.join(', ') : 'India'}
          </strong>
        </div>

        <div className="rounded-2xl border border-white/6 bg-black/20 p-3.5">
          <span className="type-label !mb-1 block">Visa Sponsorship</span>
          <strong className={`text-xs font-semibold ${workAuth.requiresSponsorship ? 'text-amber-300' : 'text-emerald-300'}`}>
            {workAuth.requiresSponsorship ? 'Requires Sponsorship' : 'Does Not Require Sponsorship'}
          </strong>
        </div>

        <div className="rounded-2xl border border-white/6 bg-black/20 p-3.5">
          <span className="type-label !mb-1 block">International Remote</span>
          <strong className="text-xs font-semibold text-emerald-300">
            {workAuth.openToInternationalRemote ? 'Open to Global Remote' : 'Domestic Only'}
          </strong>
        </div>
      </div>
    </div>
  )
}

// 4. Application Profile (For REXION AI Agent)
export function ProfileApplicationProfileSection({
  appPrefs,
  onEdit,
}: {
  appPrefs?: ProfileApplicationPreferences
  onEdit: () => void
}) {
  const prefs = appPrefs || {
    yearsOfExperience: 0,
    currentEducation: '',
    graduationYear: '',
    noticePeriod: 'Immediate',
    workAuthorization: 'Authorized',
    sponsorshipRequirement: false,
    relocationPreference: 'Open',
    preferredEmploymentTypes: ['Full-time', 'Internship'],
  }

  return (
    <div className="rounded-[28px] border border-white/8 bg-[rgba(15,26,22,0.85)] p-6 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-400/20">
            <Bot size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">Application Profile (AI Agent)</h3>
              <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300 uppercase">
                Agentic Ready
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Reusable job form answers used by the REXION AI 1-Click application agent
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-emerald-400/30 hover:bg-white/10"
        >
          <Edit3 size={13} className="text-emerald-400" />
          Configure Agent
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/6 bg-black/20 p-3.5">
          <span className="type-label !mb-1 block">Years of Experience</span>
          <strong className="text-xs font-semibold text-white">{prefs.yearsOfExperience || 0} Years</strong>
        </div>

        <div className="rounded-2xl border border-white/6 bg-black/20 p-3.5">
          <span className="type-label !mb-1 block">Notice Period</span>
          <strong className="text-xs font-semibold text-emerald-300">{prefs.noticePeriod || 'Immediate'}</strong>
        </div>

        <div className="rounded-2xl border border-white/6 bg-black/20 p-3.5">
          <span className="type-label !mb-1 block">Graduation Year</span>
          <strong className="text-xs font-semibold text-white">{prefs.graduationYear || '2026'}</strong>
        </div>

        <div className="rounded-2xl border border-white/6 bg-black/20 p-3.5">
          <span className="type-label !mb-1 block">1-Click Auto-Fill</span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
            <CheckCircle2 size={13} />
            Active & Verified
          </span>
        </div>
      </div>
    </div>
  )
}

// 5. Privacy & AI Usage Settings
export function ProfilePrivacySection({
  privacy,
  onEdit,
}: {
  privacy?: ProfilePrivacySettings
  onEdit: () => void
}) {
  const p = privacy || {
    profileVisibility: 'recruiters',
    showEmail: true,
    showPhone: false,
    showLocation: true,
    allowAiUseProfileData: true,
    allowAutomatedApplications: true,
  }

  return (
    <div className="rounded-[28px] border border-white/8 bg-[rgba(15,26,22,0.85)] p-6 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-400/10 text-purple-300">
            <Lock size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Privacy & AI Settings</h3>
            <p className="text-xs text-[var(--text-secondary)]">Data visibility, recruiter access, and automated workflow permissions</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-emerald-400/30 hover:bg-white/10"
        >
          <Edit3 size={13} className="text-emerald-400" />
          Edit Privacy
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/6 bg-black/20 p-3.5">
          <span className="type-label !mb-1 block">Profile Visibility</span>
          <span className="inline-block text-xs font-bold text-white uppercase tracking-wider">
            {p.profileVisibility === 'public'
              ? 'Public (Visible on Web)'
              : p.profileVisibility === 'recruiters'
              ? 'Verified Recruiters Only'
              : 'Private'}
          </span>
        </div>

        <div className="rounded-2xl border border-white/6 bg-black/20 p-3.5">
          <span className="type-label !mb-1 block">Contact Privacy</span>
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span>Email: {p.showEmail ? 'Visible' : 'Hidden'}</span>
            <span>•</span>
            <span>Phone: {p.showPhone ? 'Visible' : 'Hidden'}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/6 bg-black/20 p-3.5">
          <span className="type-label !mb-1 block">AI Application Agent</span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">
            {p.allowAutomatedApplications ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
            {p.allowAutomatedApplications ? 'Enabled for Applications' : 'Disabled'}
          </span>
        </div>
      </div>
    </div>
  )
}
