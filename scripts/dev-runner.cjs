const { spawn } = require('node:child_process')
const fs = require('node:fs')
const http = require('node:http')
const path = require('node:path')

const rootDir = process.cwd()
const services = [
  {
    name: 'backend',
    cwd: path.join(rootDir, 'backend'),
    checkUrl: 'http://127.0.0.1:5000/api/health',
    command:
      process.platform === 'win32'
        ? { bin: 'cmd.exe', args: ['/d', '/s', '/c', 'npm run dev'] }
        : { bin: 'npm', args: ['run', 'dev'] }
  },
  {
    name: 'frontend',
    cwd: path.join(rootDir, 'frontend'),
    checkUrl: 'http://127.0.0.1:5173',
    command:
      process.platform === 'win32'
        ? {
            bin: 'cmd.exe',
            args: ['/d', '/s', '/c', 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort']
          }
        : {
            bin: 'npm',
            args: ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173', '--strictPort']
          }
  }
]

for (const service of services) {
  const packageJsonPath = path.join(service.cwd, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    console.error(`[dev-runner] Missing package.json for ${service.name} at ${packageJsonPath}`)
    process.exit(1)
  }
}

const childProcesses = new Map()
let shuttingDown = false

async function isServiceReachable(url) {
  return new Promise((resolve) => {
    const request = http.get(url, { timeout: 1500 }, (response) => {
      const statusCode = Number(response.statusCode || 0)
      response.resume()
      resolve(statusCode >= 200 && statusCode < 500)
    })

    request.on('timeout', () => {
      request.destroy()
      resolve(false)
    })

    request.on('error', () => {
      resolve(false)
    })
  })
}

function printPrefixed(name, chunk, isError = false) {
  const output = chunk.toString()
  const lines = output.split(/\r?\n/)

  for (const line of lines) {
    if (!line.trim()) {
      continue
    }

    const stream = isError ? process.stderr : process.stdout
    stream.write(`[${name}] ${line}\n`)
  }
}

function killService(serviceName, child) {
  if (!child || child.exitCode !== null) {
    return
  }

  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' })
    return
  }

  child.kill('SIGTERM')
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return
  }

  shuttingDown = true
  process.exitCode = exitCode

  for (const [serviceName, child] of childProcesses.entries()) {
    killService(serviceName, child)
  }
}

function startService(service) {
  const child = spawn(service.command.bin, service.command.args, {
    cwd: service.cwd,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe']
  })

  childProcesses.set(service.name, child)

  child.stdout.on('data', (chunk) => printPrefixed(service.name, chunk))
  child.stderr.on('data', (chunk) => printPrefixed(service.name, chunk, true))

  child.on('exit', async (code, signal) => {
    childProcesses.delete(service.name)

    if (shuttingDown) {
      if (childProcesses.size === 0) {
        process.exitCode = process.exitCode || 0
      }
      return
    }

    // If service is already available on expected endpoint (e.g., existing process),
    // do not fail the whole dev runner.
    if (await isServiceReachable(service.checkUrl)) {
      console.log(`[dev-runner] ${service.name} is already running at ${service.checkUrl}.`)
      if (childProcesses.size === 0) {
        process.exitCode = 0
      }
      return
    }

    const exitReason = signal ? `signal ${signal}` : `code ${code}`
    console.error(`[dev-runner] ${service.name} exited (${exitReason}). Stopping all services.`)
    shutdown(code || 1)
  })
}

process.on('SIGINT', () => {
  console.log('\n[dev-runner] SIGINT received. Stopping services...')
  shutdown(0)
})

process.on('SIGTERM', () => {
  console.log('\n[dev-runner] SIGTERM received. Stopping services...')
  shutdown(0)
})

console.log('[dev-runner] Starting backend and frontend...')
;(async () => {
  for (const service of services) {
    if (await isServiceReachable(service.checkUrl)) {
      console.log(`[dev-runner] ${service.name} already running at ${service.checkUrl}.`)
      continue
    }
    startService(service)
  }

  if (childProcesses.size === 0) {
    console.log('[dev-runner] Nothing to start. Services are already running.')
    process.exitCode = 0
    return
  }
})().catch((error) => {
  console.error('[dev-runner] Failed to start services:', error.message)
  shutdown(1)
})
