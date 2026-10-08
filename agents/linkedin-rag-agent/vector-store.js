const fs = require("fs");
const path = require("path");

const STORE_PATH = path.join(__dirname, "vector-store.json");
const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";

function generateLocalEmbedding(text, dim = 256) {
  const vec = new Array(dim).fill(0)
  const words = String(text || '').toLowerCase().match(/\w+/g) || []
  if (words.length === 0) return vec

  words.forEach(w => {
    let hash = 0
    for (let i = 0; i < w.length; i++) {
      hash = (hash << 5) - hash + w.charCodeAt(i)
      hash |= 0
    }
    const idx = Math.abs(hash) % dim
    vec[idx] += 1
  })

  // Normalize
  const norm = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0))
  return norm > 0 ? vec.map(v => v / norm) : vec
}

async function embedText(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return generateLocalEmbedding(text);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        content: { parts: [{ text: text.slice(0, 8000) }] },
      }),
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return generateLocalEmbedding(text);
    }

    const data = await response.json();
    return data?.embedding?.values || generateLocalEmbedding(text);
  } catch {
    return generateLocalEmbedding(text);
  }
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

function loadStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      return JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
    }
  } catch {}
  return [];
}

function saveStore(chunks) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(chunks, null, 2), "utf8");
}

async function addDocumentChunks(chunks) {
  const store = loadStore();
  for (const item of chunks) {
    if (!item.embedding) {
      item.embedding = await embedText(item.text);
    }
    store.push(item);
  }
  saveStore(store);
}

async function retrieveRelevantChunks(query, topK = 4) {
  const store = loadStore();
  if (store.length === 0) return [];

  const queryEmbedding = await embedText(query);
  const scored = [];

  for (const chunk of store) {
    const score = cosineSimilarity(queryEmbedding, chunk.embedding);
    scored.push({ ...chunk, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

module.exports = {
  embedText,
  cosineSimilarity,
  retrieveRelevantChunks,
  addDocumentChunks,
  loadStore,
  saveStore,
};
