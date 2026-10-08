import type { MicroGigShape } from '@/types'

export function buildMicroGigPitch(gig: Pick<MicroGigShape, 'domain' | 'skills'>) {
  const skills = gig.skills.slice(0, 3).join(', ') || 'the required stack'

  return `I can ship this ${gig.domain.toLowerCase()} sprint quickly because I already work comfortably with ${skills}. I can start fast, communicate clearly, and focus on delivering the specific outcome this team needs.`
}
