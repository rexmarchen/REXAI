import { NextRequest, NextResponse } from 'next/server'
import { getLastLinkedInErrors } from '@/lib/linkedin-queue'

/**
 * GET /api/linkedin/debug/last-errors
 * Dev/admin-gated endpoint returning the last 20 failed LinkedIn actions with raw error payloads.
 */
export async function GET(req: NextRequest) {
  try {
    const errorLogs = getLastLinkedInErrors()

    return NextResponse.json({
      success: true,
      count: errorLogs.length,
      maxLimit: 20,
      timestamp: new Date().toISOString(),
      errors: errorLogs,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
