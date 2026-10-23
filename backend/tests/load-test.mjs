/**
 * REXION Production Load Testing & Concurrency Benchmark Suite
 * 
 * Simulates realistic user journeys across progressive concurrency stages:
 * - Stage 0: Smoke (1 VU baseline)
 * - Stage 1: 10 Concurrent Virtual Users (Low load)
 * - Stage 2: 25 Concurrent Virtual Users (Moderate load)
 * - Stage 3: 50 Concurrent Virtual Users (High load)
 * - Stage 4: 100 Concurrent Virtual Users (Peak stress load)
 * 
 * Measures:
 * - Requests Per Second (RPS)
 * - Latency percentiles: min, mean, p50 (median), p95, p99, max
 * - Error rate & status distribution
 * - Cache hit ratio & response compression impact
 */

import http from 'http'
import dotenv from 'dotenv'
dotenv.config()
dotenv.config({ path: '.env.local', override: true })
process.env.SKIP_BOOT_INGESTION = 'true'
process.env.NODE_ENV = 'test'

import app from '../src/app.js'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import User from '../src/models/User.js'
import cacheManager from '../src/utils/cacheManager.js'

const PORT = 5055 // Dedicated port for isolated load testing
const BASE_URL = `http://127.0.0.1:${PORT}`

// Generate test JWT for authentic authenticated journeys
const JWT_SECRET = process.env.JWT_SECRET || 'rexion-dev-super-secret-jwt-key-2026'
const testUserId = new mongoose.Types.ObjectId()
const testToken = jwt.sign(
  { _id: testUserId.toString(), id: testUserId.toString(), email: 'loadtest@rexion.ai', role: 'developer' },
  JWT_SECRET,
  { expiresIn: '1h' }
)

const USER_JOURNEYS = [
  {
    name: '1. Health & Liveness Probe',
    method: 'GET',
    path: '/health',
    weight: 15
  },
  {
    name: '2. Readiness & DB Latency Ping',
    method: 'GET',
    path: '/ready',
    weight: 15
  },
  {
    name: '3. Career Hub Public Quizzes Catalog',
    method: 'GET',
    path: '/api/quizzes',
    weight: 25
  },
  {
    name: '4. Leaderboard Ranking Query',
    method: 'GET',
    path: '/api/quizzes/leaderboard',
    weight: 15
  },
  {
    name: '5. Internships & Job Discovery (Page 1)',
    method: 'GET',
    path: '/api/internships?page=1&limit=20',
    weight: 20
  },
  {
    name: '6. Single Quiz Details (Python Basics)',
    method: 'GET',
    path: '/api/quizzes/python-basics',
    weight: 5
  },
  {
    name: '7. Authenticated User Profile',
    method: 'GET',
    path: '/api/profile',
    headers: { Authorization: `Bearer ${testToken}` },
    weight: 5
  }
]

function makeRequest(journey) {
  return new Promise((resolve) => {
    const start = Date.now()
    const url = new URL(journey.path, BASE_URL)

    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: journey.method,
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'User-Agent': 'Rexion-LoadTester/1.0',
        ...(journey.headers || {})
      }
    }

    if (journey.body) {
      reqOptions.headers['Content-Type'] = 'application/json'
    }

    const req = http.request(reqOptions, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        const latency = Date.now() - start
        resolve({
          statusCode: res.statusCode,
          latency,
          path: journey.path,
          success: res.statusCode >= 200 && res.statusCode < 400,
          contentEncoding: res.headers['content-encoding'] || 'identity'
        })
      })
    })

    req.on('error', (err) => {
      resolve({
        statusCode: 0,
        latency: Date.now() - start,
        path: journey.path,
        success: false,
        error: err.message
      })
    })

    if (journey.body) {
      req.write(JSON.stringify(journey.body))
    }
    req.end()
  })
}

function calculatePercentiles(latencies) {
  if (latencies.length === 0) return { min: 0, mean: 0, p50: 0, p95: 0, p99: 0, max: 0 }
  const sorted = [...latencies].sort((a, b) => a - b)
  const sum = sorted.reduce((a, b) => a + b, 0)
  const mean = Math.round(sum / sorted.length)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const p50 = sorted[Math.floor(sorted.length * 0.50)]
  const p95 = sorted[Math.floor(sorted.length * 0.95)]
  const p99 = sorted[Math.floor(sorted.length * 0.99)]
  return { min, mean, p50, p95, p99, max }
}

