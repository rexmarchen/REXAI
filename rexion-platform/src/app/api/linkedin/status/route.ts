import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId } from '@/lib/session'

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    let account = null

    try {
      account = await (prisma as any).linkedInAccount.findUnique({
        where: { userId },
      })
    } catch (dbErr: any) {
      console.warn('[Prisma status check fallback]:', dbErr.message)
    }

    if (!account) {
      return NextResponse.json({
        success: true,
        connected: false,
        account: null,
      })
    }

    return NextResponse.json({
      success: true,
      connected: account.status !== 'disconnected',
      account: {
        id: account.id,
        userId: account.userId,
        provider: account.provider,
        providerAcctId: account.providerAcctId,
        status: account.status,
        dailyCap: account.dailyCap,
        connectedAt: account.connectedAt,
        lastActionAt: account.lastActionAt,
      },
    })
  } catch (error: any) {
    console.error('[API /api/linkedin/status Error]:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch status' },
      { status: 500 }
    )
  }
}
