import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')?.toLowerCase().trim()
  const userId = searchParams.get('userId')

  if (!email || !userId) {
    return new NextResponse('Invalid unsubscribe link.', { status: 400 })
  }

  try {
    // Add email to SuppressionEntry
    await prisma.suppressionEntry.upsert({
      where: { email },
      update: {
        userId,
        reason: 'unsubscribed',
        addedAt: new Date(),
      },
      create: {
        userId,
        email,
        reason: 'unsubscribed',
        addedAt: new Date(),
      },
    })

    // Return a simple HTML unsubscribe confirmation page
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribe Successful</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0d1511;
            color: #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .card {
            background-color: #15201b;
            border: 1px solid rgba(16, 185, 129, 0.15);
            border-radius: 16px;
            padding: 32px;
            text-align: center;
            max-width: 400px;
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
          }
          h1 {
            color: #10b981;
            font-size: 24px;
            margin-top: 0;
          }
          p {
            color: #94a3b8;
            font-size: 15px;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Unsubscribed successfully</h1>
          <p>You have been removed from our outreach mailing list. You will no longer receive cold emails from this sender.</p>
        </div>
      </body>
      </html>
    `
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (err: any) {
    console.error('Failed to unsubscribe:', err)
    return new NextResponse('An error occurred during unsubscribe. Please try again.', { status: 500 })
  }
}
