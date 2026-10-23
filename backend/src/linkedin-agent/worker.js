// Run as its own process (NOT inside the web cluster): node src/linkedin-agent/worker.js
import 'dotenv/config';
import mongoose from 'mongoose';
import { Queue, Worker } from 'bullmq';
import { bullConnection } from './redis.js';
import * as P from './processors.js';

const QUEUE = 'rexion-linkedin';

(async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
  if (!mongoUri) {
    console.error('[linkedin-agent worker] No MongoDB connection string provided.');
    process.exit(1);
  }

  await mongoose.connect(mongoUri, { maxPoolSize: 20, waitQueueTimeoutMS: 5000 });

  const queue = new Queue(QUEUE, { connection: bullConnection() });

  // Repeatable jobs. upsertJobScheduler is idempotent, so running 2 workers never duplicates them.
  const every = (ms) => ({ every: ms });
  const tpl = (name) => ({ name, opts: { removeOnComplete: 50, removeOnFail: 200 } });
  await queue.upsertJobScheduler('plan', every(15 * 60e3), tpl('plan'));
  await queue.upsertJobScheduler('generate', every(5 * 60e3), tpl('generate'));
  await queue.upsertJobScheduler('dispatch', every(60e3), tpl('dispatch'));
  await queue.upsertJobScheduler('token-check', every(6 * 3600e3), tpl('token-check'));

  const worker = new Worker(QUEUE, async (job) => {
    switch (job.name) {
      case 'plan': return P.plan();
      case 'generate': return P.generateDue();
      case 'dispatch': return P.dispatchDue(queue);
      case 'publish': return P.publishPost(job.data.postId);
      case 'token-check': return P.tokenCheck();
      default: throw new Error(`unknown job ${job.name}`);
    }
  }, {
    connection: bullConnection(),
    concurrency: Number(process.env.LI_WORKER_CONCURRENCY) || 10,
    limiter: { max: 10, duration: 1000 }, // global cap on jobs per second (protects LinkedIn + Anthropic APIs)
  });

  worker.on('failed', (job, err) => console.error('[job failed]', job?.name, err.message));
  console.log('[linkedin-agent] worker started');

  const shutdown = async () => {
    await worker.close(); // finish in-flight jobs
    await queue.close();
    await mongoose.disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
})().catch((e) => { console.error('[linkedin-agent worker error]', e); process.exit(1); });
