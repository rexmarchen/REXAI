import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { SignupPageClient } from '@/components/auth/SignupPageClient'

export default async function RegisterPage({ searchParams }: { searchParams?: { plan?: string } }) {
  const session = await auth()
  if (session?.user) {
    redirect('/dashboard')
  }

  const plan = searchParams?.plan || null
  return <SignupPageClient initialPlan={plan} />
}
