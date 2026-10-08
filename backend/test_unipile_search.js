const UNIPILE_DSN = process.env.UNIPILE_DSN || 'api62.unipile.com:19261'
const UNIPILE_API_KEY = process.env.UNIPILE_API_KEY || 'wPBskp4M.NDi8BlLY9Xrtxgh78JD6q/PAcdjZh2Ft+Q5oPhiDOjM='
const baseUrl = UNIPILE_DSN.startsWith('http') ? UNIPILE_DSN : `https://${UNIPILE_DSN}`

async function testLinkedInSearch() {
  console.log('--- 1. Testing Unipile LinkedIn Search for Real HR / Founders ---')

  const accountId = '0fsMHoZ2SwacZz6lQsuXbw'

  // Test search endpoints on Unipile (e.g. POST /api/v1/linkedin/search or GET /api/v1/users/search)
  try {
    const searchRes = await fetch(`${baseUrl}/api/v1/users/search?account_id=${accountId}&query=Technical+Recruiter`, {
      headers: { 'X-API-KEY': UNIPILE_API_KEY }
    })
    console.log(`Search status: ${searchRes.status}`)
    const searchData = await searchRes.json().catch(() => ({}))
    console.log('Search response:', JSON.stringify(searchData, null, 2))
  } catch (e) {
    console.error('Search error:', e.message)
  }
}

testLinkedInSearch()
