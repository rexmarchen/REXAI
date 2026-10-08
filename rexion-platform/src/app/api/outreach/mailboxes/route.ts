import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listConnectedMailboxes } from '@/lib/outreach/connected-mailbox'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    return NextResponse.json({ mailboxes: await listConnectedMailboxes(session.user.id) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load mailboxes.' }, { status: 500 })
  }
}
