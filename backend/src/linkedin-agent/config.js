export default {
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    redirectUri: process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:5000/api/li-agent/callback',
    // YYYYMM. LinkedIn retires old versions, so bump this when needed.
    version: process.env.LINKEDIN_API_VERSION || '202608',
    scopes: 'openid profile w_member_social',
  },
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
  planAheadHours: 48,        // how far ahead slots become post rows
  generateLeadHours: 6,      // generate content this long before posting time
  missedAfterMinutes: 120,   // a post this late is marked "missed", never published stale
  maxPublishAttempts: 5,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
