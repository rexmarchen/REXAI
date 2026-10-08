import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DashboardLayout as Shell } from '@/components/layout/DashboardLayout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return <Shell user={session.user}>{children}</Shell>
}
