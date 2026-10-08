import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createMicrosoftConnectUrl } from '@/lib/outreach/connected-mailbox'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
  try {
    return NextResponse.redirect(await createMicrosoftConnectUrl(session.user.id))
  } catch (error) {
    return NextResponse.redirect(new URL(`/outreach?mailboxError=${encodeURIComponent(error instanceof Error ? error.message : 'Could not connect Microsoft.')}`, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
  }
}
