import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import User from '../src/models/User.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rexion'

async function run() {
  await mongoose.connect(mongoUri)
  const adminEmail = 'admin@rexion.ai'
  const newPassword = process.argv[2] || 'Admin@123456'

  let user = await User.findOne({ email: adminEmail })
  if (!user) {
    user = new User({
      name: 'System Administrator',
      email: adminEmail,
      role: 'admin',
      plan: 'elite'
    })
  }

  user.role = 'admin'
  user.password = newPassword
  await user.save()

  console.log(`\n✅ Administrator Account Ready:`)
  console.log(`Email:    ${adminEmail}`)
  console.log(`Password: ${newPassword}`)
  console.log(`Role:     ${user.role}\n`)

  await mongoose.disconnect()
}

run().catch(console.error)
