/**
 * verify-permissions-live.mjs
 * Live HTTP API verification of faculty authorization boundaries.
 */

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
  console.log('       LIVE FACULTY AUTHORIZATION & PERMISSION TESTS             ')
  console.log('=================================================================\n')

  const timestamp = Date.now()
  const teacherAEmail = `teacher_a_${timestamp}@university.edu`
  const teacherBEmail = `teacher_b_${timestamp}@university.edu`

  // 1. Register Teacher A (Faculty)
  console.log('1. Registering Teacher A (Faculty)...')
  const regA = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Professor Alice Smith',
      email: teacherAEmail,
      password: 'StrongPassword123!',
      accountType: 'faculty'
    })
  })
  if (regA.status !== 201) {
    throw new Error(`Teacher A registration failed: ${JSON.stringify(regA.data)}`)
  }
  const tokenA = regA.data.token
  console.log('   ✓ Teacher A registered. Role:', regA.data.user?.role, 'Status:', regA.data.user?.facultyStatus)

  // 2. Teacher A creates a draft quiz
  console.log('\n2. Teacher A creating a draft quiz...')
  const createQuizRes = await request('/faculty/quizzes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      title: 'Advanced Operating Systems Test Quiz',
      topic: 'Operating Systems',
      category: 'Development',
      difficulty: 'Hard',
      initialQuestions: [
        {
          question: 'What is a deadlock condition?',
          type: 'multiple_choice',
          options: ['Mutual Exclusion', 'Hold and Wait', 'No Preemption', 'All of the above'],
          correctIndex: 3,
          explanation: 'Coffman conditions specify all four criteria are required for deadlock.'
        }
      ]
    })
  })
  if (createQuizRes.status !== 201) {
    throw new Error(`Draft quiz creation failed: ${JSON.stringify(createQuizRes.data)}`)
  }
  const quizId = createQuizRes.data.quiz._id
  console.log('   ✓ Quiz created with ID:', quizId, 'Status:', createQuizRes.data.quiz.status)

  // 3. Test: Unverified Teacher A tries to publish quiz directly via API
  console.log('\n3. Security Guard Test: Unverified Teacher A attempts direct publish...')
  const publishRes = await request(`/faculty/quizzes/${quizId}/publish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` }
  })
  console.log('   Response Status:', publishRes.status)
  console.log('   Response Code:', publishRes.data?.code)
  console.log('   Response Message:', publishRes.data?.message)

  if (publishRes.status === 403 && publishRes.data?.code === 'UNVERIFIED_FACULTY') {
    console.log('   [PASS] Direct publish blocked! Unverified faculty cannot publish quizzes.')
  } else {
    throw new Error(`SECURITY VULNERABILITY: Unverified faculty was allowed to publish or received unexpected status: ${publishRes.status}`)
  }

  // 4. Register Teacher B (Another faculty member)
  console.log('\n4. Registering Teacher B (Another Faculty Member)...')
  const regB = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Professor Bob Jones',
      email: teacherBEmail,
      password: 'StrongPassword123!',
      accountType: 'faculty'
    })
  })
  const tokenB = regB.data.token
  console.log('   ✓ Teacher B registered.')

  // 5. Test: Teacher B attempts to edit Teacher A's quiz
  console.log('\n5. Cross-Tenant IDOR Test: Teacher B attempts to EDIT Teacher A\'s quiz...')
  const editRes = await request(`/faculty/quizzes/${quizId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenB}` },
    body: JSON.stringify({ title: 'Tampered by Teacher B' })
  })
  console.log('   Response Status:', editRes.status)
  console.log('   Response Message:', editRes.data?.message)
  if (editRes.status === 403) {
    console.log('   [PASS] Edit blocked! One teacher cannot edit another teacher\'s quiz.')
  } else {
    throw new Error(`SECURITY VULNERABILITY: Teacher B was able to modify Teacher A's quiz! Status: ${editRes.status}`)
  }

  // 6. Test: Teacher B attempts to delete Teacher A's quiz
  console.log('\n6. Cross-Tenant IDOR Test: Teacher B attempts to DELETE Teacher A\'s quiz...')
  const deleteRes = await request(`/faculty/quizzes/${quizId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenB}` }
  })
  console.log('   Response Status:', deleteRes.status)
  if (deleteRes.status === 403) {
    console.log('   [PASS] Deletion blocked! One teacher cannot delete another teacher\'s quiz.')
  } else {
    throw new Error(`SECURITY VULNERABILITY: Teacher B was able to delete Teacher A's quiz! Status: ${deleteRes.status}`)
  }

  // 7. Test: Teacher B attempts to access Teacher A's quiz analytics
  console.log('\n7. Privacy Test: Teacher B attempts to access Teacher A\'s quiz ANALYTICS...')
  const analyticsRes = await request(`/faculty/quizzes/${quizId}/analytics`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenB}` }
  })
  console.log('   Response Status:', analyticsRes.status)
  if (analyticsRes.status === 403) {
    console.log('   [PASS] Analytics access blocked! One teacher cannot access another teacher\'s analytics.')
  } else {
    throw new Error(`SECURITY VULNERABILITY: Teacher B was able to view Teacher A's analytics! Status: ${analyticsRes.status}`)
  }

  console.log('\n=================================================================')
  console.log(' ALL FACULTY PERMISSION & CROSS-TENANT TESTS PASSED (100%)       ')
  console.log('=================================================================\n')
}

run().catch((err) => {
  console.error('\n❌ Test execution failure:', err)
  process.exit(1)
})
