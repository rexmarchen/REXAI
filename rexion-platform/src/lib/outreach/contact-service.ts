// Contact Service — isolated mock implementation
// When backend is ready, replace the function bodies here without touching UI.
//
// Usage:
//   const result = await contactService.search({ query: 'founder', roles: ['Founder'] })

import type { ContactSearchResult, FilterState, OutreachContact } from '@/types/outreach'
import { MOCK_CONTACTS } from './mock-data'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalize(str: string) {
  return str.toLowerCase().trim()
}

function contactMatchesFilter(contact: OutreachContact, filter: Partial<FilterState>): boolean {
  const { query, roles, companies, locations, industries } = filter

  if (query) {
    const q = normalize(query)
    const searchTarget = normalize(
      `${contact.firstName} ${contact.lastName} ${contact.jobTitle} ${contact.companyName} ${contact.email}`
    )
    if (!searchTarget.includes(q)) return false
  }

  if (roles && roles.length > 0) {
    const title = normalize(contact.jobTitle)
    const matched = roles.some((role) => title.includes(normalize(role)))
    if (!matched) return false
  }

  if (companies && companies.length > 0) {
    const company = normalize(contact.companyName)
    const matched = companies.some((c) => company.includes(normalize(c)))
    if (!matched) return false
  }

  if (locations && locations.length > 0) {
    const loc = normalize(contact.location)
    const matched = locations.some((l) => loc.includes(normalize(l)))
    if (!matched) return false
  }

  if (industries && industries.length > 0) {
    const ind = normalize(contact.industry ?? '')
    const matched = industries.some((i) => ind.includes(normalize(i)))
    if (!matched) return false
  }

  return true
}

export const contactService = {
  /**
   * Search contacts with optional filters.
   * Replace body with real API call: GET /api/outreach/contacts?query=...
   */
  async search(filter: Partial<FilterState>): Promise<ContactSearchResult> {
    // Simulate network latency
    await delay(480 + Math.random() * 200)

    const filtered = MOCK_CONTACTS.filter((c) => contactMatchesFilter(c, filter))
    const isFiltered = Boolean(
      filter.query ||
        (filter.roles && filter.roles.length > 0) ||
        (filter.companies && filter.companies.length > 0) ||
        (filter.locations && filter.locations.length > 0)
    )

    return {
      contacts: filtered,
      total: filtered.length,
      isFiltered,
    }
  },

  /**
   * Get a single contact by ID.
   * Replace body with: GET /api/outreach/contacts/:id
   */
  async getById(id: string): Promise<OutreachContact | null> {
    await delay(200)
    return MOCK_CONTACTS.find((c) => c.id === id) ?? null
  },

  /**
   * Get multiple contacts by IDs (for campaign preview).
   * Replace body with: POST /api/outreach/contacts/batch { ids }
   */
  async getByIds(ids: string[]): Promise<OutreachContact[]> {
    await delay(300)
    const idSet = new Set(ids)
    return MOCK_CONTACTS.filter((c) => idSet.has(c.id))
  },
}
