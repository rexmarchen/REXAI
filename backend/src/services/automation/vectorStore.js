import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { AUTOMATION_VECTOR_ROOT, GEMINI_API_KEY, GEMINI_EMBEDDING_MODEL } from '../../config/env.js'

const require = createRequire(import.meta.url)
const { LocalIndex } = require('vectra')

const indexCache = new Map()

function safeUserPath(userId) {
  return path.resolve(AUTOMATION_VECTOR_ROOT, 'users', String(Number(userId)))
}

async function getIndex(userId) {
  const key = String(Number(userId))
  if (indexCache.has(key)) return indexCache.get(key)

  const indexPath = safeUserPath(userId)
  fs.mkdirSync(indexPath, { recursive: true })
  const index = new LocalIndex(indexPath)
  if (!(await index.isIndexCreated())) {
    await index.createIndex()
  }

  indexCache.set(key, index)
  return index
}

export async function embedText(text) {
  if (!GEMINI_API_KEY) {
    return null
  }

  const model = GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001'
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY
    },
    body: JSON.stringify({ content: { parts: [{ text: String(text || '').slice(0, 8000) }] } })
  })

  if (!response.ok) {
    throw new Error(`Embedding error (${response.status}): ${await response.text()}`)
  }

  const data = await response.json()
  return data.embedding?.values || null
}

export async function addUserChunk(userId, text, metadata = {}) {
  const vector = await embedText(text)
  if (!vector) {
    return null
  }

  const index = await getIndex(userId)
  const inserted = await index.insertItem({
    vector,
    metadata: {
      userId: Number(userId),
      text,
      ...metadata
    }
  })

  return inserted.id
}

export async function retrieveUserChunks(userId, query, topK = 4) {
  const vector = await embedText(query)
  if (!vector) {
    return []
  }

  const index = await getIndex(userId)
  const results = await index.queryItems(vector, topK)
  return results.map((result) => ({
    text: result.item.metadata.text,
    source: result.item.metadata.source,
    score: result.score,
    metadata: result.item.metadata
  }))
}
