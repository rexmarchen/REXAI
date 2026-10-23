/**
 * setup-admin.mjs
 * Secure CLI script to create or promote the first authorized REXION administrator.
 *
 * Usage:
 *   node scripts/setup-admin.mjs <user-email>
 *
 * Example:
 *   node scripts/setup-admin.mjs admin@rexion.ai
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import User from '../src/models/User.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const emailArg = process.argv[2]

if (!emailArg || !emailArg.trim()) {
  console.error('\n❌ Error: Please specify the email of the user to promote to admin.')
  console.error('Usage: node scripts/setup-admin.mjs <user-email>\n')
  process.exit(1)
}

const targetEmail = emailArg.trim().toLowerCase()
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rexion'

async function run() {
  try {
    console.log(`Connecting to MongoDB...`)
    await mongoose.connect(mongoUri)
    console.log(`Connected to database. Searching for user: "${targetEmail}"...`)

    const user = await User.findOne({ email: targetEmail })
    if (!user) {
      console.error(`\n❌ Error: No user found with email "${targetEmail}".`)
      console.log('Please register an account in REXION first, then run this command.\n')
      process.exit(1)
    }

    user.role = 'admin'
    await user.save()

    console.log(`\n✅ Success! User "${user.name}" (${user.email}) is now an authorized REXION administrator.`)
    console.log(`Role: ${user.role}`)
    console.log(`You can now log in and access the Faculty Moderation Center at /admin/faculty.\n`)
  } catch (err) {
    console.error('Fatal database error:', err)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

run()
