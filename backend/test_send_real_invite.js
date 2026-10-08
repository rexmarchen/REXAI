const UNIPILE_DSN = process.env.UNIPILE_DSN || 'api62.unipile.com:19261'
const UNIPILE_API_KEY = process.env.UNIPILE_API_KEY || 'wPBskp4M.NDi8BlLY9Xrtxgh78JD6q/PAcdjZh2Ft+Q5oPhiDOjM='
const baseUrl = UNIPILE_DSN.startsWith('http') ? UNIPILE_DSN : `https://${UNIPILE_DSN}`

async function sendRealInviteTest() {
  console.log('--- Resolving Profile & Sending Real Invitation via Unipile ---')

  const accountId = '0fsMHoZ2SwacZz6lQsuXbw'

  // 1. Resolve target public identifier
  const targetUsername = 'williamhgates'
  console.log(`Resolving LinkedIn profile for: ${targetUsername}...`)

  const profileRes = await fetch(`${baseUrl}/api/v1/users/${targetUsername}?account_id=${accountId}`, {
    headers: { 'X-API-KEY': UNIPILE_API_KEY }
  })

  const profile = await profileRes.json()
  console.log(`Resolved: ${profile.first_name} ${profile.last_name} (provider_id: ${profile.provider_id})`)

  if (!profile.provider_id) {
    console.error('Could not resolve provider_id:', profile)
    return
  }

  // 2. Dispatch real invite with note
  const invitePayload = {
    account_id: accountId,
    provider_id: profile.provider_id,
    message: "Hi Bill, I'm a Software & ML Engineer working on distributed AI architectures. Would love to connect!"
  }

  console.log('Sending invitation payload:', invitePayload)

  const inviteRes = await fetch(`${baseUrl}/api/v1/users/invite`, {
    method: 'POST',
    headers: {
      'X-API-KEY': UNIPILE_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(invitePayload)
  })

  console.log(`Invite HTTP Status: ${inviteRes.status}`)
  const inviteResult = await inviteRes.json().catch(() => ({}))
  console.log('Invite Result:', JSON.stringify(inviteResult, null, 2))
}

sendRealInviteTest()
