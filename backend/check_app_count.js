import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rexion';
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const total = await db.collection('applications').countDocuments();
  const byState = await db.collection('applications').aggregate([
    { $group: { _id: '$state', count: { $sum: 1 } } }
  ]).toArray();

  const recent = await db.collection('applications').find({}).sort({ createdAt: -1 }).limit(10).toArray();

  console.log('TOTAL APPLICATIONS IN DB:', total);
  if (recent.length > 0) {
    console.log('SAMPLE RECENT APPLICATION:');
    console.log(JSON.stringify({
      id: recent[0]._id,
      jobTitle: recent[0].jobTitle,
      company: recent[0].company,
      status: recent[0].status,
      state: recent[0].state,
      platform: recent[0].platform,
      createdAt: recent[0].createdAt
    }, null, 2));
  }
  const byStatus = await db.collection('applications').aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]).toArray();
  console.log('APPLICATIONS BY STATUS:', JSON.stringify(byStatus, null, 2));

  await mongoose.disconnect();
}

check().catch(e => {
  console.error('Check failed:', e);
  process.exit(1);
});
