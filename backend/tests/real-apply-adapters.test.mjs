import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { existsSync, writeFileSync } from 'node:fs'
import { applyToJob } from '../src/services/formFillerService.js'

test('Form Filler - Workday Template Redirection', async () => {
  const application = {
    id: 9991,
    postingUrl: 'https://nvidia.myworkdayjobs.com/NVIDIACareers/job/USA-CA-Santa-Clara/Senior-Deep-Learning-Software-Engineer_JR1982701'
  }
  const candidateProfile = {
    fullName: 'John Doe',
    email: 'johndoe@example.com',
    phone: '+15555550100'
  }

  const result = await applyToJob({
    application,
    candidateProfile,
    resumeFilePath: null
  })

  assert.equal(result.status, 'manual_required')
  assert.match(result.errorMessage, /Workday/)
  assert.equal(result.channelUsed, 'manual')
})

test('Form Filler - Unrecognized Template Redirection', async () => {
  const application = {
    id: 9992,
    postingUrl: 'https://google.com/about/careers'
  }
  const candidateProfile = {
    fullName: 'John Doe',
    email: 'johndoe@example.com',
    phone: '+15555550100'
  }

  const result = await applyToJob({
    application,
    candidateProfile,
    resumeFilePath: null
  })

  assert.equal(result.status, 'manual_required')
  assert.match(result.errorMessage, /Unrecognized template|Custom company portal/)
  assert.equal(result.channelUsed, 'manual')
})

test('Form Filler - Greenhouse Template Check Fields Validation (Without submit)', async () => {
  const application = {
    id: 9993,
    postingUrl: 'https://boards.greenhouse.io/github/jobs/123456789' // Mock/dead ID
  }
  const candidateProfile = {
    fullName: 'John Doe',
    email: 'johndoe@example.com',
    phone: '+15555550100'
  }

  // Create a temporary dummy resume file if it doesn't exist
  const dummyResumePath = path.join(process.cwd(), 'uploads', 'test-resume.pdf')
  if (!existsSync(path.dirname(dummyResumePath))) {
    path.dirname(dummyResumePath) && existsSync(path.dirname(dummyResumePath)) || 
    (() => {
      // Just check if we can make it
      try {
        const fs = require('fs')
        fs.mkdirSync(path.dirname(dummyResumePath), { recursive: true })
      } catch {}
    })()
  }
  writeFileSync(dummyResumePath, 'Dummy PDF content')

  const result = await applyToJob({
    application,
    candidateProfile,
    resumeFilePath: dummyResumePath
  })

  // Since this is a dead job ID, Greenhouse will show a 404 or page not found,
  // which will fail to find input elements and return 'failed' or 'manual_required'.
  // This validates the adapter fails honestly rather than assuming success.
  assert.ok(['failed', 'manual_required', 'expired'].includes(result.status))
  assert.ok(result.errorMessage !== undefined)
})
