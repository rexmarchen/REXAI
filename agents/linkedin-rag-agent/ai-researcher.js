const fs = require("fs");
const path = require("path");
const { getDb, loadState, saveState, findRelevantMemories } = require("./mongo-store");
const { retrieveRelevantChunks } = require("./vector-store");

try {
  require("dotenv").config();
} catch {}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGeminiText(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }

  const configuredModel = process.env.GEMINI_TEXT_MODEL;
  const candidateModels = Array.from(
    new Set([
      configuredModel,
      "gemini-2.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.5-flash",
      "gemini-3.6-flash",
      "gemini-3.7-flash",
      "gemini-2.0-flash",
    ].filter(Boolean))
  );

  let lastError = null;
  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          lastError = new Error(`Gemini generateContent error (${response.status}): ${errText}`);
          if ((response.status === 503 || response.status === 429) && attempt < 2) {
            console.warn(`[AI Researcher] Model ${model} is busy (${response.status}), retrying in 1s...`);
            await sleep(1000);
            continue;
          }
          console.warn(`[AI Researcher] Model ${model} returned ${response.status}, trying fallback model...`);
          break;
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) throw new Error("Empty response from Gemini");

        const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch {}
        }

        return {
          topic_title: "Key lessons building this project",
          technical_angle: cleaned.slice(0, 150),
          search_query: "project architecture",
        };
      } catch (err) {
        lastError = err;
        await sleep(1000);
      }
    }
  }
  throw lastError || new Error("All Gemini models failed in ai-researcher.");
}

