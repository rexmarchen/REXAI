const formatMessage = (level, message) => `[intern-hub] ${level.toUpperCase()} ${message}`

export const logger = {
  info(message) {
    console.log(formatMessage('info', message))
  },
  warn(message) {
    console.warn(formatMessage('warn', message))
  },
  error(message) {
    console.error(formatMessage('error', message))
  }
}
