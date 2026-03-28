import { ok, apiError } from '@/lib/api'
import { getGigById } from '@/lib/server-data'

export async function GET(
  _request: Request,
  context: {
    params: { id: string }
  }
) {
  const gig = await getGigById(context.params.id)
  if (!gig) {
    return apiError('Gig not found.', 404)
  }

  return ok(gig)
}
