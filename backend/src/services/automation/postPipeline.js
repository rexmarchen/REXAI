import db from '../../lib/db.js'
import { ensureAutomationSchema } from './schema.js'
import { getOrCreateSettings } from './settingsService.js'
import { retrieveContext } from './knowledgeService.js'
import { callGeminiJson } from './geminiService.js'
import { publishLinkedInPostForUser } from './linkedinTokenService.js'

function fallbackPost(topic, context) {
  const detail = context
    ? context.split('\n').find((line) => line.trim().length > 40)?.replace(/^- \[[^\]]+\]\s*/, '')
    : ''

  return {
    post_text: [
      `I have been thinking about ${topic}.`,
      '',
      detail
        ? `The useful part is the concrete work behind it: ${detail.slice(0, 220)}`
        : 'The useful part is turning small experiments into repeatable systems instead of one-off wins.',
      '',
      'What is one engineering habit that has made your recent work easier to trust?',
      '',
      '#softwareengineering #buildinpublic #careergrowth'
    ].join('\n'),
    needs_image: false,
    image_prompt: ''
  }
}

async function chooseTopic(userId, requestedTopic) {
  if (requestedTopic) return requestedTopic

  const repo = await db.query(
    `SELECT name, language, description
     FROM automation_github_repos
     WHERE user_id = $1
     ORDER BY last_posted_at ASC NULLS FIRST, last_synced_at DESC NULLS LAST
     LIMIT 1`,
    [userId]
  )

  if (repo.rows[0]) {
    const item = repo.rows[0]
    return `${item.name}${item.language ? ` in ${item.language}` : ''}`
  }

  const note = await db.query(
    `SELECT title, content
     FROM automation_knowledge_entries
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  )

  if (note.rows[0]) {
    return note.rows[0].title || note.rows[0].content.slice(0, 80)
  }

  return 'a recent engineering lesson from my projects'
}

export async function generateDraftForUser(userId, { topic = '', sourceType = 'manual', sourceId = null } = {}) {
  await ensureAutomationSchema()
  await getOrCreateSettings(userId)

  const resolvedTopic = await chooseTopic(userId, topic)
  const context = await retrieveContext(userId, resolvedTopic)
  const prompt = `You are drafting a LinkedIn post for the signed-in user using only their own retrieved notes, GitHub data, and post history.

TOPIC:
${resolvedTopic}

USER-SCOPED CONTEXT:
${context || '(No user knowledge found yet.)'}

Write a LinkedIn post:
- 100-180 words
- Specific, direct opening
- Natural human voice, not generic marketing copy
- Include concrete details from the user-scoped context when relevant
- End with a real question
- Add 3-5 specific hashtags

Return ONLY valid JSON:
{
  "post_text": "<post>",
  "needs_image": false,
  "image_prompt": ""
}`

  let generated = null
  try {
    generated = await callGeminiJson(prompt)
  } catch (err) {
    console.warn('Automation Gemini generation failed; using fallback draft:', err.message)
  }

  const post = generated?.post_text ? generated : fallbackPost(resolvedTopic, context)
  const result = await db.query(
    `INSERT INTO automation_post_drafts (user_id, topic, source_type, source_id, post_text, status, metadata)
     VALUES ($1, $2, $3, $4, $5, 'draft', $6)
     RETURNING *`,
    [
      userId,
      resolvedTopic,
      sourceType,
      sourceId,
      post.post_text,
      { needsImage: Boolean(post.needs_image), imagePrompt: post.image_prompt || '', contextUsed: Boolean(context) }
    ]
  )

  return result.rows[0]
}

export async function publishDraftForUser(userId, draftId) {
  await ensureAutomationSchema()
  const draftResult = await db.query(
    `SELECT *
     FROM automation_post_drafts
     WHERE user_id = $1 AND id = $2`,
    [userId, draftId]
  )

  const draft = draftResult.rows[0]
  if (!draft) {
    throw new Error('Draft not found.')
  }

  if (!['draft', 'approved', 'failed'].includes(draft.status)) {
    throw new Error(`Draft cannot be published from status "${draft.status}".`)
  }

  await db.query(
    `UPDATE automation_post_drafts
     SET status = 'approved', approved_at = COALESCE(approved_at, now()), error = null
     WHERE user_id = $1 AND id = $2`,
    [userId, draftId]
  )

  try {
    const linkedinPostId = await publishLinkedInPostForUser(userId, draft.post_text)
    const publishedAt = new Date()

    const updated = await db.query(
      `UPDATE automation_post_drafts
       SET status = 'published', published_at = $1, linkedin_post_id = $2, error = null
       WHERE user_id = $3 AND id = $4
       RETURNING *`,
      [publishedAt, linkedinPostId, userId, draftId]
    )

    await db.query(
      `INSERT INTO automation_post_history (user_id, draft_id, topic, post_text, linkedin_post_id, status, published_at, metadata)
       VALUES ($1, $2, $3, $4, $5, 'published', $6, $7)`,
      [userId, draftId, draft.topic, draft.post_text, linkedinPostId, publishedAt, draft.metadata || {}]
    )

    if (draft.source_type === 'github' && draft.source_id) {
      await db.query(
        `UPDATE automation_github_repos
         SET last_posted_at = $1
         WHERE user_id = $2 AND repo_key = $3`,
        [publishedAt, userId, draft.source_id]
      )
    }

    return updated.rows[0]
  } catch (err) {
    await db.query(
      `UPDATE automation_post_drafts
       SET status = 'failed', error = $1
       WHERE user_id = $2 AND id = $3`,
      [err.message, userId, draftId]
    )

    await db.query(
      `INSERT INTO automation_post_history (user_id, draft_id, topic, post_text, status, error, metadata)
       VALUES ($1, $2, $3, $4, 'failed', $5, $6)`,
      [userId, draftId, draft.topic, draft.post_text, err.message, draft.metadata || {}]
    )

    throw err
  }
}

export async function rejectDraftForUser(userId, draftId) {
  await ensureAutomationSchema()
  const result = await db.query(
    `UPDATE automation_post_drafts
     SET status = 'rejected'
     WHERE user_id = $1 AND id = $2 AND status IN ('draft', 'failed')
     RETURNING *`,
    [userId, draftId]
  )

  if (!result.rows[0]) {
    throw new Error('Draft not found or cannot be rejected.')
  }

  return result.rows[0]
}

export async function runAutomationForUser(userId, { reason = 'scheduled', topic = '' } = {}) {
  await ensureAutomationSchema()
  const settings = await getOrCreateSettings(userId)
  const draft = await generateDraftForUser(userId, { topic, sourceType: reason })

  if (settings.full_auto_enabled && settings.approval_mode === 'auto_publish') {
    return publishDraftForUser(userId, draft.id)
  }

  return draft
}

export async function getDrafts(userId, limit = 8) {
  await ensureAutomationSchema()
  const result = await db.query(
    `SELECT *
     FROM automation_post_drafts
     WHERE user_id = $1
     ORDER BY generated_at DESC
     LIMIT $2`,
    [userId, limit]
  )
  return result.rows
}

export async function getPostHistory(userId, limit = 12) {
  await ensureAutomationSchema()
  const result = await db.query(
    `SELECT *
     FROM automation_post_history
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  )
  return result.rows
}
