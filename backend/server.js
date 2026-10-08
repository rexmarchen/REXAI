import dotenv from 'dotenv'
dotenv.config()
dotenv.config({ path: '.env.local', override: true })
import './src/config/telemetry.js'
import mongoose from 'mongoose'
import app from './src/app.js'

const PORT = process.env.PORT || 5000

import Application from './src/models/Application.js'
import ApplicationBatch from './src/models/ApplicationBatch.js'

export const applicationBatches = new Map()
export const applications = new Map()

export async function findApplicationBatchById(batchId) {
  const numId = Number(batchId)
  let batch = applicationBatches.get(numId)
  if (batch) return batch

  try {
    const doc = await ApplicationBatch.findOne({ batchId: numId })
    if (doc) {
      batch = {
        id: doc.batchId,
        userId: doc.userId,
        status: doc.status,
        emailPreview: doc.emailPreview,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      }
      applicationBatches.set(numId, batch)
      return batch
    }
  } catch (err) {
    console.warn('MongoDB findApplicationBatchById error:', err.message)
  }

  // Graceful fallback so client doesn't 404 poll forever
  return { id: numId, status: 'completed', applications: [] }
}

export async function findApplicationsByBatchId(batchId) {
  const batchIdStr = String(batchId)
  try {
    const docs = await Application.find({ batchId: batchIdStr })
    if (docs && docs.length > 0) {
      return docs.map(d => ({
        id: String(d._id),
        batchId: String(d.batchId),
        jobTitle: d.jobTitle,
        company: d.company,
        location: d.location,
        description: d.description,
        tier: d.tier,
        postingUrl: d.applicationUrl,
        status: (d.status === 'SUBMITTED' ? 'applied' : (d.status === 'VALIDATION_READY' ? 'manual_required' : String(d.status).toLowerCase())),
        channelUsed: d.channelUsed,
        errorMessage: d.failureReason || null,
        submittedAt: d.submittedAt,
        evidenceScreenshotPath: d.evidenceScreenshot,
        createdAt: d.createdAt
      }))
    }
  } catch (err) {
    console.warn('MongoDB findApplicationsByBatchId error:', err.message)
  }

  return Array.from(applications.values()).filter((application) => String(application.batchId) === batchIdStr)
}

export async function updateApplicationBatchStatus(batchId, status) {
  const numId = Number(batchId)
  const batch = applicationBatches.get(numId) || { id: numId, userId: 1 }
  batch.status = status
  batch.updatedAt = new Date().toISOString()
  applicationBatches.set(numId, batch)

  try {
    await ApplicationBatch.findOneAndUpdate(
      { batchId: numId },
      { status, updatedAt: new Date() },
      { upsert: true }
    )
  } catch (err) {
    console.warn('MongoDB updateApplicationBatchStatus error:', err.message)
  }

  return batch
}

export async function updateApplicationEvidence(applicationId, evidence) {
  const strId = String(applicationId)
  const application = applications.get(strId) || { id: strId }
  Object.assign(application, evidence)
  applications.set(strId, application)

  try {
    const updateDoc = {}
    if (evidence.status) {
      const s = String(evidence.status).toLowerCase()
      updateDoc.status = (s === 'applied' || s === 'submitted') ? 'SUBMITTED' : (s === 'manual_required' ? 'VALIDATION_READY' : (s === 'failed' ? 'FAILED' : 'QUEUED'))
    }
    if (evidence.evidenceScreenshotPath || evidence.screenshotPath) {
      updateDoc.evidenceScreenshot = evidence.evidenceScreenshotPath || evidence.screenshotPath
    }
    if (evidence.errorMessage) {
      updateDoc.failureReason = evidence.errorMessage
    }
    if (evidence.submittedAt) {
      updateDoc.submittedAt = new Date(evidence.submittedAt)
    }

    if (mongoose.Types.ObjectId.isValid(strId)) {
      await Application.findByIdAndUpdate(strId, updateDoc)
    } else {
      await Application.findOneAndUpdate(
        { $or: [{ externalJobId: strId }, { jobId: strId }] },
        updateDoc
      )
    }
  } catch (err) {
    console.warn('MongoDB updateApplicationEvidence error:', err.message)
  }

  return application
}

