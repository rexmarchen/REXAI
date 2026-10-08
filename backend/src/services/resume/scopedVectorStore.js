import CandidateProfile from '../../models/CandidateProfile.js'
import logger from '../../utils/logger.js'

/**
 * Basic tokenizer & stemmer helper for deterministic semantic/lexical similarity
 */
function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1)
}

function computeTF(tokens) {
  const tf = {}
  for (const t of tokens) {
    tf[t] = (tf[t] || 0) + 1
  }
  return tf
}

function calculateCosineSimilarity(tf1, tf2) {
  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0

  for (const k in tf1) {
    norm1 += tf1[k] * tf1[k]
    if (tf2[k]) {
      dotProduct += tf1[k] * tf2[k]
    }
  }

  for (const k in tf2) {
    norm2 += tf2[k] * tf2[k]
  }

  if (norm1 === 0 || norm2 === 0) return 0
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
}

/**
 * Retrieve resume context chunks strictly scoped to a specific userId.
 * Multi-tenant isolation guaranteed: Queries only candidate profile / chunks for the given userId.
 *
 * @param {string|mongoose.Types.ObjectId} userId - Target candidate user ID
 * @param {string} query - Target question or field description
 * @param {Object} options - Retrieval options (topK, minScore)
 * @returns {Promise<Array<{chunkId: string, text: string, section: string, score: number}>>}
 */
export async function retrieveResumeContext(userId, query, { topK = 5, minScore = 0.05 } = {}) {
  if (!userId) {
    throw new Error('ScopedVectorStore: userId is required for multi-tenant isolation')
  }

  const profile = await CandidateProfile.findOne({ userId }).lean()
  if (!profile || !profile.resumeChunks || profile.resumeChunks.length === 0) {
    return []
  }

  const queryTokens = tokenize(query)
  if (queryTokens.length === 0) {
    return profile.resumeChunks.slice(0, topK).map((c) => ({
      chunkId: c.chunkId,
      text: c.text,
      section: c.section,
      score: 1.0
    }))
  }

  const queryTf = computeTF(queryTokens)

  const scoredChunks = profile.resumeChunks.map((chunk) => {
    const chunkTokens = tokenize(`${chunk.section} ${chunk.text}`)
    const chunkTf = computeTF(chunkTokens)
    let score = calculateCosineSimilarity(queryTf, chunkTf)

    // Section relevance bonus
    const queryLower = query.toLowerCase()
    if (chunk.section && queryLower.includes(chunk.section.toLowerCase())) {
      score += 0.2
    }

    return {
      chunkId: chunk.chunkId,
      text: chunk.text,
      section: chunk.section,
      score: Math.min(1.0, score)
    }
  })

  return scoredChunks
    .filter((c) => c.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}

/**
 * In-memory / direct search for when profile chunks are passed directly
 */
export function rankChunksInMemory(chunks, query, { topK = 5, minScore = 0.05 } = {}) {
  if (!chunks || chunks.length === 0) return []

  const queryTokens = tokenize(query)
  const queryTf = computeTF(queryTokens)

  return chunks
    .map((chunk) => {
      const chunkTokens = tokenize(`${chunk.section || ''} ${chunk.text || ''}`)
      const chunkTf = computeTF(chunkTokens)
      const score = calculateCosineSimilarity(queryTf, chunkTf)
      return {
        chunkId: chunk.chunkId,
        text: chunk.text,
        section: chunk.section,
        score
      }
    })
    .filter((c) => c.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}
