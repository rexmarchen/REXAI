import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { DashboardNavbar } from '@/components/dashboard/DashboardNavbar'
import styles from '@/styles/dashboard.module.css'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className={styles.shell}>
      <Sidebar user={session.user} />
      <div className={styles.main}>
        <DashboardNavbar user={session.user} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  )
}
