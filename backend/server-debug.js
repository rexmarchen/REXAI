import mongoose from 'mongoose'
import app from './src/app.js'
import { NODE_ENV, PORT, MONGO_URI, JWT_SECRET } from './src/config/env.js'

console.log('Starting Rexion Backend...')
console.log('NODE_ENV:', NODE_ENV)
console.log('MONGO_URI:', MONGO_URI ? 'Set' : 'Missing')
console.log('JWT_SECRET:', JWT_SECRET ? 'Set' : 'Missing')

mongoose.set('bufferCommands', false)

let serverStarted = false
const DEFAULT_MONGO_CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000
}

const configuredMongoFamily = Number(process.env.MONGO_FAMILY || 0)

const startServer = () => {
  if (serverStarted) {
    return
  }

  serverStarted = true
  console.log('\nStarting server...')
  app.listen(PORT, () => {
    console.log(`\nServer running on http://localhost:${PORT}`)
    console.log('Ready to accept requests')
  })
}

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB')
})

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected.')
})

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message)
})

const getMongoConnectionAttempts = () => {
  if (configuredMongoFamily === 4 || configuredMongoFamily === 6) {
    return [
      {
        label: `family=${configuredMongoFamily}`,
        options: {
          ...DEFAULT_MONGO_CONNECT_OPTIONS,
          family: configuredMongoFamily
        }
      }
    ]
  }

  return [
    {
      label: 'default network settings',
      options: { ...DEFAULT_MONGO_CONNECT_OPTIONS }
    },
    {
      label: 'IPv4-only DNS resolution',
      options: {
        ...DEFAULT_MONGO_CONNECT_OPTIONS,
        family: 4
      }
    }
  ]
}

const logMongoTroubleshooting = (error) => {
  const message = String(error?.message || '')
  const lowerMessage = message.toLowerCase()
  const troubleshootingSteps = []

  troubleshootingSteps.push(
    'If Atlas is optional for local development, use `npm run dev` to start the default SQLite backend instead of `npm run dev:mongo`.'
  )

  if (lowerMessage.includes('could not connect to any servers') || lowerMessage.includes('whitelist')) {
    troubleshootingSteps.push(
      'Add this machine\'s current public IP to Atlas Network Access and make sure the cluster is active.'
    )
  }

  troubleshootingSteps.push(
    'Confirm the Atlas database user credentials in `backend/.env` are correct and the password is URL-safe.'
  )
  troubleshootingSteps.push(
    'Allow outbound TCP 27017 to the Atlas hosts. Local firewalls, VPNs, antivirus HTTPS inspection, and some campus or office networks can block it.'
  )

  if (!configuredMongoFamily) {
    troubleshootingSteps.push(
      'If this network has broken IPv6 routing, set `MONGO_FAMILY=4` in `backend/.env` to force IPv4 on the next start.'
    )
  }

  if (lowerMessage.includes('ssl') || lowerMessage.includes('tls')) {
    troubleshootingSteps.push(
      'The TLS handshake is being interrupted before MongoDB can authenticate, which usually points to network filtering or Atlas access rules rather than app code.'
    )
  }

  console.warn('\nMongoDB troubleshooting:')
  for (const step of troubleshootingSteps) {
    console.warn(`- ${step}`)
  }
}

async function connectToMongo() {
  if (!MONGO_URI) {
    console.warn('MONGO_URI is missing. MongoDB-backed features are disabled.')
    return
  }

  console.log('\nConnecting to MongoDB...')
  let lastError = null
  const attempts = getMongoConnectionAttempts()

  for (let index = 0; index < attempts.length; index += 1) {
    const attempt = attempts[index]

    if (index > 0) {
      console.warn(`Retrying MongoDB connection with ${attempt.label}...`)
    }

    try {
      await mongoose.connect(MONGO_URI, attempt.options)
      return
    } catch (err) {
      lastError = err
      await mongoose.disconnect().catch(() => {})
    }
  }

  if (lastError) {
    console.error('Database connection error:', lastError.message)
    console.warn('MongoDB-backed features are unavailable until the Atlas connection succeeds.')
    logMongoTroubleshooting(lastError)
  }
}

startServer()
void connectToMongo()
