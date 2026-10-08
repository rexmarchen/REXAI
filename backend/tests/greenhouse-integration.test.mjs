import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import greenhouseProvider from '../src/services/ats/greenhouseProvider.js'
import atsAdapter from '../src/services/ats/atsAdapter.js'
import AppError from '../src/utils/AppError.js'

test('Greenhouse Provider - URL Parsing', () => {
  // Pattern 1
  const url1 = 'https://boards.greenhouse.io/stripe/jobs/4827014'
  const res1 = greenhouseProvider.parseUrl(url1)
  assert.equal(res1.boardToken, 'stripe')
  assert.equal(res1.jobId, '4827014')

  // Pattern 2
  const url2 = 'https://job-boards.greenhouse.io/figma/jobs/99281'
  const res2 = greenhouseProvider.parseUrl(url2)
  assert.equal(res2.boardToken, 'figma')
  assert.equal(res2.jobId, '99281')

  // Pattern 3 (Query params)
  const url3 = 'https://boards.greenhouse.io/embed/job_board?board_token=vercel&job_id=2291'
  const res3 = greenhouseProvider.parseUrl(url3)
  assert.equal(res3.boardToken, 'vercel')
  assert.equal(res3.jobId, '2291')

  // Invalid URL throws error
  assert.throws(() => {
    greenhouseProvider.parseUrl('https://google.com')
  }, (err) => {
    return err instanceof AppError && err.details === 'GREENHOUSE_JOB_NOT_FOUND'
  })
})

test('Greenhouse Provider - canHandle Matcher', () => {
  assert.ok(greenhouseProvider.canHandle('https://boards.greenhouse.io/stripe/jobs/1234'))
  assert.ok(greenhouseProvider.canHandle('https://job-boards.greenhouse.io/figma'))
  assert.ok(!greenhouseProvider.canHandle('https://lever.co/company/job'))
})

test('Greenhouse Provider - Profile Validation and Mapping Rules', () => {
  const questions = [
    { name: 'first_name', label: 'First Name', required: true, type: 'text' },
    { name: 'last_name', label: 'Last Name', required: true, type: 'text' },
    { name: 'email', label: 'Email', required: true, type: 'text' },
    { name: 'phone', label: 'Phone', required: false, type: 'text' }
  ]

  // Case 1: Missing required field
  const profile1 = { name: 'John', email: '' }
  const val1 = greenhouseProvider.validate(profile1, null, questions)
  assert.equal(val1.valid, false)
  assert.equal(val1.missingFields.length, 2) // last_name, email

  // Case 2: Successful mapping
  const profile2 = { fullName: 'John Doe', email: 'john@example.com' }
  const val2 = greenhouseProvider.validate(profile2, null, questions)
  assert.equal(val2.valid, true)
  assert.equal(val2.mappedFields.first_name, 'John')
  assert.equal(val2.mappedFields.last_name, 'Doe')
  assert.equal(val2.mappedFields.email, 'john@example.com')
})

test('Greenhouse Provider - File Attachment Boundary Conditions', () => {
  const questions = [
    { name: 'resume', label: 'Resume', required: true, type: 'file' }
  ]

  // Case 1: Missing resume file
  const val1 = greenhouseProvider.validate({}, null, questions)
  assert.equal(val1.valid, false)
  assert.equal(val1.missingFields[0].reasonCode, 'MISSING_RESUME')

  // Case 2: Unsupported resume extension
  const badResume = {
    mimetype: 'image/png',
    size: 2048,
    originalname: 'pic.png'
  }
  const val2 = greenhouseProvider.validate({}, badResume, questions)
  assert.equal(val2.valid, false)
  assert.equal(val2.missingFields[0].reasonCode, 'UNSUPPORTED_ATTACHMENT')

  // Case 3: Resume file too large
  const largeResume = {
    mimetype: 'application/pdf',
    size: 15 * 1024 * 1024, // 15MB
    originalname: 'resume.pdf'
  }
  const val3 = greenhouseProvider.validate({}, largeResume, questions)
  assert.equal(val3.valid, false)
  assert.equal(val3.missingFields[0].reasonCode, 'UNSUPPORTED_ATTACHMENT')
})

test('Greenhouse Provider - Submit Dry-Run Validation Bypass', async () => {
  // Create a temporary mock resume file for test
  const tempResumePath = path.join(process.cwd(), 'uploads', 'test-dryrun-resume.pdf')
  if (!fs.existsSync(path.dirname(tempResumePath))) {
    fs.mkdirSync(path.dirname(tempResumePath), { recursive: true })
  }
  fs.writeFileSync(tempResumePath, 'mock pdf body')

  const resumeFile = {
    path: tempResumePath,
    mimetype: 'application/pdf',
    originalname: 'my-resume.pdf',
    size: 128
  }

  const profile = {
    fullName: 'Anshu Pal',
    email: 'anshu@example.com',
    phone: '+919065000000',
    linkedinUrl: 'https://linkedin.com/in/anshu'
  }

  // Stub getJobDetails on provider
  const originalGetDetails = greenhouseProvider.getJobDetails
  greenhouseProvider.getJobDetails = async () => ({
    externalJobId: '1234',
    title: 'Software Developer',
    company: 'Stripe',
    location: 'Remote',
    questions: [
      { name: 'first_name', label: 'First Name', required: true, type: 'text' },
      { name: 'last_name', label: 'Last Name', required: true, type: 'text' },
      { name: 'email', label: 'Email', required: true, type: 'text' },
      { name: 'resume', label: 'Resume', required: true, type: 'file' }
    ]
  })

  try {
    const result = await atsAdapter.submit(
      'https://boards.greenhouse.io/stripe/jobs/1234',
      profile,
      resumeFile,
      { dryRun: true }
    )

    assert.equal(result.dryRun, true)
    assert.equal(result.valid, true)
    assert.ok(result.payloadSummary !== undefined)
    assert.equal(result.payloadSummary.first_name, 'Anshu')
    assert.equal(result.payloadSummary.last_name, 'Pal')
    assert.equal(result.payloadSummary.email, 'anshu@example.com')
  } finally {
    // Restore
    greenhouseProvider.getJobDetails = originalGetDetails
    if (fs.existsSync(tempResumePath)) {
      fs.unlinkSync(tempResumePath)
    }
  }
})
