import { auth } from '@/lib/auth'
import { MicroInternshipsWorkspace } from '@/components/micro-internships/MicroInternshipsWorkspace'

export default async function MicroInternshipsPage() {
  const session = await auth()
  const plan = session?.user?.plan || 'free'

  return <MicroInternshipsWorkspace plan={plan} />
}
