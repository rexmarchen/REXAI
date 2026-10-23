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
  const emails = ['anshuar9065@gmail.com', 'anshupal5047@gmail.com', 'admin@rexion.ai', 'adminnew@rexion.ai']
  const res = await User.updateMany(
    { email: { $in: emails } },
    { $set: { role: 'admin' } }
  )
  console.log(`Updated ${res.modifiedCount} users to admin role.`)
  const users = await User.find({ role: 'admin' }, { email: 1, name: 1, role: 1 })
  console.log('Current Admins:', JSON.stringify(users, null, 2))
  await mongoose.disconnect()
}

run().catch(console.error)
