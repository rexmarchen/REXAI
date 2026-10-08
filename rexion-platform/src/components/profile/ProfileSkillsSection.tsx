'use client'

import { useState } from 'react'
import { Code2, Cpu, Database, Layers, Wrench, Sparkles, Plus, Edit3, Trash2 } from 'lucide-react'
import type { CareerProfileShape, CategorizedSkills } from '@/types'

interface ProfileSkillsSectionProps {
  profile: CareerProfileShape
  onEdit: () => void
}

export function ProfileSkillsSection({ profile, onEdit }: ProfileSkillsSectionProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'languages' | 'aiMl' | 'frameworks' | 'databases' | 'tools' | 'other'>('all')

  const categorized: CategorizedSkills = profile.categorizedSkills || {
    languages: profile.languages || [],
    aiMl: [],
    frameworks: profile.frameworks || [],
    databases: profile.databases || [],
    tools: profile.tools || [],
    other: [],
  }

  // Combine flat skills with categorized skills
  const allCategorizedSkills = [
    ...(categorized.languages || []),
    ...(categorized.aiMl || []),
    ...(categorized.frameworks || []),
    ...(categorized.databases || []),
    ...(categorized.tools || []),
    ...(categorized.other || []),
  ]

  const unassignedSkills = (profile.skills || []).filter((s) => !allCategorizedSkills.includes(s))

  const categories = [
    { key: 'all', label: 'All Skills', count: allCategorizedSkills.length + unassignedSkills.length, icon: Sparkles },
    { key: 'languages', label: 'Languages', count: (categorized.languages || []).length, icon: Code2 },
    { key: 'aiMl', label: 'AI / ML', count: (categorized.aiMl || []).length, icon: Cpu },
    { key: 'frameworks', label: 'Frameworks & Libs', count: (categorized.frameworks || []).length, icon: Layers },
    { key: 'databases', label: 'Databases', count: (categorized.databases || []).length, icon: Database },
    { key: 'tools', label: 'Developer Tools', count: (categorized.tools || []).length, icon: Wrench },
  ]

  const hasAnySkills = allCategorizedSkills.length > 0 || unassignedSkills.length > 0

  return (
    <div className="rounded-[28px] border border-white/8 bg-[rgba(15,26,22,0.85)] p-6 shadow-xl backdrop-blur-xl" id="skills-section">
      <div className="flex items-center justify-between pb-4 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
            <Code2 size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Skills & Technologies</h3>
            <p className="text-xs text-[var(--text-secondary)]">Technical stacks, AI frameworks, tools, and platforms</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-emerald-400/30 hover:bg-white/10"
        >
          <Edit3 size={13} className="text-emerald-400" />
          Manage Skills
        </button>
      </div>

      {!hasAnySkills ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center">
          <Code2 size={24} className="mx-auto text-[var(--text-muted)] mb-2" />
          <p className="text-sm font-semibold text-white">No technical skills added yet</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Add your programming languages, frameworks, AI stacks, and developer tools to power job matching.
          </p>
          <button
            type="button"
            onClick={onEdit}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/20 transition"
          >
            <Plus size={14} />
            Add Skills
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon
              const active = activeTab === cat.key
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveTab(cat.key as any)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                      : 'border border-white/6 bg-white/[0.02] text-[var(--text-secondary)] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={13} />
                  <span>{cat.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      active ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/10 text-[var(--text-muted)]'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Skill Pills Display */}
          <div className="space-y-4">
            {(activeTab === 'all' || activeTab === 'languages') && (categorized.languages || []).length > 0 && (
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">
                  Programming Languages
                </span>
                <div className="flex flex-wrap gap-2">
                  {categorized.languages.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-xs font-medium text-emerald-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'aiMl') && (categorized.aiMl || []).length > 0 && (
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">
                  AI / Machine Learning
                </span>
                <div className="flex flex-wrap gap-2">
                  {categorized.aiMl.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-xl border border-teal-500/20 bg-teal-500/5 px-3 py-1 text-xs font-medium text-teal-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'frameworks') && (categorized.frameworks || []).length > 0 && (
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">
                  Frameworks & Libraries
                </span>
                <div className="flex flex-wrap gap-2">
                  {categorized.frameworks.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 text-xs font-medium text-cyan-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'databases') && (categorized.databases || []).length > 0 && (
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">
                  Databases
                </span>
                <div className="flex flex-wrap gap-2">
                  {categorized.databases.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-xs font-medium text-amber-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'tools') && (categorized.tools || []).length > 0 && (
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">
                  Tools & Platforms
                </span>
                <div className="flex flex-wrap gap-2">
                  {categorized.tools.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/90"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'all' && unassignedSkills.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">
                  General & Other Skills
                </span>
                <div className="flex flex-wrap gap-2">
                  {unassignedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-[var(--text-secondary)]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
