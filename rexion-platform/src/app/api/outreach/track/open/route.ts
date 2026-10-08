import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 1x1 Transparent GIF base64
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sendId = searchParams.get('sendId')

  if (sendId) {
    try {
      const sendRecord = await prisma.campaignSend.findUnique({
        where: { id: sendId },
      })

      // Only mark as opened on first open (status must be 'sent' or similar, not already opened/replied/bounced)
      if (sendRecord && sendRecord.status === 'sent') {
        await prisma.campaignSend.update({
          where: { id: sendId },
          data: {
            status: 'opened',
            openedAt: new Date(),
          },
        })
      }
    } catch (err) {
      console.error('Failed to track email open:', err)
    }
  }

  // Return 1x1 transparent tracking GIF
  return new NextResponse(TRANSPARENT_GIF, {
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': TRANSPARENT_GIF.length.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}
