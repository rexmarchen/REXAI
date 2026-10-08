import 'server-only'

/**
 * Production Unipile API Client (Server-only)
 * Handles authenticated live LinkedIn people search, invitation dispatching,
 * delivery verification, and account connection status.
 */

export interface ConnectLinkResponse {
  object?: string
  url: string
  [key: string]: any
}

export interface UnipileAccountResponse {
  id: string
  name?: string
  provider?: string
  status?: string
  created_at?: string
  [key: string]: any
}

export interface NormalizedLinkedInContact {
  name: string
  firstName?: string
  lastName?: string
  title: string
  company: string
  profileUrl: string
  publicIdentifier: string
  providerId: string
  avatarUrl?: string
  location?: string
  isRelationship?: boolean
  networkDistance?: string
  memberUrn?: string
}

export interface SearchLinkedInPeopleParams {
  keywords: string
  providerAcctId: string
  company?: string
  industry?: string
  limit?: number
}

export interface SendLinkedInInviteParams {
  accountId: string
  providerId?: string
  profileUrl?: string
  publicIdentifier?: string
  message: string
}

export interface SendInviteResult {
  success: boolean
  invitationId?: string
  status: 'SENT' | 'FAILED' | 'SKIPPED'
  error?: string
  rawError?: any
  isRetryable?: boolean
}

function getUnipileBaseUrl(): string {
  const dsn = process.env.UNIPILE_DSN || 'api62.unipile.com:19261'
  return dsn.startsWith('http://') || dsn.startsWith('https://') ? dsn : `https://${dsn}`
}

function getUnipileApiKey(): string {
  const key = process.env.UNIPILE_API_KEY
  if (!key) {
    throw new Error('UNIPILE_API_KEY environment variable is missing.')
  }
  return key
}

/**
 * Validates whether a given string is a well-formed LinkedIn profile URL.
 */
export function validateLinkedInProfileUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  const pattern = /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_\-\u00C0-\u024F%]+\/?$/i
  return pattern.test(trimmed)
}

/**
 * Helper to extract company name from headline when not explicitly provided
 */
function extractCompanyFromHeadline(headline: string, fallbackCompany?: string): string {
  if (fallbackCompany && fallbackCompany.trim()) return fallbackCompany.trim()
  if (!headline) return 'Technology Company'

  const atMatch = headline.match(/(?:at|@)\s+([^,|•|—|-]+)/i)
  if (atMatch && atMatch[1]) {
    return atMatch[1].trim()
  }

  const barMatch = headline.match(/\|\s*([^,|•|—|-]+)/)
  if (barMatch && barMatch[1]) {
    return barMatch[1].trim()
  }

  return 'Technology Company'
}

/**
 * Searches real, live LinkedIn profiles proxied through the user's connected account via Unipile.
 * 
 * @param params Search keywords, providerAcctId, and optional filters
 * @returns Array of normalized and validated LinkedIn contacts
 */
