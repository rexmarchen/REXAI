import { consumeRateLimit } from './config/rateLimit.js'
import { sendError, sendJson } from './middleware/errorHandler.js'
import { handleNotFound } from './middleware/notFound.js'
import { routeInternshipRequest } from './routes/internships.js'
import { logger } from './utils/logger.js'

const resolveClientId = (request) => {
  const forwardedFor = String(request.headers['x-forwarded-for'] || '')
    .split(',')
    .map((part) => part.trim())
    .find(Boolean)

  return forwardedFor || request.socket.remoteAddress || 'anonymous'
}

export const app = async (request, response) => {
  const origin = String(request.headers.origin || '').trim()
  const url = new URL(request.url || '/', `http://${request.headers.host || '127.0.0.1'}`)

  try {
    if (request.method === 'OPTIONS') {
      sendJson(response, 204, null, origin)
      return
    }

    const rateState = consumeRateLimit(resolveClientId(request))
    response.setHeader('X-RateLimit-Limit', String(rateState.limit))
    response.setHeader('X-RateLimit-Remaining', String(rateState.remaining))
    response.setHeader('X-RateLimit-Reset', String(Math.floor(rateState.resetAt / 1000)))

    if (!rateState.allowed) {
      sendJson(
        response,
        429,
        {
          success: false,
          error: 'Rate limit exceeded. Please try again in a moment.'
        },
        origin
      )
      return
    }

    const handled = await routeInternshipRequest(request, response, origin, url)
    if (!handled) {
      handleNotFound(response, origin, url.pathname)
    }
  } catch (error) {
    logger.error(`${request.method} ${url.pathname} failed: ${error?.message || 'Unknown error'}`)
    sendError(response, error, origin)
  }
}
