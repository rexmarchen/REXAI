import axios from 'axios'

let cachedToken = null
let tokenExpiresAt = 0

/**
 * Get active Snov.io OAuth Access Token with automatic caching
 */
export async function getSnovAccessToken() {
  const userId = String(process.env.SNOV_USER_ID || '').trim()
  const secret = String(process.env.SNOV_SECRET || '').trim()

  if (!userId || !secret) {
    return null
  }

  // Return cached token if valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken
  }

  try {
    const response = await axios.post(
      'https://api.snov.io/v1/oauth/access_token',
      {
        grant_type: 'client_credentials',
        client_id: userId,
        client_secret: secret
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    )

    if (response.data && response.data.access_token) {
      cachedToken = response.data.access_token
      const expiresInSec = Number(response.data.expires_in) || 3600
      tokenExpiresAt = Date.now() + expiresInSec * 1000
      return cachedToken
    }
  } catch (err) {
    console.error('Snov.io OAuth Token Error:', err.response?.data || err.message)
  }

  return null
}

/**
 * Format company input to a list of potential search domains
 */
export function resolveCandidateDomains(company = '', location = '') {
  const trimmed = (company || '').trim().toLowerCase()
  if (!trimmed) return ['google.co.in', 'google.com']

  if (trimmed.includes('.')) {
    const raw = trimmed.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    return [raw]
  }

  const clean = trimmed.replace(/[^a-z0-9]/g, '')
  const loc = (location || '').toLowerCase()
  const isIndia = loc.includes('mumbai') || loc.includes('delhi') || loc.includes('bangalore') || loc.includes('bengaluru') || loc.includes('pune') || loc.includes('hyderabad') || loc.includes('india')

  if (clean === 'google') {
    return isIndia ? ['google.co.in', 'google.com', 'alphabet.com'] : ['google.com', 'google.co.in', 'alphabet.com']
  }

  if (isIndia) {
    return [`${clean}.co.in`, `${clean}.in`, `${clean}.com`]
  }

  return [`${clean}.com`, `${clean}.io`, `${clean}.co.in`]
}

/**
 * Search Snov.io by domain
 */
export async function searchSnovDomain(domain, limit = 20) {
  const token = await getSnovAccessToken()
  if (!token) {
    return { success: false, error: 'Snov.io API credentials not configured', rawList: [] }
  }

  try {
    const url = `https://api.snov.io/v2/domain-emails-with-info?domain=${encodeURIComponent(domain)}&type=all&limit=${limit}`
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      timeout: 15000
    })

    const rawList = response.data?.data || response.data?.emails || []
    return {
      success: true,
      domain,
      rawList
    }
  } catch (err) {
    console.error(`Snov.io Domain Search Error for [${domain}]:`, err.response?.data || err.message)
    return {
      success: false,
      error: err.response?.data?.message || err.message,
      rawList: []
    }
  }
}

/**
 * Main Contact Search via Snov.io
 */
export async function searchSnovContacts({ role = '', company = '', location = '' }) {
  const candidateDomains = resolveCandidateDomains(company, location)
  let rawList = []
  let matchedDomain = candidateDomains[0]

  for (const dom of candidateDomains) {
    const result = await searchSnovDomain(dom, 30)
    if (result.success && result.rawList && result.rawList.length > 0) {
      rawList = result.rawList
      matchedDomain = dom
      break
    }
  }

  if (!rawList || rawList.length === 0) {
    return []
  }

  const roleLower = (role || '').toLowerCase()
  const contacts = []

  for (const item of rawList) {
    const email = String(item.email || '').trim().toLowerCase()
    if (!email) continue

    const verified = item.status === 'verified' || item.status === 'valid'
    const emailParts = email.split('@')[0].split('.')
    const firstName = item.firstName || item.first_name || emailParts[0] || 'Contact'
    const lastName = item.lastName || item.last_name || emailParts[1] || 'Lead'
    const linkedinUrl = item.sourcePage || item.source_page || item.socialLinks?.linkedin || ''

    // Derive or assign job title based on role search or email name
    let jobTitle = item.position || ''
    if (!jobTitle) {
      if (roleLower.includes('founder') || roleLower.includes('ceo')) {
        jobTitle = 'Founder & Executive'
      } else if (roleLower.includes('hr') || roleLower.includes('recruiter') || roleLower.includes('talent')) {
        jobTitle = 'Talent Acquisition & HR'
      } else if (roleLower.includes('manager')) {
        jobTitle = 'Engineering / Product Manager'
      } else {
        jobTitle = 'HR & People Operations'
      }
    }

    const companyName = company || (matchedDomain.split('.')[0].charAt(0).toUpperCase() + matchedDomain.split('.')[0].slice(1))

    // Determine high-accuracy LinkedIn link
    let finalLinkedinUrl = linkedinUrl
    if (!finalLinkedinUrl || finalLinkedinUrl === 'https://www.linkedin.com' || !finalLinkedinUrl.includes('linkedin.com')) {
      const searchTerms = encodeURIComponent(`${firstName} ${lastName} ${companyName}`)
      finalLinkedinUrl = `https://www.linkedin.com/search/results/people/?keywords=${searchTerms}`
    }

    contacts.push({
      firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
      lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
      email,
      jobTitle,
      companyName,
      location: location || 'Mumbai, India',
      verified,
      linkedinUrl: finalLinkedinUrl
    })
  }

  return contacts
}
