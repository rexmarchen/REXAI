import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Application from '../src/models/Application.js';
import User from '../src/models/User.js';

dotenv.config();
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

async function migrate() {
  console.log('--- STARTING SQLITE TO MONGODB MIGRATION ---');
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected to MongoDB Atlas.');

  const targetUser = await User.findOne({ email: 'anshuar9065@gmail.com' });
  if (!targetUser) {
    throw new Error('User anshuar9065@gmail.com not found in MongoDB!');
  }
  const defaultUserId = targetUser._id.toString();
  console.log(`Target User ID for unassigned batches: ${defaultUserId} (${targetUser.email})`);

  const dbPath = path.resolve('data', 'rexion.sqlite');
  const sqliteDb = new DatabaseSync(dbPath);

  // Map batches to users
  const batchRows = sqliteDb.prepare('SELECT * FROM application_batches').all();
  const batchOwnerMap = new Map();
  for (const b of batchRows) {
    let owner = b.user_id;
    if (!owner || owner === 999 || owner === 1 || owner === 3 || owner === 'null') {
      owner = defaultUserId;
    } else {
      owner = String(owner);
    }
    batchOwnerMap.set(String(b.id), owner);
  }

  const appRows = sqliteDb.prepare('SELECT * FROM applications').all();
  console.log(`Found ${appRows.length} applications in SQLite to transfer.`);

  // Map sqlite status to valid Mongoose status
  const mapStatus = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'applied' || s === 'submitted') return 'SUBMITTED';
    if (s === 'manual_required') return 'VALIDATION_READY';
    if (s === 'applying') return 'SUBMITTING';
    if (s === 'queued') return 'QUEUED';
    if (s === 'failed') return 'FAILED';
    if (s === 'expired') return 'EXPIRED';
    return 'QUEUED';
  };

  let migratedCount = 0;
  let skippedCount = 0;

  for (const r of appRows) {
    const batchIdStr = String(r.batch_id || '');
    const userId = batchOwnerMap.get(batchIdStr) || defaultUserId;
    const mappedStatus = mapStatus(r.status);
    const canonicalId = `sqlite-legacy-${r.id}`;

    // Check if already in MongoDB
    const existing = await Application.findOne({
      $or: [
        { canonicalJobIdentity: canonicalId },
        { externalJobId: String(r.id) }
      ]
    });

    if (existing) {
      skippedCount++;
      continue;
    }

    const appDoc = {
      user: userId,
      batchId: batchIdStr,
      jobId: String(r.id),
      canonicalJobIdentity: canonicalId,
      platform: 'playwright',
      externalJobId: String(r.id),
      company: r.company || 'Company',
      jobTitle: r.job_title || 'Role',
      location: r.location || 'Remote',
      description: r.description || '',
      applicationUrl: r.posting_url || 'https://www.linkedin.com',
      tier: Number(r.tier || 1),
      channelUsed: r.channel_used || 'playwright',
      status: mappedStatus,
      matchScore: 92,
      sourcePostedAt: r.created_at ? new Date(r.created_at) : new Date(),
      freshnessTimestamp: r.created_at ? new Date(r.created_at) : new Date(),
      missingFields: [],
      needsUserAction: mappedStatus === 'VALIDATION_READY',
      evidenceScreenshot: r.evidence_screenshot_path || r.evidence_screenshot || null,
      submittedAt: (mappedStatus === 'SUBMITTED' && r.submitted_at) ? new Date(r.submitted_at) : (mappedStatus === 'SUBMITTED' ? new Date(r.created_at) : null),
      createdAt: r.created_at ? new Date(r.created_at) : new Date(),
      updatedAt: r.created_at ? new Date(r.created_at) : new Date(),
      auditEvents: [
        {
          eventType: mappedStatus,
          message: `Migrated legacy application record from SQLite: ${r.job_title} @ ${r.company}`,
          timestamp: r.created_at ? new Date(r.created_at) : new Date()
        }
      ]
    };

    try {
      await Application.create(appDoc);
      migratedCount++;
    } catch (createErr) {
      console.warn(`Failed to insert app ${r.id}:`, createErr.message);
    }
  }

  console.log(`Migration Complete: ${migratedCount} transferred, ${skippedCount} previously existed.`);

  const totalInMongo = await Application.countDocuments({});
  const totalUserApps = await Application.countDocuments({
    $or: [
      { user: defaultUserId },
      { userId: defaultUserId },
      { user: targetUser._id },
      { userId: targetUser._id }
    ]
  });
  console.log(`Current Total Applications in MongoDB: ${totalInMongo}`);
  console.log(`Current Applications for ${targetUser.email} in MongoDB: ${totalUserApps}`);

  await mongoose.disconnect();
}

migrate().catch(console.error);
