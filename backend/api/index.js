import app from '../server.js'

function buildQueryString(query) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query || {})) {
    if (key === '__path') {
      continue
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, String(item))
      }
      continue
    }

    if (value != null) {
      params.set(key, String(value))
    }
  }

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

export default function handler(request, response) {
  const rawPath = request.query?.__path
  const normalizedPath = Array.isArray(rawPath)
    ? rawPath.filter(Boolean).join('/')
    : String(rawPath || '').trim()

  request.url = `/api${normalizedPath ? `/${normalizedPath}` : ''}${buildQueryString(request.query)}`

  return app(request, response)
}
