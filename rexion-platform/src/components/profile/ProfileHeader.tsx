'use client'

import { motion } from 'framer-motion'
import {
  MapPin,
  Briefcase,
  Sparkles,
  Edit3,
  Eye,
  UploadCloud,
  Github,
  Linkedin,
  Globe,
  Code2,
  CheckCircle2,
} from 'lucide-react'
import type { CareerProfileShape, SessionUser } from '@/types'

interface ProfileHeaderProps {
  user: SessionUser
  profile: CareerProfileShape
  completionScore: number
  onEditBasicInfo: () => void
  onOpenResumeModal: () => void
  onPreviewProfile: () => void
}

export function ProfileHeader({
  user,
  profile,
  completionScore,
  onEditBasicInfo,
  onOpenResumeModal,
  onPreviewProfile,
}: ProfileHeaderProps) {
  const displayName = user.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Career Candidate'
  const headline = profile.headline || 'Career Profile • Candidate'
  const location =
    profile.city && profile.country
      ? `${profile.city}, ${profile.country}`
      : profile.location?.city && profile.location?.country
      ? `${profile.location.city}, ${profile.location.country}`
      : profile.city || profile.country || profile.location?.country || 'Location not set'

  const careerLevel = profile.careerLevel || 'Student / Intern'
  const currentStatus = profile.currentStatus || 'Actively Looking'
  const social = profile.socialLinks || {}

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'Rx'

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-[rgba(16,28,24,0.95)] via-[rgba(10,16,14,0.92)] to-[rgba(6,10,8,0.98)] p-6 shadow-2xl backdrop-blur-2xl lg:p-8">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-60 w-60 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {/* Avatar with status indicator */}
          <div className="relative shrink-0">
            {user.image || profile.resumeUrl ? (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-emerald-400/30 bg-gradient-to-br from-emerald-950/80 to-black p-1 shadow-lg shadow-emerald-500/10 sm:h-28 sm:w-28">
                <span className="font-display text-2xl font-bold tracking-tight text-emerald-300 sm:text-3xl">
                  {initials}
                </span>
              </div>
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-emerald-400/30 bg-gradient-to-br from-emerald-950/80 to-black font-display text-2xl font-bold text-emerald-300 shadow-lg shadow-emerald-500/10 sm:h-28 sm:w-28 sm:text-3xl">
                {initials}
              </div>
            )}
            <div
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#060a08] bg-emerald-400 shadow-md"
              title={currentStatus}
            >
              <CheckCircle2 size={14} className="text-[#04110d]" />
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                {displayName}
              </h1>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
                {user.plan || 'Free'} Plan
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-xs font-medium text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                {currentStatus}
              </span>
            </div>

            <p className="text-base font-medium text-emerald-100/90 sm:text-lg">
              {headline}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--text-secondary)] sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} className="text-emerald-400" />
                {location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Briefcase size={14} className="text-emerald-400" />
                {careerLevel}
              </span>
              {profile.education?.[0] && (
                <span className="hidden items-center gap-1.5 md:inline-flex text-[var(--text-muted)]">
                  • {profile.education[0].degree} ({profile.education[0].institution})
                </span>
              )}
            </div>

            {/* Social Links */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {social.github && (
                <a
                  href={social.github.startsWith('http') ? social.github : `https://${social.github}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-[var(--text-secondary)] transition hover:border-emerald-400/30 hover:bg-white/10 hover:text-white"
                >
                  <Github size={13} />
                  GitHub
                </a>
              )}
              {social.linkedin && (
                <a
                  href={social.linkedin.startsWith('http') ? social.linkedin : `https://${social.linkedin}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-[var(--text-secondary)] transition hover:border-emerald-400/30 hover:bg-white/10 hover:text-white"
                >
                  <Linkedin size={13} />
                  LinkedIn
                </a>
              )}
              {social.portfolio && (
                <a
                  href={social.portfolio.startsWith('http') ? social.portfolio : `https://${social.portfolio}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-[var(--text-secondary)] transition hover:border-emerald-400/30 hover:bg-white/10 hover:text-white"
                >
                  <Globe size={13} />
                  Portfolio
                </a>
              )}
              {social.leetcode && (
                <a
                  href={social.leetcode.startsWith('http') ? social.leetcode : `https://${social.leetcode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-[var(--text-secondary)] transition hover:border-emerald-400/30 hover:bg-white/10 hover:text-white"
                >
                  <Code2 size={13} />
                  LeetCode
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-start">
          <button
            type="button"
            onClick={onEditBasicInfo}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white transition hover:border-white/20 hover:bg-white/10 active:scale-[0.98] sm:flex-initial sm:text-sm"
          >
            <Edit3 size={15} className="text-emerald-400" />
            Edit Profile
          </button>

          <button
            type="button"
            onClick={onOpenResumeModal}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/20 active:scale-[0.98] sm:flex-initial sm:text-sm"
          >
            <UploadCloud size={15} />
            {profile.resume?.fileUrl || profile.resumeUrl ? 'Update Resume' : 'Upload Resume'}
          </button>

          <button
            type="button"
            onClick={onPreviewProfile}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-2.5 text-xs font-semibold text-[#04110d] shadow-lg shadow-emerald-500/20 transition hover:brightness-110 active:scale-[0.98] sm:flex-initial sm:text-sm"
          >
            <Eye size={15} />
            Preview Profile
          </button>
        </div>
      </div>
    </div>
  )
}
