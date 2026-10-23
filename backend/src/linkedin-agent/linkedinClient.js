import cfg from './config.js';
const API = 'https://api.linkedin.com';

function authUrl(state) {
  const p = new URLSearchParams({
    response_type: 'code', client_id: cfg.linkedin.clientId,
    redirect_uri: cfg.linkedin.redirectUri, state, scope: cfg.linkedin.scopes,
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${p}`;
}

async function exchangeCode(code) {
  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code', code,
      client_id: cfg.linkedin.clientId, client_secret: cfg.linkedin.clientSecret,
      redirect_uri: cfg.linkedin.redirectUri,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'LinkedIn token exchange failed');
  return data; // { access_token, expires_in, ... } (no refresh_token for self-serve apps)
}

async function getProfile(token) {
  const res = await fetch(`${API}/v2/userinfo`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`LinkedIn userinfo failed (${res.status})`);
  return res.json(); // { sub, name, picture, ... }
}

// LinkedIn treats these characters as markup in "commentary"; unescaped, posts get truncated.
// '#' is left alone so hashtags still work.
function escapeCommentary(t) {
  return t.replace(/[\\|{}@\[\]()<>*_~]/g, (m) => '\\' + m);
}

// Error kinds drive what the worker does next:
// auth -> token dead, hold posts, ask user to reconnect
// retry -> LinkedIn clearly did NOT accept it (429/502/503/504), safe to retry later
// uncertain -> timeout / network / 500: it MIGHT have posted. Never auto-retry (would double post)
// fatal -> bad request, don't retry
async function createPost({ token, authorUrn, text }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  let res;
  try {
    res = await fetch(`${API}/rest/posts`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': cfg.linkedin.version,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: authorUrn,
        commentary: escapeCommentary(text),
        visibility: 'PUBLIC',
        distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      }),
    });
  } catch (e) {
    const err = new Error(`network/timeout: ${e.message}`);
    err.kind = 'uncertain';
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 201) return { urn: res.headers.get('x-restli-id') || null };

  const body = (await res.text().catch(() => '')).slice(0, 300);
  const err = new Error(`LinkedIn ${res.status}: ${body}`);
  err.status = res.status;
  err.retryAfter = Number(res.headers.get('retry-after')) || null;
  if (res.status === 401) err.kind = 'auth';
  else if ([429, 502, 503, 504].includes(res.status)) err.kind = 'retry';
  else if (res.status >= 500) err.kind = 'uncertain';
  else err.kind = 'fatal';
  throw err;
}

export { authUrl, exchangeCode, getProfile, createPost, escapeCommentary };
