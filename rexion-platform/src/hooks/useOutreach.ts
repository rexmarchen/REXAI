'use client'

import { useQuery } from '@tanstack/react-query'
import type { CompanyProfile, OutreachCampaignShape, OutreachContactShape } from '@/types'

async function fetchJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, init)
  if (!response.ok) {
    throw new Error('Failed to load outreach data.')
  }

  return (await response.json()) as T
}

export function useOutreachCampaigns() {
  return useQuery({
    queryKey: ['outreach-campaigns'],
    queryFn: () => fetchJson<OutreachCampaignShape[]>('/api/outreach/campaigns'),
  })
}

export function useCompanySearch(query: string) {
  return useQuery({
    queryKey: ['company-search', query],
    queryFn: () =>
      fetchJson<CompanyProfile[]>(`/api/outreach/company-search?q=${encodeURIComponent(query)}`),
    enabled: query.trim().length > 1,
  })
}

export function useFindContacts(companyName: string, domain: string, enabled: boolean) {
  return useQuery({
    queryKey: ['find-contacts', companyName, domain],
    queryFn: () =>
      fetchJson<OutreachContactShape[]>('/api/outreach/find-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyName, domain }),
      }),
    enabled,
  })
}
