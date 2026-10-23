// Express routes the Rexion website talks to.
// app.use('/api/li-agent', createRouter({ requireAuth }));
// requireAuth sets req.user (supports req.user.id or req.user._id).
import express from 'express';
import crypto from 'node:crypto';
import { DateTime } from 'luxon';
import cfg from './config.js';
import { Account, Schedule, Post } from './models.js';
import { getRedis } from './redis.js';
import * as li from './linkedinClient.js';
import { encrypt } from './tokenCrypto.js';

const uid = (req) => String(req.user?.id || req.user?._id || '');
const str = (v, max) => (v == null ? undefined : String(v).trim().slice(0, max));
const list = (v, maxItems, maxLen) => (Array.isArray(v) ? v.slice(0, maxItems).map((x) => str(x, maxLen)).filter(Boolean) : []);
const wrap = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((e) => {
    console.error('[linkedin route error]', e);
    res.status(500).json({ error: 'Server error' });
  });
};

function createRouter({ requireAuth }) {
  const r = express.Router();

  // ---- OAuth callback (public: LinkedIn redirects the browser here) ----
  r.get('/callback', wrap(async (req, res) => {
    const back = (q) => res.redirect(`${cfg.frontendUrl}/settings/linkedin?${q}`);
    const { code, state, error } = req.query;
    if (error) return back(`error=${encodeURIComponent(error)}`);
    if (!code || !state) return back('error=missing_params');

    const key = `li:oauth:${state}`;
    const redis = getRedis();
    const userId = await redis.get(key);
    await redis.del(key); // one-time use
    if (!userId) return back('error=state_expired');

    try {
      const tok = await li.exchangeCode(code);
      const prof = await li.getProfile(tok.access_token);
      await Account.findOneAndUpdate({ userId }, {
        userId, memberUrn: `urn:li:person:${prof.sub}`, name: prof.name, picture: prof.picture,
        accessTokenEnc: encrypt(tok.access_token),
        expiresAt: new Date(Date.now() + tok.expires_in * 1000),
        status: 'active', lastWarnedDays: null,
      }, { upsert: true, new: true });
      // release posts that were held while the token was expired
      await Post.updateMany({ userId, status: 'held', content: { $exists: true, $ne: null } }, { $set: { status: 'approved', nextRetryAt: null } });
      return back('connected=1');
    } catch (e) {
      console.error('[linkedin callback]', e.message);
      return back('error=connect_failed');
    }
  }));

  r.use(requireAuth);

  r.get('/connect', wrap(async (req, res) => {
    const state = crypto.randomBytes(24).toString('hex');
    await getRedis().set(`li:oauth:${state}`, uid(req), 'EX', 600);
    res.json({ url: li.authUrl(state) }); // frontend does window.location = url
  }));

  r.get('/status', wrap(async (req, res) => {
    const a = await Account.findOne({ userId: uid(req) }).lean();
    if (!a) return res.json({ connected: false });
    const daysLeft = Math.ceil((a.expiresAt - Date.now()) / 864e5);
    res.json({
      connected: a.status === 'active' && daysLeft > 0,
      status: a.status,
      name: a.name,
      picture: a.picture,
      expiresAt: a.expiresAt,
      daysLeft: Math.max(daysLeft, 0)
    });
  }));

  r.delete('/disconnect', wrap(async (req, res) => {
    await Account.updateOne({ userId: uid(req) }, { $set: { status: 'revoked' }, $unset: { accessTokenEnc: '' } });
    await Schedule.updateOne({ userId: uid(req) }, { $set: { enabled: false } });
    await Post.updateMany({ userId: uid(req), status: { $in: ['planned', 'generating', 'pending_approval', 'approved', 'held'] } }, { $set: { status: 'cancelled' } });
    res.json({ ok: true });
  }));

  // ---- Schedule & content settings (the form on the website) ----
  r.get('/schedule', wrap(async (req, res) => {
    res.json((await Schedule.findOne({ userId: uid(req) }).lean()) || { enabled: false, slots: [], profile: {} });
  }));

  r.put('/schedule', wrap(async (req, res) => {
    const b = req.body || {};
    const errors = [];
    const timezone = str(b.timezone, 64) || 'UTC';
    if (!DateTime.local().setZone(timezone).isValid) errors.push('Invalid timezone');

    const slots = (Array.isArray(b.slots) ? b.slots : []).slice(0, 21).map((s) => ({
      day: Number(s.day), time: String(s.time || ''), theme: str(s.theme, 200), format: str(s.format, 60),
    }));
    for (const s of slots) {
      if (!(s.day >= 1 && s.day <= 7)) errors.push('Slot day must be 1 (Mon) to 7 (Sun)');
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time)) errors.push(`Invalid time "${s.time}" (use HH:mm)`);
    }
    if (errors.length) return res.status(400).json({ errors: [...new Set(errors)] });

    const p = b.profile || {};
    const doc = {
      enabled: !!b.enabled, timezone, slots,
      approvalMode: b.approvalMode === 'auto' ? 'auto' : 'manual',
      maxPostsPerDay: Math.min(Math.max(Number(b.maxPostsPerDay) || 2, 1), 5),
      jitterMinutes: Math.min(Math.max(Number(b.jitterMinutes) || 0, 0), 30),
      profile: {
        about: str(p.about, 1500), industry: str(p.industry, 120), audience: str(p.audience, 300),
        tone: str(p.tone, 200), brandVoice: str(p.brandVoice, 600), cta: str(p.cta, 200),
        language: str(p.language, 40) || 'English',
        topics: list(p.topics, 20, 120), avoid: list(p.avoid, 30, 60), hashtags: list(p.hashtags, 10, 40),
      },
    };
    if (doc.enabled) {
      const a = await Account.findOne({ userId: uid(req), status: 'active' }).lean();
      if (!a) return res.status(400).json({ errors: ['Connect LinkedIn before enabling the schedule'] });
    }
    const saved = await Schedule.findOneAndUpdate({ userId: uid(req) }, { $set: { userId: uid(req), ...doc } }, { upsert: true, new: true }).lean();
    res.json(saved);
  }));

  // ---- Posts: calendar, approval, editing ----
  r.get('/posts', wrap(async (req, res) => {
    const q = { userId: uid(req) };
    if (req.query.status) q.status = String(req.query.status);
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    res.json(await Post.find(q).sort({ scheduledFor: -1 }).limit(limit).lean());
  }));

  const EDITABLE = ['planned', 'pending_approval', 'approved'];
  const mine = (req) => ({ _id: req.params.id, userId: uid(req) });

  r.patch('/posts/:id', wrap(async (req, res) => {
    const set = {};
    if (req.body.content != null) {
      const c = String(req.body.content).trim();
      if (!c || c.length > 3000) return res.status(400).json({ error: 'Content must be 1 to 3000 characters' });
      set.content = c;
    }
    if (req.body.scheduledFor) {
      const d = new Date(req.body.scheduledFor);
      if (isNaN(d) || d <= new Date()) return res.status(400).json({ error: 'scheduledFor must be a future date' });
      set.scheduledFor = d;
    }
    const post = await Post.findOneAndUpdate({ ...mine(req), status: { $in: EDITABLE } }, { $set: set }, { new: true }).lean();
    post ? res.json(post) : res.status(404).json({ error: 'Not found or not editable' });
  }));

  r.post('/posts/:id/approve', wrap(async (req, res) => {
    const post = await Post.findOneAndUpdate({ ...mine(req), status: 'pending_approval', content: { $ne: null } }, { $set: { status: 'approved' } }, { new: true }).lean();
    post ? res.json(post) : res.status(404).json({ error: 'Nothing to approve' });
  }));

  r.post('/posts/:id/reject', wrap(async (req, res) => {
    const post = await Post.findOneAndUpdate({ ...mine(req), status: { $in: EDITABLE } }, { $set: { status: 'cancelled' } }, { new: true }).lean();
    post ? res.json(post) : res.status(404).json({ error: 'Not found' });
  }));

  r.post('/posts/:id/regenerate', wrap(async (req, res) => {
    const post = await Post.findOneAndUpdate({ ...mine(req), status: { $in: ['planned', 'pending_approval', 'approved', 'failed'] }, scheduledFor: { $gt: new Date() } },
      { $set: { status: 'planned', content: null, genAttempts: 0, error: null } }, { new: true }).lean();
    post ? res.json(post) : res.status(404).json({ error: 'Not found' });
  }));

  r.post('/posts/:id/publish-now', wrap(async (req, res) => {
    const post = await Post.findOneAndUpdate({ ...mine(req), status: { $in: ['pending_approval', 'approved'] }, content: { $ne: null } },
      { $set: { status: 'approved', scheduledFor: new Date(), nextRetryAt: null } }, { new: true }).lean();
    post ? res.json(post) : res.status(404).json({ error: 'Not found' });
  }));

  return r;
}

export { createRouter };
export default createRouter;
