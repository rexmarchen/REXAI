'use client'

import { FolderGit2, Plus, ExternalLink, Github, Edit3, Trash2, Calendar, Tag } from 'lucide-react'
import type { ProfileProject } from '@/types/profile'

interface ProfileProjectsSectionProps {
  projects: ProfileProject[]
  onAddProject: () => void
  onEditProject: (project: ProfileProject, index: number) => void
  onDeleteProject: (index: number) => void
}

export function ProfileProjectsSection({
  projects = [],
  onAddProject,
  onEditProject,
  onDeleteProject,
}: ProfileProjectsSectionProps) {
  return (
    <div className="rounded-[28px] border border-white/8 bg-[rgba(15,26,22,0.85)] p-6 shadow-xl backdrop-blur-xl" id="projects-section">
      <div className="flex items-center justify-between pb-4 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
            <FolderGit2 size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Projects</h3>
            <p className="text-xs text-[var(--text-secondary)]">Applications, AI models, open-source repos, and prototypes</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAddProject}
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
        >
          <Plus size={14} />
          Add Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center">
          <FolderGit2 size={24} className="mx-auto text-[var(--text-muted)] mb-2" />
          <p className="text-sm font-semibold text-white">No projects added yet</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Showcase your best builds, production systems, hackathon winners, and GitHub repos.
          </p>
          <button
            type="button"
            onClick={onAddProject}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/20 transition"
          >
            <Plus size={14} />
            Add Project
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {projects.map((project, index) => {
            const title = project.title || project.projectName || 'Untitled Project'
            return (
              <article
                key={project.id || project._id || `${title}-${index}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/6 bg-white/[0.02] p-5 transition hover:border-white/15 hover:bg-white/[0.04]"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-white group-hover:text-emerald-200 transition">
                        {title}
                      </h4>
                      {project.role && (
                        <span className="mt-0.5 inline-block text-xs font-medium text-emerald-400">
                          {project.role}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={() => onEditProject(project, index)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[var(--text-secondary)] hover:text-white transition"
                        title="Edit Project"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProject(index)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[var(--text-muted)] hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 transition"
                        title="Delete Project"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <p className="mt-2.5 line-clamp-3 text-xs leading-relaxed text-[var(--text-secondary)]">
                    {project.description || 'No description provided.'}
                  </p>

                  {/* Tech stack badges */}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-lg border border-teal-400/20 bg-teal-400/5 px-2 py-0.5 text-[10px] font-medium text-teal-200"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Links & Dates */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/6 pt-3 text-xs">
                  <div className="flex items-center gap-3">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl.startsWith('http') ? project.githubUrl : `https://${project.githubUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-[var(--text-secondary)] hover:text-emerald-300 transition"
                      >
                        <Github size={12} />
                        GitHub
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl.startsWith('http') ? project.liveUrl : `https://${project.liveUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-emerald-400 hover:underline"
                      >
                        <ExternalLink size={12} />
                        Live Demo
                      </a>
                    )}
                  </div>

                  {(project.startDate || project.endDate) && (
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {project.startDate} {project.endDate ? `— ${project.endDate}` : ''}
                    </span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
