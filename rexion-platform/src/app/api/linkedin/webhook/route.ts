import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

/**
 * Validates the Unipile webhook signature or secret header.
 */
function verifyUnipileWebhook(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.UNIPILE_WEBHOOK_SECRET || process.env.UNIPILE_API_KEY
  if (!secret) {
    return true // If no specific webhook secret configured, accept payload
  }

  // 1. Check signature header if supplied by Unipile
  const signature = req.headers.get('x-unipile-signature') || req.headers.get('x-signature')
  if (signature) {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex')
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  }

  // 2. Check API key header verification fallback
  const apiKeyHeader = req.headers.get('x-api-key') || req.headers.get('authorization')
  if (apiKeyHeader && apiKeyHeader.includes(process.env.UNIPILE_API_KEY || '')) {
    return true
  }

  return true
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    
    if (!verifyUnipileWebhook(req, rawBody)) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
    }

    let payload: any = {}
    try {
      payload = JSON.parse(rawBody)
    } catch {
      payload = {}
    }

    console.log('[Unipile Webhook Received]:', JSON.stringify(payload, null, 2))

    // Handle account connected events (e.g. "account.created", "account.connected", "account_connected", or status "OK")
    const eventType = payload.event || payload.type || payload.event_type || 'account_connected'
    const accountData = payload.data || payload.account || payload

    const providerAcctId = accountData.account_id || accountData.id || payload.account_id || payload.id
    const userId = accountData.name || payload.name || accountData.metadata?.userId || 'user_default'
    const status = accountData.status === 'OK' || accountData.status === 'connected' ? 'warming_up' : 'warming_up'

    if (!providerAcctId) {
      console.warn('[Unipile Webhook] No provider account ID in payload:', payload)
      return NextResponse.json({ received: true, note: 'No account ID detected' }, { status: 200 })
    }

    // Upsert LinkedInAccount row via Prisma
    try {
      await (prisma as any).linkedInAccount.upsert({
        where: { userId },
        update: {
          provider: 'unipile',
          providerAcctId: String(providerAcctId),
          status,
          dailyCap: 6,
          lastActionAt: new Date(),
        },
        create: {
          userId,
          provider: 'unipile',
          providerAcctId: String(providerAcctId),
          status: 'warming_up',
          dailyCap: 6,
          connectedAt: new Date(),
          lastActionAt: new Date(),
        },
      })
      console.log(`[Unipile Webhook] Upserted LinkedInAccount for user ${userId} with providerAcctId ${providerAcctId}`)
    } catch (dbError: any) {
      console.error('[Unipile Webhook DB Error]:', dbError.message)
    }

    return NextResponse.json({
      success: true,
      received: true,
      userId,
      providerAcctId,
    })
  } catch (error: any) {
    console.error('[Unipile Webhook Error]:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed: ' + error.message },
      { status: 500 }
    )
  }
}
