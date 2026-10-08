import { Badge } from '@/components/ui/Badge'

const builderSections = [
  'Header with contact links and portfolio',
  'Professional summary optimized for product frontend roles',
  'Experience bullets focused on outcomes and speed',
  'Projects with stack, impact, and shipped proof',
  'Skill stack organized by languages, frameworks, and tools',
] as const

const previewHighlights = [
  'ATS score climbing with stronger keyword coverage',
  'Clear project hierarchy and cleaner headline positioning',
  'Better alignment between skills, summary, and target role',
] as const

export default function ResumeBuilderPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[36px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(74,158,255,0.14),transparent_24%),linear-gradient(135deg,rgba(15,26,22,0.96),rgba(8,12,12,0.96))] p-6 shadow-soft lg:p-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="type-label">Resume Builder</p>
            <h1 className="mt-4 max-w-3xl text-[36px] font-semibold tracking-[-0.05em] text-white md:text-[48px]">
              Edit on the left. See the recruiter-ready version on the right.
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge variant="info">Draft Saved</Badge>
            <Badge variant="success">Score: 74 / 100</Badge>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[32px] border border-white/8 bg-[rgba(15,26,22,0.84)] p-6 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="type-label">Editor Outline</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Structured for clean iteration</h2>
            </div>
            <Badge variant="neutral">Classic Template</Badge>
          </div>

          <div className="mt-6 space-y-4">
            {builderSections.map((section, index) => (
              <div key={section} className="rounded-[24px] border border-white/6 bg-black/20 p-5">
                <div className="text-xs uppercase tracking-[0.08em] text-[var(--text-secondary)]">Section {index + 1}</div>
                <div className="mt-2 text-base font-semibold text-white">{section}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[32px] border border-white/8 bg-[rgba(15,26,22,0.84)] p-6 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="type-label">Live Preview</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">ATS-safe and recruiter-readable</h2>
            </div>
            <Badge variant="success">Modernized</Badge>
          </div>

          <div className="mt-6 rounded-[28px] border border-white/8 bg-white p-8 text-slate-900 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
            <div className="border-b border-slate-200 pb-5">
              <div className="text-3xl font-semibold tracking-[-0.04em]">Arjun Mehta</div>
              <div className="mt-2 text-sm text-slate-600">Frontend Engineer · Bengaluru / Remote · arjun@rexion.ai</div>
            </div>

            <div className="mt-6 space-y-5 text-sm leading-6">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Summary</div>
                <p className="mt-2 text-slate-700">
                  Frontend engineer shipping performant interfaces in React, Next.js, and TypeScript with a strong bias
                  toward product clarity, experimentation, and measurable outcomes.
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Projects</div>
                <p className="mt-2 text-slate-700">
                  Built growth landing pages, analytics dashboards, and application workflows used to improve conversion
                  and recruiter response quality.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {previewHighlights.map((item) => (
              <div key={item} className="rounded-[22px] border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm leading-6 text-emerald-100">
                {item}
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
