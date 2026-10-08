import { NextRequest, NextResponse } from 'next/server'
import { createConnectLink } from '@/lib/unipile'
import { getUserId } from '@/lib/session'

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { url } = await createConnectLink(userId)

    return NextResponse.json({
      success: true,
      url,
    })
  } catch (error: any) {
    console.error('[API /api/linkedin/connect Error]:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate LinkedIn connection link.',
      },
      { status: 500 }
    )
  }
}