export async function searchLinkedInPeople(params: SearchLinkedInPeopleParams): Promise<NormalizedLinkedInContact[]> {
  const { keywords, providerAcctId, company, limit = 15 } = params

  if (!keywords || !keywords.trim()) {
    throw new Error('Search keywords are required for LinkedIn people search.')
  }
  if (!providerAcctId || !providerAcctId.trim()) {
    throw new Error('Connected LinkedIn provider account ID is required.')
  }

  const baseUrl = getUnipileBaseUrl()
  const apiKey = getUnipileApiKey()

  // Construct query string including company if specified
  const effectiveKeywords = company && company.trim()
    ? `${keywords.trim()} ${company.trim()}`
    : keywords.trim()

  const endpoint = `${baseUrl}/api/v1/linkedin/search?account_id=${encodeURIComponent(providerAcctId)}`

  const payload = {
    api: 'classic',
    category: 'people',
    keywords: effectiveKeywords,
  }

  console.log(`[Unipile Search] Querying live LinkedIn via account ${providerAcctId} for: "${effectiveKeywords}"`)

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error(`[Unipile Search Error] HTTP ${response.status}: ${errorBody}`)
    throw new Error(`Unipile LinkedIn search failed [${response.status}]: ${errorBody}`)
  }

  const data = await response.json()
  const rawItems: any[] = Array.isArray(data.items) ? data.items : (Array.isArray(data.results) ? data.results : [])

  const normalizedContacts: NormalizedLinkedInContact[] = []

  for (const item of rawItems) {
    if (item.type && item.type !== 'PEOPLE') continue

    const name = item.name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'LinkedIn Member'
    const headline = item.headline || 'Professional'
    const publicIdentifier = item.public_identifier || ''
    const providerId = item.id || item.provider_id || ''

    // Resolve or construct valid LinkedIn profile URL
    let profileUrl = item.public_profile_url || item.profile_url || ''
    if (!validateLinkedInProfileUrl(profileUrl) && publicIdentifier) {
      profileUrl = `https://www.linkedin.com/in/${publicIdentifier}`
    }

    // Must be a valid well-formed LinkedIn profile URL
    if (!validateLinkedInProfileUrl(profileUrl)) {
      console.warn(`[Unipile Search Warning] Dropping candidate ${name} due to invalid profile URL: ${profileUrl}`)
      continue
    }

    const companyName = extractCompanyFromHeadline(headline, company)

    normalizedContacts.push({
      name,
      firstName: item.first_name || name.split(' ')[0] || '',
      lastName: item.last_name || name.split(' ').slice(1).join(' ') || '',
      title: headline,
      company: companyName,
      profileUrl,
      publicIdentifier,
      providerId,
      avatarUrl: item.profile_picture_url || item.profile_picture_url_large || '',
      location: item.location || '',
      isRelationship: Boolean(item.is_relationship),
      networkDistance: item.network_distance || '',
      memberUrn: item.member_urn || '',
    })

    if (normalizedContacts.length >= limit) break
  }

  console.log(`[Unipile Search] Successfully retrieved ${normalizedContacts.length} valid LinkedIn contacts.`)
  return normalizedContacts
}

/**
 * Dispatches a real LinkedIn connection invitation via Unipile with robust error categorization and retry backoff.
 */
export async function sendLinkedInInvite(params: SendLinkedInInviteParams): Promise<SendInviteResult> {
  const { accountId, providerId, profileUrl, publicIdentifier, message } = params

  if (!accountId) {
    return {
      success: false,
      status: 'FAILED',
      error: 'Missing Unipile account_id.',
      isRetryable: false,
    }
  }

  const targetIdentifier = providerId || publicIdentifier || profileUrl
  if (!targetIdentifier) {
    return {
      success: false,
      status: 'FAILED',
      error: 'Missing recipient identifier (providerId, publicIdentifier, or profileUrl).',
      isRetryable: false,
    }
  }

  const baseUrl = getUnipileBaseUrl()
  const apiKey = getUnipileApiKey()
  const trimmedMessage = (message || '').trim().slice(0, 300)

  const payload: Record<string, any> = {
    account_id: accountId,
    message: trimmedMessage,
  }

  if (providerId) {
    payload.provider_id = providerId
  } else if (publicIdentifier) {
    payload.provider_id = publicIdentifier
  } else if (profileUrl) {
    payload.provider_id = profileUrl
  }

  const endpoint = `${baseUrl}/api/v1/users/invite`

  let attempt = 0
  const maxAttempts = 2

  while (attempt < maxAttempts) {
    attempt++
    try {
      console.log(`[Unipile Send] Dispatching invite attempt #${attempt} to ${targetIdentifier}...`)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        const invitationId = data.invitation_id || data.id || `inv-${Date.now()}`
        console.log(`[Unipile Send Success] Invitation dispatched! ID: ${invitationId}`)
        return {
          success: true,
          invitationId,
          status: 'SENT',
          rawError: null,
        }
      }

      // Categorize HTTP status errors
      const isClientReject = response.status >= 400 && response.status < 500
      const isServerOrNetworkError = response.status >= 500

      if (isClientReject) {
        // LinkedIn / Unipile client rejection (e.g. 422 Recipient cannot be reached, already invited, limit reached)
        const errorMsg = data.detail || data.message || data.title || `LinkedIn rejected invitation (HTTP ${response.status})`
        console.warn(`[Unipile Specific Rejection] HTTP ${response.status}: ${errorMsg}`)
        return {
          success: false,
          status: 'FAILED',
          error: errorMsg,
          rawError: data,
          isRetryable: false,
        }
      }

      if (isServerOrNetworkError && attempt < maxAttempts) {
        console.warn(`[Unipile Server Warning] HTTP ${response.status}. Retrying with exponential backoff in 2s...`)
        await new Promise((r) => setTimeout(r, 2000))
        continue
      }

      return {
        success: false,
        status: 'FAILED',
        error: `Unipile API server error (HTTP ${response.status})`,
        rawError: data,
        isRetryable: true,
      }
    } catch (err: any) {
      if (attempt < maxAttempts) {
        console.warn(`[Unipile Network Warning] ${err.message}. Retrying in 2s...`)
        await new Promise((r) => setTimeout(r, 2000))
        continue
      }
      return {
        success: false,
        status: 'FAILED',
        error: `Network error connecting to Unipile: ${err.message}`,
        rawError: { message: err.message, stack: err.stack },
        isRetryable: true,
      }
    }
  }

  return {
    success: false,
    status: 'FAILED',
    error: 'Exceeded maximum dispatch attempts.',
    isRetryable: false,
  }
}

