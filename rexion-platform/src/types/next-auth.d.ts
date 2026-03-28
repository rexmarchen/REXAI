import type { DefaultSession } from 'next-auth'
import type { SubscriptionPlan, UserRole } from '@/types'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      plan: SubscriptionPlan
      role: UserRole
    }
  }

  interface User {
    plan: SubscriptionPlan
    role: UserRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    plan?: SubscriptionPlan
    role?: UserRole
  }
}
