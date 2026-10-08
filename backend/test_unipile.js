const UNIPILE_DSN = process.env.UNIPILE_DSN || 'api62.unipile.com:19261'
const UNIPILE_API_KEY = process.env.UNIPILE_API_KEY || 'wPBskp4M.NDi8BlLY9Xrtxgh78JD6q/PAcdjZh2Ft+Q5oPhiDOjM='
const APP_URL = process.env.APP_URL || 'http://localhost:3000'

const baseUrl = UNIPILE_DSN.startsWith('http') ? UNIPILE_DSN : `https://${UNIPILE_DSN}`

async function testUnipile() {
  console.log(`[Testing Unipile API]: ${baseUrl}`)

  try {
    const expiresOn = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now

    console.log('\n--- Testing POST /api/v1/hosted/accounts/link ---')
    const linkRes = await fetch(`${baseUrl}/api/v1/hosted/accounts/link`, {
      method: 'POST',
      headers: {
        'X-API-KEY': UNIPILE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'create',
        providers: ['LINKEDIN'],
        api_url: baseUrl,
        expiresOn: expiresOn,
        success_redirect_url: `${APP_URL}/outreach/linkedin?connected=1`,
        failure_redirect_url: `${APP_URL}/outreach/linkedin?error=1`,
        name: 'user_rexion_test'
      })
    })
    
    console.log(`Link create HTTP status: ${linkRes.status}`)
    const linkData = await linkRes.json()
    console.log('Connect Link response:', JSON.stringify(linkData, null, 2))
  } catch (err) {
    console.error('Unipile test error:', err.message)
  }
}

testUnipile()
