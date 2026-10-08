async function test() {
  const companies = ['stripe', 'airbnb', 'gitlab', 'fingerprint', 'activecampaign', 'redis', 'lever', 'vercel', 'hotjar', 'shopify']
  for (const c of companies) {
    // Greenhouse
    try {
      const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${c}/jobs?content=true`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.jobs && data.jobs.length > 0) {
          console.log(`Greenhouse: ${c} has ${data.jobs.length} jobs. Example URL: ${data.jobs[0].absolute_url}`)
        }
      }
    } catch {}

    // Lever
    try {
      const res = await fetch(`https://api.lever.co/v0/postings/${c}?mode=json`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.length > 0) {
          console.log(`Lever: ${c} has ${data.length} jobs. Example URL: ${data[0].hostedUrl}`)
        }
      }
    } catch {}
  }
}
test()
