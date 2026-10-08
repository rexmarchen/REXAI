import { CampaignDetails } from '@/components/outreach/CampaignDetails'

interface Props {
  params: { id: string }
}

export default function CampaignDetailPage({ params }: Props) {
  return (
    <div>
      <CampaignDetails id={params.id} />
    </div>
  )
}
