const fs = require("fs");
const path = require("path");

let cachedClient = null;
let cachedDb = null;

const LOCAL_MEMORIES_FILE = path.join(__dirname, "memories.json");
const LOCAL_STATE_FILE = path.join(__dirname, "state.json");

function getLocalState(fallback = {}) {
  try {
    if (fs.existsSync(LOCAL_STATE_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_STATE_FILE, "utf8"));
    }
  } catch {}
  return fallback;
}

function saveLocalState(state) {
  fs.writeFileSync(LOCAL_STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

function getLocalMemories() {
  try {
    if (fs.existsSync(LOCAL_MEMORIES_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_MEMORIES_FILE, "utf8"));
    }
  } catch {}
  return [];
}

function saveLocalMemories(memories) {
  fs.writeFileSync(LOCAL_MEMORIES_FILE, JSON.stringify(memories, null, 2), "utf8");
}

async function getDb() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    return null;
  }

  if (cachedDb) return cachedDb;

  try {
    const { MongoClient } = require("mongodb");
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
    const dbName = process.env.MONGODB_DB_NAME || "rexion_automation";
    cachedDb = cachedClient.db(dbName);
    return cachedDb;
  } catch (err) {
    console.warn("[MongoDB Warning] Unable to connect to MongoDB, using local file storage fallback:", err.message);
    return null;
  }
}

async function loadState(fallback = {}) {
  const db = await getDb();
  if (!db) {
    return getLocalState(fallback);
  }

  try {
    const doc = await db.collection("agent_state").findOne({ _id: "linkedin_agent_state" });
    return doc ? { ...fallback, ...doc } : fallback;
  } catch {
    return getLocalState(fallback);
  }
}

async function saveState(state) {
  saveLocalState(state);

  const db = await getDb();
  if (db) {
    try {
      await db.collection("agent_state").updateOne(
        { _id: "linkedin_agent_state" },
        { $set: { ...state, updatedAt: new Date() } },
        { upsert: true }
      );
    } catch (err) {
      console.warn("[MongoDB Warning] Could not persist state to MongoDB:", err.message);
    }
  }
}

async function addMemory(content, type = "note", source = "user", metadata = {}) {
  const memoryItem = {
    content,
    type,
    source,
    metadata,
    createdAt: new Date(),
  };

  const localMemories = getLocalMemories();
  localMemories.push(memoryItem);
  saveLocalMemories(localMemories);

  const db = await getDb();
  if (db) {
    try {
      await db.collection("memories").insertOne(memoryItem);
    } catch (err) {
      console.warn("[MongoDB Warning] Could not write memory to MongoDB:", err.message);
    }
  }

  return memoryItem;
}

async function findRelevantMemories(topic, topK = 4) {
  const normalizedTopic = String(topic || "").toLowerCase();
  const db = await getDb();

  if (db) {
    try {
      const docs = await db
        .collection("memories")
        .find({})
        .sort({ createdAt: -1 })
        .limit(30)
        .toArray();

      if (docs.length > 0) {
        return docs
          .map((m) => {
            const text = `${m.content} ${JSON.stringify(m.metadata || {})}`.toLowerCase();
            const words = normalizedTopic.split(/\s+/).filter((w) => w.length > 3);
            const matches = words.filter((w) => text.includes(w)).length;
            const score = words.length > 0 ? matches / words.length : 0.5;
            return { ...m, score };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, topK);
      }
    } catch {}
  }

  const local = getLocalMemories();
  return local
    .map((m) => {
      const text = `${m.content} ${JSON.stringify(m.metadata || {})}`.toLowerCase();
      const words = normalizedTopic.split(/\s+/).filter((w) => w.length > 3);
      const matches = words.filter((w) => text.includes(w)).length;
      const score = words.length > 0 ? matches / words.length : 0.5;
      return { ...m, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

async function getRecentMemories(limit = 3) {
  const db = await getDb();
  if (db) {
    try {
      return await db
        .collection("memories")
        .find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
    } catch {}
  }

  const local = getLocalMemories();
  return local.slice(-limit).reverse();
}

module.exports = {
  getDb,
  loadState,
  saveState,
  addMemory,
  findRelevantMemories,
  getRecentMemories,
};
