import { ok, apiError, requireSessionUser } from '@/lib/api'
import { rankMicroGigs } from '@/lib/micro-gigs/matching'
import { generateGigMatchExplanation } from '@/lib/openai'
import { ensureSessionUser, listGigs } from '@/lib/server-data'

export async function GET() {
  const sessionUser = await requireSessionUser()
  if (!sessionUser) {
    return apiError('Please log in to view matched gigs.', 401)
  }

  const storedUser = await ensureSessionUser(sessionUser)
  const gigs = await listGigs()
  const profile = storedUser?.profile || {
    skills: ['React', 'Next.js', 'TypeScript'],
    preferredDomain: 'Frontend',
    location: 'Remote',
  }

  const ranked = rankMicroGigs(gigs, {
    skills: profile.skills.length ? profile.skills : ['React', 'Next.js'],
    preferredDomain: profile.preferredDomain,
    location: profile.location,
  }).slice(0, 5)

  const withExplanations = await Promise.all(
    ranked.map(async (entry) => ({
      gig: entry.gig,
      score: entry.score,
      explanation: await generateGigMatchExplanation({
        gig: entry.gig,
        skills: profile.skills.length ? profile.skills : ['React', 'Next.js'],
      }),
    }))
  )

  return ok(withExplanations)
}
