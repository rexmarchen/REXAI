import { ok, apiError, requireSessionUser } from '@/lib/api'
import { listUserCampaigns } from '@/lib/server-data'

export async function GET() {
  const sessionUser = await requireSessionUser()
  if (!sessionUser) {
    return apiError('Please log in to view campaigns.', 401)
  }

  return ok(await listUserCampaigns(sessionUser.id))
}
