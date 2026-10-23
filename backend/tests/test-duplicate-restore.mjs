import assert from 'assert'

const API_BASE = 'http://localhost:5000/api'

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const res = await fetch(url, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

async function testDuplicateAndRestore() {
  console.log('Testing Duplicate and Restore Workflows on Faculty and Developer portals...')
  const timestamp = Date.now()

  // 1. Register a verified faculty user
  const regFac = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Dr. Turing Duplicate Test',
      email: `turing_${timestamp}@test.edu`,
      password: 'StrongPassword123!',
      accountType: 'faculty'
    })
  })
  assert.strictEqual(regFac.status, 201)
  const token = regFac.data.token

  // 2. Create a faculty quiz
  const createRes = await request('/faculty/quizzes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      title: 'Turing Machines and Decidability',
      topic: 'Computation Theory',
      category: 'Development',
      difficulty: 'Hard',
      initialQuestions: [
        {
          question: 'Is the Halting Problem decidable?',
          type: 'true_false',
          correctIndex: 1, // False
          explanation: 'Turing proved in 1936 that the halting problem is undecidable on Turing machines.'
        }
      ]
    })
  })
  assert.strictEqual(createRes.status, 201)
  const quizId = createRes.data.quiz._id
  console.log('✓ Created initial quiz:', createRes.data.quiz.title, 'Status:', createRes.data.quiz.status)

  // 3. Duplicate quiz
  const dupRes = await request(`/faculty/quizzes/${quizId}/duplicate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  })
  assert.strictEqual(dupRes.status, 201)
  assert.strictEqual(dupRes.data.quiz.status, 'draft')
  assert.strictEqual(dupRes.data.quiz.questionsCount, 1)
  assert.notStrictEqual(dupRes.data.quiz._id, quizId)
  assert.notStrictEqual(dupRes.data.quiz.slug, createRes.data.quiz.slug)
  console.log('✓ Successfully duplicated quiz:', dupRes.data.quiz.title, 'New ID:', dupRes.data.quiz._id)

  // 4. Archive initial quiz
  const archRes = await request(`/faculty/quizzes/${quizId}/archive`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  })
  assert.strictEqual(archRes.status, 200)
  assert.strictEqual(archRes.data.quiz.status, 'archived')
  console.log('✓ Successfully archived quiz:', quizId)

  // 5. Restore archived quiz
  const restoreRes = await request(`/faculty/quizzes/${quizId}/restore`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  })
  assert.strictEqual(restoreRes.status, 200)
  assert.strictEqual(restoreRes.data.quiz.status, 'draft')
  console.log('✓ Successfully restored archived quiz to draft:', quizId)

  console.log('\nALL DUPLICATE & RESTORE TESTS PASSED (100%)!')
}

testDuplicateAndRestore().catch(err => {
  console.error('Test failed:', err)
  process.exit(1)
})
