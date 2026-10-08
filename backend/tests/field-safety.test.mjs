import assert from 'assert'
import { categorizeFormField, analyzeFormFields } from '../src/services/agents/formUnderstandingEngine.js'
import { FIELD_SAFETY } from '../src/config/constants.js'

console.log('--- RUNNING FIELD SAFETY & FORM UNDERSTANDING TEST SUITE ---')

// Test 1: Safe Autofill fields
{
  const nameField = categorizeFormField({ name: 'first_name', label: 'First Name' })
  assert.strictEqual(nameField.safetyCategory, FIELD_SAFETY.SAFE_AUTOFILL)
  assert.strictEqual(nameField.canonicalField, 'firstName')

  const emailField = categorizeFormField({ name: 'email', label: 'Email Address' })
  assert.strictEqual(emailField.safetyCategory, FIELD_SAFETY.SAFE_AUTOFILL)
  assert.strictEqual(emailField.canonicalField, 'email')

  const linkedinField = categorizeFormField({ name: 'urls[LinkedIn]', label: 'LinkedIn Profile' })
  assert.strictEqual(linkedinField.safetyCategory, FIELD_SAFETY.SAFE_AUTOFILL)
  assert.strictEqual(linkedinField.canonicalField, 'linkedinUrl')

  console.log('✓ Test 1 Passed: Safe autofill fields correctly categorized')
}

// Test 2: Sensitive - NEVER GUESS fields
{
  const visaField = categorizeFormField({ name: 'sponsorship', label: 'Will you now or in the future require visa sponsorship?' })
  assert.strictEqual(visaField.safetyCategory, FIELD_SAFETY.SENSITIVE_NEVER_GUESS)
  assert.strictEqual(visaField.isSensitive, true)

  const workAuthField = categorizeFormField({ name: 'work_auth', label: 'Are you legally authorized to work in the United States?' })
  assert.strictEqual(workAuthField.safetyCategory, FIELD_SAFETY.SENSITIVE_NEVER_GUESS)

  const disabilityField = categorizeFormField({ name: 'eeo_disability', label: 'Voluntary Self-Identification of Disability' })
  assert.strictEqual(disabilityField.safetyCategory, FIELD_SAFETY.SENSITIVE_NEVER_GUESS)

  const ssnField = categorizeFormField({ name: 'ssn', label: 'Social Security Number' })
  assert.strictEqual(ssnField.safetyCategory, FIELD_SAFETY.SENSITIVE_NEVER_GUESS)

  console.log('✓ Test 2 Passed: Sensitive legal & EEO fields strictly marked as SENSITIVE_NEVER_GUESS')
}

// Test 3: Requires Validation & Screening questions
{
  const salaryField = categorizeFormField({ name: 'desired_salary', label: 'Expected Salary (USD)' })
  assert.strictEqual(salaryField.safetyCategory, FIELD_SAFETY.REQUIRES_VALIDATION)

  const customQuestion = categorizeFormField({ name: 'custom_123', label: 'Why are you interested in joining our company?' })
  assert.strictEqual(customQuestion.safetyCategory, FIELD_SAFETY.REQUIRES_VALIDATION)

  console.log('✓ Test 3 Passed: Salary and custom questions categorized for validation')
}

// Test 4: Full Form Analysis
{
  const sampleForm = [
    { name: 'name', label: 'Full Name' },
    { name: 'email', label: 'Email' },
    { name: 'phone', label: 'Phone' },
    { name: 'sponsorship', label: 'Do you require sponsorship?' },
    { name: 'cover_letter', label: 'Cover Letter / Notes' }
  ]

  const analysis = analyzeFormFields(sampleForm)
  assert.strictEqual(analysis.counts.total, 5)
  assert.strictEqual(analysis.counts.safe, 3)
  assert.strictEqual(analysis.counts.sensitive, 1)
  assert.strictEqual(analysis.counts.validation, 1)
  assert.strictEqual(analysis.requiresUserInput, true, 'Form with sensitive field must require user input')

  console.log('✓ Test 4 Passed: Form analysis aggregate metrics and userInput flags verified')
}

console.log('ALL FIELD SAFETY TESTS PASSED PERFECTLY!')
