import { apiError, ok, requireSessionUser } from '@/lib/api'
import { exportUserData } from '@/lib/server-data'

export async function GET() {
  const sessionUser = await requireSessionUser()
  if (!sessionUser) {
    return apiError('Please log in to export your data.', 401)
  }

  return ok(await exportUserData(sessionUser.id))
}
