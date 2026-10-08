import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const isDashboardPath = request.nextUrl.pathname.startsWith('/dashboard')
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin')
  const isAdminApiPath = request.nextUrl.pathname.startsWith('/api/admin')
  const isUserApiPath = request.nextUrl.pathname.startsWith('/api/user')
  const protectedPath = isDashboardPath || isAdminPath || isAdminApiPath || isUserApiPath

  if (!protectedPath) {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token) {
    const loginUrl = new URL('/login', request.nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = String(token.role || 'user')
  if ((isAdminPath || isAdminApiPath) && role !== 'admin') {
    if (isAdminApiPath) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 })
    }

    return NextResponse.redirect(new URL('/dashboard?access=admin-required', request.nextUrl.origin))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/api/admin/:path*', '/api/user/:path*'],
}
