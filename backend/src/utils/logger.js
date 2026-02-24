import fs from 'fs'
import path from 'path'

const logFile = path.join(process.cwd(), 'logs', 'app.log')

const ensureLogDir = () => {
  const logDir = path.dirname(logFile)
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }
}

const log = (level, message) => {
  ensureLogDir()
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] [${level}] ${message}`
  console.log(logMessage)
  fs.appendFileSync(logFile, logMessage + '\n')
}

export default {
  info: (msg) => log('INFO', msg),
  error: (msg) => log('ERROR', msg),
  warn: (msg) => log('WARN', msg),
  debug: (msg) => log('DEBUG', msg)
}
