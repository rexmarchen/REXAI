import { auth } from '@/lib/auth'
import { hasRequiredPlan } from '@/lib/plan'
import { UpgradeGate } from '@/components/common/UpgradeGate'
import { CampaignHistory } from '@/components/outreach/CampaignHistory'

export default async function OutreachHistoryPage() {
  const session = await auth()
  const plan = session?.user?.plan || 'free'

  if (!hasRequiredPlan(plan, 'pro')) {
    return <UpgradeGate feature="Outreach History" requiredPlan="pro" />
  }

  return <CampaignHistory />
}
