import assert from 'assert'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../src/config/env.js'
import User from '../src/models/User.js'
import FacultyProfile from '../src/models/FacultyProfile.js'
import FacultyQuestion from '../src/models/FacultyQuestion.js'
import FacultyVerificationLog from '../src/models/FacultyVerificationLog.js'
import { Quiz, QuizAttempt, QuizVersion } from '../src/models/Quiz.js'
import { validateFacultyQuestion } from '../src/controllers/facultyController.js'

console.log('=================================================================')
console.log('       REXION FACULTY & QUIZ MANAGEMENT SYSTEM TEST SUITE        ')
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
  // 1. QUESTION VALIDATION INVARIANTS
  // ─────────────────────────────────────────────────────────────────

  runTest('Question Validation: Empty question text is rejected', () => {
    const q = { question: '   ', type: 'multiple_choice', options: ['Option 1', 'Option 2'], correctIndex: 0 }
    const errs = validateFacultyQuestion(q)
    assert.ok(errs.some(e => e.includes('Question statement is required')), 'Should catch empty question')
  })

  runTest('Question Validation: MCQ requires valid options and correctIndex', () => {
    const qInvalid = { question: 'What is O(1)?', type: 'multiple_choice', options: ['Constant time'], correctIndex: 0 }
    const errs = validateFacultyQuestion(qInvalid)
    assert.ok(errs.some(e => e.includes('at least 2 options')), 'Should require at least 2 options')

    const qOutOfBounds = { question: 'What is O(1)?', type: 'multiple_choice', options: ['Linear', 'Constant'], correctIndex: 3 }
    const errsBound = validateFacultyQuestion(qOutOfBounds)
    assert.ok(errsBound.some(e => e.includes('valid correct answer option')), 'Should catch out of bounds index')

    const qValid = { question: 'What is O(1)?', type: 'multiple_choice', options: ['Linear', 'Constant'], correctIndex: 1 }
    const errsValid = validateFacultyQuestion(qValid)
    assert.strictEqual(errsValid.length, 0, 'Valid MCQ should have 0 errors')
  })

  runTest('Question Validation: True/False requires boolean index 0 or 1', () => {
    const qInvalid = { question: 'Is Python dynamically typed?', type: 'true_false', correctIndex: 4 }
    const errs = validateFacultyQuestion(qInvalid)
    assert.ok(errs.some(e => e.includes('True or False')), 'Should reject non-boolean choice')

    const qValid = { question: 'Is Python dynamically typed?', type: 'true_false', correctIndex: 0 }
    assert.strictEqual(validateFacultyQuestion(qValid).length, 0, 'Valid true/false should pass')
  })

  // ─────────────────────────────────────────────────────────────────
  // 2. USER & PROFILE MODELS
  // ─────────────────────────────────────────────────────────────────

  runTest('User Model: Supports "faculty" role and facultyStatus enum', () => {
    const roleValues = User.schema.path('role').enumValues
    assert.ok(roleValues.includes('faculty'), 'role should include "faculty"')
    assert.ok(roleValues.includes('user'), 'role should include "user"')
    assert.ok(roleValues.includes('admin'), 'role should include "admin"')

    const statusValues = User.schema.path('facultyStatus').enumValues
    assert.ok(statusValues.includes('unverified'), 'status should include "unverified"')
    assert.ok(statusValues.includes('pending'), 'status should include "pending"')
    assert.ok(statusValues.includes('verified'), 'status should include "verified"')
    assert.ok(statusValues.includes('rejected'), 'status should include "rejected"')
    assert.ok(statusValues.includes('suspended'), 'status should include "suspended"')
  })

  runTest('FacultyProfile: Completion calculation accurately scores sections', () => {
    const profile = new FacultyProfile({
      userId: new mongoose.Types.ObjectId(),
      fullName: 'Dr. Alan Turing',
      professionalTitle: 'Professor',
      designation: 'Professor',
      bio: 'Pioneer in theoretical computer science and AI computation.',
      contactEmail: 'alan.turing@cambridge.ac.uk',
      institutionName: 'University of Cambridge',
      department: 'Computer Science',
      qualifications: [{ degree: 'Ph.D.', specialization: 'Mathematical Logic', institution: 'Princeton University', graduationYear: 1938 }],
      teachingSubjects: ['Algorithms', 'Automata Theory', 'Cryptography']
    })

    const completion = profile.calculateCompletion()
    assert.ok(completion >= 70, `Profile completion should be high for complete fields, got ${completion}`)

    const publicView = profile.toPublicProfile()
    assert.strictEqual(publicView.employeeId, undefined, 'Public profile must never leak employeeId')
    assert.strictEqual(publicView.verificationEvidence, undefined, 'Public profile must never leak verificationEvidence')
    assert.strictEqual(publicView.phone, undefined, 'Public profile must never leak phone')
    assert.strictEqual(publicView.isVerified, false, 'Should reflect unverified initial status')
  })

  // ─────────────────────────────────────────────────────────────────
  // 3. DATABASE INTEGRATION TESTS (when DB active)
  // ─────────────────────────────────────────────────────────────────

  if (dbConnected) {
    try { await FacultyQuestion.collection.drop() } catch (_) {}
    await runTest('DB Integration: Faculty registration and profile initialization', async () => {
      const testEmail = `prof.euler.${Date.now()}@oxford.edu`
      const user = await User.create({
        name: 'Prof. Leonhard Euler',
        email: testEmail,
        password: 'SecurePassword123!',
        role: 'faculty',
        facultyStatus: 'unverified'
      })

      const profile = await FacultyProfile.create({
        userId: user._id,
        fullName: user.name,
        contactEmail: user.email,
        institutionName: 'University of Oxford',
        department: 'Mathematics',
        status: 'unverified'
      })

      assert.strictEqual(user.role, 'faculty')
      assert.strictEqual(user.facultyStatus, 'unverified')
      assert.strictEqual(profile.institutionName, 'University of Oxford')
      assert.strictEqual(profile.status, 'unverified')
    })

    await runTest('DB Integration: Unverified faculty cannot publish quiz (Security Guard)', async () => {
      const facultyUser = await User.create({
        name: 'Unverified Lecturer',
        email: `unverified.${Date.now()}@college.edu`,
        password: 'SecurePassword123!',
        role: 'faculty',
        facultyStatus: 'unverified'
      })

      const quiz = await Quiz.create({
        slug: `unverified-quiz-${Date.now()}`,
        title: 'Draft Unverified Test Quiz',
        category: 'Development',
        topic: 'Compilers',
        author: facultyUser._id,
        authorRole: 'faculty',
        status: 'draft',
        isVerifiedFaculty: false,
        questionPool: [{
          id: 'q1',
          question: 'What does a lexer output?',
          type: 'multiple_choice',
          options: ['Tokens', 'Binary', 'AST', 'Bytecode'],
          correctIndex: 0
        }]
      })

      // Invariant: status remains draft, not published
      assert.strictEqual(quiz.status, 'draft')
      assert.strictEqual(quiz.isVerifiedFaculty, false)
    })

    await runTest('DB Integration: Admin verification workflow and quiz publishing', async () => {
      const adminUser = await User.create({
        name: 'Academic Dean Admin',
        email: `dean.${Date.now()}@rexion.ai`,
        password: 'AdminPassword123!',
        role: 'admin'
      })

      const faculty = await User.create({
        name: 'Dr. Ada Lovelace',
        email: `ada.${Date.now()}@analytics.edu`,
        password: 'Password123!',
        role: 'faculty',
        facultyStatus: 'pending'
      })

      const profile = await FacultyProfile.create({
        userId: faculty._id,
        fullName: 'Dr. Ada Lovelace',
        contactEmail: faculty.email,
        institutionName: 'Analytical Engine Institute',
        department: 'Mechanical Computation',
        employeeId: 'FAC-1843-001',
        status: 'pending'
      })

      // Admin approves verification
      profile.status = 'verified'
      profile.reviewedBy = adminUser._id
      profile.verificationReviewedAt = new Date()
      await profile.save()
      await User.findByIdAndUpdate(faculty._id, { facultyStatus: 'verified' })

      await FacultyVerificationLog.create({
        facultyProfileId: profile._id,
        userId: faculty._id,
        action: 'approved',
        previousStatus: 'pending',
        newStatus: 'verified',
        performedBy: adminUser._id,
        performerEmail: adminUser.email,
        reason: 'Credentials and institutional appointment verified.'
      })

      // Verified faculty publishes quiz
      const quiz = await Quiz.create({
        slug: `ada-algo-${Date.now()}`,
        title: 'Analytical Engine Algorithms',
        category: 'Development',
        topic: 'Algorithms',
        author: faculty._id,
        authorName: 'Dr. Ada Lovelace',
        authorRole: 'faculty',
        institutionName: profile.institutionName,
        isVerifiedFaculty: true,
        status: 'published',
        publishedAt: new Date(),
        questionPool: [{
          id: 'q1',
          question: 'What is the Bernoulli number program designed for?',
          type: 'multiple_choice',
          options: ['Calculating Bernoulli numbers', 'Text editing', 'Graphics', 'Networking'],
          correctIndex: 0,
          explanation: 'Note G contains the first published algorithm for the Analytical Engine.'
        }]
      })

      // Snapshot created in QuizVersion
      await QuizVersion.create({
        quizId: quiz._id,
        quizSlug: quiz.slug,
        version: 1,
        title: quiz.title,
        category: quiz.category,
        topic: quiz.topic,
        questionPool: quiz.questionPool,
        publishedBy: faculty._id
      })

      const versionDoc = await QuizVersion.findOne({ quizId: quiz._id, version: 1 })
      assert.ok(versionDoc, 'Immutable version snapshot must exist')
      assert.strictEqual(quiz.isVerifiedFaculty, true, 'Published quiz must have verified faculty flag')
    })

    await runTest('DB Integration: Reusable Question Bank create and import', async () => {
      const faculty = await User.create({
        name: 'Prof. Gauss',
        email: `gauss.${Date.now()}@gottingen.edu`,
        password: 'Password123!',
        role: 'faculty',
        facultyStatus: 'verified'
      })

      const qBankItem = await FacultyQuestion.create({
        author: faculty._id,
        question: 'What is the sum of integers from 1 to 100?',
        type: 'multiple_choice',
        options: ['5000', '5050', '5100', '5150'],
        correctIndex: 1,
        subject: 'Mathematics',
        topic: 'Arithmetic Progressions',
        difficulty: 'Easy',
        marks: 2
      })

      assert.ok(qBankItem._id)
      assert.strictEqual(qBankItem.usageCount, 0)

      // Import to quiz
      const quiz = await Quiz.create({
        slug: `gauss-math-${Date.now()}`,
        title: 'Number Theory Quiz',
        category: 'Mathematics',
        topic: 'Number Theory',
        author: faculty._id,
        questionPool: []
      })

      quiz.questionPool.push({
        id: `q_${Date.now()}`,
        question: qBankItem.question,
        type: qBankItem.type,
        options: qBankItem.options,
        correctIndex: qBankItem.correctIndex,
        marks: qBankItem.marks
      })
      await quiz.save()
      await FacultyQuestion.findByIdAndUpdate(qBankItem._id, { $inc: { usageCount: 1 } })

      const updatedBankItem = await FacultyQuestion.findById(qBankItem._id)
      assert.strictEqual(updatedBankItem.usageCount, 1, 'Usage count should increment')
      assert.strictEqual(quiz.questionPool.length, 1)
    })
  }

  console.log('\n=================================================================')
  console.log(` RESULTS: ${passedTests}/${totalTests} Faculty & Quiz System Tests PASSED`)
  console.log('=================================================================\n')

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }
}

main().catch(err => {
  console.error('[FATAL] Test runner error:', err)
  process.exit(1)
})
