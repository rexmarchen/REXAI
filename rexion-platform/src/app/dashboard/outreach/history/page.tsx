import { redirect } from 'next/navigation'

// Redirect legacy history route to campaigns tab
export default function HistoryPage() {
  redirect('/dashboard/outreach?tab=campaigns')
}
