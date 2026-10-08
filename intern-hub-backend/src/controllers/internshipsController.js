const adzunaService = require('../services/adzunaService');
const cache = require('../config/cache');
const { generateInternshipsCacheKey } = require('../utils/cacheKeys');
const { validateInternshipQuery } = require('../middleware/validate');
const logger = require('../utils/logger');

/**
 * GET /api/internships
 * Query params: location, results_per_page, what
 */
const getInternships = async (req, res, next) => {
  try {
    // Validate query parameters
    const { error, value } = validateInternshipQuery(req.query);
    if (error) {
      logger.warn(`Invalid query: ${error.message}`);
      return res.status(400).json({ error: error.details[0].message });
    }

    const { location, results_per_page, what } = value;

    // Build cache key
    const cacheKey = generateInternshipsCacheKey({ what, location, results_per_page });
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.debug(`Cache hit for key: ${cacheKey}`);
      return res.json(cached);
    }

    // Fetch from service
    const internships = await adzunaService.fetchInternships({
      what,
      where: location,
      resultsPerPage: results_per_page,
    });

    // Cache the result
    cache.set(cacheKey, internships);
    logger.debug(`Cached internships for key: ${cacheKey}`);

    res.json(internships);
  } catch (error) {
    next(error); // Pass to global error handler
  }
};

module.exports = {
  getInternships,
};