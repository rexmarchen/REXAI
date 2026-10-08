import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ProfilePageClient } from '@/components/profile/ProfilePageClient'

export default async function DashboardProfilePage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect('/login')
  }

  return <ProfilePageClient initialUser={session.user} />
}
