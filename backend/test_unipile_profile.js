const UNIPILE_DSN = process.env.UNIPILE_DSN || 'api62.unipile.com:19261'
const UNIPILE_API_KEY = process.env.UNIPILE_API_KEY || 'wPBskp4M.NDi8BlLY9Xrtxgh78JD6q/PAcdjZh2Ft+Q5oPhiDOjM='
const baseUrl = UNIPILE_DSN.startsWith('http') ? UNIPILE_DSN : `https://${UNIPILE_DSN}`

async function testProfileLookup() {
  console.log('--- Testing Profile Resolution on Unipile ---')

  const res = await fetch(`${baseUrl}/api/v1/users/williamhgates?account_id=0fsMHoZ2SwacZz6lQsuXbw`, {
    headers: { 'X-API-KEY': UNIPILE_API_KEY }
  })

  console.log('Profile lookup status:', res.status)
  const profile = await res.json().catch(() => ({}))
  console.log('Profile data:', JSON.stringify(profile, null, 2))
}

testProfileLookup()