async function runStage(vuCount, durationMs) {
  const stageStart = Date.now()
  const results = []
  let activeWorkers = 0

  console.log(`\n▶ Starting Test Stage: Concurrency = ${vuCount} Virtual Users (Duration: ${durationMs / 1000}s)`)

  async function worker() {
    while (Date.now() - stageStart < durationMs) {
      // Pick random journey based on weights
      const totalWeight = USER_JOURNEYS.reduce((acc, j) => acc + j.weight, 0)
      let rand = Math.random() * totalWeight
      let selectedJourney = USER_JOURNEYS[0]
      for (const j of USER_JOURNEYS) {
        if (rand < j.weight) {
          selectedJourney = j
          break
        }
        rand -= j.weight
      }

      const res = await makeRequest(selectedJourney)
      results.push(res)

      // Micro think time (10ms)
      await new Promise(r => setTimeout(r, 10))
    }
  }

  // Spawn VU workers
  const workerPromises = []
  for (let i = 0; i < vuCount; i++) {
    workerPromises.push(worker())
  }

  await Promise.all(workerPromises)

  const actualDurationSec = (Date.now() - stageStart) / 1000
  const totalRequests = results.length
  const successfulRequests = results.filter(r => r.success).length
  const failedRequests = totalRequests - successfulRequests
  const errorRate = ((failedRequests / totalRequests) * 100).toFixed(2)
  const rps = Math.round(totalRequests / actualDurationSec)

  const statusDist = {}
  for (const r of results) {
    const s = r.statusCode ? String(r.statusCode) : 'NET_ERR'
    statusDist[s] = (statusDist[s] || 0) + 1
  }

  if (failedRequests > 0) {
    const failures = results.filter(r => !r.success).slice(0, 5)
    console.warn(`  ⚠️ Stage Failures (${failedRequests}):`, failures.map(f => `${f.path} -> ${f.statusCode || f.error}`))
  }

  const statusSummary = Object.entries(statusDist).map(([code, count]) => `${code}:${count}`).join(' ')
  const latencies = results.map(r => r.latency)
  const percentiles = calculatePercentiles(latencies)

  return {
    vuCount,
    totalRequests,
    successfulRequests,
    failedRequests,
    errorRate: `${errorRate}%`,
    rps,
    statusCodes: statusSummary,
    ...percentiles
  }
}

async function startLoadTest() {
  console.log('=================================================================')
  console.log('         REXION REALISTIC PROGRESSIVE LOAD TEST SUITE            ')
  console.log('=================================================================')

  // Connect to DB if needed
  const mongoUri = process.env.MONGO_URI || process.env.DATABASE_URL || ''
  if (mongoUri && mongoose.connection.readyState === 0) {
    console.log('Connecting to database for live query load test...')
    await mongoose.connect(mongoUri, {
      maxPoolSize: 50,
      minPoolSize: 5
    })
    console.log('✅ Database connected.')
  }

  try {
    await User.findByIdAndUpdate(
      testUserId,
      {
        _id: testUserId,
        email: 'loadtest@rexion.ai',
        name: 'Load Test Engineer',
        role: 'developer',
        plan: 'pro'
      },
      { upsert: true }
    )
  } catch (_) {}

  // Start dedicated HTTP server
  const server = app.listen(PORT, '127.0.0.1')
  await new Promise(r => setTimeout(r, 600)) // Wait for listening

  console.log(`Server listening at ${BASE_URL}. Initializing test stages...`)

  const summary = []

  try {
    // 1. Smoke test: 1 VU (Baseline)
    const smokeResult = await runStage(1, 3000)
    summary.push(smokeResult)

    // 2. Stage 1: 10 VUs
    const stage1Result = await runStage(10, 4000)
    summary.push(stage1Result)

    // 3. Stage 2: 25 VUs
    const stage2Result = await runStage(25, 4000)
    summary.push(stage2Result)

    // 4. Stage 3: 50 VUs
    const stage3Result = await runStage(50, 4000)
    summary.push(stage3Result)

    // 5. Stage 4: 100 VUs
    const stage4Result = await runStage(100, 5000)
    summary.push(stage4Result)

    console.log('\n=================================================================')
    console.log('                 LOAD TEST PERFORMANCE BENCHMARK RESULTS         ')
    console.log('=================================================================')
    console.table(summary)

    const cacheStats = cacheManager.getStats()
    console.log('\nCache Manager Metrics:')
    console.log(`• Entries: ${cacheStats.size} / ${cacheStats.maxEntries}`)
    console.log(`• Hit Rate: ${cacheStats.hitRate} (Hits: ${cacheStats.hits}, Misses: ${cacheStats.misses})`)
    console.log(`• Stampede Coalesced Waits: ${cacheStats.coalescedWaits}`)
    console.log(`• Total Key Sets: ${cacheStats.sets}`)

    console.log('\n=================================================================')
    console.log('✅ Load testing completed successfully. All stages evaluated.')
    console.log('=================================================================')
  } finally {
    try {
      await User.findByIdAndDelete(testUserId)
    } catch (_) {}
    server.close()
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
    }
  }
}

startLoadTest().catch(err => {
  console.error('Load test failure:', err)
  process.exit(1)
})
