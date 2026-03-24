import { createServer } from 'node:http'

import { app } from './src/app.js'
import { config } from './src/config/index.js'
import { logger } from './src/utils/logger.js'

const server = createServer(app)

server.listen(config.port, () => {
  logger.info(`Intern Hub backend listening on http://127.0.0.1:${config.port}`)
  logger.info(`Adzuna base URL: ${config.adzunaBaseUrl}`)
  logger.info(`Adzuna app id loaded: ${config.adzunaAppId ? 'yes' : 'no'}`)
})
