import fs from 'fs'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'

const JUDGE0_URL = process.env.JUDGE0_URL
const JUDGE0_TOKEN = process.env.JUDGE0_TOKEN
const JUDGE0_LANG = {
  python: Number(process.env.JUDGE0_PYTHON_ID || 71),
  javascript: Number(process.env.JUDGE0_JS_ID || 63)
}

export const LANGUAGES = ['python', 'javascript']

// Harness converts function definitions into executable programs that consume JSON on stdin and output JSON on stdout
const HARNESS = {
  python: (code, fn) => `${code}

import sys, json
try:
    _raw = sys.stdin.read()
    _args = json.loads(_raw) if _raw.strip() else []
    _fn = None
    if '${fn}' in globals() and callable(globals()['${fn}']):
        _fn = globals()['${fn}']
    elif 'Solution' in globals():
        _sol = globals()['Solution']()
        if hasattr(_sol, '${fn}'):
            _fn = getattr(_sol, '${fn}')
    if _fn is None:
        raise NameError(f"Function '${fn}' not found in your code. Please define def ${fn}(...) or implement it inside class Solution.")
    _res = _fn(*_args)
    sys.stdout.write(json.dumps(_res))
except Exception as _e:
    import traceback
    sys.stderr.write(traceback.format_exc())
    sys.exit(1)
`,
  javascript: (code, fn) => `${code}

try {
  const fs = require("fs");
  const _raw = fs.readFileSync(0, "utf8");
  const _args = _raw.trim() ? JSON.parse(_raw) : [];
  let _fn = null;
  if (typeof ${fn} === "function") {
    _fn = ${fn};
  } else if (typeof Solution !== "undefined") {
    const _sol = new Solution();
    if (typeof _sol.${fn} === "function") {
      _fn = _sol.${fn}.bind(_sol);
    }
  }
  if (!_fn) {
    throw new Error("Function '${fn}' not found in your code. Please define function ${fn}(...) or implement it inside class Solution.");
  }
  const _res = _fn(..._args);
  process.stdout.write(JSON.stringify(_res));
} catch (err) {
  process.stderr.write(err && err.stack ? err.stack : String(err));
  process.exit(1);
}
`
}

const sandboxDir = path.join(os.tmpdir(), 'rexion-code-sandbox')
if (!fs.existsSync(sandboxDir)) {
  try {
    fs.mkdirSync(sandboxDir, { recursive: true })
  } catch (err) {
    console.warn('Could not create sandbox dir:', err.message)
  }
}

// Canonical value sorters for LeetCode style checkers
const numSort = (a, b) => {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a) < String(b) ? -1 : 1
}

export const canon = (x, mode) => {
  if (!Array.isArray(x)) return x
  if (mode === 'UNORDERED') {
    return [...x].sort(numSort)
  }
  if (mode === 'UNORDERED_DEEP') {
    return x
      .map((i) => (Array.isArray(i) ? [...i].sort(numSort) : i))
      .sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1))
  }
  return x
}

export function matches(actualJson, expected, checker = 'EXACT') {
  let actual
  try {
    actual = JSON.parse(actualJson)
  } catch {
    return false
  }
  return JSON.stringify(canon(actual, checker)) === JSON.stringify(canon(expected, checker))
}

const b64 = (s) => Buffer.from(s).toString('base64')
const unb64 = (s) => (s ? Buffer.from(s, 'base64').toString() : '')

// Judge0 API Runner
async function runOneJudge0(language, code, fn, args, limits = { sec: 2, kb: 128000 }) {
  const res = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(JUDGE0_TOKEN && { 'X-Auth-Token': JUDGE0_TOKEN })
    },
    body: JSON.stringify({
      language_id: JUDGE0_LANG[language] || 71,
      source_code: b64(HARNESS[language](code, fn)),
      stdin: b64(JSON.stringify(args)),
      cpu_time_limit: limits.sec,
      memory_limit: limits.kb,
      enable_network: false
    }),
    signal: AbortSignal.timeout(15000)
  })

  if (!res.ok) throw new Error(`Judge0 status ${res.status}`)
  const r = await res.json()
  const id = Number(r.status?.id)

  return {
    status: id === 3 || id === 4 ? 'ok' : id === 5 ? 'tle' : id === 6 ? 'compile' : 'runtime',
    stdout: unb64(r.stdout).trim(),
    stderr: unb64(r.stderr) || unb64(r.compile_output),
    timeMs: Math.round(Number(r.time || 0) * 1000)
  }
}

