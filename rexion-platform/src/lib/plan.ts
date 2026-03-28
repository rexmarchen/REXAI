import type { SubscriptionPlan, UserRole } from '@/types'

export const PLAN_ORDER: Record<SubscriptionPlan, number> = {
  free: 0,
  pro: 1,
  elite: 2,
}

export function normalizePlan(plan?: string | null): SubscriptionPlan {
  if (plan === 'pro' || plan === 'elite') {
    return plan
  }

  return 'free'
}

export function normalizeRole(role?: string | null): UserRole {
  if (role === 'company' || role === 'admin') {
    return role
  }

  return 'candidate'
}

export function hasRequiredPlan(currentPlan: SubscriptionPlan, requiredPlan: SubscriptionPlan) {
  return PLAN_ORDER[currentPlan] >= PLAN_ORDER[requiredPlan]
}

export function getDailySendLimit(plan: SubscriptionPlan) {
  if (plan === 'elite') {
    return 200
  }

  if (plan === 'pro') {
    return 50
  }

  return 0
}
