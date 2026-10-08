'use client'

import { GraduationCap, Award, Trophy, Plus, ExternalLink, Edit3, Trash2, Calendar } from 'lucide-react'
import type { ProfileEducation, ProfileCertification, ProfileAchievement } from '@/types/profile'

interface EducationSectionProps {
  education: ProfileEducation[]
  onAddEducation: () => void
  onEditEducation: (item: ProfileEducation, index: number) => void
  onDeleteEducation: (index: number) => void
}

export function ProfileEducationSection({
  education = [],
  onAddEducation,
  onEditEducation,
  onDeleteEducation,
}: EducationSectionProps) {
  return (
    <div className="rounded-[28px] border border-white/8 bg-[rgba(15,26,22,0.85)] p-6 shadow-xl backdrop-blur-xl" id="education-section">
      <div className="flex items-center justify-between pb-4 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
            <GraduationCap size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Education</h3>
            <p className="text-xs text-[var(--text-secondary)]">Degrees, universities, specializations, and GPA</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAddEducation}
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
        >
          <Plus size={14} />
          Add Education
        </button>
      </div>

      {education.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center">
          <GraduationCap size={24} className="mx-auto text-[var(--text-muted)] mb-2" />
          <p className="text-sm font-semibold text-white">No education records added yet</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Add your college, undergraduate, master&apos;s degrees, or high school academic details.
          </p>
          <button
            type="button"
            onClick={onAddEducation}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/20 transition"
          >
            <Plus size={14} />
            Add Education
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {education.map((item, index) => (
            <article
              key={item.id || item._id || `${item.institution}-${index}`}
              className="group relative rounded-2xl border border-white/6 bg-white/[0.02] p-5 transition hover:border-white/15 hover:bg-white/[0.04]"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-bold text-white">{item.degree}</h4>
                    {item.fieldOfStudy && (
                      <span className="text-sm font-medium text-emerald-300">in {item.fieldOfStudy}</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-[var(--text-secondary)]">
                    {item.institution}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-[var(--text-muted)]">
                    <span>
                      {item.startYear} — {item.isCurrent ? 'Present' : item.endYear || 'Present'}
                    </span>
                    {item.cgpa && (
                      <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.2 text-[11px] font-semibold text-white">
                        CGPA / Grade: {item.cgpa}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    onClick={() => onEditEducation(item, index)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[var(--text-secondary)] hover:text-white transition"
                    title="Edit"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteEducation(index)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[var(--text-muted)] hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 transition"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {item.description && (
                <p className="mt-3 text-xs text-[var(--text-secondary)] leading-relaxed">
                  {item.description}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

interface CertificationsSectionProps {
  certifications: ProfileCertification[]
  onAddCertification: () => void
  onEditCertification: (item: ProfileCertification, index: number) => void
  onDeleteCertification: (index: number) => void
}

export function ProfileCertificationsSection({
  certifications = [],
  onAddCertification,
  onEditCertification,
  onDeleteCertification,
}: CertificationsSectionProps) {
  return (
    <div className="rounded-[28px] border border-white/8 bg-[rgba(15,26,22,0.85)] p-6 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
            <Award size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Certifications</h3>
            <p className="text-xs text-[var(--text-secondary)]">Verified credentials, cloud certificates, and courses</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAddCertification}
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {certifications.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center">
          <p className="text-xs text-[var(--text-muted)]">No certificates added yet.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {certifications.map((item, index) => (
            <article
              key={item.id || item._id || `${item.name}-${index}`}
              className="group rounded-2xl border border-white/6 bg-white/[0.02] p-4 transition hover:border-white/15 hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white">{item.name}</h4>
                  <p className="text-xs text-amber-200/90">{item.issuingOrganization}</p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                    {item.issueDate && <span>Issued: {item.issueDate}</span>}
                    {item.credentialId && <span>• ID: {item.credentialId}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                  {item.credentialUrl && (
                    <a
                      href={item.credentialUrl.startsWith('http') ? item.credentialUrl : `https://${item.credentialUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-emerald-400 hover:text-emerald-300"
                      title="Verify Credential"
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => onEditCertification(item, index)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[var(--text-secondary)] hover:text-white"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteCertification(index)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[var(--text-muted)] hover:text-rose-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

interface AchievementsSectionProps {
  achievements: ProfileAchievement[]
  onAddAchievement: () => void
  onEditAchievement: (item: ProfileAchievement, index: number) => void
  onDeleteAchievement: (index: number) => void
}

export function ProfileAchievementsSection({
  achievements = [],
  onAddAchievement,
  onEditAchievement,
  onDeleteAchievement,
}: AchievementsSectionProps) {
  return (
    <div className="rounded-[28px] border border-white/8 bg-[rgba(15,26,22,0.85)] p-6 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-400/10 text-purple-300">
            <Trophy size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Achievements & Awards</h3>
            <p className="text-xs text-[var(--text-secondary)]">Hackathon wins, competitive programming ranks, and honors</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAddAchievement}
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {achievements.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center">
          <p className="text-xs text-[var(--text-muted)]">No achievements added yet.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {achievements.map((item, index) => (
            <article
              key={item.id || item._id || `${item.title}-${index}`}
              className="group rounded-2xl border border-white/6 bg-white/[0.02] p-4 transition hover:border-white/15 hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  {item.organization && <p className="text-xs text-purple-200/90">{item.organization}</p>}
                  {item.date && <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">{item.date}</span>}
                  {item.description && (
                    <p className="mt-2 text-xs text-[var(--text-secondary)] line-clamp-2">{item.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                  {item.verificationUrl && (
                    <a
                      href={item.verificationUrl.startsWith('http') ? item.verificationUrl : `https://${item.verificationUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-purple-400 hover:text-purple-300"
                      title="View Verification"
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => onEditAchievement(item, index)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[var(--text-secondary)] hover:text-white"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteAchievement(index)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[var(--text-muted)] hover:text-rose-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
