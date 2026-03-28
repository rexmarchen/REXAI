import { addUnsubscribedEmail } from '@/lib/server-data'

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')
  if (!token) {
    return new Response('Missing unsubscribe token.', { status: 400 })
  }

  const email = Buffer.from(token, 'base64url').toString('utf-8')
  await addUnsubscribedEmail(email)

  return new Response(
    `<html><body style="font-family:Inter,Arial,sans-serif;background:#050805;color:#f5f7f5;padding:40px;"><h1>You are unsubscribed.</h1><p>${email} has been removed from future REXION outreach sends.</p></body></html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    }
  )
}