export async function updateApplicationStatus(applicationId, status) {
  return updateApplicationEvidence(applicationId, { status })
}

export async function updateApplicationBatchEmailPreview(batchId, filename) {
  const numId = Number(batchId)
  try {
    await ApplicationBatch.findOneAndUpdate({ batchId: numId }, { emailPreview: filename })
  } catch (err) {
    console.warn('MongoDB updateApplicationBatchEmailPreview error:', err.message)
  }
  return updateApplicationEvidence(`batch-${batchId}`, { emailPreview: filename })
}

export async function createApplicationBatch(userId, status = 'pending') {
  const id = Date.now()
  const batch = { id, userId, status, createdAt: new Date().toISOString() }
  applicationBatches.set(Number(id), batch)

  try {
    await ApplicationBatch.create({
      batchId: id,
      userId: userId || 1,
      status
    })
  } catch (err) {
    console.warn('MongoDB createApplicationBatch error:', err.message)
  }

  return batch
}

export async function createApplication(arg1, arg2 = {}) {
  let batchId
  let data
  if (typeof arg1 === 'object' && arg1 !== null) {
    data = arg1
    batchId = arg1.batchId
  } else {
    batchId = arg1
    data = arg2
  }

  const numBatchId = Number(batchId) || Date.now()
  const rawStatus = String(data.status || data.state || 'queued').toLowerCase()
  const mappedStatus = (rawStatus === 'applied' || rawStatus === 'submitted') ? 'SUBMITTED' : (rawStatus === 'manual_required' ? 'VALIDATION_READY' : (rawStatus === 'failed' ? 'FAILED' : 'QUEUED'))

  let docId = data.id || null
  try {
    const createdDoc = await Application.create({
      user: data.userId || data.user || '6a802ac956bb1dfbaa7cda78',
      batchId: String(numBatchId),
      jobId: String(data.jobId || data.id || Date.now()),
      canonicalJobIdentity: String(data.canonicalJobIdentity || data.jobId || Date.now()),
      platform: data.platform || 'playwright',
      externalJobId: String(data.externalJobId || data.id || Date.now()),
      company: data.company || 'Company',
      jobTitle: data.jobTitle || data.job_title || 'Role',
      location: data.location || 'Remote',
      description: data.description || '',
      applicationUrl: data.postingUrl || data.posting_url || data.applicationUrl || 'https://www.linkedin.com',
      tier: Number(data.tier || 1),
      channelUsed: data.channelUsed || data.channel_used || 'playwright',
      status: mappedStatus,
      matchScore: Number(data.matchScore || 90),
      missingFields: [],
      evidenceScreenshot: data.evidenceScreenshotPath || data.evidence_screenshot || null,
      submittedAt: mappedStatus === 'SUBMITTED' ? new Date() : null
    })
    docId = String(createdDoc._id)
  } catch (err) {
    console.warn('MongoDB createApplication error:', err.message)
  }

  if (!docId) {
    docId = `app-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
  }

  const application = { id: String(docId), ...data, batchId: String(batchId), createdAt: new Date().toISOString() }
  applications.set(String(docId), application)
  return application
}

export async function findLatestResumePrediction() {
  return null
}

setImmediate(() => {
  if (app && typeof app.listen === 'function') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`)
    })
  }
})

const mongoUri =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL ||
  'mongodb+srv://anshuar9065_db_user:Anshu_90-@cluster0.ytzioe4.mongodb.net/rexion?appName=Cluster0'

const mongoOptions = {
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 1
}

mongoose.connection.on('connected', () => {
  console.log('[MongoDB] Connected to MongoDB Atlas successfully')
})

mongoose.connection.on('error', (err) => {
  console.warn('[MongoDB] Connection error:', err.message)
})

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected from Atlas. Scheduling auto-reconnect...')
  if (mongoUri) {
    setTimeout(() => {
      if (mongoose.connection.readyState === 0) {
        mongoose.connect(mongoUri, mongoOptions).catch((e) => {
          console.warn('[MongoDB] Auto-reconnect failed:', e.message)
        })
      }
    }, 2500)
  }
})

if (mongoUri) {
  mongoose.connect(mongoUri, mongoOptions)
    .catch(err => {
      console.warn('Database initial connection warning:', err.message)
    })
}