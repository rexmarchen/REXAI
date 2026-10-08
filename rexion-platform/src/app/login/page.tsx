import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { LoginPageClient } from '@/components/auth/LoginPageClient'

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) {
    redirect('/dashboard')
  }

  return <LoginPageClient />
}
