import { sendJson } from './errorHandler.js'

export const handleNotFound = (response, origin, pathname) => {
  sendJson(
    response,
    404,
    {
      success: false,
      error: `Route not found: ${pathname}`
    },
    origin
  )
}
