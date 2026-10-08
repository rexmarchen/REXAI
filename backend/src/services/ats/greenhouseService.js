import { GREENHOUSE_API_KEY, GREENHOUSE_BOARD_TOKEN } from '../../config/env.js'
import AppError from '../../utils/AppError.js'
import logger from '../../utils/logger.js'

const API_BASE_URL = process.env.GREENHOUSE_API_BASE_URL || 'https://boards-api.greenhouse.io/v1'

/**
 * Service to interact directly with the Greenhouse Job Board REST API.
 */
class GreenhouseService {
  /**
   * Resolves the API key and board token from arguments or falls back to system environment values.
   */
  _resolveCredentials(options = {}) {
    const apiKey = options.apiKey || GREENHOUSE_API_KEY
    const boardToken = options.boardToken || GREENHOUSE_BOARD_TOKEN

    if (!boardToken) {
      throw new AppError('Greenhouse board token is missing or not configured.', 400, 'GREENHOUSE_CONFIGURATION_MISSING')
    }

    return { apiKey, boardToken }
  }

  /**
   * Helper to format Basic Auth header
   */
  _getAuthHeader(apiKey) {
    if (!apiKey) {
      throw new AppError('Greenhouse API key is missing. This submission requires basic authentication.', 401, 'GREENHOUSE_AUTH_FAILED')
    }
    // Basic auth username is API key, password is empty
    const credentials = `${apiKey}:`
    const encoded = Buffer.from(credentials).toString('base64')
    return `Basic ${encoded}`
  }

  /**
   * Fetches basic metadata about a Greenhouse job board.
   */
  async getBoard(options = {}) {
    const { boardToken } = this._resolveCredentials(options)
    const url = `${API_BASE_URL}/boards/${boardToken}`
    
    try {
      logger.info(`[Greenhouse] Fetching board details for token: "${boardToken}"`)
      const res = await fetch(url)
      
      if (res.status === 404) {
        throw new AppError(`Greenhouse board "${boardToken}" not found.`, 404, 'GREENHOUSE_BOARD_NOT_FOUND')
      }

      if (!res.ok) {
        throw new AppError(`Failed to fetch board details: ${res.statusText}`, res.status, 'NETWORK_ERROR')
      }

      return await res.json()
    } catch (err) {
      if (err instanceof AppError) throw err
      logger.error(`[Greenhouse] Board fetch failed: ${err.message}`)
      throw new AppError(`Greenhouse service communication error: ${err.message}`, 500, 'NETWORK_ERROR')
    }
  }

  /**
   * Fetches all live job listings on a board.
   */
  async getJobs(options = {}) {
    const { boardToken } = this._resolveCredentials(options)
    const url = `${API_BASE_URL}/boards/${boardToken}/jobs`

    try {
      logger.info(`[Greenhouse] Fetching job listings for board: "${boardToken}"`)
      const res = await fetch(url)

      if (res.status === 404) {
        throw new AppError(`Greenhouse board "${boardToken}" not found.`, 404, 'GREENHOUSE_BOARD_NOT_FOUND')
      }

      if (!res.ok) {
        throw new AppError(`Failed to fetch jobs: ${res.statusText}`, res.status, 'NETWORK_ERROR')
      }

      const data = await res.json()
      return data.jobs || []
    } catch (err) {
      if (err instanceof AppError) throw err
      logger.error(`[Greenhouse] Jobs fetch failed: ${err.message}`)
      throw new AppError(`Greenhouse service communication error: ${err.message}`, 500, 'NETWORK_ERROR')
    }
  }

  /**
   * Fetches detailed questions and specs for a specific job listing.
   */
  async getJob(jobId, options = {}) {
    const { boardToken } = this._resolveCredentials(options)
    const parsedJobId = String(jobId || '').trim()

    if (!parsedJobId) {
      throw new AppError('Job ID is required for retrieval.', 400, 'GREENHOUSE_JOB_NOT_FOUND')
    }

    const url = `${API_BASE_URL}/boards/${boardToken}/jobs/${parsedJobId}?questions=true`

    try {
      logger.info(`[Greenhouse] Fetching job specifications for ID "${parsedJobId}" (board: "${boardToken}")`)
      const res = await fetch(url)

      if (res.status === 404) {
        throw new AppError(`Greenhouse job ID "${parsedJobId}" on board "${boardToken}" was not found or is no longer live.`, 404, 'GREENHOUSE_JOB_NOT_FOUND')
      }

      if (!res.ok) {
        throw new AppError(`Failed to retrieve job details: ${res.statusText}`, res.status, 'GREENHOUSE_FORM_FETCH_FAILED')
      }

      return await res.json()
    } catch (err) {
      if (err instanceof AppError) throw err
      logger.error(`[Greenhouse] Job spec fetch failed: ${err.message}`)
      throw new AppError(`Greenhouse service communication error: ${err.message}`, 500, 'NETWORK_ERROR')
    }
  }

  /**
   * Submits an application to a Greenhouse job listing.
   * Receives a FormData instance representing the multipart payload.
   */
  async submitApplication(jobId, formData, options = {}) {
    const { apiKey, boardToken } = this._resolveCredentials(options)
    const parsedJobId = String(jobId || '').trim()

    if (!parsedJobId) {
      throw new AppError('Job ID is required for application submission.', 400, 'GREENHOUSE_JOB_NOT_FOUND')
    }

    const url = `${API_BASE_URL}/boards/${boardToken}/jobs/${parsedJobId}`
    const authHeader = this._getAuthHeader(apiKey)

    try {
      logger.info(`[Greenhouse] Submitting job application to ID "${parsedJobId}" on board "${boardToken}"...`)
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader
        },
        body: formData
      })

      const responseText = await res.text()
      let parsedResponse = {}
      try {
        parsedResponse = JSON.parse(responseText)
      } catch {
        parsedResponse = { message: responseText }
      }

      if (res.status === 401) {
        throw new AppError('Greenhouse API Authentication failed. Please check your credentials.', 401, 'GREENHOUSE_AUTH_FAILED')
      }

      if (res.status === 429) {
        throw new AppError('Greenhouse API rate limit exceeded. Please try again later.', 429, 'GREENHOUSE_RATE_LIMITED')
      }

      if (!res.ok) {
        const errorReason = parsedResponse.message || parsedResponse.error || responseText || 'Unknown rejection'
        throw new AppError(`Greenhouse submission rejected: ${errorReason}`, res.status, 'GREENHOUSE_SUBMISSION_FAILED')
      }

      logger.info(`[Greenhouse] Application accepted for Job ID "${parsedJobId}" on board "${boardToken}"!`)
      return {
        success: true,
        response: parsedResponse,
        statusCode: res.status
      }
    } catch (err) {
      if (err instanceof AppError) throw err
      logger.error(`[Greenhouse] Submission request failed: ${err.message}`)
      throw new AppError(`Greenhouse submission connection error: ${err.message}`, 500, 'NETWORK_ERROR')
    }
  }
}

export const greenhouseService = new GreenhouseService()
export default greenhouseService
