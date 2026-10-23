import { connectDB } from '../src/config/database.js'
import AuditLog from '../src/models/AuditLog.js'
import User from '../src/models/User.js'
import DeveloperProfile from '../src/models/DeveloperProfile.js'
import FacultyProfile from '../src/models/FacultyProfile.js'

async function syncRealAuditLogs() {
  await connectDB()

  // Remove the fake seed logs (which had fake emails like rahul@dev.com, vikas@example.com)
  await AuditLog.deleteMany({
    $or: [
      { 'actor.email': { $in: ['rahul@dev.com', 'neha.kumar@example.com', 'billing@techcorp.com'] } },
      { description: /Rahul Sharma|Dr\. Priya Singh|vikas@example\.com|TechCorp Ltd/i }
    ]
  })

  // Check how many real logs exist
  const existingCount = await AuditLog.countDocuments()
  console.log(`Current real audit logs count: ${existingCount}`)

  // Generate real audit logs from actual Users
  const users = await User.find().sort({ createdAt: -1 }).limit(15).lean()
  for (const u of users) {
    const exists = await AuditLog.findOne({
      action: 'USER_REGISTRATION',
      'actor.email': u.email
    })
    if (!exists) {
      await AuditLog.create({
        action: 'USER_REGISTRATION',
        category: 'user_management',
        severity: 'info',
        title: `User registration: ${u.name || u.email}`,
        description: `New ${u.role} account created for ${u.email}`,
        status: 'New',
        actor: { id: u._id, name: u.name || 'User', email: u.email, role: u.role },
        createdAt: u.createdAt || new Date()
      })
    }
  }

  // Generate real audit logs from actual DeveloperProfiles
  const devs = await DeveloperProfile.find().lean()
  for (const d of devs) {
    const exists = await AuditLog.findOne({
      action: 'DEVELOPER_APPLICATION',
      'target.email': d.email
    })
    if (!exists) {
      await AuditLog.create({
        action: 'DEVELOPER_APPLICATION',
        category: 'developer',
        severity: d.status === 'active' ? 'success' : 'info',
        title: `Developer application: ${d.displayName || d.email}`,
        description: `Application status: ${d.status} (${d.title || 'Technical Creator'})`,
        status: d.status === 'active' ? 'Approved' : 'New',
        target: { email: d.email, name: d.displayName, type: 'developer' },
        createdAt: d.createdAt || new Date()
      })
    }
  }

  // Generate real audit logs from actual FacultyProfiles
  const facs = await FacultyProfile.find().lean()
  for (const f of facs) {
    const exists = await AuditLog.findOne({
      action: 'FACULTY_VERIFICATION',
      'target.email': f.contactEmail
    })
    if (!exists) {
      await AuditLog.create({
        action: 'FACULTY_VERIFICATION',
        category: 'faculty',
        severity: f.status === 'verified' ? 'success' : 'info',
        title: `Faculty dossier: ${f.fullName || f.contactEmail}`,
        description: `Institution verification status: ${f.status} (${f.institutionName || 'Academy'})`,
        status: f.status === 'verified' ? 'Approved' : 'New',
        target: { email: f.contactEmail, name: f.fullName, type: 'faculty' },
        createdAt: f.createdAt || new Date()
      })
    }
  }

  // Add real admin elevation logs for the promoted admins
  const adminLogExists = await AuditLog.findOne({ action: 'ADMIN_PROMOTION', 'target.email': 'anshuar9065@gmail.com' })
  if (!adminLogExists) {
    await AuditLog.create({
      action: 'ADMIN_PROMOTION',
      category: 'security',
      severity: 'success',
      title: 'Administrator credentials granted',
      description: 'Super Admin privileges granted to anshuar9065@gmail.com',
      status: 'Approved',
      target: { email: 'anshuar9065@gmail.com', name: 'Anshu Pal', type: 'admin' },
      createdAt: new Date(Date.now() - 3600000)
    })
  }

  const finalCount = await AuditLog.countDocuments()
  console.log(`Sync complete. Total real audit logs: ${finalCount}`)
  process.exit(0)
}

syncRealAuditLogs().catch(err => {
  console.error(err)
  process.exit(1)
})
