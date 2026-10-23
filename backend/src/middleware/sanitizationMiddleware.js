/**
 * Sanitization Middleware
 * Protects against Cross-Site Scripting (XSS) and NoSQL Injection
 */

function sanitizeValue(value) {
  if (value === null || value === undefined) {
    return value
  }

  if (typeof value === 'string') {
    // Strip potential XSS vector tags and attributes while preserving safe text
    return value
      .replace(/<script\b[\s\S]*?<\/script>/gi, '')
      .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, '')
      .replace(/<embed\b[\s\S]*?<\/embed>/gi, '')
      .replace(/<object\b[\s\S]*?<\/object>/gi, '')
      .replace(/javascript:[^"'\s>]*/gi, '')
      .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue)
  }

  if (typeof value === 'object') {
    const cleanObj = {}
    for (const [key, val] of Object.entries(value)) {
      // Prevent NoSQL injection: Disallow MongoDB operator keys ($gt, $ne, $where, etc.) and dot-paths
      if (key.startsWith('$') || key.includes('.')) {
        continue
      }
      cleanObj[key] = sanitizeValue(val)
    }
    return cleanObj
  }

  return value
}

export const sanitizeInputs = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    try {
      req.body = sanitizeValue(req.body)
    } catch (_) {}
  }
  if (req.query && typeof req.query === 'object') {
    try {
      const cleanQuery = sanitizeValue(req.query)
      for (const k of Object.keys(req.query)) {
        delete req.query[k]
      }
      Object.assign(req.query, cleanQuery)
    } catch (_) {}
  }
  if (req.params && typeof req.params === 'object') {
    try {
      const cleanParams = sanitizeValue(req.params)
      for (const k of Object.keys(req.params)) {
        delete req.params[k]
      }
      Object.assign(req.params, cleanParams)
    } catch (_) {}
  }
  next()
}

export default sanitizeInputs
