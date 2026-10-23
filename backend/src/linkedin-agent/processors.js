import cfg from './config.js';
import { Account, Schedule, Post } from './models.js';
import { computeUpcomingSlots } from './planner.js';
import { generatePost } from './contentAgent.js';
import { createPost } from './linkedinClient.js';
import { decrypt } from './tokenCrypto.js';
import { notify } from './notify.js';

async function inChunks(items, size, fn) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.allSettled(items.slice(i, i + size).map(fn));
  }
}

// 1) PLAN: turn every enabled user's weekly slots into concrete post rows for the next 48h.
async function plan() {
  const now = new Date();
  for await (const s of Schedule.find({ enabled: true }).lean().cursor()) {
    try {
      const acct = await Account.findOne({ userId: s.userId, status: 'active' }).lean();
      if (!acct) continue;
      const slots = computeUpcomingSlots(s, now, cfg.planAheadHours);
      const keep = new Set(slots.map((x) => x.slotKey));

      for (const slot of slots) {
        await Post.updateOne(
          { userId: s.userId, slotKey: slot.slotKey },
          { $setOnInsert: { userId: s.userId, slotKey: slot.slotKey, scheduledFor: slot.scheduledFor,
                            theme: slot.theme, format: slot.format, status: 'planned' } },
          { upsert: true }
        ).catch((e) => { if (e.code !== 11000) throw e; });
      }
      // user changed their schedule: cancel future posts whose slot no longer exists
      await Post.updateMany(
        { userId: s.userId, status: { $in: ['planned', 'pending_approval', 'approved'] },
          scheduledFor: { $gt: now }, slotKey: { $nin: [...keep] } },
        { $set: { status: 'cancelled' } }
      );
    } catch (e) { console.error('[plan] user', s.userId, e.message); }
  }
}

// 2) GENERATE: write content ~6h before each post is due.
async function generateDue() {
  const horizon = new Date(Date.now() + cfg.generateLeadHours * 3600e3);
  const due = await Post.find({ status: 'planned', scheduledFor: { $lte: horizon } })
    .sort({ scheduledFor: 1 }).limit(25).select('_id').lean();

  await inChunks(due, 5, async ({ _id }) => {
    const post = await Post.findOneAndUpdate({ _id, status: 'planned' }, { $set: { status: 'generating' } }, { new: true });
    if (!post) return; // another worker took it
    try {
      const schedule = await Schedule.findOne({ userId: post.userId }).lean();
      if (!schedule || !schedule.enabled) { await Post.updateOne({ _id }, { $set: { status: 'cancelled' } }); return; }
      const recent = await Post.find({
        userId: post.userId, _id: { $ne: _id },
        status: { $in: ['published', 'pending_approval', 'approved', 'generating'] },
      }).sort({ scheduledFor: -1 }).limit(10).select('content format').lean();

      const { content, format } = await generatePost({
        profile: schedule.profile || {}, slot: { theme: post.theme, format: post.format }, recent,
      });
      const status = schedule.approvalMode === 'auto' ? 'approved' : 'pending_approval';
      await Post.updateOne({ _id }, { $set: { content, format, status, error: null } });
      if (status === 'pending_approval') await notify(post.userId, 'approval_needed', { postId: String(_id), scheduledFor: post.scheduledFor });
    } catch (e) {
      const genAttempts = (post.genAttempts || 0) + 1;
      await Post.updateOne({ _id }, { $set: { status: genAttempts >= 3 ? 'failed' : 'planned', genAttempts, error: e.message.slice(0, 300) } });
      if (genAttempts >= 3) await notify(post.userId, 'post_failed', { postId: String(_id), reason: 'content generation failed' });
    }
  });
}

