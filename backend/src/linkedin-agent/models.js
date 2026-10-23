import mongoose from 'mongoose';
const { Schema } = mongoose;

// One LinkedIn connection per Rexion user. Tokens are stored encrypted.
const LinkedInAccount = mongoose.models.LiAgentAccount || mongoose.model('LiAgentAccount', new Schema({
  userId: { type: String, required: true, unique: true },
  memberUrn: String,               // urn:li:person:xxxx
  name: String,
  picture: String,
  accessTokenEnc: String,
  expiresAt: Date,                 // self-serve tokens last ~60 days, no refresh token
  status: { type: String, enum: ['active', 'expired', 'revoked'], default: 'active' },
  lastWarnedDays: Number,
}, { timestamps: true }));

// Everything the user sets on the Rexion website.
const LinkedInSchedule = mongoose.models.LiAgentSchedule || mongoose.model('LiAgentSchedule', new Schema({
  userId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  timezone: { type: String, default: 'UTC' },            // IANA, e.g. Asia/Kolkata
  approvalMode: { type: String, enum: ['auto', 'manual'], default: 'manual' },
  maxPostsPerDay: { type: Number, default: 2, min: 1, max: 5 },
  jitterMinutes: { type: Number, default: 5, min: 0, max: 30 },
  slots: [{
    day: { type: Number, min: 1, max: 7 },               // 1 = Monday ... 7 = Sunday
    time: String,                                        // "HH:mm" in the user's timezone
    theme: String,                                       // optional: what this slot is about
    format: String,                                      // optional: story, how-to, ...
  }],
  profile: {
    about: String, industry: String, audience: String,
    tone: String, brandVoice: String, cta: String,
    language: { type: String, default: 'English' },
    topics: [String], avoid: [String], hashtags: [String],
  },
}, { timestamps: true }));

const LinkedInPostSchema = new Schema({
  userId: { type: String, required: true, index: true },
  slotKey: { type: String, required: true },
  scheduledFor: { type: Date, required: true },
  theme: String,
  format: String,
  content: String,
  status: {
    type: String, default: 'planned',
    enum: ['planned', 'generating', 'pending_approval', 'approved', 'publishing',
           'published', 'failed', 'held', 'uncertain', 'missed', 'cancelled'],
  },
  attempts: { type: Number, default: 0 },
  genAttempts: { type: Number, default: 0 },
  nextRetryAt: Date,
  linkedinPostUrn: String,
  publishedAt: Date,
  error: String,
}, { timestamps: true });
LinkedInPostSchema.index({ userId: 1, slotKey: 1 }, { unique: true });   // a slot can never create two posts
LinkedInPostSchema.index({ status: 1, scheduledFor: 1 });

export const Account = LinkedInAccount;
export const Schedule = LinkedInSchedule;
export const Post = mongoose.models.LiAgentPost || mongoose.model('LiAgentPost', LinkedInPostSchema);
