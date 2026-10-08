'use client'

import { Briefcase, Plus, ExternalLink, Calendar, MapPin, Edit3, Trash2 } from 'lucide-react'
import type { ProfileExperience } from '@/types/profile'

interface ProfileExperienceSectionProps {
  experience: ProfileExperience[]
  onAddExperience: () => void
  onEditExperience: (item: ProfileExperience, index: number) => void
  onDeleteExperience: (index: number) => void
}

export function ProfileExperienceSection({
  experience = [],
  onAddExperience,
  onEditExperience,
  onDeleteExperience,
}: ProfileExperienceSectionProps) {
  return (
    <div className="rounded-[28px] border border-white/8 bg-[rgba(15,26,22,0.85)] p-6 shadow-xl backdrop-blur-xl" id="experience-section">
      <div className="flex items-center justify-between pb-4 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
            <Briefcase size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Experience</h3>
            <p className="text-xs text-[var(--text-secondary)]">Internships, full-time roles, freelance, and open-source</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAddExperience}
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
        >
          <Plus size={14} />
          Add Experience
        </button>
      </div>

      {experience.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center">
          <Briefcase size={24} className="mx-auto text-[var(--text-muted)] mb-2" />
          <p className="text-sm font-semibold text-white">No professional experience added yet</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Add your previous internships, full-time positions, freelance gigs, or major open-source work.
          </p>
          <button
            type="button"
            onClick={onAddExperience}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/20 transition"
          >
            <Plus size={14} />
            Add Experience
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {experience.map((item, index) => (
            <article
              key={item.id || item._id || `${item.company}-${index}`}
              className="group relative rounded-2xl border border-white/6 bg-white/[0.02] p-5 transition hover:border-white/15 hover:bg-white/[0.04]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-bold text-white">{item.role}</h4>
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                      {item.employmentType || 'Full-time'}
                    </span>
                    {item.isCurrent && (
                      <span className="rounded-full border border-teal-400/30 bg-teal-400/10 px-2 py-0.5 text-[10px] font-medium text-teal-300">
                        Present
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-secondary)]">
                    <strong className="font-semibold text-emerald-100">{item.company}</strong>
                    {item.companyUrl && (
                      <a
                        href={item.companyUrl.startsWith('http') ? item.companyUrl : `https://${item.companyUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
                      >
                        <ExternalLink size={11} />
                        Website
                      </a>
                    )}
                    {item.location && (
                      <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
                        <MapPin size={11} />
                        {item.location}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
                      <Calendar size={11} />
                      {item.startDate} — {item.isCurrent ? 'Present' : item.endDate || 'Present'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-start opacity-80 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    onClick={() => onEditExperience(item, index)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20 hover:text-white transition"
                    title="Edit"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteExperience(index)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[var(--text-muted)] hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 transition"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {item.description && (
                <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-[var(--text-secondary)]">
                  {item.description}
                </p>
              )}

              {item.skills && item.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                  {item.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-lg border border-white/8 bg-black/30 px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
