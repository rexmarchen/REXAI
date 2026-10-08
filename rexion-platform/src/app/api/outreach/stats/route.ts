import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Fetch all campaigns belonging to this user
    const campaigns = await prisma.campaign.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    const campaignStats = []
    let totalSent = 0
    let totalOpened = 0
    let totalReplied = 0
    let totalBounced = 0

    // 2. Loop through each campaign and aggregate details
    for (const campaign of campaigns) {
      const sends = await prisma.campaignSend.findMany({
        where: { campaignId: campaign.id },
      })

      const queuedCount = sends.filter((s) => s.status === 'queued').length
      const sendingCount = sends.filter((s) => s.status === 'sending').length
      const sentCount = sends.filter((s) => s.status === 'sent' || s.status === 'opened' || s.status === 'replied').length
      const openedCount = sends.filter((s) => s.status === 'opened' || s.status === 'replied').length
      const repliedCount = sends.filter((s) => s.status === 'replied').length
      const bouncedCount = sends.filter((s) => s.status === 'bounced').length
      const failedCount = sends.filter((s) => s.status === 'failed').length
      const skippedCount = sends.filter((s) => s.status === 'skipped').length

      // Check if campaign is complete (if all sends are processed)
      let resolvedStatus = campaign.status
      if (campaign.status === 'sending' && queuedCount === 0 && sendingCount === 0) {
        resolvedStatus = 'complete'
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'complete' },
        })
      }

      totalSent += sentCount
      totalOpened += openedCount
      totalReplied += repliedCount
      totalBounced += bouncedCount

      campaignStats.push({
        id: campaign.id,
        name: campaign.name,
        status: resolvedStatus,
        sent: sentCount,
        opened: openedCount,
        replied: repliedCount,
        bounced: bouncedCount,
        failed: failedCount,
        skipped: skippedCount,
        total: sends.length,
        createdAt: campaign.createdAt,
      })
    }

    // 3. Compute rates
    const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0
    const replyRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0
    const bounceRate = totalSent > 0 ? Math.round((totalBounced / totalSent) * 100) : 0

    return NextResponse.json({
      aggregate: {
        totalSent,
        openRate,
        replyRate,
        bounceRate,
      },
      campaigns: campaignStats,
    })
  } catch (error: any) {
    console.error('Outreach stats route error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
