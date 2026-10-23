// Run with:
// k6 run -e BASE_URL=http://localhost:5000 -e TOKEN="your_jwt_here" scripts/k6-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics to track bottleneck visibility
const errorRate = new Rate('errors');
const summaryLatency = new Trend('activity_summary_latency', true);

export const options = {
  stages: [
    { duration: '1m', target: 100 },   // Warm-up & pool ramp
    { duration: '2m', target: 500 },   // Ramp to 500 VUs
    { duration: '4m', target: 500 },   // Sustain 500 VUs
    { duration: '1m', target: 1000 },  // Spike to 1,000 VUs
    { duration: '3m', target: 1000 },  // Sustain 1,000 VUs
    { duration: '1m', target: 0 },     // Graceful cooldown
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],              // < 1% HTTP failures (non-2xx/3xx)
    http_req_duration: ['p(95)<800', 'p(99)<1500'], // 95% < 800ms, 99% < 1.5s
    errors: ['rate<0.01'],
    activity_summary_latency: ['p(95)<1000'],    // Heavy aggregation endpoint target
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:5000';
const TOKEN = __ENV.TOKEN || '';

const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept-Encoding': 'gzip',
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

export default function () {
  // Batch simulating realistic user interaction:
  // 1. Health/Readiness probe
  // 2. Heavy aggregation dashboard summary
  // 3. Paginated activity list
  const requests = [
    {
      method: 'GET',
      url: `${BASE}/health`,
      params: { headers: defaultHeaders, tags: { name: 'HealthCheck' } },
    },
    {
      method: 'GET',
      url: `${BASE}/api/activities/summary`,
      params: { headers: defaultHeaders, tags: { name: 'ActivitySummary' } },
    },
    {
      method: 'GET',
      url: `${BASE}/api/activities?page=1&limit=20`,
      params: { headers: defaultHeaders, tags: { name: 'ActivityList' } },
    },
  ];

  const responses = http.batch(requests);

  responses.forEach((res, index) => {
    const isOk = check(res, {
      'status is 200 or 304': (r) => r.status === 200 || r.status === 304,
      'response under 1.5s': (r) => r.timings.duration < 1500,
    });

    errorRate.add(!isOk);

    // Track latency specifically on the heavy aggregation route
    if (index === 1) {
      summaryLatency.add(res.timings.duration);
    }
  });

  // Realistic human think-time between screen interactions (1s - 3s)
  sleep(Math.random() * 2 + 1);
}
