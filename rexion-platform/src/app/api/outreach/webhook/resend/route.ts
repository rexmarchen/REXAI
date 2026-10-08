import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const { type, data } = payload

    if (!type || !data || !Array.isArray(data.to) || data.to.length === 0) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
    }

    const email = data.to[0].toLowerCase().trim()
    const reason = type === 'email.bounced' ? 'bounced' : type === 'email.complained' ? 'complained' : null

    if (!reason) {
      // Ignore other event types like email.sent, email.delivered, etc.
      return NextResponse.json({ received: true, ignored: true })
    }

    console.log(`Resend Webhook: Email ${email} triggered event ${type}`)

    // 1. Find the contact associated with this email
    const contact = await prisma.contact.findFirst({
      where: { email },
    })

    if (contact) {
      // 2. Add email to SuppressionEntry
      await prisma.suppressionEntry.upsert({
        where: { email },
        update: {
          userId: contact.userId,
          reason,
          addedAt: new Date(),
        },
        create: {
          userId: contact.userId,
          email,
          reason,
          addedAt: new Date(),
        },
      })

      // 3. Mark the most recent CampaignSend record for this contact as bounced
      const recentSend = await prisma.campaignSend.findFirst({
        where: {
          contactId: contact.id,
          status: { in: ['sent', 'opened', 'sending', 'queued'] },
        },
        orderBy: { queuedAt: 'desc' },
      })

      if (recentSend) {
        await prisma.campaignSend.update({
          where: { id: recentSend.id },
          data: {
            status: 'bounced',
            bouncedAt: new Date(),
          },
        })
      }
    } else {
      // If we don't have the contact in our system, we still suppress it globally
      await prisma.suppressionEntry.upsert({
        where: { email },
        update: {
          userId: 'system',
          reason,
          addedAt: new Date(),
        },
        create: {
          userId: 'system',
          email,
          reason,
          addedAt: new Date(),
        },
      })
    }

    return NextResponse.json({ received: true, processed: true })
  } catch (error: any) {
    console.error('Resend webhook error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