/**
 * Retrieves direct LinkedIn user profile details to inspect relationship and network distance.
 */
export async function getLinkedInUserProfile(targetIdOrIdentifier: string, providerAcctId: string): Promise<any> {
  const baseUrl = getUnipileBaseUrl()
  const apiKey = getUnipileApiKey()

  const endpoint = `${baseUrl}/api/v1/users/${encodeURIComponent(targetIdOrIdentifier)}?account_id=${encodeURIComponent(providerAcctId)}`

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'X-API-KEY': apiKey,
      'Accept': 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Unipile getLinkedInUserProfile failed [${response.status}]: ${errorBody}`)
  }

  return response.json()
}

/**
 * Creates a hosted LinkedIn authorization connect link for a user.
 */
export async function createConnectLink(userId: string): Promise<ConnectLinkResponse> {
  const baseUrl = getUnipileBaseUrl()
  const apiKey = getUnipileApiKey()
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const endpoint = `${baseUrl}/api/v1/hosted/accounts/link`
  const expiresOn = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

  const payload = {
    type: 'create',
    providers: ['LINKEDIN'],
    api_url: baseUrl,
    expiresOn: expiresOn,
    success_redirect_url: `${appUrl}/outreach/linkedin?connected=1`,
    failure_redirect_url: `${appUrl}/outreach/linkedin?error=1`,
    name: userId,
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Unipile createConnectLink failed [${response.status}]: ${errorBody}`)
  }

  return response.json()
}

/**
 * Retrieves account health and connectivity status from Unipile.
 */
export async function getAccountStatus(providerAcctId: string): Promise<UnipileAccountResponse> {
  const baseUrl = getUnipileBaseUrl()
  const apiKey = getUnipileApiKey()

  const endpoint = `${baseUrl}/api/v1/accounts/${providerAcctId}`

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'X-API-KEY': apiKey,
      'Accept': 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Unipile getAccountStatus failed [${response.status}]: ${errorBody}`)
  }

  return response.json()
}

/**
 * Lists all connected accounts on the Unipile DSN.
 */
export async function listAccounts(): Promise<any> {
  const baseUrl = getUnipileBaseUrl()
  const apiKey = getUnipileApiKey()

  const endpoint = `${baseUrl}/api/v1/accounts`

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'X-API-KEY': apiKey,
      'Accept': 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Unipile listAccounts failed [${response.status}]: ${errorBody}`)
  }

  return response.json()
}
