import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const MAX_EMAILS = 20

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const emails: string[] = Array.isArray(body?.emails)
      ? Array.from(
          new Set<string>(
            body.emails
              .filter((email: unknown): email is string => typeof email === 'string')
              .map((email: string) => email.trim().toLowerCase()),
          ),
        ).slice(0, MAX_EMAILS)
      : []

    if (emails.length === 0) {
      return NextResponse.json({ suppressedEmails: [], suppressedCount: 0 })
    }

    const entries = await prisma.suppressionEntry.findMany({
      where: { userId: session.user.id, email: { in: emails } },
      select: { email: true, reason: true },
    })

    return NextResponse.json({
      suppressedEmails: entries,
      suppressedCount: entries.length,
    })
  } catch (error) {
    console.error('Suppression check failed:', error)
    return NextResponse.json({ error: 'Unable to check suppression list.' }, { status: 500 })
  }
}