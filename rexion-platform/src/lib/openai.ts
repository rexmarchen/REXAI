import OpenAI from 'openai'
import type { MicroGigShape, OutreachTone } from '@/types'

let client: OpenAI | null = null

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null
  }

  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  return client
}

export async function generateColdEmail(options: {
  companyName: string
  contactRole: string
  tone: OutreachTone
  resumeText?: string
  targetRole?: string
}) {
  const fallback = `Hi {Name},\n\nI am reaching out because ${options.companyName} is one of the few teams building with serious execution quality. I am targeting ${options.targetRole || 'product-focused roles'} and have been shipping work across ${options.resumeText ? 'real projects and measurable outcomes' : 'frontend, product, and execution-heavy roles'}.\n\nIf there is room for someone who can contribute fast, I would love to share a few relevant samples and learn where your team is hiring.\n\nBest,\n{name}`

  const openai = getOpenAIClient()
  if (!openai) {
    return fallback
  }

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.8,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert cold email writer. Write concise, personalized outreach emails under 150 words. Use variables {Name}, {Company}, {Role}, {Position}, {Date}.',
      },
      {
        role: 'user',
        content: `Write a ${options.tone} cold email to a ${options.contactRole} at ${options.companyName}. Background: ${options.resumeText || 'Strong builder profile.'}. Target role: ${options.targetRole || 'Software/Frontend Engineer'}.`,
      },
    ],
  })

  return completion.choices[0]?.message?.content || fallback
}

export async function generateGigMatchExplanation(options: {
  gig: MicroGigShape
  skills: string[]
}) {
  const fallback = `Strong overlap on ${options.gig.skills.slice(0, 2).join(', ')} and a high-conviction ${options.gig.domain.toLowerCase()} workflow that matches your profile.`
  const openai = getOpenAIClient()

  if (!openai) {
    return fallback
  }

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.6,
    messages: [
      {
        role: 'user',
        content: `In one sentence, explain why this gig is a fit. Skills: ${options.skills.join(', ')}. Gig: ${options.gig.title} at ${options.gig.company.name}.`,
      },
    ],
  })

  return completion.choices[0]?.message?.content || fallback
}
