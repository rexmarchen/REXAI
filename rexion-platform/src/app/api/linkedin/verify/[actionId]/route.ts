import { NextRequest, NextResponse } from 'next/server'
import { getActionDeliveryLog } from '@/lib/linkedin-queue'

/**
 * GET /api/linkedin/verify/[actionId]
 * Confirms real delivery status of a specific LinkedIn action or invitation ID against Unipile records.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { actionId: string } }
) {
  try {
    const { actionId } = params

    if (!actionId) {
      return NextResponse.json(
        { success: false, error: 'actionId parameter is required.' },
        { status: 400 }
      )
    }

    const log = getActionDeliveryLog(actionId)

    if (!log) {
      return NextResponse.json({
        success: true,
        actionId,
        verified: false,
        status: 'UNKNOWN',
        message: 'No local delivery record found for this actionId. It may still be in queue or processed in an earlier session.',
      })
    }

    const isDelivered = log.outcome === 'SENT' && Boolean(log.invitationId)

    return NextResponse.json({
      success: true,
      actionId,
      verified: isDelivered,
      status: log.outcome,
      invitationId: log.invitationId || null,
      recipientName: log.recipientName,
      company: log.company,
      timestamp: log.timestamp,
      errorMessage: log.errorMessage || null,
      rawError: log.rawError || null,
      message: isDelivered
        ? `Confirmed: Invite delivered to ${log.recipientName} (Invitation ID: ${log.invitationId})`
        : `Action failed or skipped: ${log.errorMessage || 'Unknown error'}`,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
