import { isAllowedOrigin } from '../config/index.js'

const getCorsHeaders = (origin) => {
  const headers = {
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin'
  }

  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }

  return headers
}

export const sendJson = (response, statusCode, payload, origin, extraHeaders = {}) => {
  const headers = {
    ...getCorsHeaders(origin),
    ...extraHeaders,
    'Content-Type': 'application/json; charset=utf-8'
  }

  response.writeHead(statusCode, headers)

  if (statusCode === 204) {
    response.end()
    return
  }

  response.end(JSON.stringify(payload))
}

export const sendRedirect = (response, statusCode, location, origin, extraHeaders = {}) => {
  const headers = {
    ...getCorsHeaders(origin),
    ...extraHeaders,
    Location: location
  }

  response.writeHead(statusCode, headers)
  response.end()
}

export const sendError = (response, error, origin) => {
  const statusCode = Number(error?.statusCode || error?.status || 500)
  const isServerError = statusCode >= 500
  const message = isServerError
    ? String(error?.message || 'Internal server error.')
    : String(error?.message || 'Request failed.')

  sendJson(
    response,
    statusCode,
    {
      success: false,
      error: message
    },
    origin
  )
}
