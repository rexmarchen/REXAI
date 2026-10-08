/**
 * Base Abstract Internship Source Interface
 */
export class InternshipSource {
  constructor(name) {
    if (new.target === InternshipSource) {
      throw new TypeError('Cannot construct InternshipSource instances directly')
    }
    this.name = name
  }

  /**
   * Search and fetch raw internship postings from the provider.
   * @param {Object} params
   * @returns {Promise<Array<Object>>}
   */
  async search(params = {}) {
    throw new Error('search() must be implemented by subclass')
  }

  /**
   * Health check for provider connectivity and credentials.
   * @returns {Promise<{ healthy: boolean, status: string, message: string, quota?: any }>}
   */
  async healthCheck() {
    throw new Error('healthCheck() must be implemented by subclass')
  }
}

export default InternshipSource
