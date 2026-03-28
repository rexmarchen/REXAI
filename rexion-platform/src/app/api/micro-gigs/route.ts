import { ok } from '@/lib/api'
import { listGigs } from '@/lib/server-data'

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams
  const search = searchParams.get('search')?.toLowerCase() || ''
  const domain = searchParams.get('domain')
  const location = searchParams.get('location')
  const status = searchParams.get('status')

  const gigs = await listGigs()

  return ok(
    gigs.filter((gig) => {
      if (search && !`${gig.company.name} ${gig.title}`.toLowerCase().includes(search)) return false
      if (domain && domain !== 'all' && gig.domain !== domain) return false
      if (location && location !== 'all' && gig.location !== location) return false
      if (status && status !== 'all' && gig.status !== status) return false
      return true
    })
  )
}
