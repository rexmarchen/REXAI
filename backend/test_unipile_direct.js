const UNIPILE_DSN = process.env.UNIPILE_DSN || 'api62.unipile.com:19261'
const UNIPILE_API_KEY = process.env.UNIPILE_API_KEY || 'wPBskp4M.NDi8BlLY9Xrtxgh78JD6q/PAcdjZh2Ft+Q5oPhiDOjM='
const baseUrl = UNIPILE_DSN.startsWith('http') ? UNIPILE_DSN : `https://${UNIPILE_DSN}`

async function testDirectUnipileConnect() {
  console.log(`[Testing Direct Unipile Connect on]: ${baseUrl}`)

  // 1. Check account creation via Unipile POST /api/v1/accounts
  try {
    const res = await fetch(`${baseUrl}/api/v1/accounts`, {
      method: 'POST',
      headers: {
        'X-API-KEY': UNIPILE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'LINKEDIN',
        username: 'pookii2316@gmail.com',
        password: 'Pookii@1234'
      })
    })

    console.log('Direct Unipile Connect status:', res.status)
    const data = await res.json().catch(() => ({}))
    console.log('Direct Unipile Connect response:', JSON.stringify(data, null, 2))
  } catch (e) {
    console.error('Error:', e.message)
  }
}

testDirectUnipileConnect()
