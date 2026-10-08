import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { getProspectsByCompanyAndTitle } from './src/services/snovService.js'

async function testLeadDiscovery() {
  console.log('--- Testing Real Recruiter Discovery for Software & ML Engineer ---')

  // Search tech recruiters / HR leads at top tech companies
  const leads = await getProspectsByCompanyAndTitle({
    companyDomain: 'razorpay.com',
    roleTitles: ['Technical Recruiter', 'Talent Acquisition', 'Engineering Manager']
  })

  console.log(`Found ${leads?.length || 0} real leads from Razorpay:`)
  console.log(JSON.stringify(leads?.slice(0, 3), null, 2))
}

testLeadDiscovery()
