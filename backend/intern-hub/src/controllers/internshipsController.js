import { config } from '../config/index.js'
import { sendJson, sendRedirect } from '../middleware/errorHandler.js'
import { validateInternshipSearch, validateLinkedInRedirect } from '../middleware/validate.js'
import { searchInternships } from '../services/adzunaService.js'
import { resolveLinkedInDestination } from '../services/apifyService.js'

export const handleHealth = async (response, origin) => {
  sendJson(
    response,
    200,
    {
      success: true,
      status: 'ok',
      service: 'intern-hub',
      provider: 'adzuna',
      adzuna_base_url: config.adzunaBaseUrl,
      adzuna_app_id_loaded: Boolean(config.adzunaAppId),
      timestamp: new Date().toISOString()
    },
    origin
  )
}

export const handleSearchInternships = async (url, response, origin) => {
  const params = validateInternshipSearch(url.searchParams)
  const payload = await searchInternships(params)

  sendJson(
    response,
    200,
    {
      success: true,
      query: params.query,
      location: params.location || null,
      remote: params.remote ?? null,
      page: params.page,
      num_pages: params.numPages,
      limit: params.limit,
      posted_within_hours: params.postedWithinHours,
      refresh: params.refresh,
      jobs: payload.jobs,
      meta: payload.meta
    },
    origin
  )
}

export const handleLinkedInRedirect = async (url, response, origin) => {
  const params = validateLinkedInRedirect(url.searchParams)
  const resolved = await resolveLinkedInDestination(params)

  sendRedirect(response, 302, resolved.url, origin, {
    'Cache-Control': 'no-store',
    'X-Intern-Hub-Redirect-Source': resolved.source
  })
}
