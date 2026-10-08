import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { Badge } from '@/components/ui/Badge'
import { activityFeed, mockCampaigns, mockMicroGigs } from '@/lib/mock-data'
import { formatCurrency } from '@/lib/utils'

const signalCards = [
  {
    title: 'Razorpay outreach heating up',
    summary: 'Two verified recruiter opens and one follow-up slot due before noon.',
    badge: 'Priority',
    tone: 'success' as const,
  },
  {
    title: 'Frontend demand remains strongest',
    summary: 'React + Next.js roles account for the highest fit score in today’s match set.',
    badge: 'Demand',
    tone: 'info' as const,
  },
  {
    title: 'Zepto micro-gig closes in 48 hours',
    summary: 'A pre-hiring sprint with real conversion upside is still open and under-applied.',
    badge: 'Closing Soon',
    tone: 'warning' as const,
  },
] as const

export default function IntelligenceFeedPage() {
  const featuredCampaign = mockCampaigns[0]
  const featuredGig = mockMicroGigs[0]

  return (
    <div className="space-y-6">
      <section className="rounded-[36px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_24%),linear-gradient(135deg,rgba(15,26,22,0.96),rgba(8,12,12,0.96))] p-6 shadow-soft lg:p-10">
        <p className="type-label">Intelligence Feed</p>
        <h1 className="mt-4 max-w-3xl text-[36px] font-semibold tracking-[-0.05em] text-white md:text-[48px]">
          The signals worth acting on, without the noise.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
          REXION distills job demand, recruiter behavior, and gig urgency into a daily operating view so your next move
          stays obvious.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {signalCards.map((signal) => (
          <article key={signal.title} className="rounded-[28px] border border-white/8 bg-[rgba(15,26,22,0.84)] p-6 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <Badge variant={signal.tone}>{signal.badge}</Badge>
            </div>
            <h2 className="mt-5 text-xl font-semibold text-white">{signal.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{signal.summary}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,1fr)]">
        <ActivityFeed items={activityFeed} />

        <div className="space-y-6">
          <section className="rounded-[32px] border border-white/8 bg-[rgba(15,26,22,0.84)] p-6 shadow-soft">
            <p className="type-label">Campaign Snapshot</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">{featuredCampaign.company.name}</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-white/6 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.08em] text-[var(--text-secondary)]">Contacts</div>
                <div className="mt-2 text-2xl font-semibold text-white">{featuredCampaign.totalContacts}</div>
              </div>
              <div className="rounded-[22px] border border-white/6 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.08em] text-[var(--text-secondary)]">Opened</div>
                <div className="mt-2 text-2xl font-semibold text-white">{featuredCampaign.openCount}</div>
              </div>
              <div className="rounded-[22px] border border-white/6 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.08em] text-[var(--text-secondary)]">Tone</div>
                <div className="mt-2 text-2xl font-semibold capitalize text-white">{featuredCampaign.tone}</div>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-[var(--text-secondary)]">{featuredCampaign.subject}</p>
          </section>

          <section className="rounded-[32px] border border-white/8 bg-[rgba(15,26,22,0.84)] p-6 shadow-soft">
            <p className="type-label">Featured Gig</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">{featuredGig.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{featuredGig.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-white">
              <Badge variant="success">{featuredGig.company.name}</Badge>
              <span>{formatCurrency(featuredGig.pay)}</span>
              <span>{featuredGig.duration} days</span>
              <span className="capitalize">{featuredGig.location}</span>
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}
