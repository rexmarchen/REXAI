import mongoose from 'mongoose'
import app from './src/app.js'
import { NODE_ENV, PORT, MONGO_URI, JWT_SECRET } from './src/config/env.js'

console.log('Starting Rexion Backend...')
console.log('NODE_ENV:', NODE_ENV)
console.log('MONGO_URI:', MONGO_URI ? 'Set' : 'Missing')
console.log('JWT_SECRET:', JWT_SECRET ? 'Set' : 'Missing')

const startServer = () => {
  console.log('\nStarting server...')
  app.listen(PORT, () => {
    console.log(`\nServer running on http://localhost:${PORT}`)
    console.log('Ready to accept requests')
  })
}

console.log('\nConnecting to MongoDB...')
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB')
    startServer()
  })
  .catch((err) => {
    console.error('Database connection error:', err.message)
    console.warn('Starting in limited mode without MongoDB-backed features.')
    startServer()
  })
