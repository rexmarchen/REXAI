const { spawn } = require('node:child_process')

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const processes = [
  spawn(npmCommand, ['run', 'dev'], { stdio: 'inherit', shell: false }),
  spawn(npmCommand, ['run', 'worker'], { stdio: 'inherit', shell: false }),
]

function stopProcesses() {
  for (const child of processes) {
    if (!child.killed) child.kill()
  }
}

process.on('SIGINT', () => {
  stopProcesses()
  process.exit(0)
})
process.on('SIGTERM', () => {
  stopProcesses()
  process.exit(0)
})

for (const child of processes) {
  child.on('exit', (code) => {
    if (code && code !== 0) {
      stopProcesses()
      process.exit(code)
    }
  })
}