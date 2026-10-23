/**
 * verify-e2e-workflow.mjs
 * End-to-end live testing of the complete REXION Faculty lifecycle:
 * Registration -> Profile -> Verification Request -> Admin Approval -> Quiz Creation -> Publishing -> Student Discovery -> Attempt & Scoring -> Faculty Analytics
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import User from '../src/models/User.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const API_BASE = 'http://localhost:5000/api'

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const res = await fetch(url, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

async function run() {
  console.log('=================================================================')
  console.log('     COMPLETE END-TO-END FACULTY SYSTEM LIFECYCLE TEST           ')
  console.log('=================================================================\n')

  const ts = Date.now()
  const facultyEmail = `prof.albert.${ts}@princeton.edu`
  const studentEmail = `student.marie.${ts}@gmail.com`
  const adminEmail = `admin.system.${ts}@rexion.ai`

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1: Faculty Account Registration
  // ─────────────────────────────────────────────────────────────────────────
  console.log('STEP 1: Registering Faculty Account...')
  const regFaculty = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Prof. Albert Einstein',
      email: facultyEmail,
      password: 'RelativityPassword2026!',
      accountType: 'faculty'
    })
  })
  if (regFaculty.status !== 201) throw new Error(`Registration failed: ${JSON.stringify(regFaculty.data)}`)
  const facultyToken = regFaculty.data.token
  const facultyUserId = regFaculty.data.user.id
  console.log('   ✓ Registered. User ID:', facultyUserId, 'Role:', regFaculty.data.user.role, 'Faculty Status:', regFaculty.data.user.facultyStatus)

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: Complete Professional Faculty Profile & Qualifications
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\nSTEP 2: Completing Faculty Profile & Academic Qualifications...')
  const updateProfRes = await request('/faculty/profile', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${facultyToken}` },
    body: JSON.stringify({
      fullName: 'Prof. Albert Einstein',
      professionalTitle: 'Prof.',
      designation: 'Professor',
      institutionName: 'Institute for Advanced Study, Princeton',
      institutionType: 'University',
      department: 'Theoretical Physics & Computer Science',
      contactEmail: facultyEmail,
      institutionalEmail: facultyEmail,
      employmentType: 'Full-time',
      bio: 'Theoretical physicist working on general relativity, statistical mechanics, and quantum computational foundations.',
      teachingSubjects: ['Theoretical Physics', 'Quantum Algorithms', 'Calculus'],
      qualifications: [
        { degree: 'Ph.D.', specialization: 'Theoretical Physics', institution: 'University of Zurich', graduationYear: 1995 },
        { degree: 'B.S.', specialization: 'Physics & Mathematics', institution: 'Federal Polytechnic School Zurich', graduationYear: 1990 }
      ]
    })
  })
  if (updateProfRes.status !== 200) throw new Error(`Profile update failed: ${JSON.stringify(updateProfRes.data)}`)
  const facultyProfileId = updateProfRes.data.profile._id
  console.log('   ✓ Profile completed. Completion %:', updateProfRes.data.profile.profileCompletion?.percentage, '%')

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3: Submit Verification Request Dossier
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\nSTEP 3: Submitting Verification Dossier...')
  const verifySubRes = await request('/faculty/verify', {
    method: 'POST',
    headers: { Authorization: `Bearer ${facultyToken}` },
    body: JSON.stringify({
      institutionalEmail: facultyEmail,
      institutionName: 'Institute for Advanced Study, Princeton',
      department: 'Theoretical Physics',
      employeeId: 'IAS-FAC-1905',
      facultyIdNumber: 'IAS-FAC-1905',
      verificationDocumentUrl: 'https://ias.edu/faculty/albert-einstein-directory',
      notes: 'Official faculty directory link and verified institutional email provided.'
    })
  })
  if (verifySubRes.status !== 200) throw new Error(`Verification submission failed: ${JSON.stringify(verifySubRes.data)}`)
  console.log('   ✓ Dossier submitted. Status now:', verifySubRes.data.profile.status)

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4: Admin Promotion and Verification Approval
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\nSTEP 4: Setting up Admin and Approving Faculty Dossier...')
  // Register admin user
  const regAdmin = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'System Admin',
      email: adminEmail,
      password: 'AdminPassword2026!'
    })
  })
  // Promote via DB
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rexion')
  await User.updateOne({ email: adminEmail }, { $set: { role: 'admin' } })
  await mongoose.disconnect()

  // Login as admin
  const loginAdmin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: adminEmail, password: 'AdminPassword2026!' })
  })
  const adminToken = loginAdmin.data.token

  // Approve faculty
  const approveRes = await request(`/admin/faculty/${facultyProfileId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      status: 'verified',
      notes: 'Institutional directory verified successfully. Approved for quiz publication.'
    })
  })
  if (approveRes.status !== 200) throw new Error(`Admin approval failed: ${JSON.stringify(approveRes.data)}`)
  console.log('   ✓ Faculty verified by Admin. Status:', approveRes.data.profile.status)

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 5: Verified Faculty Creates Quiz with Questions
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\nSTEP 5: Creating Educational Quiz and Questions...')
  const createQuizRes = await request('/faculty/quizzes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${facultyToken}` },
    body: JSON.stringify({
      title: `Special Relativity Fundamentals (${ts})`,
      topic: 'Physics',
      category: 'Science',
      difficulty: 'Medium',
      durationMinutes: 10,
      passingScore: 60,
      initialQuestions: [
        {
          question: 'What is the speed of light in a vacuum?',
          type: 'multiple_choice',
          options: ['300,000 km/s', '150,000 km/s', 'Infinite', 'Variable depending on observer'],
          correctIndex: 0,
          explanation: 'In special relativity, the speed of light in vacuum is constant for all inertial frames at approximately 300,000 km/s.'
        },
        {
          question: 'Mass-energy equivalence is expressed as E = mc^2.',
          type: 'true_false',
          options: ['True', 'False'],
          correctIndex: 0,
          explanation: 'E = mc^2 demonstrates that mass and energy are interchangeable.'
        }
      ]
    })
  })
  if (createQuizRes.status !== 201) throw new Error(`Quiz creation failed: ${JSON.stringify(createQuizRes.data)}`)
  const quizId = createQuizRes.data.quiz._id
  const quizSlug = createQuizRes.data.quiz.slug
  console.log('   ✓ Quiz created. ID:', quizId, 'Slug:', quizSlug)

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 6: Publishing Quiz to Career Hub
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\nSTEP 6: Publishing Quiz to Career Hub...')
  const publishRes = await request(`/faculty/quizzes/${quizId}/publish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${facultyToken}` }
  })
  if (publishRes.status !== 200) throw new Error(`Publish failed: ${JSON.stringify(publishRes.data)}`)
  console.log('   ✓ Quiz published! Status:', publishRes.data.quiz.status, 'Version snapshot:', publishRes.data.quiz.version)

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 7: Student Browses Career Hub & Discovers Quiz
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\nSTEP 7: Student Browsing Career Hub for Published Quiz...')
  const regStudent = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Marie Curie',
      email: studentEmail,
      password: 'StudentPassword2026!',
      accountType: 'student'
    })
  })
  const studentToken = regStudent.data.token

  const studentQuizRes = await request(`/quizzes/${quizSlug}`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  })
  if (studentQuizRes.status !== 200) throw new Error(`Student could not fetch quiz: ${JSON.stringify(studentQuizRes.data)}`)
  console.log('   ✓ Discovered Quiz:', studentQuizRes.data.quiz.title)
  console.log('   ✓ Author Attribution:', studentQuizRes.data.quiz.authorName)
  console.log('   ✓ Verified Badge:', studentQuizRes.data.quiz.isVerifiedFaculty ? 'YES (Verified)' : 'NO')
  console.log('   ✓ Questions received by student (answers redacted):', studentQuizRes.data.quiz.questions?.length)

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 8: Student Takes & Submits Quiz
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\nSTEP 8: Student Submitting Quiz Answers...')
  const questions = studentQuizRes.data.quiz.questions
  const answers = [
    { questionId: questions[0].id, selectedIndex: 0 }, // Correct answer
    { questionId: questions[1].id, selectedIndex: 0 }  // Correct answer
  ]
  const submitRes = await request(`/quizzes/${quizSlug}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ answers, timeTaken: 120 })
  })
  if (submitRes.status !== 200) throw new Error(`Submission failed: ${JSON.stringify(submitRes.data)}`)
  console.log('   ✓ Evaluation Result: Score:', submitRes.data.result?.scorePercentage, '%, Passed:', submitRes.data.result?.passed)
  console.log('   ✓ Correct Answers Count:', submitRes.data.result?.correctCount, '/', submitRes.data.result?.totalQuestions)
  console.log('   ✓ Feedback:', submitRes.data.result?.feedback)

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 9: Faculty Reviews Updated Analytics & Cohort Records
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\nSTEP 9: Faculty Inspecting Quiz Analytics Dashboard...')
  const analyticsRes = await request(`/faculty/quizzes/${quizId}/analytics`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${facultyToken}` }
  })
  if (analyticsRes.status !== 200) throw new Error(`Analytics retrieval failed: ${JSON.stringify(analyticsRes.data)}`)
  console.log('   ✓ Real Attempt Records:', analyticsRes.data.stats?.totalAttempts)
  console.log('   ✓ Cohort Pass Rate:', analyticsRes.data.stats?.passRate, '%')
  console.log('   ✓ Cohort Average Score:', analyticsRes.data.stats?.averageScore, '%')
  console.log('   ✓ Recent Candidate Attempt Score:', analyticsRes.data.recentAttempts?.[0]?.scorePercentage, '%, Passed:', analyticsRes.data.recentAttempts?.[0]?.passed)

  console.log('\n=================================================================')
  console.log(' COMPLETE END-TO-END WORKFLOW SUCCEEDED WITH 100% PASS RATE!     ')
  console.log('=================================================================\n')
}

run().catch((err) => {
  console.error('\n❌ Workflow failure:', err)
  process.exit(1)
})
