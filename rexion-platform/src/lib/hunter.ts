import type { OutreachContactShape } from '@/types'
import { mockContacts } from '@/lib/mock-data'

export async function searchHunterDomain(domain: string): Promise<OutreachContactShape[]> {
  const apiKey = process.env.HUNTER_API_KEY

  if (apiKey) {
    const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${apiKey}`
    const response = await fetch(url, { cache: 'no-store' })

    if (response.ok) {
      const payload = (await response.json()) as {
        data?: {
          emails?: Array<{
            value?: string
            first_name?: string
            last_name?: string
            position?: string
            confidence?: number
            linkedin?: string
          }>
        }
      }

      return (payload.data?.emails || []).map((entry) => ({
        id: entry.value || `${entry.first_name}-${entry.last_name}`,
        name: `${entry.first_name || ''} ${entry.last_name || ''}`.trim() || 'Unknown Contact',
        role: entry.position || 'Recruiter',
        email: entry.value || '',
        confidence:
          (entry.confidence || 0) > 80 ? 'verified' : (entry.confidence || 0) >= 50 ? 'likely' : 'guessed',
        linkedinUrl: entry.linkedin,
      }))
    }
  }

  return mockContacts.filter((contact) => contact.email.includes(domain.split('.')[0]))
}
