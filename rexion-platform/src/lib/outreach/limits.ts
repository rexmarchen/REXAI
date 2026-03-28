import type { SubscriptionPlan } from '@/types'
import { getDailySendLimit } from '@/lib/plan'

export function validateDailySendLimit(plan: SubscriptionPlan, usedToday: number, requested: number) {
  const limit = getDailySendLimit(plan)

  return {
    limit,
    usedToday,
    requested,
    allowed: usedToday + requested <= limit,
  }
}
