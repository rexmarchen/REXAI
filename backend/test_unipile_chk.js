const UNIPILE_DSN = process.env.UNIPILE_DSN || 'api62.unipile.com:19261'
const UNIPILE_API_KEY = process.env.UNIPILE_API_KEY || 'wPBskp4M.NDi8BlLY9Xrtxgh78JD6q/PAcdjZh2Ft+Q5oPhiDOjM='
const baseUrl = UNIPILE_DSN.startsWith('http') ? UNIPILE_DSN : `https://${UNIPILE_DSN}`

async function testCheckpointEndpoints() {
  console.log('--- Testing Checkpoint Solving on Unipile ---')

  // Check GET /api/v1/accounts
  const listRes = await fetch(`${baseUrl}/api/v1/accounts`, {
    headers: { 'X-API-KEY': UNIPILE_API_KEY }
  })
  const list = await listRes.json()
  console.log('Current Accounts list:', JSON.stringify(list, null, 2))
}

testCheckpointEndpoints()
