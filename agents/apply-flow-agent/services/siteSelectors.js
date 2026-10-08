// Site CSS Selector Configurations for various ATS systems
// Keeps core Puppeteer logic clean and extensible without hardcoded selectors.

export const siteSelectors = [
  {
    name: 'local-test-form',
    detect: (url) => url.includes('test_application_form.html') || url.includes('test-form'),
    fields: {
      firstName: 'input#first_name',
      lastName: 'input#last_name',
      email: 'input#email',
      phone: 'input#phone',
      address: 'input#address_line1',
      city: 'input#city',
      state: 'input#state',
      zipCode: 'input#zip_code',
      linkedin: 'input#linkedin_url',
      github: 'input#github_url',
      portfolio: 'input#portfolio_url',
      currentTitle: 'input#current_title',
      yearsExperience: 'input#years_experience',
      resume: 'input[type="file"]',
      customQuestion: 'textarea#why_interested'
    },
    submitButton: 'button[type="submit"]',
    successIndicators: ['Submitted values', 'submitted values', 'submitted']
  },
  {
    name: 'greenhouse',
    detect: (url) => url.includes('greenhouse.io') || url.includes('boards.greenhouse.io'),
    fields: {
      firstName: 'input#first_name',
      lastName: 'input#last_name',
      fullName: 'input#name',
      email: 'input#email',
      phone: 'input#phone',
      resume: 'input[type="file"][id="resume_upload"], input[type="file"]',
      summary: 'textarea#cover_letter_text, textarea',
      linkedin: 'input[autocomplete="custom-question-linkedin-profile"], input[name*="linkedin" i], input[id*="linkedin" i]',
      github: 'input[autocomplete="custom-question-github-profile"], input[name*="github" i], input[id*="github" i]',
      portfolio: 'input[autocomplete="custom-question-website"], input[autocomplete="custom-question-portfolio"], input[name*="website" i], input[name*="portfolio" i], input[id*="website" i], input[id*="portfolio" i]'
    },
    submitButton: '#submit_app',
    successIndicators: [
      'thank you', 'thanks', 'received', 'submitted', 'confirmation', 'success',
      'your application has been', 'job application'
    ]
  },
  {
    name: 'lever',
    detect: (url) => url.includes('lever.co') || url.includes('jobs.lever.co'),
    fields: {
      fullName: 'input[name="name"]',
      email: 'input[name="email"]',
      phone: 'input[name="phone"]',
      resume: 'input[type="file"][name="resume"], input[type="file"]',
      summary: 'textarea[name="comments"], textarea',
      linkedin: 'input[name="urls[LinkedIn]"], input[name*="linkedin" i]',
      github: 'input[name="urls[GitHub]"], input[name*="github" i]',
      portfolio: 'input[name="urls[Portfolio]"], input[name*="portfolio" i], input[name*="website" i]'
    },
    submitButton: '#btn-submit, button[type="submit"]',
    successIndicators: [
      'thank you', 'thanks', 'received', 'submitted', 'confirmation', 'success',
      'your application has been', 'job application'
    ]
  },
  {
    name: 'generic-form',
    detect: (url) => true,
    fields: {
      firstName: 'input#first_name, input[name*="first_name" i], input[name*="firstName" i], input[id*="firstName" i], input[id*="first_name" i]',
      lastName: 'input#last_name, input[name*="last_name" i], input[name*="lastName" i], input[id*="lastName" i], input[id*="last_name" i]',
      fullName: 'input#name, input[name="name" i], input[name="full_name" i], input[name*="fullName" i]',
      email: 'input#email, input[type="email"], input[name*="email" i], input[id*="email" i]',
      phone: 'input#phone, input[type="tel"], input[name*="phone" i], input[id*="phoneNumber" i], input[id*="phone" i]',
      address: 'input#address_line1, input[name*="addressLine1" i], input[id*="addressLine1" i], input[name*="address" i]',
      city: 'input#city, input[name*="city" i], input[id*="city" i]',
      state: 'input#state, select#address_countryRegion, select[name*="region" i], select[name*="state" i], input[name*="state" i]',
      zipCode: 'input#zip_code, input[name*="postalCode" i], input[id*="postalCode" i], input[name*="zip" i]',
      country: 'select#address_country, select[name*="country" i]',
      linkedin: 'input#linkedin_url, input[name*="linkedin" i], input[id*="linkedin" i]',
      github: 'input#github_url, input[name*="github" i], input[id*="github" i]',
      portfolio: 'input#portfolio_url, input[name*="portfolio" i], input[name*="website" i], input[id*="portfolio" i]',
      currentTitle: 'input#current_title, input[name*="jobTitle" i], input[id*="jobTitle" i], input[name*="title" i], input#custom_question_1',
      employer: 'input[name*="employer" i], input[id*="employer" i], input[name="org" i], input#org',
      yearsExperience: 'input#years_experience, input[name*="yearsExperience" i], input[id*="yearsExperience" i], input[name*="years_experience" i], input#custom_question_2',
      educationDegree: 'select#education_degree, select[name*="degree" i], input#education_degree',
      educationInstitution: 'input#education_institution, input[name*="institution" i], input[id*="institution" i], input[name*="school" i]',
      resume: 'input[type="file"]',
      customQuestion: 'textarea#why_interested, textarea'
    },
    submitButton: '#submitBtn, button[type="submit"], input[type="submit"], #submit_app, #btn-submit, button',
    successIndicators: ['submitted', 'thank you', 'received', 'success', 'application']
  }
];

/**
 * Detects the ATS configuration matching the target URL.
 * @param {string} url - The job application posting URL
 * @returns {Object|null} - The selector config object, or null if unsupported
 */
export function detectSiteType(url) {
  if (!url || typeof url !== 'string') return null;
  
  for (const config of siteSelectors) {
    if (config.detect(url)) {
      return config;
    }
  }
  return null;
}
