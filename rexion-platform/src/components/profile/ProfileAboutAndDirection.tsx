'use client'

import { Edit3, User, Sparkles, Target, Compass, Layers, Globe } from 'lucide-react'
import type { CareerProfileShape } from '@/types'

interface ProfileAboutSectionProps {
  profile: CareerProfileShape
  onEdit: () => void
}

export function ProfileAboutSection({ profile, onEdit }: ProfileAboutSectionProps) {
  const summary = profile.professionalSummary?.trim()

  return (
    <div className="rounded-[28px] border border-white/8 bg-[rgba(15,26,22,0.85)] p-6 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
            <User size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">About</h3>
            <p className="text-xs text-[var(--text-secondary)]">Professional summary and career elevator pitch</p>
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

      <div className="mt-4">
        {summary ? (
          <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)] font-normal">
            {summary}
          </p>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center">
            <Sparkles size={20} className="mx-auto text-[var(--text-muted)] mb-2" />
            <p className="text-sm font-medium text-[var(--text-secondary)]">No professional summary added yet.</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Add a compelling 2-3 sentence overview highlighting your background, strengths, and goals.
            </p>
            <button
              type="button"
              onClick={onEdit}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/20 transition"
            >
              Add Summary
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface ProfileCareerDirectionProps {
  profile: CareerProfileShape
  onEdit: () => void
}

export function ProfileCareerDirection({ profile, onEdit }: ProfileCareerDirectionProps) {
  const targetRoles = profile.targetRoles || []
  const secondaryRoles = profile.secondaryRoles || []
  const industries = profile.industries || []
  const careerLevel = profile.careerLevel || 'Student / Intern'
  const currentStatus = profile.currentStatus || 'Actively Looking'

  const hasContent =
    targetRoles.length > 0 ||
    secondaryRoles.length > 0 ||
    industries.length > 0 ||
    careerLevel ||
    currentStatus

  return (
    <div className="rounded-[28px] border border-white/8 bg-[rgba(15,26,22,0.85)] p-6 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
            <Compass size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Career Direction</h3>
            <p className="text-xs text-[var(--text-secondary)]">Target roles, seniority level, and industry focus</p>
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

      <div className="mt-5 space-y-4">
        {/* Primary Roles */}
        <div>
          <span className="type-label !mb-2 block">Primary Target Roles</span>
          {targetRoles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {targetRoles.map((role) => (
                <span
                  key={role}
                  className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200"
                >
                  {role}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)] italic">No primary roles specified.</p>
          )}
        </div>

        {/* Secondary Roles */}
        {secondaryRoles.length > 0 && (
          <div>
            <span className="type-label !mb-2 block">Secondary Roles</span>
            <div className="flex flex-wrap gap-2">
              {secondaryRoles.map((role) => (
                <span
                  key={role}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-[var(--text-secondary)]"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Level & Status Meta Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/6 bg-black/20 p-3.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] block">
              Career Level
            </span>
            <strong className="mt-1 block text-sm font-semibold text-white">{careerLevel}</strong>
          </div>

          <div className="rounded-2xl border border-white/6 bg-black/20 p-3.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] block">
              Status
            </span>
            <strong className="mt-1 block text-sm font-semibold text-emerald-300">{currentStatus}</strong>
          </div>

          <div className="rounded-2xl border border-white/6 bg-black/20 p-3.5 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] block">
              Target Industries
            </span>
            <strong className="mt-1 block text-sm font-semibold text-white">
              {industries.length > 0 ? industries.join(', ') : 'Any tech sector'}
            </strong>
          </div>
        </div>
      </div>
    </div>
  )
}
