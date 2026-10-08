import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { disconnectMailbox } from '@/lib/outreach/connected-mailbox'

export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const disconnected = await disconnectMailbox(session.user.id, context.params.id)
    return NextResponse.json({ disconnected })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not disconnect mailbox.' }, { status: 500 })
  }
}
