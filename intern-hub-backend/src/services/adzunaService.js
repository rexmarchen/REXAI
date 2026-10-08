const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

const { appId, apiKey, baseUrl, country } = config.adzuna;

/**
 * Fetches internship listings from Adzuna API
 * @param {Object} params - { what, where, resultsPerPage }
 * @returns {Promise<Object>} - Formatted internships data
 */
const fetchInternships = async ({ what, where, resultsPerPage }) => {
  try {
    const url = `${baseUrl}/${country}/search/1`;
    const queryParams = {
      app_id: appId,
      app_key: apiKey,
      results_per_page: resultsPerPage,
      what,
      where,
      content_type: 'internship', // Adzuna specific – filters internships
    };

    logger.info(`Calling Adzuna API: ${url} with params: ${JSON.stringify(queryParams)}`);

    const response = await axios.get(url, { params: queryParams });

    const internships = response.data.results.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company?.display_name || 'Unknown',
      location: job.location?.display_name || 'Unknown',
      description: job.description,
      url: job.redirect_url,
      created: job.created,
      contractType: job.contract_type,
    }));

    return {
      total: response.data.count,
      internships,
      source: 'Adzuna',
    };
  } catch (error) {
    logger.error(`Adzuna API error: ${error.message}`);
    if (error.response) {
      // Forward the error with status from Adzuna
      throw { status: error.response.status, message: 'External API error', details: error.response.data };
    }
    throw { status: 500, message: 'Failed to fetch internships' };
  }
};

module.exports = {
  fetchInternships,
};