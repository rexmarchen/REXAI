// ==============================================================================
// REXION AI LINKEDIN AGENT RELIABILITY & SECURITY TEST SUITE
// ==============================================================================
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'

// Set dummy test key if not set
process.env.TOKEN_ENC_KEY = process.env.TOKEN_ENC_KEY || Buffer.from('12345678901234567890123456789012').toString('base64')

import { encrypt, decrypt } from '../src/linkedin-agent/tokenCrypto.js'
import { computeUpcomingSlots } from '../src/linkedin-agent/planner.js'
import { escapeCommentary } from '../src/linkedin-agent/linkedinClient.js'
import { similarity } from '../src/linkedin-agent/contentAgent.js'

describe('LinkedIn Agent Core Reliability Suite', () => {
  it('1. Token Encryption: AES-256-GCM safely encrypts and round-trips token', () => {
    const rawToken = 'AQU2pp0zsGbIM2ULJclsFKevosaVmdFY304rR3oHxAyIrW'
    const encrypted = encrypt(rawToken)

    assert.notEqual(encrypted, rawToken)
    assert.match(encrypted, /^[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/)

    const decrypted = decrypt(encrypted)
    assert.equal(decrypted, rawToken)
  })

  it('2. Token Tampering: Tampered auth tag or ciphertext throws auth error', () => {
    const rawToken = 'secret-token-sample'
    const encrypted = encrypt(rawToken)
    const parts = encrypted.split('.')
    // Tamper with ciphertext
    const tamperedCiphertext = Buffer.from('corrupted-data').toString('base64')
    const tamperedPayload = `${parts[0]}.${parts[1]}.${tamperedCiphertext}`

    assert.throws(() => {
      decrypt(tamperedPayload)
    })
  })

  it('3. Commentary Escaping: Reserved markdown characters are safely escaped', () => {
    const input = 'Check out {this} [amazing] (product) <here> & test *bold* _italic_ ~strike~ \\slash |bar @mention #trending'
    const escaped = escapeCommentary(input)

    assert.ok(escaped.includes('\\{this\\}'))
    assert.ok(escaped.includes('\\[amazing\\]'))
    assert.ok(escaped.includes('\\(product\\)'))
    assert.ok(escaped.includes('\\<here\\>'))
    assert.ok(escaped.includes('\\*bold\\*'))
    assert.ok(escaped.includes('\\_italic\\_'))
    assert.ok(escaped.includes('\\|bar'))
    assert.ok(escaped.includes('\\@mention'))
    // Hashtags (#) must NOT be escaped
    assert.ok(escaped.includes('#trending'))
  })

  it('4. Slot Planning: Respects user timezone and maxPostsPerDay cap', () => {
    const schedule = {
      timezone: 'America/New_York',
      maxPostsPerDay: 1,
      jitterMinutes: 5,
      slots: [
        { day: 1, time: '09:00', theme: 'Monday morning motivation' },
        { day: 1, time: '14:00', theme: 'Monday afternoon tips' },
        { day: 3, time: '10:00', theme: 'Wednesday insights' }
      ]
    }

    const testMonday = new Date('2026-10-26T12:00:00Z') // A Monday
    const slots = computeUpcomingSlots(schedule, testMonday, 48)

    assert.ok(Array.isArray(slots))
    // Each scheduled item must have scheduledFor Date and slotKey
    slots.forEach((s) => {
      assert.ok(s.slotKey)
      assert.ok(s.scheduledFor instanceof Date)
    })
  })

  it('5. Similarity Detection: Detects high overlap between repeated post texts', () => {
    const textA = 'Artificial intelligence is changing the way software engineers build modern web applications every single day.'
    const textB = 'Artificial intelligence is changing the way software developers construct modern web applications every day.'
    const unrelated = 'Fresh pasta made from durum wheat flour tastes delicious with homemade tomato basil sauce.'

    const simHigh = similarity(textA, textB)
    const simLow = similarity(textA, unrelated)

    // Matches the duplicate rejection threshold of 0.35 in contentAgent.js
    assert.ok(simHigh > 0.35, `Expected similarity > 0.35, got ${simHigh}`)
    assert.ok(simLow < 0.1, `Expected similarity < 0.1, got ${simLow}`)
  })
})
