import type { LeaderboardEntry, MicroGigShape } from '@/types'

function toSet(values: string[]) {
  return new Set(values.map((value) => value.toLowerCase()))
}

export function calculateMatchScore(options: {
  skills: string[]
  preferredDomain?: string
  location?: string
  gig: MicroGigShape
}) {
  const skillSet = toSet(options.skills)
  const gigSkillSet = toSet(options.gig.skills)
  const intersection = [...skillSet].filter((skill) => gigSkillSet.has(skill)).length
  const union = new Set([...skillSet, ...gigSkillSet]).size || 1
  const skillScore = Math.round((intersection / union) * 50)

  const domainScore =
    options.preferredDomain?.toLowerCase() === options.gig.domain.toLowerCase() ? 20 : 8
  const locationScore =
    !options.location ||
    options.location.toLowerCase().includes('remote') ||
    options.gig.location === 'remote'
      ? 15
      : 6
  const preHiringBonus = options.gig.isPreHiring ? 15 : 0

  return Math.min(100, skillScore + domainScore + locationScore + preHiringBonus)
}

export function rankMicroGigs(
  gigs: MicroGigShape[],
  profile: {
    skills: string[]
    preferredDomain?: string
    location?: string
  }
) {
  return gigs
    .map((gig) => ({
      gig,
      score: calculateMatchScore({
        ...profile,
        gig,
      }),
    }))
    .sort((left, right) => right.score - left.score)
}

export function buildLeaderboardRows(entries: LeaderboardEntry[]) {
  return [...entries].sort((left, right) => left.rank - right.rank)
}
