#!/usr/bin/env node
/**
 * REXION LinkedIn RAG & Autonomous Research Agent
 * ------------------------------------------------
 * Fully autonomous personal branding agent that:
 * 1. Researches GitHub repositories and project portfolio
 * 2. Extracts RAG context from local documents, PDFs, resumes, and memories
 * 3. Drafts authentic engineering posts with Google Gemini
 * 4. Optionally generates supporting graphics with Imagen / Gemini Multimodal
 * 5. Publishes directly to LinkedIn or outputs drafts for review
 */

const fs = require("fs");
const path = require("path");

try {
  require("dotenv").config();
} catch {}

const {
  runAgentForTopic,
  generateAutonomousPost,
  publishPost,
} = require("./agent-core");
const { ingestDirectory, ingestFile } = require("./ingest");
const { loadStore } = require("./vector-store");
const { getRecentMemories } = require("./mongo-store");

function printHelp() {
  console.log(`
=====================================================================
          REXION LINKEDIN RAG & AUTONOMOUS AGENT
=====================================================================

Usage:
  node scripts/linkedin-rag-agent/index.js [options]

Options:
  --auto              Run autonomous GitHub research, RAG ideation & post
  --topic "<text>"    Generate and publish a post for a specific topic
  --dry-run           Draft post and retrieve RAG without publishing to LinkedIn
  --repo "<name>"     Focus autonomous post on a specific repository
  --ingest [dir/file] Index documents/resumes into vector database
  --status            Check agent configuration, API keys, and memory status
  --help              Display this help menu

Environment Variables (.env):
  GEMINI_API_KEY          (Required: from Google AI Studio)
  LINKEDIN_ACCESS_TOKEN   (Required: OAuth token with w_member_social scope)
  LINKEDIN_PERSON_URN     (Optional: auto-resolved from token if omitted)
  GITHUB_USERNAME         (Optional: your GitHub handle for live portfolio research)
  GITHUB_TOKEN            (Optional: GitHub Personal Access Token for higher rate limits)
  MONGODB_URI             (Optional: MongoDB Atlas URI for persistent cloud memory)
  AUTHOR_NAME             (Optional: e.g. "Anshu Pal", for personalized voice)
  GEMINI_TEXT_MODEL       (Optional: defaults to gemini-2.5-flash / gemini-3.5-flash)
  GEMINI_IMAGE_MODEL      (Optional: defaults to imagen-3.0-generate-002)

Examples:
  # 1. Autonomous research across your GitHub repos and dry-run preview:
  node scripts/linkedin-rag-agent/index.js --auto --dry-run

  # 2. Fully publish autonomous post to LinkedIn:
  node scripts/linkedin-rag-agent/index.js --auto

  # 3. Draft post on a specific technical topic:
  node scripts/linkedin-rag-agent/index.js --topic "Lessons optimizing React render latency" --dry-run

  # 4. Ingest your resume or technical docs:
  node scripts/linkedin-rag-agent/index.js --ingest ./documents
=====================================================================
`);
}

async function showStatus() {
  console.log(`\n--- Agent Status Diagnostic ---`);
  console.log(`Gemini API Key:       ${process.env.GEMINI_API_KEY ? "Configured ✓" : "MISSING ✗"}`);
  console.log(`LinkedIn Token:       ${process.env.LINKEDIN_ACCESS_TOKEN ? "Configured ✓" : "MISSING ✗"}`);
  console.log(`LinkedIn Person URN:  ${process.env.LINKEDIN_PERSON_URN || "(Auto-resolving from token)"}`);
  console.log(`GitHub Username:      ${process.env.GITHUB_USERNAME || "(Using local portfolio catalog)"}`);
  console.log(`MongoDB URI:          ${process.env.MONGODB_URI ? "Configured ✓" : "Using local JSON store"}`);

  const store = loadStore();
  console.log(`Vector Store Chunks:  ${store.length} indexed chunks`);

  const memories = await getRecentMemories(5);
  console.log(`Memory Entries:       ${memories.length} recent memories logged`);
  console.log(`-------------------------------\n`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.length === 0) {
    printHelp();
    return;
  }

  if (args.includes("--status")) {
    await showStatus();
    return;
  }

  if (args.includes("--ingest")) {
    const targetIdx = args.indexOf("--ingest") + 1;
    const targetPath = args[targetIdx] && !args[targetIdx].startsWith("--") ? args[targetIdx] : path.join(__dirname, "documents");
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
      await ingestFile(targetPath);
    } else {
      await ingestDirectory(targetPath);
    }
    return;
  }

  const dryRun = args.includes("--dry-run");
  const isAuto = args.includes("--auto");
  const topicIdx = args.indexOf("--topic");
  const repoIdx = args.indexOf("--repo");
  const explicitRepo = repoIdx !== -1 ? args[repoIdx + 1] : null;

  if (topicIdx !== -1 && args[topicIdx + 1]) {
    const topic = args[topicIdx + 1];
    console.log(`\n[Agent] Running topic workflow for: "${topic}" ${dryRun ? "(DRY RUN)" : ""}`);
    const result = await runAgentForTopic(topic, { dryRun });
    console.log(`\n--- Generated Post ---\n${result.postText}\n----------------------`);
    if (result.needsImage) {
      console.log(`Visual Idea: ${result.imagePrompt}`);
    }
    if (dryRun) {
      console.log(`\n[Dry Run] Post was generated successfully and verified. (Not posted to LinkedIn).`);
    } else {
      console.log(`\n[Agent] Successfully published to LinkedIn! Post ID: ${result.postId}`);
    }
    return;
  }

  if (isAuto || explicitRepo) {
    console.log(`\n[Agent] Starting Autonomous GitHub Portfolio Research ${dryRun ? "(DRY RUN)" : ""}...`);
    const result = await generateAutonomousPost(explicitRepo, { dryRun });
    console.log(`\nSelected Project:     ${result.repoName}`);
    console.log(`Technical Angle:      ${result.topicTitle}`);
    console.log(`\n--- Generated Post ---\n${result.postText}\n----------------------`);
    if (result.needsImage) {
      console.log(`Visual Graphic Idea:  ${result.imagePrompt}`);
    }
    if (dryRun) {
      console.log(`\n[Dry Run] Autonomous post ideated and formatted successfully. (Not posted to LinkedIn).`);
    } else {
      console.log(`\n[Agent] Successfully published to LinkedIn! Post ID: ${result.postId}`);
    }
    return;
  }

  printHelp();
}

if (require.main === module) {
  main().catch((err) => {
    console.error("\n[Agent Error]:", err.message);
    process.exit(1);
  });
}

module.exports = { main };
