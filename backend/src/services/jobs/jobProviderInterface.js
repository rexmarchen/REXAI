/**
 * Job Provider Base Interface
 * Every job provider (Adzuna, Greenhouse, Lever, Workday, LinkedIn, etc.) must implement this interface.
 */
export class JobProviderInterface {
  constructor(name) {
    this.name = name
  }

  /**
   * Search jobs matching criteria
   * @param {Object} params
   * @param {string} params.query
   * @param {string} params.location
   * @param {string} params.domain
   * @param {number} params.page
   * @param {number} params.limit
   * @returns {Promise<Array<NormalizedJob>>}
   */
  async searchJobs(params) {
    throw new Error(`searchJobs() not implemented in provider ${this.name}`)
  }

  /**
   * Fetch details for a specific job
   * @param {string} externalJobId
   * @returns {Promise<NormalizedJob>}
   */
  async getJobDetails(externalJobId) {
    throw new Error(`getJobDetails() not implemented in provider ${this.name}`)
  }

  /**
   * Normalize raw provider payload into standardized job format
   * @param {Object} rawJob
   * @returns {NormalizedJob}
   */
  normalizeJob(rawJob) {
    throw new Error(`normalizeJob() not implemented in provider ${this.name}`)
  }
}
