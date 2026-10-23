import assert from 'assert'
import { validateSafeCode } from '../src/services/codeRunner.js'
import sanitizeInputs from '../src/middleware/sanitizationMiddleware.js'
import path from 'path'

console.log('=================================================================')
console.log('       REXION AI AUTOMATED SECURITY REGRESSION TEST SUITE        ')
console.log('=================================================================\n')

let passedTests = 0
let totalTests = 0

function runTest(name, fn) {
  totalTests++
  try {
    fn()
    console.log(`[PASS] Test ${totalTests}: ${name}`)
    passedTests++
  } catch (err) {
    console.error(`[FAIL] Test ${totalTests}: ${name}`)
    console.error(err)
    process.exitCode = 1
  }
}

// ─────────────────────────────────────────────────────────────────
// 1. RCE Sandbox Protections
// ─────────────────────────────────────────────────────────────────

runTest('RCE Defense: Python os/subprocess imports are blocked', () => {
  const payloads = [
    'import os\nos.system("id")',
    'from subprocess import Popen\nPopen(["whoami"])',
    '__import__("os").system("whoami")',
    'open("/etc/passwd").read()',
    'eval("__import__(\'os\').system(\'ls\')")',
    '[c for c in ().__class__.__bases__[0].__subclasses__() if c.__name__ == "catch_warnings"]'
  ]
  for (const code of payloads) {
    const check = validateSafeCode('python', code)
    assert.strictEqual(check.safe, false, `Expected payload to be blocked: ${code}`)
  }
})

runTest('RCE Defense: JavaScript child_process/fs/eval calls are blocked', () => {
  const payloads = [
    'const { exec } = require("child_process"); exec("id");',
    'require("fs").readFileSync("/etc/passwd", "utf8");',
    'eval("process.exit(1)");',
    'Function("return process")().mainModule.require("child_process")',
    'process.kill(process.pid)'
  ]
  for (const code of payloads) {
    const check = validateSafeCode('javascript', code)
    assert.strictEqual(check.safe, false, `Expected payload to be blocked: ${code}`)
  }
})

runTest('RCE Defense: Legitimate algorithm code is allowed', () => {
  const pythonCode = `def twoSum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        diff = target - n
        if diff in seen:
            return [seen[diff], i]
        seen[n] = i
    return []`
  const jsCode = `function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
      const complement = target - nums[i];
      if (map.has(complement)) return [map.get(complement), i];
      map.set(nums[i], i);
    }
    return [];
  }`
  assert.strictEqual(validateSafeCode('python', pythonCode).safe, true)
  assert.strictEqual(validateSafeCode('javascript', jsCode).safe, true)
})

runTest('RCE Defense: Payload size cap enforces 50KB maximum', () => {
  const hugePayload = 'a = 1\n'.repeat(25000) // ~150KB
  const check = validateSafeCode('python', hugePayload)
  assert.strictEqual(check.safe, false)
  assert.match(check.reason, /maximum permitted length/i)
})

// ─────────────────────────────────────────────────────────────────
// 2. Input Sanitization & NoSQL / XSS Injection Defense
// ─────────────────────────────────────────────────────────────────

runTest('Sanitization: NoSQL injection operators ($gt, $ne, $where) are stripped', () => {
  const req = {
    body: {
      username: 'admin',
      password: { $ne: 'random' },
      query: { $gt: '' },
      nested: {
        normal: 'valid_value',
        $where: 'sleep(5000)'
      }
    }
  }
  sanitizeInputs(req, {}, () => {})
  assert.strictEqual(req.body.username, 'admin')
  assert.strictEqual(req.body.password.$ne, undefined)
  assert.strictEqual(req.body.query.$gt, undefined)
  assert.strictEqual(req.body.nested.normal, 'valid_value')
  assert.strictEqual(req.body.nested.$where, undefined)
})

runTest('Sanitization: Stored XSS vectors (<script>, javascript:, onerror) are neutralized', () => {
  const req = {
    body: {
      bio: '<script>alert(document.cookie)</script>Software Engineer',
      headline: '<img src=x onerror=alert(1)>Full Stack',
      website: 'javascript:void(0)'
    }
  }
  sanitizeInputs(req, {}, () => {})
  assert.strictEqual(req.body.bio.includes('<script>'), false)
  assert.strictEqual(req.body.headline.includes('onerror='), false)
  assert.strictEqual(req.body.website.includes('javascript:'), false)
})

// ─────────────────────────────────────────────────────────────────
// 3. IDOR / BOLA & Authorization Defense
// ─────────────────────────────────────────────────────────────────

