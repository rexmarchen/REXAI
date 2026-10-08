import { Badge } from '@/components/ui/Badge'

const pastSessions = [
  { role: 'Frontend Engineer', company: 'Zepto', score: 78, date: '29 Mar 2026', focus: 'Mixed' },
  { role: 'Product Designer', company: 'Cred', score: 71, date: '26 Mar 2026', focus: 'Behavioral' },
  { role: 'Backend Developer', company: 'Razorpay', score: 83, date: '22 Mar 2026', focus: 'Technical' },
] as const

const sessionPreview = [
  {
    category: 'Technical',
    question: 'Explain the difference between useMemo and useCallback in React, and where each helps most.',
    feedback: 'Strong on the core distinction. Sharpen the real-world example by mentioning referential stability for props.',
    score: 82,
  },
  {
    category: 'Behavioral',
    question: 'Tell me about a time you handled a fast-moving product request with unclear requirements.',
    feedback: 'Good ownership signal. Add metrics or outcome detail to increase credibility.',
    score: 74,
  },
] as const

export default function InterHuntPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[36px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_24%),linear-gradient(135deg,rgba(15,26,22,0.96),rgba(8,12,12,0.96))] p-6 shadow-soft lg:p-10">
        <p className="type-label">Inter Hunt</p>
        <h1 className="mt-4 max-w-3xl text-[36px] font-semibold tracking-[-0.05em] text-white md:text-[48px]">
          Practice like the interview is already on the calendar.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
          The session deck below mirrors the scoring and feedback flow we&apos;re wiring into the full AI interview system.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <article className="rounded-[32px] border border-white/8 bg-[rgba(15,26,22,0.84)] p-6 shadow-soft">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="type-label">Session Blueprint</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Frontend Engineer · Mixed · Medium</h2>
            </div>
            <Badge variant="info">10 Questions</Badge>
          </div>

          <div className="mt-6 space-y-4">
            {sessionPreview.map((entry, index) => (
              <div key={entry.question} className="rounded-[24px] border border-white/6 bg-black/20 p-5">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant={entry.category === 'Technical' ? 'success' : 'warning'}>{entry.category}</Badge>
                  <span className="text-sm font-semibold text-white">Q{index + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{entry.question}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{entry.feedback}</p>
                <div className="mt-4 text-sm font-medium text-emerald-200">Score preview: {entry.score}/100</div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[32px] border border-white/8 bg-[rgba(15,26,22,0.84)] p-6 shadow-soft">
          <p className="type-label">Past Sessions</p>
          <div className="mt-6 space-y-3">
            {pastSessions.map((session) => (
              <div key={`${session.company}-${session.date}`} className="rounded-[22px] border border-white/6 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">
                    {session.role} · {session.company}
                  </div>
                  <Badge variant={session.score >= 80 ? 'success' : 'info'}>{session.score}/100</Badge>
                </div>
                <div className="mt-2 text-sm text-[var(--text-secondary)]">
                  {session.focus} interview · {session.date}
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
