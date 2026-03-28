import { z } from 'zod'
import { ok, apiError } from '@/lib/api'
import { searchApolloPeople } from '@/lib/apollo'
import { searchHunterDomain } from '@/lib/hunter'
import { mergeContacts } from '@/lib/outreach/contacts'

const schema = z.object({
  companyName: z.string().min(2),
  domain: z.string().min(3),
})

export async function POST(request: Request) {
  const payload = await request.json()
  const parsed = schema.safeParse(payload)

  if (!parsed.success) {
    return apiError('Please provide a valid company name and domain.', 400)
  }

  const [hunterContacts, apolloContacts] = await Promise.all([
    searchHunterDomain(parsed.data.domain),
    searchApolloPeople(parsed.data.domain),
  ])

  return ok(mergeContacts([hunterContacts, apolloContacts]))
}
