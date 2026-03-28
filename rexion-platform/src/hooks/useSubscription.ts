'use client'

import { useSession } from 'next-auth/react'
import { hasRequiredPlan, normalizePlan } from '@/lib/plan'
import type { SubscriptionPlan } from '@/types'

export function useSubscription() {
  const { data: session, status } = useSession()
  const plan = normalizePlan(session?.user?.plan)

  return {
    status,
    plan,
    isFree: plan === 'free',
    isPro: plan === 'pro',
    isElite: plan === 'elite',
    hasPlan(requiredPlan: SubscriptionPlan) {
      return hasRequiredPlan(plan, requiredPlan)
    },
  }
}
