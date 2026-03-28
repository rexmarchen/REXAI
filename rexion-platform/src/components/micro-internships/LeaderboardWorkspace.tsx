'use client'

import { useState } from 'react'
import { Leaderboard } from '@/components/micro-internships/Leaderboard'
import { useLeaderboard } from '@/hooks/useMicroGigs'

export function LeaderboardWorkspace() {
  const { data = [] } = useLeaderboard()
  const [domain, setDomain] = useState('all')

  return <Leaderboard entries={data} domain={domain} onDomainChange={setDomain} />
}