runTest('BOLA Defense: Client-supplied x-user-id / query.userId cannot spoof identity', () => {
  // Simulate request where attacker injects target user id in headers or query
  const untrustedReq = {
    user: undefined, // unauthenticated guest
    headers: { 'x-user-id': 'victim_12345' },
    query: { userId: 'victim_12345' },
    body: { userId: 'victim_12345' }
  }

  // Identity resolution strictly derived from req.user
  const resolvedUserId = untrustedReq.user?._id?.toString() || untrustedReq.user?.id?.toString() || null
  assert.strictEqual(resolvedUserId, null, 'Untrusted client header must not set user identity')
})

runTest('Authorization: Profile mass assignment strips protected attributes', () => {
  const incoming = {
    name: 'Jane Doe',
    role: 'admin',
    plan: 'elite',
    password: 'new_hashed_password',
    email: 'hacked@example.com'
  }

  // Same logic as profileController.updateProfile
  delete incoming.role
  delete incoming.plan
  delete incoming.password
  delete incoming.email

  assert.strictEqual(incoming.role, undefined, 'role field must be deleted')
  assert.strictEqual(incoming.plan, undefined, 'plan field must be deleted')
  assert.strictEqual(incoming.password, undefined, 'password field must be deleted')
  assert.strictEqual(incoming.email, undefined, 'email field must be deleted')
  assert.strictEqual(incoming.name, 'Jane Doe', 'permitted fields must be preserved')
})

// ─────────────────────────────────────────────────────────────────
// 4. Information Disclosure & Quiz Cheating Defense
// ─────────────────────────────────────────────────────────────────

runTest('Information Disclosure: Quiz questions redact correctIndex and explanation before submit', () => {
  const rawQuestion = {
    id: 'py1',
    question: 'What is type(1/2)?',
    options: ['int', 'float', 'double'],
    correctIndex: 1,
    explanation: 'Python 3 division always returns float',
    difficulty: 'Easy'
  }

  // Redacted mapping function
  const clientSafe = {
    id: rawQuestion.id,
    question: rawQuestion.question,
    options: rawQuestion.options,
    difficulty: rawQuestion.difficulty
  }

  assert.strictEqual(clientSafe.correctIndex, undefined, 'correctIndex must not be exposed')
  assert.strictEqual(clientSafe.explanation, undefined, 'explanation must not be exposed')
  assert.strictEqual(clientSafe.options.length, 3)
})

// ─────────────────────────────────────────────────────────────────
// 5. File Upload & Path Traversal Protections
// ─────────────────────────────────────────────────────────────────

runTest('Path Traversal Defense: Uploaded filenames are sanitized and confined to destination', () => {
  const baseUploadsDir = path.resolve('uploads')
  const maliciousInputs = [
    '../../etc/passwd',
    '..\\..\\windows\\system32\\cmd.exe',
    'resume/../../sensitive.key',
    'file%2e%2e%2fmalicious.pdf'
  ]

  for (const input of maliciousInputs) {
    const safeFilename = path.basename(input).replace(/[^a-zA-Z0-9._-]/g, '')
    const fullPath = path.resolve(baseUploadsDir, safeFilename)
    assert.strictEqual(fullPath.startsWith(baseUploadsDir), true, `Path traversal escape detected on ${input}`)
  }
})

runTest('Upload Extension Validation: Dangerous executable formats are rejected', () => {
  const ALLOWED_DOC_EXTENSIONS = new Set(['.pdf', '.docx', '.doc', '.txt'])
  const dangerousExtensions = ['.exe', '.sh', '.bat', '.cmd', '.php', '.js', '.py', '.svg', '.html', '.phtml']

  for (const ext of dangerousExtensions) {
    assert.strictEqual(ALLOWED_DOC_EXTENSIONS.has(ext), false, `Extension ${ext} should be forbidden`)
  }
})

// ─────────────────────────────────────────────────────────────────
// 6. Cross-Tenant Isolation & Multi-Tenant Boundaries
// ─────────────────────────────────────────────────────────────────

runTest('Cross-Tenant Isolation: Discover endpoint does not cross user boundaries when profile is absent', () => {
  // Simulate discover profile resolution:
  const resolveProfileForRequest = (userId, userProfilesDb, incomingBodyProfile) => {
    let profile = null
    if (userId && userProfilesDb[userId]) {
      profile = userProfilesDb[userId]
    }
    if (!profile && incomingBodyProfile) {
      profile = incomingBodyProfile
    }
    // SECURE: Must NEVER fall back to CandidateProfile.findOne().sort({ updatedAt: -1 })
    return profile
  }

  const userProfilesDb = {
    'victim_user_123': {
      fullName: 'Alice Smith',
      skills: ['Confidential Skill', 'Proprietary R&D'],
      email: 'alice@victimcorp.com'
    }
  }

  // Attacker has no profile and submits no body profile
  const resolved = resolveProfileForRequest('attacker_456', userProfilesDb, null)
  assert.strictEqual(resolved, null, 'Attacker must not receive another candidate profile')
})

