import { ML_SERVICE_URL } from '../config/env.js'
import { logger } from '../utils/logger.js'

const DEFAULT_ML_SERVICE_URL = ML_SERVICE_URL || 'http://localhost:8000'

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
    const response = await fetch(`${DEFAULT_ML_SERVICE_URL}/predict`, {
      method: 'POST',
      body: formData,
      timeout: 60000
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `ML Service returned ${response.status}`)
    }

    const prediction = await response.json()
    logger.info(`ML Service prediction successful for ${fileName}`)
    return prediction
  } catch (error) {
    logger.error(`ML Service prediction failed: ${error.message}`)
    throw new Error(`ML Service prediction failed: ${error.message}`)
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
 * @returns {Promise} List of jobs
 */
export const searchJobsViaMlService = async (query, options = {}) => {
  const params = new URLSearchParams()
  params.append('query', query)
  
  if (options.location) {
    params.append('location', options.location)
  }
  if (options.remote) {
    params.append('remote', options.remote)
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
    return data.jobs || []
  } catch (error) {
    logger.error(`Job search from ML Service failed: ${error.message}`)
    // Return empty array instead of throwing for graceful degradation
    return []
  }
}