// Production Local Sandbox Runner
async function runOneLocal(language, code, fn, args, limits = { sec: 2 }) {
  const fileExt = language === 'python' ? 'py' : 'cjs'
  const filePath = path.join(
    sandboxDir,
    `run_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`
  )
  const harnessCode = HARNESS[language](code, fn)

  try {
    fs.writeFileSync(filePath, harnessCode, 'utf8')
  } catch (err) {
    return {
      status: 'runtime',
      stdout: '',
      stderr: `Failed to prepare script: ${err.message}`,
      timeMs: 0
    }
  }

  return new Promise((resolve) => {
    const startTime = Date.now()
    let stdout = ''
    let stderr = ''
    let killed = false

    const cmd = language === 'python' ? 'python' : 'node'
    const child = spawn(cmd, [filePath], {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    })

    const timeoutLimitMs = Math.max(1000, Math.min(10000, limits.sec * 1000))
    const timer = setTimeout(() => {
      killed = true
      try {
        child.kill('SIGKILL')
      } catch (e) {}
      cleanup()
      resolve({
        status: 'tle',
        stdout: '',
        stderr: 'Time Limit Exceeded (execution timed out)',
        timeMs: timeoutLimitMs
      })
    }, timeoutLimitMs)

    const cleanup = () => {
      clearTimeout(timer)
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      } catch (e) {}
    }

    child.stdout.on('data', (d) => {
      if (stdout.length < 20000) stdout += d.toString()
    })
    child.stderr.on('data', (d) => {
      if (stderr.length < 20000) stderr += d.toString()
    })

    child.on('close', (codeExit) => {
      if (killed) return
      cleanup()
      const timeMs = Date.now() - startTime
      if (codeExit !== 0) {
        resolve({
          status: 'runtime',
          stdout: stdout.trim(),
          stderr: stderr.trim() || `Process exited with code ${codeExit}`,
          timeMs
        })
      } else {
        resolve({
          status: 'ok',
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          timeMs
        })
      }
    })

    child.on('error', (err) => {
      if (killed) return
      cleanup()
      resolve({
        status: 'runtime',
        stdout: '',
        stderr: err.message,
        timeMs: Date.now() - startTime
      })
    })

    // Write input arguments to stdin
    try {
      child.stdin.write(JSON.stringify(args))
      child.stdin.end()
    } catch (e) {
      cleanup()
      resolve({
        status: 'runtime',
        stdout: '',
        stderr: e.message,
        timeMs: Date.now() - startTime
      })
    }
  })
}

// Generic runOne that prefers Judge0 if configured, otherwise uses isolated local sandbox
export async function runOne(language, code, fn, args, limits = { sec: 2, kb: 128000 }) {
  if (JUDGE0_URL) {
    try {
      return await runOneJudge0(language, code, fn, args, limits)
    } catch (err) {
      console.warn('Judge0 failed, falling back to local runner:', err.message)
    }
  }
  return await runOneLocal(language, code, fn, args, limits)
}

// Concurrency pool runner
export async function pool(items, n, fn) {
  const out = []
  let i = 0
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const k = i++
      out[k] = await fn(items[k], k)
    }
  })
  await Promise.all(workers)
  return out
}

// High-level Test Runner for both Run (sample tests) and Submit (all tests)
export async function executeProblemTests({
  language,
  code,
  functionName,
  checker = 'EXACT',
  tests,
  timeLimitSec = 2,
  memoryLimitKb = 128000,
  mode = 'run' // 'run' | 'submit'
}) {
  const isSubmit = mode === 'submit'
  // Sample tests for quick run, all tests for submit
  const testsToRun = isSubmit ? tests : tests.filter((t) => t.isSample)

  if (!testsToRun || testsToRun.length === 0) {
    return {
      verdict: 'ACCEPTED',
      passed: 0,
      total: 0,
      runtimeMs: 0,
      cases: []
    }
  }

  const limits = { sec: timeLimitSec, kb: memoryLimitKb }

  const results = await pool(testsToRun, 4, async (t, idx) => {
    const r = await runOne(language, code, functionName, t.input, limits)
    const pass = r.status === 'ok' && matches(r.stdout, t.expected, checker)
    return { t, r, pass, index: idx }
  })

  const passed = results.filter((x) => x.pass).length
  const bad = results.find((x) => !x.pass)
  const verdict = !bad
    ? 'ACCEPTED'
    : bad.r.status === 'tle'
    ? 'TIME_LIMIT'
    : bad.r.status === 'compile'
    ? 'COMPILE_ERROR'
    : bad.r.status === 'runtime'
    ? 'RUNTIME_ERROR'
    : 'WRONG_ANSWER'

  const runtimeMs = Math.max(...results.map((x) => x.r.timeMs || 0), 1)

  const cases = results.map(({ t, r, pass }) => {
    if (t.isSample || !isSubmit) {
      return {
        pass,
        input: t.input,
        expected: t.expected,
        got: r.stdout,
        error: r.stderr ? r.stderr.slice(0, 600) : '',
        runtimeMs: r.timeMs
      }
    }
    // Hidden tests hide raw inputs/outputs to prevent answer leakage
    return {
      pass,
      runtimeMs: r.timeMs
    }
  })

  return {
    verdict,
    passed,
    total: testsToRun.length,
    runtimeMs,
    cases,
    failedCase: bad && !bad.t.isSample ? { message: `Failed on hidden test case (${bad.r.status})` } : null
  }
}
