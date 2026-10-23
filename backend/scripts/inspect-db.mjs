import { connectDB } from '../src/config/database.js'
import User from '../src/models/User.js'
import DeveloperProfile from '../src/models/DeveloperProfile.js'
import FacultyProfile from '../src/models/FacultyProfile.js'
import Internship from '../src/models/Internship.js'
import Application from '../src/models/Application.js'
import Subscription from '../src/models/Subscription.js'
import SocialAutomationPost from '../src/models/SocialAutomationPost.js'
import AuditLog from '../src/models/AuditLog.js'
import Resume from '../src/models/Resume.js'
import { Quiz } from '../src/models/Quiz.js'
import { ProblemSubmission } from '../src/models/ProblemSubmission.js'
import { TutorSession } from '../src/models/TutorSession.js'

async function inspect() {
  await connectDB()

  console.log('--- USER ROLES ---')
  const roles = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }])
  console.log(roles)

  console.log('--- USER PLANS ---')
  const plans = await User.aggregate([{ $group: { _id: '$plan', count: { $sum: 1 } } }])
  console.log(plans)

  console.log('--- DEVELOPER PROFILES ---')
  const devStatuses = await DeveloperProfile.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
  console.log(devStatuses)

  console.log('--- FACULTY PROFILES ---')
  const facStatuses = await FacultyProfile.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
  console.log(facStatuses)

  console.log('--- INTERNSHIPS & APPLICATIONS ---')
  const internships = await Internship.countDocuments()
  const applications = await Application.countDocuments()
  console.log({ internships, applications })

  console.log('--- AUDIT LOGS ---')
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(10).lean()
  console.log(`Found ${logs.length} audit logs:`)
  logs.forEach(l => console.log(`  [${l.category}] ${l.title} - ${l.createdAt}`))

  console.log('--- SOCIAL AUTOMATION POSTS ---')
  const postStatuses = await SocialAutomationPost.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
  console.log(postStatuses)

  process.exit(0)
}

inspect().catch(err => {
  console.error(err)
  process.exit(1)
})
