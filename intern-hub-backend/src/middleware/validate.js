const Joi = require('joi');

// Schema for internship query parameters
const internshipQuerySchema = Joi.object({
  what: Joi.string().trim().min(1).max(100).default('internship'),
  location: Joi.string().trim().min(1).max(100).default('London'),
  results_per_page: Joi.number().integer().min(1).max(50).default(10),
});

const validateInternshipQuery = (query) => {
  return internshipQuerySchema.validate(query, { abortEarly: false });
};

module.exports = {
  validateInternshipQuery,
};