async function getAllRepositories() {
  const username = process.env.GITHUB_USERNAME || process.env.GITHUB_USER;
  const token = process.env.GITHUB_TOKEN;

  // 1. If GitHub username is configured, fetch live from GitHub API
  if (username) {
    try {
      const headers = { "User-Agent": "rexion-linkedin-agent" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=30`, { headers });
      if (res.ok) {
        const repos = await res.json();
        return repos
          .filter((r) => !r.fork && r.name.toLowerCase() !== username.toLowerCase())
          .map((r) => ({
            name: r.name,
            repoKey: r.full_name,
            language: r.language || "TypeScript / Python",
            url: r.html_url,
            description: r.description || "Open source software project",
          }));
      }
    } catch (err) {
      console.warn("[GitHub Warning] Could not fetch live repos from GitHub API:", err.message);
    }
  }

  // 2. Check MongoDB catalog
  try {
    const db = await getDb();
    if (db) {
      const catalog = await db.collection("portfolio_catalog").findOne({ _id: "github_portfolio" });
      if (catalog && catalog.repos && catalog.repos.length > 0) {
        return catalog.repos.filter((r) => r.name !== r.repoKey?.split("/")[0]);
      }
    }
  } catch {}

  // 3. Fallback default portfolio projects for demonstration / initial setup
  return [
    {
      name: "rexionAI",
      repoKey: "rexmarchen/rexionAI",
      language: "TypeScript & Python",
      url: "https://github.com/rexmarchen/rexionAI",
      description: "AI-powered career acceleration, automated application flow, and job matching platform.",
    },
    {
      name: "autonomous-job-agent",
      repoKey: "rexmarchen/autonomous-job-agent",
      language: "Node.js & Playwright",
      url: "https://github.com/rexmarchen/autonomous-job-agent",
      description: "Automated job discovery, ATS form filling, and smart application queue.",
    },
    {
      name: "linkedin-rag-copilot",
      repoKey: "rexmarchen/linkedin-rag-copilot",
      language: "JavaScript & Gemini",
      url: "https://github.com/rexmarchen/linkedin-rag-copilot",
      description: "Autonomous RAG posting system powered by Google Gemini and vector embeddings.",
    }
  ];
}

async function pickRepositoryToResearch(explicitRepoName = null) {
  const allRepos = await getAllRepositories();
  if (!allRepos.length) {
    throw new Error("No repositories found to research.");
  }

  if (explicitRepoName) {
    const found = allRepos.find(
      (r) => r.name.toLowerCase() === explicitRepoName.toLowerCase()
    );
    if (found) return found;
  }

  const state = await loadState({ recentlyPostedRepos: [] });
  const recent = state.recentlyPostedRepos || [];

  let candidates = allRepos.filter((r) => !recent.slice(0, 5).includes(r.name));

  if (candidates.length === 0) {
    const lastPosted = recent[0];
    candidates = allRepos.filter((r) => r.name !== lastPosted);
  }

  if (candidates.length === 0) {
    candidates = allRepos;
  }

  const sorted = candidates.sort(() => 0.5 - Math.random());
  return sorted[0];
}

async function researchTopicForPost(targetRepoName = null) {
  const repo = await pickRepositoryToResearch(targetRepoName);
  const authorName = process.env.AUTHOR_NAME || "Software Engineer";

  const ideationPrompt = `You are the technical AI brain of ${authorName}, a software builder and computer science enthusiast.
You need to choose a fresh, authentic engineering angle to write a LinkedIn post about one of your GitHub projects.

SELECTED REPOSITORY:
- Name: ${repo.name}
- Primary Tech/Language: ${repo.language || "Software Engineering"}
- Technical Context / Description: ${repo.description}

Brainstorm a specific, compelling technical post topic about this project.
Choose an angle that sounds like a real developer sharing practical experience:
- Architectural or design decision (why this stack or pattern?)
- Overcoming a technical hurdle, latency, or concurrency bug
- Performance, state management, or UI design challenge
- Key engineering lesson learned while building it

Do NOT create generic marketing topics like "Why AI is the future". Focus directly on the concrete project "${repo.name}".

Respond with ONLY valid JSON in this exact shape:
{
  "topic_title": "<short descriptive topic, e.g. 'Optimizing Puppeteer DOM hydration and queue concurrency'>",
  "technical_angle": "<1-2 sentences summarizing the core engineering insight or story>",
  "search_query": "<search keywords to retrieve supporting RAG context from the vector database>"
}`;

  console.log(`[AI Researcher] Brainstorming technical angle for project: "${repo.name}"...`);
  const idea = await callGeminiText(ideationPrompt);

  const searchQuery = idea.search_query || idea.topic_title || repo.name;
  console.log(`[AI Researcher] Retrieving RAG context for query: "${searchQuery}"...`);

  const ragParts = [];
  try {
    const memories = await findRelevantMemories(searchQuery, 4);
    for (const m of memories) {
      if (m.score > 0.4) {
        ragParts.push(`- [Memory (${m.type})]: ${m.content}`);
      }
    }
  } catch (ragErr) {
    console.warn("[AI Researcher] Memory retrieval notice:", ragErr.message);
  }

  try {
    const localChunks = await retrieveRelevantChunks(searchQuery, 3);
    for (const c of localChunks) {
      ragParts.push(`- [Document Chunk from ${c.source || "doc"}]: ${c.text}`);
    }
  } catch {}

  if (ragParts.length === 0) {
    ragParts.push(`- [Project Summary]: ${repo.description} (Built using ${repo.language})`);
  }

  return {
    repoName: repo.name,
    repoKey: repo.repoKey,
    repoUrl: repo.url,
    language: repo.language,
    topicTitle: idea.topic_title,
    technicalAngle: idea.technical_angle,
    ragContext: ragParts.join("\n"),
  };
}

async function markRepoAsPosted(repoName) {
  try {
    const state = await loadState({ recentlyPostedRepos: [] });
    const recent = state.recentlyPostedRepos || [];
    const updated = [repoName, ...recent.filter((r) => r !== repoName)].slice(0, 8);
    await saveState({
      recentlyPostedRepos: updated,
      lastPostedRepo: repoName,
      lastPostedAt: new Date(),
    });
  } catch (err) {
    console.warn("[AI Researcher] Could not update recent repo state:", err.message);
  }
}

module.exports = {
  getAllRepositories,
  pickRepositoryToResearch,
  researchTopicForPost,
  markRepoAsPosted,
};
