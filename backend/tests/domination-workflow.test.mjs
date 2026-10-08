import test, { afterEach } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'node:fs'
import {
  canUseDominationWorkflow,
  findDominationMatches,
  applyAllDominationMatches
} from '../src/services/dominationWorkflowService.js'
import {
  findApplicationsByBatchId,
  findApplicationBatchById
} from '../server.js'

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
})

test('canUseDominationWorkflow checks plan and role correctly', () => {
  assert.equal(canUseDominationWorkflow({ role: 'admin' }), true)
  assert.equal(canUseDominationWorkflow({ plan: 'elite' }), true)
  assert.equal(canUseDominationWorkflow({ role: 'candidate', plan: 'free' }), false)
  assert.equal(canUseDominationWorkflow(null), false)
})

test('findDominationMatches fails fast when file is missing', async () => {
  await assert.rejects(
    findDominationMatches({
      user: { plan: 'elite' },
      body: {},
      file: null
    }),
    /Please upload a resume file/
  )
})

test('findDominationMatches parses resume and finds/scores matching jobs', async () => {
  // Mock global.fetch
  global.fetch = async (url) => {
    if (url.includes('adzuna.com') || url.includes('adzuna')) {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          results: [
            {
              id: 'adzuna-101',
              title: 'Software Engineer (React & Node)',
              description: 'Looking for a developer with 5 years of experience and React/Node/Python skills.',
              company: { display_name: 'GitHub' },
              location: { display_name: 'Remote' },
              redirect_url: 'https://boards.greenhouse.io/github/jobs/6930149001',
              posted_date: new Date().toISOString()
            },
            {
              id: 'adzuna-202',
              title: 'Backend Developer (Python)',
              description: 'Looking for a python coder with React and JavaScript.',
              company: { display_name: 'StackAdapt' },
              location: { display_name: 'Remote' },
              redirect_url: 'https://jobs.lever.co/stackadapt/202',
              posted_date: new Date().toISOString()
            }
          ]
        })
      }
    }
    if (url.includes('greenhouse.io')) {
      return {
        ok: true,
        json: async () => ({
          jobs: [
            {
              id: 101,
              title: 'Software Engineer (React & Node)',
              absolute_url: 'https://boards.greenhouse.io/github/jobs/6930149001',
              location: { name: 'Remote' },
              updated_at: new Date().toISOString()
            }
          ]
        })
      }
    }
    if (url.includes('lever.co')) {
      return {
        ok: true,
        json: async () => [
          {
            id: '202',
            text: 'Backend Developer (Python)',
            hostedUrl: 'https://jobs.lever.co/stackadapt/202',
            categories: { location: 'Remote' },
            createdAt: Date.now()
          }
        ]
      }
    }
    if (url.includes('remoteok.com')) {
      return {
        ok: true,
        json: async () => [
          { legal: 'RemoteOK' },
          {
            id: 303,
            position: 'React Frontend Engineer',
            company: 'Stripe',
            location: 'Remote',
            url: 'https://remoteok.com/stripe-303',
            epoch: Math.floor(Date.now() / 1000)
          }
        ]
      }
    }
    return { ok: false, status: 404, statusText: 'Not Found' }
  }

  // Create temporary resume file
  const testDir = path.join(process.cwd(), 'uploads')
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true })
  }
  const testFile = path.join(testDir, 'test-resume-workflow.pdf')
  writeFileSync(testFile, 'Skills: JavaScript, React, Node.js, Python. 5 years of experience.')

  const result = await findDominationMatches({
    user: { plan: 'elite' },
    body: { targetRole: 'Software Engineer' },
    file: { path: testFile, mimetype: 'application/pdf', originalname: 'test-resume.pdf' }
  })

  // Clean up test file
  if (existsSync(testFile)) {
    unlinkSync(testFile)
  }

  assert.equal(result.success, true)
  assert.equal(result.status, 'ok')
  assert.ok(result.jobs.length >= 2)
  
  // Verify scores and structure
  const firstJob = result.jobs[0]
  assert.ok(firstJob.score >= 45 && firstJob.score <= 98)
  assert.ok(firstJob.title)
  assert.ok(firstJob.posting_url)
})

test('applyAllDominationMatches validates input parameters', async () => {
  await assert.rejects(
    applyAllDominationMatches({
      user: { plan: 'elite', email: '' },
      body: { jobs: [] }
    }),
    /Authenticated user email could not be resolved from session/
  )

  await assert.rejects(
    applyAllDominationMatches({
      user: { plan: 'elite', email: 'tester@example.com' },
      body: { jobs: [] }
    }),
    /No jobs selected for application/
  )
})

test('applyAllDominationMatches creates batch and enqueues applications', async () => {
  const result = await applyAllDominationMatches({
    user: { id: 999, plan: 'elite', email: 'tester@example.com' },
    body: {
      jobs: [
        {
          job_title: 'Software Engineer',
          company: 'GitHub',
          location: 'Remote',
          description: 'A job',
          tier: 1,
          posting_url: 'https://boards.greenhouse.io/github/jobs/6930149001'
        }
      ],
      resumeData: {
        parsedName: 'John Test',
        skillsDetected: ['React', 'Node'],
        experienceYears: '5+'
      }
    }
  })

  assert.equal(result.success, true)
  assert.equal(result.status, 'ok')
  assert.ok(typeof result.batchId === 'number')
  assert.equal(result.queuedCount, 1)

  // Verify batch exists in DB
  const batch = await findApplicationBatchById(result.batchId)
  assert.ok(batch)
  
  // Verify applications exist in DB
  const applications = await findApplicationsByBatchId(result.batchId)
  assert.equal(applications.length, 1)
  assert.equal(applications[0].jobTitle, 'Software Engineer')
  assert.equal(applications[0].company, 'GitHub')
})

test('local email preview saves and is served', async () => {
  const { sendEmail } = await import('../src/services/emailService.js')
  const res = await sendEmail({
    to: 'tester@example.com',
    subject: 'Test Email Local Preview',
    html: '<h1>Hello Local Email Preview!</h1>',
    text: 'Hello Local Email Preview!'
  })

  assert.equal(res.status, 'sent')
  assert.ok(res.provider === 'local_preview' || res.provider === 'smtp')
  if (res.provider === 'local_preview') {
    assert.ok(res.filename)
    assert.ok(res.previewUrl)
  }
})

