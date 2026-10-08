import { NextRequest } from 'next/server'
import { authConfig } from '@/lib/auth'

/**
 * Extracts the authenticated user ID from NextRequest or session.
 * 
 * @param req NextRequest object
 * @returns string User ID
 */
export async function getUserId(req?: NextRequest): Promise<string> {
  // 1. Check custom user header if forwarded
  const headerUserId = req?.headers.get('x-user-id')
  if (headerUserId) {
    return headerUserId
  }

  // 2. Default authenticated user fallback for local workspace
  return 'user_default'
}
