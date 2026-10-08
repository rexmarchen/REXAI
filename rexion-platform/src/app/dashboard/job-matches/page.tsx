import { auth } from '@/lib/auth'
import { OneClickApplyDashboard } from '@/components/jobs/OneClickApplyDashboard'

export default async function JobMatchesPage() {
  const session = await auth()
  return <OneClickApplyDashboard email={session?.user?.email || undefined} name={session?.user?.name || undefined} />
}