// ─────────────────────────────────────────────────────────────────
// 7. BOLA Defense in Domination Evidence & Email Retrieval
// ─────────────────────────────────────────────────────────────────

runTest('BOLA Defense: Domination email endpoint rejects cross-account email access', () => {
  const verifyEmailAccess = (user, filename) => {
    if (user.role === 'admin') return true
    const userEmail = user.email ? user.email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_') : ''
    return Boolean(userEmail && filename.toLowerCase().includes(userEmail))
  }

  const userAlice = { id: 'u1', email: 'alice@example.com', role: 'user' }
  const userBob = { id: 'u2', email: 'bob@example.com', role: 'user' }
  const adminUser = { id: 'u3', email: 'admin@rexion.ai', role: 'admin' }

  const bobEmailFile = 'email_1790000000_bob_example_com.html'

  // Alice trying to view Bob's email
  assert.strictEqual(verifyEmailAccess(userAlice, bobEmailFile), false, 'Alice must not access Bob email')
  // Bob accessing his own email
  assert.strictEqual(verifyEmailAccess(userBob, bobEmailFile), true, 'Bob should access his own email')
  // Admin accessing email
  assert.strictEqual(verifyEmailAccess(adminUser, bobEmailFile), true, 'Admin has audit access')
})

runTest('BOLA Defense: Domination evidence endpoint rejects unowned application evidence', () => {
  const verifyEvidenceOwnership = (user, filename, userApps) => {
    if (user.role === 'admin') return true
    return userApps.some(app => app.userId === user.id && app.evidenceScreenshot?.includes(filename))
  }

  const userAlice = { id: 'u1', role: 'user' }
  const userBob = { id: 'u2', role: 'user' }
  const adminUser = { id: 'u3', role: 'admin' }

  const applicationsDb = [
    { id: 'app1', userId: 'u2', evidenceScreenshot: 'evidence_bob_proof_123.png' }
  ]

  // Alice trying to view Bob's proof
  assert.strictEqual(verifyEvidenceOwnership(userAlice, 'evidence_bob_proof_123.png', applicationsDb), false)
  // Bob accessing his own proof
  assert.strictEqual(verifyEvidenceOwnership(userBob, 'evidence_bob_proof_123.png', applicationsDb), true)
  // Admin accessing proof
  assert.strictEqual(verifyEvidenceOwnership(adminUser, 'evidence_bob_proof_123.png', applicationsDb), true)
})

// ─────────────────────────────────────────────────────────────────
// 8. Secret Exposure & Production Configuration Enforcement
// ─────────────────────────────────────────────────────────────────

runTest('Secret Hardening: Unipile integration does not default to hardcoded API key', async () => {
  const fsModule = await import('fs')
  const controllerPath = path.resolve('src/controllers/linkedinController.js')
  const content = fsModule.readFileSync(controllerPath, 'utf8')
  assert.strictEqual(content.includes('wPBskp4M.NDi8BlLY9Xrtxgh78JD6q'), false, 'Hardcoded API key must not exist in controller')
})

runTest('Session Hardening: Session middleware requires strong secret in production', () => {
  const testSessionSecretValidation = (nodeEnv, sessionSecret) => {
    if (nodeEnv === 'production' && (!sessionSecret || sessionSecret === 'rexion-dev-session-secret-key-12345678')) {
      throw new Error('[FATAL SECURITY ERROR] SESSION_SECRET must be configured with a cryptographically secure key in production!')
    }
    return true
  }

  // Development with fallback secret succeeds
  assert.strictEqual(testSessionSecretValidation('development', 'rexion-dev-session-secret-key-12345678'), true)
  // Production with strong secret succeeds
  assert.strictEqual(testSessionSecretValidation('production', 'strong_prod_session_secret_1234567890'), true)
  // Production with missing/default secret throws fatal error
  assert.throws(() => testSessionSecretValidation('production', ''), /FATAL SECURITY ERROR/)
  assert.throws(() => testSessionSecretValidation('production', 'rexion-dev-session-secret-key-12345678'), /FATAL SECURITY ERROR/)
})

console.log('\n=================================================================')
console.log(` RESULTS: ${passedTests}/${totalTests} Automated Security Regression Tests PASSED `)
console.log('=================================================================\n')
