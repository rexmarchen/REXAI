import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getGigById } from '@/lib/server-data'
import { GigDetail } from '@/components/micro-internships/GigDetail'

export default async function MicroInternshipDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [session, gig] = await Promise.all([auth(), getGigById(params.id)])

  if (!gig) {
    notFound()
  }

  return <GigDetail gig={gig} plan={session?.user?.plan || 'free'} />
}