// 3) DISPATCH: every minute, claim posts that are due and queue them for publishing.
async function dispatchDue(queue) {
  const now = new Date();
  const tenMinAgo = new Date(Date.now() - 10 * 60e3);

  // crash recovery
  await Post.updateMany({ status: 'generating', updatedAt: { $lt: tenMinAgo } }, { $set: { status: 'planned' } });
  await Post.updateMany({ status: 'publishing', updatedAt: { $lt: tenMinAgo } },
    { $set: { status: 'uncertain', error: 'Worker stopped mid-publish. Check LinkedIn before retrying.' } });
  // never publish stale content
  const staleBefore = new Date(Date.now() - cfg.missedAfterMinutes * 60e3);
  await Post.updateMany({ status: { $in: ['planned', 'pending_approval', 'approved', 'held'] }, scheduledFor: { $lt: staleBefore } },
    { $set: { status: 'missed' } });

  const due = await Post.find({
    status: 'approved', scheduledFor: { $lte: now },
    $or: [{ nextRetryAt: null }, { nextRetryAt: { $lte: now } }],
  }).sort({ scheduledFor: 1 }).limit(100).select('_id').lean();

  for (const { _id } of due) {
    const claimed = await Post.findOneAndUpdate({ _id, status: 'approved' },
      { $set: { status: 'publishing' }, $inc: { attempts: 1 } }, { new: true });
    if (!claimed) continue;
    await queue.add('publish', { postId: String(_id) }, {
      jobId: `publish-${_id}-${claimed.attempts}`, attempts: 1,
      removeOnComplete: 1000, removeOnFail: 2000,
    });
  }
}

// 4) PUBLISH one post. LinkedIn is called at most once per claim.
async function publishPost(postId) {
  const post = await Post.findOne({ _id: postId, status: 'publishing' });
  if (!post) return;

  const acct = await Account.findOne({ userId: post.userId });
  if (!acct || acct.status !== 'active' || acct.expiresAt <= new Date()) {
    if (acct && acct.status === 'active') { acct.status = 'expired'; await acct.save(); }
    await Post.updateOne({ _id: post._id }, { $set: { status: 'held', error: 'LinkedIn connection expired. Reconnect to resume.' } });
    await notify(post.userId, 'reconnect_needed', {});
    return;
  }

  try {
    const token = decrypt(acct.accessTokenEnc);
    const { urn } = await createPost({ token, authorUrn: acct.memberUrn, text: post.content });
    await Post.updateOne({ _id: post._id }, { $set: { status: 'published', linkedinPostUrn: urn, publishedAt: new Date(), error: null } });
  } catch (e) {
    const msg = String(e.message).slice(0, 300);
    if (e.kind === 'auth') {
      await Account.updateOne({ _id: acct._id }, { $set: { status: 'expired' } });
      await Post.updateOne({ _id: post._id }, { $set: { status: 'held', error: msg } });
      await notify(post.userId, 'reconnect_needed', {});
    } else if (e.kind === 'retry' && post.attempts < cfg.maxPublishAttempts) {
      const wait = (e.retryAfter || Math.min(2 ** post.attempts * 60, 1800)) * 1000;
      await Post.updateOne({ _id: post._id }, { $set: { status: 'approved', nextRetryAt: new Date(Date.now() + wait), error: msg } });
    } else if (e.kind === 'uncertain') {
      await Post.updateOne({ _id: post._id }, { $set: { status: 'uncertain', error: msg } });
      await notify(post.userId, 'post_uncertain', { postId: String(post._id) });
    } else {
      await Post.updateOne({ _id: post._id }, { $set: { status: 'failed', error: msg } });
      await notify(post.userId, 'post_failed', { postId: String(post._id), reason: msg });
    }
  }
}

// 5) TOKEN CHECK: LinkedIn self-serve tokens last ~60 days with no refresh. Warn early.
async function tokenCheck() {
  const soon = new Date(Date.now() + 7 * 864e5);
  for await (const a of Account.find({ status: 'active', expiresAt: { $lte: soon } }).cursor()) {
    const daysLeft = Math.ceil((a.expiresAt - Date.now()) / 864e5);
    if (daysLeft <= 0) {
      a.status = 'expired'; await a.save();
      await notify(a.userId, 'reconnect_needed', {});
    } else {
      const bucket = daysLeft <= 1 ? 1 : daysLeft <= 3 ? 3 : 7;
      if (a.lastWarnedDays !== bucket) {
        await notify(a.userId, 'token_expiring', { daysLeft });
        a.lastWarnedDays = bucket; await a.save();
      }
    }
  }
}

export { plan, generateDue, dispatchDue, publishPost, tokenCheck };
