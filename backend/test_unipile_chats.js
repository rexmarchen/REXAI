const UNIPILE_DSN = process.env.UNIPILE_DSN || 'api62.unipile.com:19261'
const UNIPILE_API_KEY = process.env.UNIPILE_API_KEY || 'wPBskp4M.NDi8BlLY9Xrtxgh78JD6q/PAcdjZh2Ft+Q5oPhiDOjM='
const baseUrl = UNIPILE_DSN.startsWith('http') ? UNIPILE_DSN : `https://${UNIPILE_DSN}`

async function testUnipileInvite() {
  console.log('--- Testing Unipile LinkedIn Invitation & Messaging Endpoints ---')

  // Check account
  const listRes = await fetch(`${baseUrl}/api/v1/accounts`, {
    headers: { 'X-API-KEY': UNIPILE_API_KEY }
  })
  const list = await listRes.json()
  const account = list.items?.[0]
  console.log(`Connected Account: ${account?.name} (ID: ${account?.id})`)

  // Check chats
  const chatsRes = await fetch(`${baseUrl}/api/v1/chats?account_id=${account?.id}&limit=5`, {
    headers: { 'X-API-KEY': UNIPILE_API_KEY }
  })
  console.log(`Chats status: ${chatsRes.status}`)
  const chats = await chatsRes.json().catch(() => ({}))
  console.log('Chats in inbox:', JSON.stringify(chats, null, 2))
}

testUnipileInvite()
