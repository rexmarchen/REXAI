import { ok } from '@/lib/api'
import { buildLeaderboardRows } from '@/lib/micro-gigs/matching'
import { listLeaderboardEntries } from '@/lib/server-data'

export async function GET() {
  return ok(buildLeaderboardRows(await listLeaderboardEntries()))
}
