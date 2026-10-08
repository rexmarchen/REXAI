import { addUnsubscribedEmail } from '@/lib/server-data'
import { verifyUnsubscribeToken } from '@/lib/unsubscribe'
import { escapeHtml } from '@/lib/utils'

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')
  if (!token) {
    return new Response('Missing unsubscribe token.', { status: 400 })
  }

  const email = verifyUnsubscribeToken(token)
  if (!email) {
    return new Response('Invalid unsubscribe token.', { status: 400 })
  }

  await addUnsubscribedEmail(email)
  const safeEmail = escapeHtml(email)

  return new Response(
    `<html><body style="font-family:Inter,Arial,sans-serif;background:#050805;color:#f5f7f5;padding:40px;"><h1>You are unsubscribed.</h1><p>${safeEmail} has been removed from future REXION outreach sends.</p></body></html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    }
  )
}
