import type { ContactConfidence, OutreachContactShape } from '@/types'
import { createId } from '@/lib/utils'

export function confidenceFromScore(score: number): ContactConfidence {
  if (score >= 80) {
    return 'verified'
  }

  if (score >= 50) {
    return 'likely'
  }

  return 'guessed'
}

export function mergeContacts(contactGroups: OutreachContactShape[][]) {
  const deduped = new Map<string, OutreachContactShape>()

  for (const group of contactGroups) {
    for (const contact of group) {
      if (!contact.email) {
        continue
      }

      const key = contact.email.toLowerCase()
      const existing = deduped.get(key)
      if (!existing) {
        deduped.set(key, {
          ...contact,
          id: contact.id || createId('contact'),
        })
        continue
      }

      const rank = ['guessed', 'likely', 'verified']
      if (rank.indexOf(contact.confidence) > rank.indexOf(existing.confidence)) {
        deduped.set(key, {
          ...existing,
          ...contact,
        })
      }
    }
  }

  return [...deduped.values()]
}

export function maskEmail(email: string) {
  const [local, domain] = email.split('@')
  if (!local || !domain) {
    return email
  }

  return `${local.slice(0, 1)}***@${domain}`
}

export function selectTopContacts(contacts: OutreachContactShape[]) {
  const rolePriority = ['Talent Acquisition', 'Recruiter', 'Hiring Manager', 'Founder']
  const confidenceRank = { guessed: 0, likely: 1, verified: 2 }

  return [...contacts]
    .sort((left, right) => {
      const leftRoleIndex = rolePriority.findIndex((value) => left.role.includes(value))
      const rightRoleIndex = rolePriority.findIndex((value) => right.role.includes(value))

      if (leftRoleIndex !== rightRoleIndex) {
        return (leftRoleIndex === -1 ? 99 : leftRoleIndex) - (rightRoleIndex === -1 ? 99 : rightRoleIndex)
      }

      return confidenceRank[right.confidence] - confidenceRank[left.confidence]
    })
    .slice(0, 3)
}
