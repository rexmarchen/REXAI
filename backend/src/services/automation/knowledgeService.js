import db from '../../lib/db.js'
import { ensureAutomationSchema } from './schema.js'
import { splitIntoChunks, keywordScore } from './text.js'
import { addUserChunk, retrieveUserChunks } from './vectorStore.js'

export async function addKnowledgeEntry(userId, { entryType = 'note', source = 'dashboard', sourceId = null, title = null, content, metadata = {} }) {
  await ensureAutomationSchema()

  const result = await db.query(
    `INSERT INTO automation_knowledge_entries (user_id, entry_type, source, source_id, title, content, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, entryType, source, sourceId, title, content, metadata]
  )
  const entry = result.rows[0]
  const chunks = splitIntoChunks(content)

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index]
    let vectorRef = null
    try {
      vectorRef = await addUserChunk(userId, chunk, {
        knowledgeEntryId: entry.id,
        source,
        sourceId,
        title,
        entryType,
        chunkIndex: index
      })
    } catch (err) {
      console.warn('Automation vector insert skipped:', err.message)
    }

    await db.query(
      `INSERT INTO automation_knowledge_chunks (user_id, knowledge_entry_id, chunk_index, content, metadata, vector_ref)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, entry.id, index, chunk, { source, sourceId, title, entryType }, vectorRef]
    )
  }

  return entry
}

export async function getRecentKnowledge(userId, limit = 8) {
  await ensureAutomationSchema()
  const result = await db.query(
    `SELECT id, entry_type, source, source_id, title, content, metadata, created_at
     FROM automation_knowledge_entries
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  )
  return result.rows
}

export async function retrieveContext(userId, query, topK = 5) {
  await ensureAutomationSchema()

  const parts = []
  try {
    const vectorChunks = await retrieveUserChunks(userId, query, topK)
    for (const chunk of vectorChunks) {
      parts.push(`- [${chunk.source || 'Knowledge'}] ${chunk.text}`)
    }
  } catch (err) {
    console.warn('Automation vector retrieval skipped:', err.message)
  }

  if (parts.length < topK) {
    const fallback = await db.query(
      `SELECT content, metadata
       FROM automation_knowledge_chunks
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 60`,
      [userId]
    )

    const ranked = fallback.rows
      .map((row) => ({ ...row, score: keywordScore(query, row.content) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK - parts.length)

    for (const row of ranked) {
      parts.push(`- [${row.metadata?.source || 'Knowledge'}] ${row.content}`)
    }
  }

  if (parts.length === 0) {
    const recent = await getRecentKnowledge(userId, 3)
    for (const item of recent) {
      parts.push(`- [Recent ${item.entry_type}] ${item.content}`)
    }
  }

  return parts.join('\n')
}
