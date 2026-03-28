'use client'

import { useQuery } from '@tanstack/react-query'
import type { LeaderboardEntry, MicroGigMatchShape, MicroGigShape } from '@/types'

async function fetchJson<T>(url: string) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to load gigs.')
  }

  return (await response.json()) as T
}

export function useMicroGigs() {
  return useQuery({
    queryKey: ['micro-gigs'],
    queryFn: () => fetchJson<MicroGigShape[]>('/api/micro-gigs'),
  })
}

export function useMatchedMicroGigs() {
  return useQuery({
    queryKey: ['micro-gigs-match'],
    queryFn: () => fetchJson<MicroGigMatchShape[]>('/api/micro-gigs/match'),
  })
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ['micro-gigs-leaderboard'],
    queryFn: () => fetchJson<LeaderboardEntry[]>('/api/micro-gigs/leaderboard'),
  })
}
