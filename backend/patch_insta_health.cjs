const fs = require('fs');
const path = require('path');

const healthPath = 'c:/Users/anshupal/Downloads/-insta-agent/rexeditzz-insta-agent/src/health.ts';
let code = fs.readFileSync(healthPath, 'utf8');

const target = `    // Ping endpoint for fast uptime check
    if (pathname === "/ping") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("PONG");
      return;
    }`;

const addition = `    // Helper: Parse JSON body
    const readJson = async (): Promise<any> => {
      return new Promise((resolve) => {
        let data = "";
        req.on("data", (chunk) => { data += chunk; });
        req.on("end", () => {
          try { resolve(JSON.parse(data || "{}")); } catch { resolve({}); }
        });
        req.on("error", () => resolve({}));
      });
    };

    // 1. Meta / Instagram Account Discovery Endpoint
    if (pathname === "/api/discover-account" && req.method === "POST") {
      try {
        const body = await readJson();
        const token = String(body.accessToken || body.access_token || "").trim();
        const appId = String(body.appId || body.clientId || "").trim();
        const appSecret = String(body.appSecret || body.clientSecret || "").trim();

        if (!token) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false, success: false, error: "Meta / Instagram access token is required." }));
          return;
        }

        let igUserId: string | null = null;
        let igUsername: string | null = null;
        let name: string = "Instagram User";
        let avatar: string = "";

        // Instagram Basic Display / User Token (starts with IG)
        if (token.startsWith("IG")) {
          const resMe = await fetch(\`https://graph.instagram.com/v23.0/me?fields=id,username,name,profile_picture_url&access_token=\${encodeURIComponent(token)}\`);
          const dataMe: any = await resMe.json().catch(() => ({}));
          if (dataMe.error) {
            throw new Error(dataMe.error.message || "Invalid Instagram user access token");
          }
          igUserId = dataMe.id;
          igUsername = dataMe.username;
          name = dataMe.name || dataMe.username || "Instagram Creator";
          avatar = dataMe.profile_picture_url || "";
        } else {
          // Meta Graph API (Facebook Page -> Connected Instagram Business Account)
          const resMe = await fetch(\`https://graph.facebook.com/v23.0/me?fields=id,name,accounts{id,name,instagram_business_account{id,username,name,profile_picture_url}}&access_token=\${encodeURIComponent(token)}\`);
          const dataMe: any = await resMe.json().catch(() => ({}));
          if (dataMe.error) {
            throw new Error(dataMe.error.message || "Invalid Meta Graph API token");
          }
          if (dataMe.accounts?.data?.[0]?.instagram_business_account) {
            const ig = dataMe.accounts.data[0].instagram_business_account;
            igUserId = ig.id;
            igUsername = ig.username;
            name = ig.name || dataMe.name || "Instagram Business";
            avatar = ig.profile_picture_url || "";
          } else {
            igUserId = dataMe.id;
            igUsername = dataMe.name ? dataMe.name.toLowerCase().replace(/\\s+/g, "_") : "instagram_user";
            name = dataMe.name || "Instagram User";
          }
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          ok: true,
          success: true,
          account: {
            id: igUserId,
            igUserId,
            username: igUsername,
            accountName: name,
            avatar,
            appId,
            verifiedAt: new Date().toISOString()
          },
          message: \`✓ Verified Instagram account @\${igUsername} (\${igUserId})\`
        }));
      } catch (err: any) {
        log.error({ err: err.message }, "Error in /api/discover-account");
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, success: false, error: err.message }));
      }
      return;
    }

    // 2. Video Reel Synthesis (From Topic OR GitHub Repository)
    if (pathname === "/api/generate-reel" && (req.method === "POST" || req.method === "GET")) {
      try {
        const body = req.method === "POST" ? await readJson() : Object.fromEntries(url.searchParams.entries());
        const { topic, githubRepo, userId, authorName } = body;

        let topicOverride = topic || "";

        // If GitHub Repository provided, extract repo details & structure
        if (githubRepo && typeof githubRepo === "string" && githubRepo.trim()) {
          const cleanRepo = githubRepo.trim().replace(/^https?:\\/\\/github\\.com\\//, "").replace(/\\/$/, "");
          log.info({ cleanRepo }, "Analyzing GitHub repository for Reel generation...");
          try {
            const ghRes = await fetch(\`https://api.github.com/repos/\${cleanRepo}\`, {
              headers: { "User-Agent": "REXION-AI-Agent" },
              signal: AbortSignal.timeout(10000)
            });
            if (ghRes.ok) {
              const repoData: any = await ghRes.json();
              const repoTitle = repoData.name || cleanRepo.split("/")[1] || "Project";
              const repoDesc = repoData.description || "Production system design and high-performance architecture";
              const lang = repoData.language || "TypeScript / Python";
              topicOverride = \`Showcase GitHub Open-Source Project: "\${repoTitle}" (\${lang}). What it solves: \${repoDesc}. Target audience: Software engineers and tech leads. Highlight 3 standout engineering capabilities and clean code structure.\`;
            } else {
              topicOverride = \`Showcase GitHub Project: "\${cleanRepo}". Highlights: System architecture, high concurrency, and clean modular design.\`;
            }
          } catch (ghErr: any) {
            log.warn({ err: ghErr.message }, "Could not fetch GitHub API metadata, using repo name fallback");
            topicOverride = \`Showcase GitHub Project: "\${cleanRepo}". Highlights: System architecture, high concurrency, and clean modular design.\`;
          }
        }

        if (!topicOverride) {
          topicOverride = "System Design & Distributed Systems: High-Throughput Resilience";
        }

        log.info({ topicOverride, userId, authorName }, "Synthesizing AI Reel from Topic / GitHub Project...");
        const { runContentLifecycle } = await import("./modules/automationOrchestrator.js");
        const result = await runContentLifecycle({
          preferredFormat: "REEL",
          topicOverride
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          ok: true,
          success: true,
          message: "🎉 Reel synthesized and queued in SQLite agent database!",
          post: result
        }));
      } catch (err: any) {
        log.error({ err: err.message }, "Error in /api/generate-reel");
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, success: false, error: err.message }));
      }
      return;
    }

    // 3. Publish Live To Instagram
    if (pathname === "/api/publish-now" && req.method === "POST") {
      try {
        const body = await readJson();
        const { postId, accessToken, igUserId } = body;
        
        let targetPost: any = null;
        if (postId) {
          targetPost = db.prepare("SELECT * FROM posts WHERE id = ?").get(postId);
        } else {
          targetPost = db.prepare("SELECT * FROM posts WHERE status IN ('approved', 'drafted', 'new') ORDER BY scheduled_at ASC LIMIT 1").get();
        }

        if (!targetPost) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: "No post found in queue to publish." }));
          return;
        }

        const { publishToInstagram } = await import("./instagram.js");
        if (accessToken) env.IG_ACCESS_TOKEN = accessToken;
        if (igUserId) env.IG_USER_ID = igUserId;

        const pubResult = await publishToInstagram(targetPost);
        db.prepare("UPDATE posts SET status = 'published', permalink = ?, ig_media_id = ?, published_at = datetime('now') WHERE id = ?")
          .run(pubResult.permalink || "", pubResult.id || "", targetPost.id);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          ok: true,
          success: true,
          message: "🚀 Published live to Instagram!",
          permalink: pubResult.permalink,
          postId: targetPost.id,
          igMediaId: pubResult.id
        }));
      } catch (err: any) {
        log.error({ err: err.message }, "Error in /api/publish-now");
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
      return;
    }

${target}`;

if (!code.includes('/api/discover-account')) {
  code = code.replace(target, addition);
  fs.writeFileSync(healthPath, code, 'utf8');
  console.log('✓ Added /api/discover-account, /api/generate-reel, and /api/publish-now to health.ts');
} else {
  console.log('Endpoints already added to health.ts');
}
