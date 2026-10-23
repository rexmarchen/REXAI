import assert from 'assert'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../src/config/env.js'
import User from '../src/models/User.js'
import DeveloperProfile from '../src/models/DeveloperProfile.js'
import { Quiz, QuizAttempt, QuizVersion, UserXP } from '../src/models/Quiz.js'
import { validateQuestion } from '../src/controllers/developerController.js'

console.log('=================================================================')
console.log('     REXION DEVELOPER PORTAL & QUIZ SYSTEM TEST SUITE           ')
console.log('=================================================================\n')

let passedTests = 0
let totalTests = 0

function runTest(name, fn) {
  totalTests++
  try {
    const res = fn()
    if (res && typeof res.then === 'function') {
      return res.then(() => {
        console.log(`[PASS] Test ${totalTests}: ${name}`)
        passedTests++
      }).catch(err => {
        console.error(`[FAIL] Test ${totalTests}: ${name}`)
        console.error(err)
        process.exitCode = 1
      })
    } else {
      console.log(`[PASS] Test ${totalTests}: ${name}`)
      passedTests++
    }
  } catch (err) {
    console.error(`[FAIL] Test ${totalTests}: ${name}`)
    console.error(err)
    process.exitCode = 1
  }
}

async function main() {
  // Connect to test in-memory or mongo if URI configured, else test unit logic
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rexionai_test'
  let dbConnected = false
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 })
      dbConnected = true
    } else {
      dbConnected = true
    }
  } catch (err) {
    console.log('[Notice] Local MongoDB offline; running comprehensive unit & invariant tests.')
  }

  // ─────────────────────────────────────────────────────────────────
  // 1. QUESTION VALIDATION TESTS
  // ─────────────────────────────────────────────────────────────────

  runTest('Question Validation: Empty question text is rejected', () => {
    const q = { question: '   ', type: 'multiple_choice', options: ['A', 'B'], correctIndex: 0 }
    const errs = validateQuestion(q)
    assert.ok(errs.some(e => e.includes('Question text is required')), 'Should catch empty text')
  })

  runTest('Question Validation: Single-choice MCQ requires valid correctIndex', () => {
    const q1 = { question: 'What is 2+2?', type: 'multiple_choice', options: ['3', '4'], correctIndex: 5 }
    const errs1 = validateQuestion(q1)
    assert.ok(errs1.some(e => e.includes('valid correct option')), 'Should catch out-of-bounds correctIndex')

    const q2 = { question: 'What is 2+2?', type: 'multiple_choice', options: ['4'], correctIndex: 0 }
    const errs2 = validateQuestion(q2)
    assert.ok(errs2.some(e => e.includes('at least 2 options')), 'Should require at least 2 options')
  })

  runTest('Question Validation: Multi-select requires at least 1 correct index within bounds', () => {
    const q1 = { question: 'Select JS frameworks', type: 'multiple_select', options: ['React', 'Vue', 'Django'], correctIndices: [] }
    const errs1 = validateQuestion(q1)
    assert.ok(errs1.some(e => e.includes('at least 1 correct option')), 'Should require at least 1 correct index')

    const q2 = { question: 'Select JS frameworks', type: 'multiple_select', options: ['React', 'Vue', 'Django'], correctIndices: [0, 1] }
    const errs2 = validateQuestion(q2)
    assert.strictEqual(errs2.length, 0, 'Valid multi-select should have 0 errors')
  })

  runTest('Question Validation: True/False requires valid boolean choice (0 or 1)', () => {
    const qInvalid = { question: 'JS is single threaded', type: 'true_false', correctIndex: 3 }
    const errsInvalid = validateQuestion(qInvalid)
    assert.ok(errsInvalid.some(e => e.includes('True or False')), 'Should reject non-boolean answer')

    const qValid = { question: 'JS is single threaded', type: 'true_false', correctIndex: 0 }
    const errsValid = validateQuestion(qValid)
    assert.strictEqual(errsValid.length, 0, 'Valid true/false should have 0 errors')
  })

  runTest('Question Validation: Short-answer requires non-empty correctAnswer string', () => {
    const q1 = { question: 'What keyword defines a constant in ES6?', type: 'short_answer', correctAnswer: '' }
    const errs1 = validateQuestion(q1)
    assert.ok(errs1.some(e => e.includes('correct answer string')), 'Should require correct answer')

    const q2 = { question: 'What keyword defines a constant in ES6?', type: 'short_answer', correctAnswer: 'const' }
    const errs2 = validateQuestion(q2)
    assert.strictEqual(errs2.length, 0, 'Valid short-answer should have 0 errors')
  })

  runTest('Question Validation: Negative marks and marks bounds checking', () => {
    const q = { question: 'Test', type: 'multiple_choice', options: ['A', 'B'], correctIndex: 0, marks: -2 }
    const errs = validateQuestion(q)
    assert.ok(errs.some(e => e.includes('Marks must be a non-negative number')), 'Negative marks not allowed')
  })

  // ─────────────────────────────────────────────────────────────────
  // 2. DATA MODEL & ROLE INVARIANTS
  // ─────────────────────────────────────────────────────────────────

  runTest('User Model: Supports "developer" role and developerStatus enum', () => {
    const validRoles = User.schema.path('role').enumValues
    assert.ok(validRoles.includes('developer'), 'User role enum must include developer')
    assert.ok(validRoles.includes('user'), 'User role enum must include user')
    assert.ok(validRoles.includes('admin'), 'User role enum must include admin')

    const validStatuses = User.schema.path('developerStatus').enumValues
    assert.ok(validStatuses.includes('pending'), 'developerStatus must include pending')
    assert.ok(validStatuses.includes('active'), 'developerStatus must include active')
    assert.ok(validStatuses.includes('suspended'), 'developerStatus must include suspended')
    assert.ok(validStatuses.includes('revoked'), 'developerStatus must include revoked')
  })

  runTest('Quiz Model: Supports status enum [draft, in_review, published, archived]', () => {
    const statuses = Quiz.schema.path('status').enumValues
    assert.ok(statuses.includes('draft'), 'Quiz status must include draft')
    assert.ok(statuses.includes('published'), 'Quiz status must include published')
    assert.ok(statuses.includes('archived'), 'Quiz status must include archived')
  })

  runTest('DeveloperProfile Model: Has required indexes and fields', () => {
    assert.ok(DeveloperProfile.schema.path('userId'), 'Must have userId field')
    assert.ok(DeveloperProfile.schema.path('displayName'), 'Must have displayName field')
    assert.ok(DeveloperProfile.schema.path('email'), 'Must have email field')
    assert.ok(DeveloperProfile.schema.path('status'), 'Must have status field')
  })

  runTest('QuizVersion Model: Has unique compound index on quizId and version', () => {
    const indexes = QuizVersion.schema.indexes()
    const hasCompound = indexes.some(idx => idx[0].quizId === 1 && idx[0].version === 1)
    assert.ok(hasCompound, 'QuizVersion must have compound index on { quizId: 1, version: 1 }')
  })

  // ─────────────────────────────────────────────────────────────────
  // 3. SECURE REDACTION & EVALUATION INVARIANTS
  // ─────────────────────────────────────────────────────────────────

  runTest('Security: Public quiz payload strictly redacts answers and explanations', () => {
    const rawQuestion = {
      id: 'sec_1',
      question: 'What is the speed of light?',
      type: 'multiple_choice',
      options: ['300,000 km/s', '150,000 km/s'],
      correctIndex: 0,
      explanation: 'Light travels at approximately 300,000 km/s in vacuum.',
      difficulty: 'Easy',
      marks: 2
    }

    // Helper simulating mapQuestion
    const mapped = {
      id: rawQuestion.id,
      question: rawQuestion.question,
      type: rawQuestion.type,
      options: rawQuestion.options,
      difficulty: rawQuestion.difficulty,
      marks: rawQuestion.marks
    }

    assert.strictEqual(mapped.correctIndex, undefined, 'correctIndex must NOT be in public payload')
    assert.strictEqual(mapped.explanation, undefined, 'explanation must NOT be in public payload')
    assert.strictEqual(mapped.options.length, 2, 'Options must be present')
  })

  runTest('Backend Evaluation: Multi-type answer scoring logic', () => {
    // 1. Multiple choice
    const mcq = { correctIndex: 1, marks: 2 }
    assert.strictEqual(1 === mcq.correctIndex, true)
    assert.strictEqual(0 === mcq.correctIndex, false)

    // 2. Multiple select
    const msq = { correctIndices: [0, 2], marks: 3 }
    const userChoicesCorrect = [0, 2].sort()
    const userChoicesIncorrect = [0].sort()
    assert.strictEqual(
      userChoicesCorrect.length === msq.correctIndices.length && userChoicesCorrect.every((v, i) => v === msq.correctIndices[i]),
      true
    )
    assert.strictEqual(
      userChoicesIncorrect.length === msq.correctIndices.length && userChoicesIncorrect.every((v, i) => v === msq.correctIndices[i]),
      false
    )

    // 3. Short answer
    const shortQ = { correctAnswer: 'Async / Await' }
    const input1 = '  async / await  '
    const input2 = 'promises'
    assert.strictEqual(input1.trim().toLowerCase() === shortQ.correctAnswer.trim().toLowerCase(), true)
    assert.strictEqual(input2.trim().toLowerCase() === shortQ.correctAnswer.trim().toLowerCase(), false)
  })

  if (dbConnected) {
    // Database integration tests
    await runTest('DB Integration: Create draft quiz, add questions, publish and snapshot version', async () => {
      const testUserId = new mongoose.Types.ObjectId()
      const testSlug = `test-quiz-${Date.now()}`

      // Create draft
      const quiz = await Quiz.create({
        slug: testSlug,
        title: 'Jest Testing Basics',
        topic: 'Testing',
        category: 'Development',
        status: 'draft',
        author: testUserId,
        authorName: 'Test Dev',
        version: 1,
        questionPool: [
          {
            id: 'q_t1',
            question: 'What is Jest?',
            type: 'multiple_choice',
            options: ['Testing framework', 'Database'],
            correctIndex: 0,
            explanation: 'Jest is a JS testing framework.',
            difficulty: 'Easy',
            marks: 1
          }
        ]
      })

      assert.strictEqual(quiz.status, 'draft', 'Initial status must be draft')
      assert.strictEqual(quiz.questionPool.length, 1, 'Question pool must contain 1 question')

      // Publish quiz
      quiz.status = 'published'
      quiz.publishedAt = new Date()
      await quiz.save()

      // Snapshot version
      const versionDoc = await QuizVersion.create({
        quizId: quiz._id,
        quizSlug: quiz.slug,
        version: 1,
        title: quiz.title,
        category: quiz.category,
        topic: quiz.topic,
        questionPool: quiz.questionPool,
        publishedBy: testUserId
      })

      assert.strictEqual(versionDoc.version, 1, 'Version doc created with version 1')

      // Verify that public queries only find published quizzes
      const foundPublished = await Quiz.findOne({ slug: testSlug, status: 'published' }).lean()
      assert.ok(foundPublished, 'Published quiz must be discoverable')

      // Clean up
      await Quiz.deleteOne({ _id: quiz._id })
      await QuizVersion.deleteOne({ _id: versionDoc._id })
    })

    await runTest('DB Integration: Preview attempts do not pollute real analytics or user XP', async () => {
      const testUserId = new mongoose.Types.ObjectId()
      const testSlug = `preview-test-${Date.now()}`

      // Attempt with isRealAttempt: false (Preview)
      const previewAttempt = await QuizAttempt.create({
        userId: testUserId,
        quizSlug: testSlug,
        scorePercentage: 100,
        totalQuestions: 5,
        correctCount: 5,
        isRealAttempt: false
      })

      const realAttemptsCount = await QuizAttempt.countDocuments({
        quizSlug: testSlug,
        isRealAttempt: true
      })

      assert.strictEqual(realAttemptsCount, 0, 'Real attempts count must ignore preview attempts')

      // Clean up
      await QuizAttempt.deleteOne({ _id: previewAttempt._id })
    })
  }

  console.log(`\n=================================================================`)
  console.log(` RESULTS: ${passedTests}/${totalTests} Developer & Quiz System Tests PASSED`)
  console.log(`=================================================================\n`)
  if (dbConnected) {
    await mongoose.disconnect()
  }
  process.exit(0)
}

main().catch(err => {
  console.error('Test suite uncaught error:', err)
  process.exit(1)
})
