/**
 * Generate a deterministic cache key for internships query
 */
const generateInternshipsCacheKey = ({ what, location, results_per_page }) => {
  return `internships:${what}:${location}:${results_per_page}`;
};

module.exports = {
  generateInternshipsCacheKey,
};