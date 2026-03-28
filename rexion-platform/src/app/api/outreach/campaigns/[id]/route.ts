import { ok, apiError, requireSessionUser } from '@/lib/api'
import { getCampaignDetail } from '@/lib/server-data'

export async function GET(
  _request: Request,
  context: {
    params: { id: string }
  }
) {
  const sessionUser = await requireSessionUser()
  if (!sessionUser) {
    return apiError('Please log in to view this campaign.', 401)
  }

  const campaign = await getCampaignDetail(sessionUser.id, context.params.id)
  if (!campaign) {
    return apiError('Campaign not found.', 404)
  }

  return ok(campaign)
}
