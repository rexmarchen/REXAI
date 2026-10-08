import test from 'node:test'
import assert from 'node:assert/strict'

import Internship from '../src/models/Internship.js'
import CandidateProfile from '../src/models/CandidateProfile.js'
import { getInternships } from '../src/controllers/internshipController.js'

test('getInternships falls back to the real Summer 2027 dataset when no DB entries exist', async () => {
  const originalCountDocuments = Internship.countDocuments
  const originalFind = Internship.find
  const originalCandidateFindOne = CandidateProfile.findOne

  Internship.countDocuments = async () => 0
  Internship.find = () => ({
    sort: () => ({
      skip: () => ({
        limit: () => ({ lean: async () => [] })
      })
    })
  })
  CandidateProfile.findOne = async () => null

  try {
    const req = { query: { limit: '5', postedWithin: '48h' } }
    const res = {
      status(code) {
        this.statusCode = code
        return this
      },
      json(payload) {
        this.payload = payload
        return this
      }
    }

    await getInternships(req, res)

    assert.equal(res.statusCode, 200)
    assert.equal(Array.isArray(res.payload.data), true)
    assert.ok(res.payload.data.length > 0)
    assert.ok(res.payload.data[0].company)
    assert.ok(res.payload.data[0].title)
  } finally {
    Internship.countDocuments = originalCountDocuments
    Internship.find = originalFind
    CandidateProfile.findOne = originalCandidateFindOne
  }
})
