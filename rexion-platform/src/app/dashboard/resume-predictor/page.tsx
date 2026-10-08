import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

const breakdown = [
  { label: 'Skills Match', value: 82 },
  { label: 'Experience Match', value: 68 },
  { label: 'Education Match', value: 54 },
  { label: 'ATS Compatibility', value: 91 },
  { label: 'Keyword Coverage', value: 61 },
] as const

const gaps = [
  {
    title: 'Missing keyword: TypeScript',
    impact: '-8 points',
    fix: 'Add TypeScript to your core skills and show one project where it shaped the implementation.',
    href: '/dashboard/resume-builder',
    cta: 'Add in Resume Builder',
  },
  {
    title: 'No recent proof-of-work project',
    impact: '-9 points',
    fix: 'A short frontend micro-gig would immediately increase credibility for fast-moving product teams.',
    href: '/dashboard/micro-gigs',
    cta: 'Browse Micro-Gigs',
  },
  {
    title: 'LinkedIn URL missing from resume header',
    impact: '-5 points',
    fix: 'Recruiters expect quick verification. Add your profile link in the contact header section.',
    href: '/dashboard/resume-builder',
    cta: 'Fix Resume Header',
  },
] as const

const strengths = [
  'Strong React and Next.js alignment for product-led frontend roles.',
  'ATS-friendly structure with clear project scoping and readable sections.',
  'Project descriptions show delivery ownership rather than generic task lists.',
] as const

const actionPlan = [
  { week: 'Week 1', action: 'Update resume keywords, add LinkedIn, and tighten the summary for frontend hiring.' },
  { week: 'Week 2', action: 'Complete one proof-of-work micro-gig that creates a credible shipped artifact.' },
  { week: 'Week 3', action: 'Launch 20 high-fit outreach emails to recruiters and engineering leaders.' },
  { week: 'Week 4', action: 'Re-apply with the upgraded resume and follow up on opened conversations.' },
] as const

export default function ResumePredictorPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[36px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(74,158,255,0.14),transparent_24%),linear-gradient(135deg,rgba(15,26,22,0.96),rgba(8,12,12,0.96))] p-6 shadow-soft lg:p-10">
        <p className="type-label">Resume Predictor</p>
        <h1 className="mt-4 max-w-3xl text-[36px] font-semibold tracking-[-0.05em] text-white md:text-[48px]">
          AI predicts your odds and points at the exact gaps to close.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
          Current target: Frontend Engineer at Razorpay. Experience level: Fresher to 1 year. Location preference:
          Remote or Bengaluru.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <article className="rounded-[32px] border border-white/8 bg-[rgba(15,26,22,0.84)] p-6 shadow-soft">
          <p className="type-label">Overall Score</p>
          <div className="mt-6 flex items-center justify-center">
            <div className="flex h-52 w-52 flex-col items-center justify-center rounded-full border-[14px] border-emerald-400/70 bg-[radial-gradient(circle,rgba(16,185,129,0.18),transparent_62%)]">
              <div className="text-[56px] font-semibold tracking-[-0.06em] text-white">74</div>
              <div className="text-sm text-emerald-200">Good Candidate</div>
            </div>
          </div>
          <p className="mt-6 text-sm leading-6 text-[var(--text-secondary)]">
            You have a good shot, but three critical gaps are suppressing your score by roughly 22 points.
          </p>
        </article>

        <article className="rounded-[32px] border border-white/8 bg-[rgba(15,26,22,0.84)] p-6 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="type-label">Breakdown Scores</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Where the score comes from</h2>
            </div>
            <Badge variant="success">74 / 100</Badge>
          </div>

          <div className="mt-6 space-y-5">
            {breakdown.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between gap-3 text-sm text-white">
                  <span>{item.label}</span>
                  <span>{item.value}%</span>
                </div>
                <div className="mt-2 h-3 rounded-full bg-white/6">
                  <div
                    className="h-3 rounded-full bg-[linear-gradient(90deg,rgba(74,158,255,0.8),rgba(16,185,129,0.9))]"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <article className="rounded-[32px] border border-white/8 bg-[rgba(15,26,22,0.84)] p-6 shadow-soft">
          <p className="type-label">Gaps Found</p>
          <div className="mt-6 space-y-4">
            {gaps.map((gap, index) => (
              <div key={gap.title} className="rounded-[24px] border border-red-400/20 bg-red-400/5 p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-red-200">0{index + 1}</div>
                <h3 className="mt-3 text-lg font-semibold text-white">{gap.title}</h3>
                <div className="mt-2 text-sm font-medium text-red-200">Impact: {gap.impact}</div>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{gap.fix}</p>
                <Link
                  href={gap.href}
                  className="mt-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
                >
                  {gap.cta}
                </Link>
              </div>
            ))}
          </div>
        </article>

        <div className="space-y-6">
          <article className="rounded-[32px] border border-white/8 bg-[rgba(15,26,22,0.84)] p-6 shadow-soft">
            <p className="type-label">What&apos;s Working</p>
            <div className="mt-6 space-y-3">
              {strengths.map((strength) => (
                <div key={strength} className="rounded-[22px] border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm leading-6 text-emerald-100">
                  {strength}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[32px] border border-white/8 bg-[rgba(15,26,22,0.84)] p-6 shadow-soft">
            <p className="type-label">30-Day Action Plan</p>
            <div className="mt-6 space-y-4">
              {actionPlan.map((step) => (
                <div key={step.week} className="rounded-[22px] border border-white/6 bg-black/20 p-4">
                  <div className="text-sm font-semibold text-white">{step.week}</div>
                  <div className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{step.action}</div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}
