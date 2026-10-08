import { auth } from '@/lib/auth'
import { activityFeed, mockMicroGigs } from '@/lib/mock-data'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { GigMatchStrip } from '@/components/dashboard/GigMatchStrip'
import { GreetingHero } from '@/components/dashboard/GreetingHero'
import { HiringVelocityBoard } from '@/components/dashboard/HiringVelocityBoard'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import connectDB from '@/lib/mongodb'
import Profile from '@/models/Profile'
import { redirect } from 'next/navigation'

type CommandStat = {
  label: string
  value: number
  change: string
  points: number[]
  highlight?: boolean
}

const commandStats: CommandStat[] = [
  {
    label: 'Applications Sent',
    value: 16,
    change: '+5 today',
    points: [8, 10, 12, 11, 14, 16],
  },
  {
    label: 'Emails Delivered',
    value: 41,
    change: '94% open trend',
    points: [18, 21, 25, 29, 34, 41],
  },
  {
    label: 'Interview Invites',
    value: 4,
    change: 'strongest signal',
    points: [1, 1, 2, 2, 3, 4],
    highlight: true,
  },
  {
    label: 'Gigs Applied',
    value: 7,
    change: '+2 closing soon',
    points: [2, 3, 3, 4, 6, 7],
  },
]

const tickerItems = [
  '84 jobs matched today',
  '26 outreach emails queued',
  '7 micro-gig matches',
  '3 recruiter opens in the last hour',
] as const

const pipelineStages = [
  {
    label: 'Queued',
    count: 8,
    detail: 'Fresh company and recruiter targets added by AI.',
    tone: 'info' as const,
  },
  {
    label: 'Sending',
    count: 3,
    detail: 'High-intent sequences moving through your daily window.',
    tone: 'warning' as const,
  },
  {
    label: 'Delivered',
    count: 19,
    detail: 'Messages landed cleanly with no bounce risk.',
    tone: 'success' as const,
  },
  {
    label: 'Opened',
    count: 7,
    detail: 'Signals worth prioritizing for quick follow-up.',
    tone: 'info' as const,
  },
  {
    label: 'Replied',
    count: 2,
    detail: 'Conversations ready for resume handoff or call booking.',
    tone: 'success' as const,
  },
] as const

export default async function DashboardHomePage() {
  const session = await auth()
  if (!session || !session.user) {
    redirect('/login')
  }

  const role = session.user.role || 'user'
  if (role === 'user' || role === 'candidate') {
    await connectDB()
    const profile = await Profile.findOne({ userId: session.user.id })
    if (!profile || !profile.resumeUrl) {
      redirect('/profile/setup')
    }
  }

  const firstName = session.user.name?.split(' ')[0] || 'there'

  return (
    <div className="space-y-6">
      <GreetingHero firstName={firstName} />

      <section className="overflow-hidden rounded-[24px] border border-white/8 bg-[rgba(15,26,22,0.78)] py-4 shadow-soft">
        <div className="animate-marquee flex min-w-max items-center gap-10 whitespace-nowrap px-6">
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <div key={`${item}-${index}`} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {commandStats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            points={[...stat.points]}
            highlight={stat.highlight}
          />
        ))}
      </section>

      <HiringVelocityBoard />

      <section className="rounded-[32px] border border-white/8 bg-[rgba(15,26,22,0.84)] p-6 shadow-soft">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="type-label">Outreach Pipeline</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Queued to replied, in one glance</h2>
          </div>
          <div className="max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
            Your current plan is{' '}
            <span className="font-semibold capitalize text-white">{session?.user?.plan || 'free'}</span>. The pipeline
            view stays focused on momentum, not clutter, so follow-up energy goes where the signal already exists.
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-5">
          {pipelineStages.map((stage) => (
            <article key={stage.label} className="rounded-[24px] border border-white/6 bg-black/20 p-5">
              <div className="flex items-center justify-between gap-3">
                <Badge variant={stage.tone}>{stage.label}</Badge>
                <span className="text-2xl font-semibold tracking-[-0.04em] text-white">{stage.count}</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{stage.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <ActivityFeed items={activityFeed} />
        <QuickActions />
      </section>

      <GigMatchStrip gigs={mockMicroGigs.slice(0, 3)} />
    </div>
  )
}
