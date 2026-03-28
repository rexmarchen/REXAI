import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init)
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function requireSessionUser() {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  return session.user
}
