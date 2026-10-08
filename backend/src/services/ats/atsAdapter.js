import AppError from '../../utils/AppError.js'
import greenhouseProvider from './greenhouseProvider.js'

class ATSAdapter {
  constructor() {
    this.providers = []
    
    // Register Greenhouse provider
    this.registerProvider(greenhouseProvider)
  }

  registerProvider(provider) {
    this.providers.push(provider)
  }

  /**
   * Resolves the appropriate provider for a given job posting URL.
   */
  getProvider(url) {
    const targetUrl = String(url || '').trim()
    if (!targetUrl) {
      throw new AppError('Job posting URL is required.', 400, 'GREENHOUSE_CONFIGURATION_MISSING')
    }

    const provider = this.providers.find((p) => p.canHandle(targetUrl))
    if (!provider) {
      throw new AppError('This job posting platform is not supported by REXION auto-apply yet.', 400, 'UNSUPPORTED_ATS')
    }

    return provider
  }

  canHandle(url) {
    const targetUrl = String(url || '').trim()
    return this.providers.some((p) => p.canHandle(targetUrl))
  }

  /**
   * Retrieves and normalizes the job description and application form.
   */
  async getJobDetails(url) {
    const provider = this.getProvider(url)
    return await provider.getJobDetails(url)
  }

  /**
   * Maps applicant profile and validates it against the job questions.
   */
  async validate(url, profile, resumeFile) {
    const provider = this.getProvider(url)
    const jobDetails = await provider.getJobDetails(url)
    return provider.validate(profile, resumeFile, jobDetails.questions)
  }

  /**
   * Submits the application to the ATS, handling dryRun flag.
   */
  async submit(url, profile, resumeFile, options = {}) {
    const provider = this.getProvider(url)
    return await provider.submit(url, profile, resumeFile, options)
  }
}

export const atsAdapter = new ATSAdapter()
export default atsAdapter
