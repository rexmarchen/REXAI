import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { searchSnovContacts } from './src/services/snovService.js'

async function testSnov() {
  console.log('--- Testing Snov.io Real Contacts Search ---')
  const contacts = await searchSnovContacts({
    role: 'tech recruiter',
    company: 'google',
    location: 'India'
  })

  console.log(`Found ${contacts.length} contacts:`)
  console.log(JSON.stringify(contacts.slice(0, 5), null, 2))
}

testSnov()
