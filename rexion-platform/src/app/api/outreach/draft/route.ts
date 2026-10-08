import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import connectDB from '@/lib/mongodb'
import Profile from '@/models/Profile'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { contactIds, userSummary: customSummary } = await req.json()
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: 'No contacts selected' }, { status: 400 })
    }

    // 1. Fetch contacts from database
    const contacts = await prisma.contact.findMany({
      where: {
        id: { in: contactIds },
        userId: session.user.id,
      },
    })

    if (contacts.length === 0) {
      return NextResponse.json({ error: 'No matching contacts found' }, { status: 404 })
    }

    // 2. Fetch candidate's resume summary if not provided in payload
    let userSummary = customSummary || ''
    if (!userSummary) {
      await connectDB()
      const profile = await Profile.findOne({ userId: session.user.id })
      if (profile?.parsedResumeData) {
        userSummary = profile.parsedResumeData.summary || profile.parsedResumeData.rawText || ''
      }
      if (!userSummary && profile) {
        userSummary = `Professional seeking a role in ${profile.jobPreferences?.desiredTitles?.join(', ') || 'Software Engineering'}. Years of experience: ${profile.jobPreferences?.yearsExperience || 0}.`
      }
    }
    userSummary = userSummary || 'A professional seeking career opportunities.'

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      // Fallback fallback draft if Claude API is not configured
      const drafts = contacts.map((c) => {
        const firstName = c.name.split(' ')[0] || 'there'
        return {
          contactId: c.id,
          subject: `Opportunity at ${c.company} - Outreach`,
          body: `Hi ${firstName},\n\nI hope you are doing well. I noticed you are the ${c.title} at ${c.company}. Given my background in technology and my experience, I wanted to reach out and see if there are any opportunities to collaborate or join your team.\n\nBest regards,\nCandidate`,
        }
      })
      return NextResponse.json({ drafts, source: 'fallback' })
    }

    // 3. Draft emails in parallel using Anthropic Claude API
    const draftPromises = contacts.map(async (contact) => {
      const prompt = `You are a professional outreach assistant. Write a short (under 120 words), personalized cold email to the following contact:
Name: ${contact.name}
Title: ${contact.title}
Company: ${contact.company}

Sender's Resume/Background Summary:
${userSummary}

Guidelines:
- Keep the email body under 120 words.
- Be very specific and relevant to their company and role.
- Keep the tone professional yet concise and friendly.
- Do not use generic placeholders like [Insert Name Here], use the real contact info provided.
- Return the response strictly as a JSON object with two fields: "subject" and "body".

JSON format:
{
  "subject": "Subject line",
  "body": "Email body text"
}`

      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 500,
            messages: [{ role: 'user', content: prompt }],
          }),
        })

        if (!response.ok) {
          throw new Error(`Claude API returned status ${response.status}`)
        }

        const data = await response.json()
        const textContent = data.content?.[0]?.text || ''
        
        // Parse JSON from Claude response
        const jsonMatch = textContent.match(/\{[\s\S]*\}/)
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : textContent)

        return {
          contactId: contact.id,
          subject: parsed.subject || `Opportunity at ${contact.company}`,
          body: parsed.body || `Hi ${contact.name.split(' ')[0] || 'there'},\n\nI wanted to reach out regarding open roles at ${contact.company}...`,
        }
      } catch (err: any) {
        console.error(`Failed to draft email for ${contact.email}:`, err)
        // Fallback for this individual contact
        const firstName = contact.name.split(' ')[0] || 'there'
        return {
          contactId: contact.id,
          subject: `Introduction / outreach regarding roles at ${contact.company}`,
          body: `Hi ${firstName},\n\nI'm reaching out because I'm interested in the team at ${contact.company}. I'd love to learn more about potential opportunities.\n\nBest regards`,
        }
      }
    })

    const drafts = await Promise.all(draftPromises)
    return NextResponse.json({ drafts, source: 'claude' })
  } catch (error: any) {
    console.error('Outreach draft route error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
