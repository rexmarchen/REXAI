const UNIPILE_DSN = process.env.UNIPILE_DSN || 'api62.unipile.com:19261'
const UNIPILE_API_KEY = process.env.UNIPILE_API_KEY || 'wPBskp4M.NDi8BlLY9Xrtxgh78JD6q/PAcdjZh2Ft+Q5oPhiDOjM='
const baseUrl = UNIPILE_DSN.startsWith('http') ? UNIPILE_DSN : `https://${UNIPILE_DSN}`

async function testInviteEndpoint() {
  console.log('--- Testing POST /api/v1/users/invite on Unipile ---')

  const res = await fetch(`${baseUrl}/api/v1/users/invite`, {
    method: 'POST',
    headers: {
      'X-API-KEY': UNIPILE_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      account_id: '0fsMHoZ2SwacZz6lQsuXbw',
      provider_id: 'williamhgates', // sample public identifier e.g. Bill Gates or standard profile identifier
      message: 'Hi! Connecting to explore engineering collaboration.'
    })
  })

  console.log('Invite HTTP status:', res.status)
  const data = await res.json().catch(() => ({}))
  console.log('Invite response:', JSON.stringify(data, null, 2))
}

testInviteEndpoint()
