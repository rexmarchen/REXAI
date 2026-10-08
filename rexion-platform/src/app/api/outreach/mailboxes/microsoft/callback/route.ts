import { NextRequest, NextResponse } from 'next/server'
import { completeMicrosoftConnection } from '@/lib/outreach/connected-mailbox'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  try {
    if (!code || !state) throw new Error('Microsoft did not return a mailbox connection code.')
    await completeMicrosoftConnection(code, state)
    return NextResponse.redirect(new URL('/outreach?mailbox=connected', appUrl))
  } catch (error) {
    return NextResponse.redirect(new URL(`/outreach?mailboxError=${encodeURIComponent(error instanceof Error ? error.message : 'Could not connect Microsoft.')}`, appUrl))
  }
}
