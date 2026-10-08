import React, { Suspense } from 'react'
import { Metadata } from 'next'
import { LinkedInAutomation } from '@/components/linkedin/LinkedInAutomation'

export const metadata: Metadata = {
  title: 'LinkedIn Automation | RexionAI',
  description: 'Paced, safe, high-trust LinkedIn outreach and connection management for career professionals.',
}

export default function LinkedInOutreachPage() {
  return (
    <main className="min-h-screen bg-[#070A0F] py-8 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-center text-slate-400 py-12">Loading LinkedIn telemetry...</div>}>
        <LinkedInAutomation />
      </Suspense>
    </main>
  )
}
