import { auth } from '@/lib/auth'
import { hasRequiredPlan } from '@/lib/plan'
import { UpgradeGate } from '@/components/common/UpgradeGate'
import { OutreachWorkspace } from '@/components/outreach/OutreachWorkspace'

export default async function OutreachPage() {
  const session = await auth()
  const plan = session?.user?.plan || 'free'

  if (!hasRequiredPlan(plan, 'pro')) {
    return <UpgradeGate feature="Outreach Automation" requiredPlan="pro" />
  }

  return <OutreachWorkspace />
}
