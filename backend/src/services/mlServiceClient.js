import { ML_SERVICE_URL } from '../config/env.js'
import { logger } from '../utils/logger.js'

const DEFAULT_ML_SERVICE_URL = ML_SERVICE_URL || 'http://localhost:8000'

/**
 * Check if ML Service is available
 * @returns {Promise<boolean>}
 */
export const isMLServiceAvailable = async () => {
  try {
    const response = await fetch(`${DEFAULT_ML_SERVICE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    })
    return response.ok
  } catch (error) {
    logger.warn(`ML Service health check failed: ${error.message}`)
    return false
  }
}

/**
 * Call ML Service to predict career path from resume
 * @param {Buffer} fileBuffer - Resume file buffer
 * @param {string} fileName - Original file name
 * @param {string} userId - User ID for tracking
 * @returns {Promise} Prediction response with career_path, confidence, ats_score, jobs
 */
export const predictCareerPathViaMlService = async (fileBuffer, fileName, userId) => {
  const formData = new FormData()
  
  // Create a Blob from the buffer
  const blob = new Blob([fileBuffer], { type: 'application/octet-stream' })
  formData.append('file', blob, fileName)
  
  if (userId) {
    formData.append('user_id', userId)
  }

  try {
    logger.info(`Attempting ML Service prediction at: ${DEFAULT_ML_SERVICE_URL}`)
    
    const response = await fetch(`${DEFAULT_ML_SERVICE_URL}/predict`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(60000)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `ML Service returned ${response.status}`)
    }

    const prediction = await response.json()
    logger.info(`ML Service prediction successful for ${fileName}`)
    return prediction
  } catch (error) {
    const errorMsg = error.message || String(error)
    logger.error(`ML Service prediction failed: ${errorMsg}`)
    
    // Enhanced error messages for debugging
    if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('Failed to fetch')) {
      logger.error(`ML Service unavailable at ${DEFAULT_ML_SERVICE_URL}. Is it running?`)
      throw new Error(`ML Service unavailable at ${DEFAULT_ML_SERVICE_URL}. Falling back to local analysis.`)
    }
    
    throw new Error(`ML Service prediction failed: ${errorMsg}`)
  }
}

/**
 * Retrieve a stored prediction from ML Service
 * @param {string} predictionId - Prediction ID
 * @returns {Promise} Prediction data
 */
export const getPredictionFromMlService = async (predictionId) => {
  try {
    const response = await fetch(`${DEFAULT_ML_SERVICE_URL}/predictions/${predictionId}`, {
      method: 'GET'
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`ML Service returned ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    logger.error(`Failed to get prediction from ML Service: ${error.message}`)
    throw error
  }
}

/**
 * Get all predictions for a user from ML Service
 * @param {string} userId - User ID
 * @param {number} limit - Limit number of results
 * @returns {Promise} List of predictions
 */
export const getUserPredictionsFromMlService = async (userId, limit = 50) => {
  try {
    const response = await fetch(
      `${DEFAULT_ML_SERVICE_URL}/predictions/user/${userId}?limit=${limit}`,
      { method: 'GET' }
    )

    if (!response.ok) {
      throw new Error(`ML Service returned ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    logger.error(`Failed to get user predictions from ML Service: ${error.message}`)
    throw error
  }
}

/**
 * Delete a prediction from ML Service
 * @param {string} predictionId - Prediction ID
 * @returns {Promise} Delete confirmation
 */
export const deletePredictionFromMlService = async (predictionId) => {
  try {
    const response = await fetch(`${DEFAULT_ML_SERVICE_URL}/predictions/${predictionId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error(`ML Service returned ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    logger.error(`Failed to delete prediction from ML Service: ${error.message}`)
    throw error
  }
}

/**
 * Search for jobs from ML Service
 * @param {string} query - Job search query
 * @param {Object} options - Search options
 * @returns {Promise} Jobs payload with jobs array and provider metadata
 */
export const searchJobsViaMlService = async (query, options = {}) => {
  const params = new URLSearchParams()
  params.append('query', query)
  
  if (options.location) {
    params.append('location', options.location)
  }
  if (typeof options.remote === 'boolean') {
    params.append('remote', String(options.remote))
  } else if (typeof options.remote === 'string' && options.remote.trim()) {
    params.append('remote', options.remote.trim())
  }
  if (Number.isFinite(options.page) && Number(options.page) > 0) {
    params.append('page', String(Math.round(Number(options.page))))
  }
  if (Number.isFinite(options.numPages) && Number(options.numPages) > 0) {
    params.append('num_pages', String(Math.round(Number(options.numPages))))
  }
  if (Number.isFinite(options.limit) && Number(options.limit) > 0) {
    params.append('limit', String(Math.round(Number(options.limit))))
  }
  if (Number.isFinite(options.postedWithinHours) && Number(options.postedWithinHours) > 0) {
    params.append('posted_within_hours', String(Math.round(Number(options.postedWithinHours))))
  }
  if (typeof options.refresh === 'boolean') {
    params.append('refresh', String(options.refresh))
  }

  try {
    const response = await fetch(
      `${DEFAULT_ML_SERVICE_URL}/jobs/search?${params.toString()}`,
      { method: 'GET' }
    )

    if (!response.ok) {
      throw new Error(`ML Service returned ${response.status}`)
    }

    const data = await response.json()
    return {
      jobs: Array.isArray(data.jobs) ? data.jobs : [],
      meta: data.meta && typeof data.meta === 'object' ? data.meta : null
    }
  } catch (error) {
    logger.error(`Job search from ML Service failed: ${error.message}`)
    // Return empty payload instead of throwing for graceful degradation.
    return {
      jobs: [],
      meta: {
        provider: 'none',
        error: error.message
      }
    }
  }
}
