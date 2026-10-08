import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function inspect() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const submitted = await db.collection('applications').find({ status: 'SUBMITTED' }).sort({ submittedAt: -1 }).limit(10).toArray();

  console.log('--- DETAILS OF RECENT SUBMITTED APPS ---');
  submitted.forEach((app, i) => {
    console.log(`\n#${i + 1}: ${app.company} - ${app.jobTitle}`);
    console.log(`URL: ${app.applicationUrl || app.jobUrl}`);
    console.log(`Channel: ${app.channelUsed || app.platform}`);
    console.log(`SubmittedAt: ${app.submittedAt}`);
    if (app.auditEvents && app.auditEvents.length > 0) {
      console.log('Last 2 audit events:', app.auditEvents.slice(-2).map(e => ({ eventType: e.eventType, message: e.message })));
    }
  });

  await mongoose.disconnect();
}
inspect();
