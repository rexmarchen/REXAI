import {
  handleHealth,
  handleLinkedInRedirect,
  handleSearchInternships
} from '../controllers/internshipsController.js'

export const routeInternshipRequest = async (request, response, origin, url) => {
  if (request.method === 'GET' && url.pathname === '/api/health') {
    await handleHealth(response, origin)
    return true
  }

  if (
    request.method === 'GET' &&
    (url.pathname === '/api/internships/search' || url.pathname === '/api/ml/jobs/search')
  ) {
    await handleSearchInternships(url, response, origin)
    return true
  }

  if (request.method === 'GET' && url.pathname === '/api/linkedin/redirect') {
    await handleLinkedInRedirect(url, response, origin)
    return true
  }

  return false
}
